# ==================== Base Stage ====================
FROM node:22-alpine AS base
WORKDIR /app
RUN apk add --no-cache openssl dumb-init

# ==================== Dependencies Stage (pour build + prisma) ====================
FROM base AS deps
COPY package*.json ./
COPY prisma ./prisma

# Install TOUT (dev + prod) pour pouvoir générer Prisma
RUN npm ci --frozen-lockfile

# Génère le Prisma Client (obligatoire)
RUN npx prisma generate

# ==================== Builder Stage ====================
FROM deps AS builder
COPY src ./src
COPY tsconfig.json ./

RUN npm run build

# ==================== Production Runtime ====================
FROM base AS runtime
ENV NODE_ENV=production

# dumb-init pour gérer proprement les signaux (Ctrl+C, etc.)
ENTRYPOINT ["dumb-init", "--"]

WORKDIR /app

# Copie seulement package.json + lock
COPY package*.json ./

# Réutilise les dépendances déjà téléchargées dans deps (évite un 2e accès réseau)
COPY --from=deps /app/node_modules ./node_modules

# Garde uniquement les dépendances de production sans retélécharger
RUN npm prune --omit=dev --ignore-scripts

# Copie le dossier prisma (migrations)
COPY --from=deps /app/prisma ./prisma

# Copie le build
COPY --from=builder /app/dist ./dist

EXPOSE 3001

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

CMD ["node", "dist/server.js"]