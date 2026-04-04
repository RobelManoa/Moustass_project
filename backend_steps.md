# Backend Steps - Moustass SVM

## 1. Objectif

Ce document decrit les etapes de mise en place, d execution et de verification de la partie backend du projet Moustass SVM.

Le backend est un monolithe modulaire base sur:
- Node.js + Express
- Prisma ORM
- MySQL
- JWT + RBAC
- Crypto SHA-256 + RSA-PSS
- CI/CD GitHub Actions avec SonarQube et Snyk

## 2. Arborescence backend

Le backend est organise autour des dossiers suivants:

- `src/modules/auth`: login et endpoint /auth/me
- `src/modules/user`: gestion des utilisateurs
- `src/modules/video`: upload, lecture, suppression des messages video
- `src/modules/crypto`: hash, signature et verification
- `src/modules/metadata`: acces metadonnees des messages
- `src/modules/license`: gestion des licences client
- `src/modules/audit`: journalisation des actions sensibles
- `src/modules/notification`: placeholder notifications
- `src/shared`: middlewares, erreurs, securite JWT/crypto
- `src/infrastructure`: acces Prisma
- `prisma`: schema et seed

## 3. Prerequis

- Node.js 22+
- npm 10+
- MySQL 8+
- Docker + Docker Compose (optionnel)

## 4. Variables d environnement

Le backend lit ses variables via `src/config/env.ts`.

Variables necessaires:

- `DATABASE_URL` (obligatoire)
- `PORT` (defaut: 3000)
- `NODE_ENV` (development/test/production)
- `CLIENT_NAME` (defaut: Client A)
- `APP_VERSION` (defaut: 1.0.0)
- `JWT_SECRET` (defaut dev, a surcharger en prod)
- `JWT_ISSUER`
- `JWT_AUDIENCE`
- `UPLOAD_DIR` (defaut: storage/messages)
- `OIDC_ISSUER` (optionnel)
- `OIDC_CLIENT_ID` (optionnel)
- `OIDC_CLIENT_SECRET` (optionnel)
- `CRYPTO_PRIVATE_KEY_PEM` (optionnel)
- `CRYPTO_PUBLIC_KEY_PEM` (optionnel)
- `BOOTSTRAP_ADMIN_EMAIL`
- `BOOTSTRAP_ADMIN_PASSWORD`
- `BOOTSTRAP_ADMIN_NAME`

Exemple minimal de `.env`:

```env
NODE_ENV=development
PORT=3000
CLIENT_NAME=Client A
APP_VERSION=1.0.0
DATABASE_URL=mysql://root:password@localhost:3306/moustass
JWT_SECRET=change-me-in-dev
JWT_ISSUER=moustass-backend
JWT_AUDIENCE=moustass-client
UPLOAD_DIR=storage/messages
BOOTSTRAP_ADMIN_EMAIL=admin@client.local
BOOTSTRAP_ADMIN_PASSWORD=ChangeMe123!
BOOTSTRAP_ADMIN_NAME=Admin
```

## 5. Installation locale

Depuis la racine du repository:

```bash
npm ci
npm run prisma:generate
```

## 6. Base de donnees (Prisma)

Le schema Prisma se trouve dans `prisma/schema.prisma`.

Etapes recommandees:

```bash
npm run prisma:migrate
npm run prisma:seed
```

Notes:
- Le seed cree/met a jour un admin bootstrap.
- Le client Prisma est aussi genere automatiquement via `postinstall`.

## 7. Demarrage backend

Mode developpement:

```bash
npm run dev
```

Build production:

```bash
npm run build
npm run start
```

Health check:

```http
GET /health
```

Info multi-tenant:

```http
GET /info
```

Reponse:

```json
{
  "client": "Client A",
  "version": "1.0.0"
}
```

## 8. Execution via Docker

Le projet fournit:
- `Dockerfile`
- `docker-compose.yml`

Lancement:

```bash
docker compose up --build
```

Services demarres:
- MySQL (`3306`)
- Backend (`3000`)

## 9. Endpoints backend

### Auth
- `POST /auth/login`
- `GET /auth/me`

### Users (admin)
- `GET /users`
- `POST /users`
- `PUT /users/:id`
- `DELETE /users/:id`

### Messages
- `POST /messages/upload`
- `GET /messages/:id`
- `DELETE /messages/:id`

### License (admin)
- `GET /license`
- `POST /license`
- `PUT /license/:id`
- `DELETE /license/:id`

### System
- `GET /health`
- `GET /info`

## 10. Securite appliquee

- Middleware `helmet` + `cors`
- Rate limiting global
- Validation d entrees via Zod
- JWT obligatoire sur routes protegees
- RBAC (`USER`, `ADMIN`)
- Upload video:
  1. calcul SHA-256
  2. creation manifest
  3. signature RSA-PSS
  4. stockage
  5. audit
- Lecture video:
  1. verification autorisation
  2. verification signature
  3. stream du fichier

## 11. CI/CD GitHub Actions

Le workflow est defini dans `.github/workflows/build.yml`.

Declencheurs:
- `push` sur branche `backend`
- `pull_request` (opened, synchronize, reopened)

Jobs:

1. `quality`
- `npm ci`
- `npm run prisma:generate`
- `npm run typecheck`
- `npm test`
- `npm run build`

2. `sonarqube`
- Scan Sonar via `SonarSource/sonarqube-scan-action@v6`
- Secret requis: `SONAR_TOKEN`

3. `snyk`
- Install CLI Snyk
- `snyk test --all-projects --severity-threshold=high`
- `snyk code test --severity-threshold=high`
- `snyk monitor --all-projects` sur push branche `backend`
- Secret requis: `SNYK_TOKEN`

## 12. Secrets GitHub a configurer

Dans GitHub > Settings > Secrets and variables > Actions:

- `SONAR_TOKEN`
- `SNYK_TOKEN`

Si SonarQube self-hosted est utilise, verifier aussi la config scanner selon l environnement.

## 13. Checklist rapide

- [ ] `.env` configure
- [ ] MySQL accessible
- [ ] `npm ci` execute
- [ ] `npm run prisma:generate` execute
- [ ] migrations appliquees
- [ ] seed admin execute
- [ ] backend demarre sur `/health`
- [ ] workflow GitHub Actions actif
- [ ] secrets `SONAR_TOKEN` et `SNYK_TOKEN` definis
