# Instruction Client

## 1. Rôle de la partie client

La partie `client` représente l’interface utilisée par les utilisateurs métier de la plateforme Moustass SVM.

Son objectif est de permettre à un utilisateur authentifié de :

- se connecter à son espace sécurisé,
- consulter les vidéos qui lui appartiennent dans l’instance client,
- lire une vidéo de manière authentifiée,
- envoyer une nouvelle vidéo,
- supprimer une vidéo qui lui appartient,
- visualiser quelques métadonnées de confiance autour du média.

Dans l’état actuel du projet, la partie client fonctionne comme un **espace personnel sécurisé de gestion de vidéos**.

## 2. Ce que le client est censé faire dans le projet

Fonctionnellement, la partie client est censée être l’interface de consommation et de dépôt des messages vidéo sécurisés.

Elle doit servir à :

- authentifier un utilisateur via le backend,
- accéder uniquement aux données autorisées pour ce client et ce compte,
- envoyer des vidéos vers le backend,
- afficher les vidéos disponibles pour l’utilisateur,
- assurer une lecture protégée par JWT,
- s’inscrire dans le flux de sécurité du projet :
  - authentification,
  - contrôle d’accès,
  - vérification d’intégrité,
  - audit des actions sensibles.

## 3. Fonctionnement général

### 3.1 Connexion

Le client commence sur une page de connexion.

L’utilisateur saisit :

- son email,
- son mot de passe.

Le frontend appelle :

- `POST /auth/login`

Si la connexion réussit :

- le backend renvoie un JWT,
- le frontend stocke le token,
- l’utilisateur est redirigé vers l’espace messages.

Le frontend récupère aussi :

- `GET /info` pour connaître le nom du client et la version,
- `GET /auth/me` pour connaître l’utilisateur connecté.

### 3.2 Consultation des messages

Une fois connecté, l’utilisateur arrive sur la page `Messages`.

Le frontend appelle :

- `GET /messages`

Le backend retourne les vidéos non supprimées :

- appartenant à l’utilisateur si son rôle est `USER`,
- ou toutes les vidéos visibles si le rôle est `ADMIN`.

Pour chaque message, l’interface affiche :

- le titre,
- la description,
- le nom du fichier original,
- le type MIME,
- la date,
- l’empreinte `SHA-256`.

### 3.3 Lecture vidéo

Quand l’utilisateur sélectionne un message, le frontend lit la vidéo via :

- `GET /messages/:id`

La lecture est sécurisée car :

- l’appel est authentifié par JWT,
- le backend vérifie que l’utilisateur a le droit d’accès,
- le backend vérifie la signature du manifest avant la lecture,
- l’action de lecture est journalisée.

Le frontend charge la vidéo sous forme de `Blob` puis l’affiche dans un lecteur HTML5.

### 3.4 Upload vidéo

L’utilisateur peut ouvrir la page `Upload` pour envoyer une nouvelle vidéo.

Le formulaire demande :

- un titre,
- une description optionnelle,
- un fichier vidéo.

Le frontend envoie un `multipart/form-data` vers :

- `POST /messages/upload`

Le backend :

1. vérifie l’authentification,
2. lit le fichier,
3. calcule le hash `SHA-256`,
4. construit le manifest,
5. signe le manifest,
6. stocke la vidéo,
7. enregistre les métadonnées en base,
8. écrit une entrée d’audit.

### 3.5 Suppression d’un message

Depuis la page des messages, l’utilisateur peut supprimer une vidéo.

Le frontend appelle :

- `DELETE /messages/:id`

Le backend :

- vérifie les droits,
- supprime le fichier stocké,
- marque le message comme supprimé (`deletedAt`),
- journalise l’action.

## 4. User Stories de la partie client

### 4.1 Authentification

- En tant qu’utilisateur, je veux me connecter avec mon email et mon mot de passe afin d’accéder à mon espace sécurisé.
- En tant qu’utilisateur, je veux que ma session soit conservée tant que mon token est valide afin de ne pas me reconnecter à chaque navigation.
- En tant qu’utilisateur, je veux être redirigé vers la page de connexion si mon token n’est plus valide afin de garantir la sécurité.

### 4.2 Consultation

- En tant qu’utilisateur, je veux voir la liste de mes vidéos afin de retrouver rapidement un message.
- En tant qu’utilisateur, je veux voir les métadonnées principales d’une vidéo afin d’identifier son contenu.
- En tant qu’utilisateur, je veux consulter l’empreinte du média afin d’avoir un indicateur d’intégrité.

### 4.3 Lecture

- En tant qu’utilisateur, je veux lire une vidéo depuis l’application afin de consulter son contenu sans accès direct public au fichier.
- En tant qu’utilisateur, je veux que l’accès soit refusé si je n’ai pas les droits afin de protéger les vidéos sensibles.

### 4.4 Upload

- En tant qu’utilisateur, je veux envoyer une vidéo avec un titre et une description afin de créer un message exploitable.
- En tant qu’utilisateur, je veux recevoir un retour clair après l’envoi afin de savoir si la vidéo a bien été stockée.

### 4.5 Suppression

- En tant qu’utilisateur, je veux supprimer une vidéo afin de retirer un contenu de mon espace.
- En tant qu’utilisateur, je veux une confirmation avant suppression afin d’éviter une erreur irréversible.

## 5. Fonctionnalités réellement disponibles aujourd’hui

La partie client supporte actuellement :

- page de connexion,
- session JWT,
- récupération des infos client via `/info`,
- récupération du profil courant via `/auth/me`,
- routes protégées,
- page `Messages`,
- liste des vidéos,
- sélection d’une vidéo,
- lecture vidéo sécurisée,
- affichage de métadonnées,
- suppression d’une vidéo,
- page `Upload`,
- envoi multipart avec titre, description et fichier,
- navigation entre `Messages` et `Upload`,
- déconnexion.

## 6. Limitations actuelles

La partie client actuelle ne couvre pas encore tout ce que le projet pourrait viser à terme.

Limitations importantes :

- il n’existe pas encore de notion complète de destinataire côté backend,
- il n’existe pas de boîte de réception “messages reçus” distincte,
- il n’existe pas de recherche avancée, ni de filtres, ni de pagination,
- il n’existe pas d’aperçu cryptographique détaillé du manifest signé,
- il n’existe pas de partage, de notification ou d’historique détaillé côté frontend,
- l’interface est centrée sur les vidéos accessibles au compte courant.

Autrement dit :

- le client actuel est un **MVP fonctionnel de gestion sécurisée de vidéos**, pas encore une messagerie vidéo multi-interlocuteurs complète.

## 7. Écrans de la partie client

### Page Login

Responsabilités :

- saisir les identifiants,
- déclencher la connexion,
- afficher les erreurs de login,
- présenter le contexte du client courant.

### Page Messages

Responsabilités :

- afficher les vidéos disponibles,
- permettre la sélection d’un message,
- lire une vidéo,
- afficher les métadonnées principales,
- supprimer un message.

### Page Upload

Responsabilités :

- créer un nouveau message vidéo,
- valider les champs obligatoires,
- envoyer le média au backend,
- confirmer le succès de l’opération.

## 8. Sécurité portée par la partie client

Le frontend client n’implémente pas lui-même la cryptographie métier, mais il s’insère dans une chaîne sécurisée :

- le token JWT est nécessaire pour tous les endpoints protégés,
- la lecture passe toujours par l’API,
- la vidéo n’est pas exposée comme un simple fichier public,
- l’intégrité est vérifiée côté backend avant lecture,
- les opérations sensibles sont auditées côté backend.

## 9. Résumé simple

La partie client est l’espace sécurisé de l’utilisateur final.

Elle lui permet aujourd’hui de :

- se connecter,
- voir ses vidéos,
- lire une vidéo,
- envoyer une vidéo,
- supprimer une vidéo,
- travailler dans une interface reliée à un backend sécurisé.

Elle est censée évoluer vers une expérience plus riche de messagerie vidéo sécurisée, mais l’état actuel est déjà un socle fonctionnel cohérent pour la démonstration du projet.
