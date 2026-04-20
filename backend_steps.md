# Backend Steps - Moustass SVM

## 1. Objectif

Ce document decrit l etat reel du backend au 20/04/2026:
- ce qui est deja implemente
- ce qui est partiel ou manquant
- les prochaines etapes prioritaires

Le constat est base sur la lecture du code source, des scripts npm, de Prisma, de Docker et du workflow CI.

## 2. Etat global (resume)

- Architecture modulaire en place (auth, user, video, license, audit, crypto, metadata, notification)
- API Express fonctionnelle avec securite de base (helmet, cors, rate limit, JWT, RBAC)
- Persistence MySQL + Prisma en place
- Flux principal video (upload, lecture, suppression) implemente
- Pipeline CI present (quality + SonarQube + Snyk)

Points majeurs manquants:
- Pas de vrais tests automatisees (script test placeholder)
- OIDC (Open ID Connect) non implemente (variables presentes, logique absente)
- Module notification encore placeholder
- Pas de migrations Prisma versionnees dans le repo
- Certaines capacites existent en service mais pas exposees en endpoint (ex: listing metadata messages)

## 3. Ce qui est deja la

### 3.1 Socle backend

- Runtime TypeScript Node.js
- Serveur Express initialise dans `src/app.ts` et `src/server.ts`
- Endpoints systeme operationnels:
  - `GET /health`
  - `GET /info`

### 3.2 Configuration et environnement

- Chargement env via `dotenv` + validation `zod` dans `src/config/env.ts`
- Fichier exemple present: `.env.example`
- Variables critiques presentes: `DATABASE_URL`, `JWT_*`, `UPLOAD_DIR`, bootstrap admin

### 3.3 Base de donnees

- Schema Prisma present: `prisma/schema.prisma`
- Modeles cles presents: `User`, `VideoMessage`, `Audit`, `CryptoKey`, `License`
- Seed present: `prisma/seed.ts` (upsert admin)
- Prisma client genere via `postinstall`

### 3.4 API metier exposee

- Auth:
  - `POST /auth/login`
  - `GET /auth/me`
- Users (ADMIN):
  - `GET /users`
  - `POST /users`
  - `PUT /users/:id`
  - `DELETE /users/:id`
- Messages:
  - `POST /messages/upload`
  - `GET /messages/:id`
  - `DELETE /messages/:id`
- License (ADMIN):
  - `GET /license`
  - `POST /license`
  - `PUT /license/:id`
  - `DELETE /license/:id`

### 3.5 Securite applicative

- `helmet` + `cors`
- Rate limit global
- Validation Zod sur login/user/license
- Auth JWT obligatoire sur routes protegees
- RBAC (`USER`, `ADMIN`)
- Hash SHA-256 + signature RSA-PSS du manifest media
- Verification de signature a la lecture
- Journalisation audit lors de l upload/suppression video

### 3.6 Docker et CI

- `Dockerfile` multi-stage present
- `docker-compose.yml` present (mysql + backend)
- Workflow GitHub Actions present: `.github/workflows/build.yml`
  - Job quality: install, prisma generate, typecheck, test, build
  - Job SonarQube
  - Job Snyk (Open Source + Code + monitor)

## 4. Ce qui manque ou reste partiel

### 4.1 Tests

Statut: MANQUANT

- Aucun fichier `*.test.ts` ou `*.spec.ts` detecte
- `npm test` est un placeholder (`No tests configured yet`)
- Impact: quality gate CI peu pertinente sur la partie tests

### 4.2 OIDC

Statut: PARTIEL

- Variables `OIDC_ISSUER`, `OIDC_CLIENT_ID`, `OIDC_CLIENT_SECRET` presentes
- Aucune logique OIDC detectee dans les modules auth
- Impact: authentification feder ee non disponible

### 4.3 Notification

Statut: PARTIEL

- `src/modules/notification/notification.service.ts` retourne un placeholder
- Pas d integration SMTP/provider

### 4.4 Metadata / listing messages

Statut: PARTIEL

- Service `listMessagesForActor` present dans metadata
- Pas de route/controller expose pour lister les messages

### 4.5 Prisma migrations

Statut: MANQUANT DANS LE REPO

- Dossier `prisma/migrations` absent
- Le schema existe, mais l historique de migration n est pas versionne

### 4.6 DevSecOps complet

Statut: PARTIEL

- Sonar + Snyk en place
- OWASP ZAP non present dans le workflow backend actuel
- IaC (Terraform/Ansible) non present dans ce repository backend

## 5. Verification rapide locale

Pre requis:
- Node.js 22+
- npm 10+
- MySQL 8+ (ou Docker)

Etapes:

```bash
npm ci
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

Checks:

```bash
curl http://localhost:3000/health
curl http://localhost:3000/info
```

## 6. Plan de completion recommande

### Priorite P0 (bloquant qualite)

- Ajouter des tests reels (unitaires + integration API)
- Remplacer le script `test` placeholder
- Ajouter un minimum de couverture sur auth, RBAC, upload/read/delete message

### Priorite P1 (securite/fonctionnel)

- Implementer OIDC (au moins login OIDC + mapping user)
- Exposer endpoint de listing metadata/messages avec controle d acces
- Finaliser le module notification (ou le retirer du scope initial)

### Priorite P2 (industrialisation)

- Versionner les migrations Prisma dans `prisma/migrations`
- Etendre CI avec scan ZAP (si exige par le projet global)
- Ajouter conventions de release (tag/version/changelog)

## 7. Checklist de suivi

- [x] API de base demarre et expose `/health` et `/info`
- [x] Auth JWT + RBAC fonctionnels
- [x] CRUD users (admin)
- [x] Upload/lecture/suppression messages avec signature
- [x] CRUD license (admin)
- [x] CI quality + SonarQube + Snyk
- [ ] Tests automatises reels
- [ ] OIDC operationnel
- [ ] Notification operationnelle
- [ ] Endpoint listing messages/metadata expose
- [ ] Migrations Prisma versionnees
- [ ] ZAP dans CI backend (si requis)
