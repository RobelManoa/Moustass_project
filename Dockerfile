FROM node:22-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json tsconfig.json ./
COPY prisma ./prisma
RUN npm install
RUN npx prisma generate

FROM deps AS build
COPY src ./src
RUN npm run build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY package.json ./
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY prisma ./prisma

EXPOSE 3000
CMD ["node", "dist/server.js"]