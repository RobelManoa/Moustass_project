# 📦 Moustass SVM – Secure Video Messaging Platform (SaaS + IaC)

## 🧭 Description du projet

Moustass SVM est une plateforme de messagerie vidéo sécurisée permettant l’envoi, le stockage et la consultation de messages vidéo confidentiels.

Le projet répond à des exigences fortes en matière de :

* 🔐 Confidentialité
* 🧾 Intégrité
* 🧑‍⚖️ Non-répudiation
* 📊 Traçabilité

L’application évolue vers un modèle **SaaS multi-clients**, avec déploiement automatisé sur le cloud via **Infrastructure as Code (IaC)**.

---

## 🎯 Objectifs

* Sécuriser les communications vidéo sensibles
* Garantir l’intégrité et l’authenticité des contenus
* Permettre un déploiement multi-clients automatisé
* Appliquer les bonnes pratiques **DevSecOps**

---

## 🏗️ Architecture

### 🔹 Type d’architecture

* **Modular Monolith (structuré en modules)**
* Inspiré microservices (sans complexité distribuée)

---

### 🔹 Stack technique

#### Backend

* Node.js
* Express.js
* Prisma ORM
* JWT + OIDC

#### Frontend

* ReactJS (client)
* React-Admin (administration)

#### Base de données

* MySQL

#### Infrastructure & DevOps

* Docker / Docker Compose
* GitHub Actions (CI/CD)
* SonarCloud (qualité)
* Snyk (sécurité dépendances)
* OWASP ZAP (tests sécurité)
* Terraform (provisioning AWS)
* Ansible (configuration & déploiement)

---

## 🧱 Structure du projet

```bash
backend/
  src/
    modules/
      auth/
      user/
      video/
      crypto/
      metadata/
      license/
      audit/
      notification/
    infrastructure/
    shared/

frontend/
admin/

iac/
  terraform/
  ansible/
```

---

## 🗄️ Data Design

### 🔹 Principe clé

* **1 base de données par client**
* Isolation totale des données

---

### 🔹 Tables principales

* `users`
* `messages`
* `audits`
* `keys`
* `license`

---

### 🔹 Données critiques

* `media_sha256` → intégrité
* `media_signature` → signature RSA
* `manifest_json` → métadonnées signées

---

## 🔐 Security Design

### 🔹 Authentification

* OIDC (Identity Provider)
* JWT interne

---

### 🔹 Autorisation

* RBAC :

  * USER
  * ADMIN

---

### 🔹 Cryptographie

* Hash : **SHA-256**
* Signature : **RSA-PSS (PS256)**

---

### 🔹 Flux sécurisé (upload)

1. Upload vidéo
2. Calcul hash (SHA-256)
3. Création manifest
4. Signature (RSA-PSS)
5. Stockage

---

### 🔹 Flux lecture

1. Vérification signature
2. Vérification autorisation
3. Lecture vidéo

---

### 🔹 Protection API

* JWT obligatoire
* Rate limiting
* Validation des entrées (Zod/Joi)

---

## ⚙️ Application Design

### 🔹 Modules backend

* **auth** → JWT, OIDC
* **user** → gestion utilisateurs
* **video** → upload / lecture
* **crypto** → hash, signature, vérification
* **metadata** → accès base de données
* **license** → gestion SaaS client
* **audit** → journalisation sécurisée
* **notification** → email (optionnel)

---

## 🏢 Multi-tenant Design

### 🔹 Stratégie

* 1 instance applicative par client
* 1 base de données par client

---

### 🔹 Configuration par variables

```env
CLIENT_NAME=Client A
DB_NAME=client_a_db
LOGO_URL=...
```

---

### 🔹 Endpoint obligatoire

```http
GET /info
```

```json
{
  "client": "Client A",
  "version": "1.0.0"
}
```

---

## 🔄 API REST

### 🔹 Auth

* POST `/auth/login`
* GET `/auth/me`
* GET `/auth/oidc/login`
* GET `/auth/oidc/callback`

#### OIDC configuration (backend)

```env
OIDC_ISSUER=https://your-idp.example.com
OIDC_CLIENT_ID=your-client-id
OIDC_CLIENT_SECRET=your-client-secret
OIDC_REDIRECT_URI=http://localhost:3001/auth/oidc/callback
OIDC_SCOPES=openid profile email
OIDC_POST_LOGIN_REDIRECT=http://localhost:5173/auth/oidc/callback
```

Usage:

* Browser login: `GET /auth/oidc/login`
* Optional redirect target after local JWT issuance:
  `GET /auth/oidc/login?redirect=http://localhost:5173/auth/oidc/callback`

### 🔹 Users

* GET `/users`
* POST `/users`

### 🔹 Messages

* POST `/messages/upload`
* GET `/messages/:id`
* DELETE `/messages/:id`

### 🔹 License

* GET `/license`
* POST `/license`
* PUT `/license/:id`
* DELETE `/license/:id`

### 🔹 Info

* GET `/info`

---

## 🔁 Flux métier

### 🔹 Upload vidéo

```
Frontend → API
→ Auth
→ Crypto (hash + signature)
→ Stockage
→ DB
→ Audit
```

---

### 🔹 Lecture vidéo

```
Frontend → API
→ Auth
→ Vérification signature
→ DB
→ Retour vidéo
→ Audit
```

---

## ⚠️ Contraintes critiques

* Signature **avant stockage**
* Audit de toutes les actions sensibles
* Aucune donnée sensible en clair
* Isolation stricte des clients

---

## 🚀 DevSecOps & CI/CD

Pipeline GitHub Actions :

1. Tests (TDD)
2. SonarCloud (Quality Gate)
3. Snyk (vulnérabilités)
4. Build Docker
5. Déploiement (Terraform + Ansible)
6. Vérification (health check)

---

## ☁️ Infrastructure (IaC)

### Terraform

* VPC
* EC2 par client
* Security Groups

### Ansible

* Installation Docker
* Déploiement application
* Injection variables client

---

## 🧪 Tests

* Tests unitaires
* Tests API (Postman)
* Tests sécurité (ZAP, Burp)
* Tests de performance

---

## 📌 Bonnes pratiques

* TDD obligatoire
* Logs sécurisés
* Secrets hors code (CI/CD)
* Versionning SemVer

---

## 📈 Évolutions possibles

* Passage à microservices réels
* Ajout d’un KMS externe (Vault)
* Scalabilité horizontale
* Monitoring avancé

---

## 👨‍💻 Auteur

Projet réalisé dans le cadre du Master Architecture & Développement Logiciel – CryptoSoft.

---
