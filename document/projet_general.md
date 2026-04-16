Vue d’ensemble des designs

On va couvrir 4 blocs fondamentaux :
🔹 A. Data Design (BDD)
    • schéma MySQL 
    • multi-client 
    • audit 
🔹 B. Security Design
    • auth (JWT + OIDC) 
    • crypto (hash + signature) 
    • gestion des accès 
🔹 C. Application Design (backend)
    • modules 
    • responsabilités 
    • flux 
🔹 D. Multi-tenant Design
    • isolation client 
    • configuration
DATA DESIGN
🔹 Principe clé
👉 1 base de données par client (comme demandé)
Donc :
    • client-a → DB A 
    • client-b → DB B 
✔ isolation forte
✔ conforme au projet

Tables principales
1. users
id
email
password_hash (ou vide si OIDC)
role (USER / ADMIN)
created_at
2. messages (cœur du système)
id
sender_id
recipient_id
media_url
media_sha256
media_signature
signature_algorithm (PS256)
signer_kid

manifest_json

created_at
expires_at

3. audits
id
actor_id
action
target_type
target_id
timestamp
ip_address
signature

4. keys
id
user_id
public_key
key_size
status
created_at

5. licence
id
client_name
logo_url
email
phone
serial_number
max_users
created_at
expires_at

SECURITY DESIGN
3.1 Authentification
Option réaliste
    • OIDC (externe ou mock) 
    • JWT côté backend
Flow
    1. user login via OIDC 
    2. backend reçoit identity 
    3. backend génère JWT interne
3.2 Autorisation
👉 RBAC simple :
    • USER 
    • ADMIN
3.3 Crypto (CRITIQUE)
À implémenter :
✔ Hash
    • SHA-256 
✔ Signature
    • RSA-PSS (PS256)

Flow upload sécurisé
    1. upload vidéo 
    2. calcul hash 
    3. création manifest 
    4. signature 
    5. stockage
Flow lecture
    1. vérification signature 
    2. vérification accès 
    3. lecture vidéo

3.4 Protection API
    • JWT obligatoire 
    • rate limiting 
    • validation input (Zod ou Joi)

APPLICATION DESIGN (Backend)
Modules
1. auth
    • JWT 
    • OIDC
2. user
    • gestion users
3. video
    • upload 
    • lecture
4. crypto (TRÈS IMPORTANT)
    • hash 
    • signature 
    • verify
5. metadata
    • DB interactions
6. license
    • CRUD licence
7. audit
    • logs sécurisés
8. notification (optionnel)
    • Email

MULTI-TENANT DESIGN
stratégie choisie
👉 1 instance app + 1 DB par client
configuration par variables
Exemple :
CLIENT_NAME=Client A
DB_NAME=client_a_db
LOGO_URL=…
endpoint obligatoire
GET /info
Retour :
{
  "client": "Client A",
  "version": "1.0.0"
}

FLUX MÉTIER GLOBAL
Upload vidéo
Frontend → API
→ Auth check
→ Crypto (hash + signature)
→ Storage
→ DB (metadata)
→ Audit log

Lecture
Frontend → API
→ Auth check
→ Vérification signature
→ Accès DB
→ Retour vidéo
→ Audit log

Points critiques
1. Signature AVANT stockage
→ sinon non conforme
❗ 2. Audit sur TOUTES les actions sensibles
→ upload / read / delete
❗ 3. Aucune donnée sensible en clair
→ logs propres
❗ 4. Multi-client isolé
→ aucune fuite
Décisions d’architecture (ADR implicites)
    • ✅ Node.js backend 
    • ✅ Modular monolith 
    • ✅ MySQL 
    • ✅ Docker 
    • ✅ 1 DB par client 
    • ✅ JWT + OIDC 
    • ✅ RSA-PSS + SHA-256

