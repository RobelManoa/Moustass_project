# Instruction Admin

## 1. Rôle de la partie admin

La partie `admin` représente la console d’administration du projet Moustass SVM.

Elle est destinée aux utilisateurs ayant le rôle :

- `ADMIN`

Son objectif est de permettre à un administrateur de :

- se connecter à la console sécurisée,
- superviser l’instance client,
- gérer les utilisateurs,
- gérer les licences,
- disposer d’un tableau de bord d’administration.

## 2. Ce que la partie admin est censée faire dans le projet

La partie admin est censée être l’interface de pilotage et de configuration fonctionnelle d’une instance client.

Elle doit permettre :

- la gestion des comptes utilisateurs,
- le contrôle des rôles,
- la création et le suivi des licences client,
- une vue d’ensemble sur l’état de l’instance,
- un accès restreint aux seules personnes habilitées.

Dans l’architecture du projet, la partie admin joue le rôle de **back-office sécurisé**.

## 3. Fonctionnement général

### 3.1 Connexion admin

L’admin se connecte avec un compte du backend via :

- `POST /auth/login`

Le frontend admin vérifie ensuite :

- que le compte possède bien le rôle `ADMIN`.

Si le rôle n’est pas `ADMIN`, l’accès à la console est refusé.

Le frontend utilise aussi :

- `GET /auth/me`

pour récupérer l’identité courante et stabiliser la session.

### 3.2 Tableau de bord

Après connexion, l’administrateur arrive sur un dashboard.

Ce dashboard a pour but de :

- présenter l’instance d’administration,
- afficher des indicateurs simples,
- rappeler les ressources connectées,
- donner une vue synthétique des utilisateurs et licences.

### 3.3 Gestion des utilisateurs

La ressource `users` permet de :

- lister les utilisateurs,
- consulter un utilisateur,
- créer un utilisateur,
- modifier un utilisateur,
- supprimer un utilisateur.

Le frontend admin appelle :

- `GET /users`
- `POST /users`
- `PUT /users/:id`
- `DELETE /users/:id`

Les informations gérées sont principalement :

- email,
- nom,
- rôle,
- mot de passe à la création,
- nouveau mot de passe à la modification.

### 3.4 Gestion des licences

La ressource `license` permet de :

- lister les licences,
- consulter une licence,
- créer une licence,
- modifier une licence,
- supprimer une licence.

Le frontend admin appelle :

- `GET /license`
- `POST /license`
- `PUT /license/:id`
- `DELETE /license/:id`

Les informations gérées sont :

- `clientName`,
- `serialNumber`,
- `email`,
- `phone`,
- `logoUrl`,
- `status`,
- `maxUsers`,
- `expiresAt`,
- éventuellement `metadata`.

## 4. User Stories de la partie admin

### 4.1 Accès administrateur

- En tant qu’administrateur, je veux me connecter à une console dédiée afin d’administrer l’instance client.
- En tant qu’administrateur, je veux que les comptes non-admin soient bloqués afin de sécuriser l’accès au back-office.

### 4.2 Gestion des utilisateurs

- En tant qu’administrateur, je veux voir tous les utilisateurs afin d’avoir une vue globale des comptes.
- En tant qu’administrateur, je veux créer un utilisateur afin de donner accès à un nouveau collaborateur.
- En tant qu’administrateur, je veux modifier le rôle d’un utilisateur afin de gérer les autorisations.
- En tant qu’administrateur, je veux réinitialiser ou changer le mot de passe d’un utilisateur afin de maintenir l’accès.
- En tant qu’administrateur, je veux supprimer un utilisateur afin de retirer un accès obsolète.

### 4.3 Gestion des licences

- En tant qu’administrateur, je veux créer une licence afin d’enregistrer ou préparer un client.
- En tant qu’administrateur, je veux modifier l’état d’une licence afin de refléter son statut réel.
- En tant qu’administrateur, je veux définir une date d’expiration afin de suivre la validité d’une licence.
- En tant qu’administrateur, je veux définir un nombre maximum d’utilisateurs afin de cadrer l’usage de l’instance.
- En tant qu’administrateur, je veux supprimer une licence si elle ne doit plus exister dans l’environnement de démonstration ou d’administration.

### 4.4 Supervision simple

- En tant qu’administrateur, je veux voir des indicateurs rapides afin d’avoir une lecture immédiate de l’instance.
- En tant qu’administrateur, je veux identifier combien d’admins et de licences actives existent afin de piloter la configuration.

## 5. Fonctionnalités réellement disponibles aujourd’hui

La partie admin supporte actuellement :

- page de connexion dédiée,
- authentification JWT,
- contrôle du rôle `ADMIN`,
- dashboard d’administration,
- liste des utilisateurs,
- création d’utilisateurs,
- consultation d’un utilisateur,
- modification d’un utilisateur,
- suppression d’un utilisateur,
- liste des licences,
- création de licences,
- consultation d’une licence,
- modification d’une licence,
- suppression d’une licence,
- page de configuration simple,
- thème et layout d’admin personnalisés.

## 6. Ressources branchées réellement

La console admin est branchée sur les endpoints backend suivants :

- `POST /auth/login`
- `GET /auth/me`
- `GET /users`
- `POST /users`
- `PUT /users/:id`
- `DELETE /users/:id`
- `GET /license`
- `POST /license`
- `PUT /license/:id`
- `DELETE /license/:id`

## 7. Ce que l’admin ne fait pas encore

Même si la console est déjà exploitable, elle ne couvre pas encore tout le potentiel d’un back-office complet.

Limitations actuelles :

- il n’existe pas encore de gestion admin complète des vidéos dans React-admin,
- il n’existe pas de ressource dédiée pour les audits,
- il n’existe pas de gestion des clés cryptographiques dans l’interface,
- il n’existe pas de module de configuration avancée du client,
- il n’existe pas de reporting détaillé ni d’export métier élaboré,
- il n’existe pas de workflow de suspension automatisée ou de renouvellement de licence.

En pratique :

- l’admin actuel est un **back-office MVP solide** pour gérer comptes et licences,
- mais pas encore un centre de supervision complet de tous les modules du système.

## 8. Écrans de la partie admin

### Login Admin

Responsabilités :

- authentifier l’administrateur,
- empêcher l’accès aux non-admin,
- ouvrir une session de back-office sécurisée.

### Dashboard

Responsabilités :

- afficher un état synthétique de l’instance,
- rappeler les ressources disponibles,
- exposer quelques métriques utiles.

### Users List / Show / Create / Edit

Responsabilités :

- gérer le cycle de vie des utilisateurs,
- consulter rapidement les rôles,
- maintenir les accès de l’instance.

### License List / Show / Create / Edit

Responsabilités :

- gérer la configuration métier des licences,
- suivre les statuts,
- maintenir les informations client associées.

### Settings

Responsabilités :

- afficher des informations de configuration sur la console admin,
- rappeler les ressources connectées,
- documenter les limites actuelles de la console.

## 9. Sécurité portée par la partie admin

La partie admin repose sur plusieurs garde-fous :

- authentification JWT,
- vérification du rôle `ADMIN`,
- endpoints backend protégés,
- séparation entre console admin et espace client,
- opérations critiques centralisées côté backend.

La sécurité est donc assurée principalement par :

- le backend Express,
- le middleware d’authentification,
- le contrôle RBAC,
- la validation des entrées.

## 10. Position de la partie admin dans le projet

Dans ce projet, la partie admin sert de point d’entrée pour la gouvernance fonctionnelle de l’instance client.

Elle permet :

- d’initialiser et gérer les accès,
- de maintenir les licences,
- de démontrer le pilotage SaaS multi-client,
- de compléter la partie client qui, elle, est orientée usage métier final.

## 11. Résumé simple

La partie admin est la console de back-office sécurisée.

Elle permet aujourd’hui de :

- se connecter comme administrateur,
- gérer les utilisateurs,
- gérer les licences,
- superviser l’instance à un niveau fonctionnel.

Elle est censée évoluer ensuite vers une administration plus complète incluant potentiellement :

- audit,
- vidéos,
- crypto,
- reporting,
- supervision avancée.
