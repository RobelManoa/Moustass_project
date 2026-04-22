# Info Licence

## État actuel de la licence dans le projet

La licence existe déjà dans le projet, mais elle fonctionne aujourd’hui comme une ressource d’administration classique, pas encore comme une fenêtre licence obligatoire à l’ouverture de l’application.

### Ce qui est déjà en place

- La licence est stockée en base MySQL via Prisma.
- Le backend expose un CRUD complet sur `/license`.
- L’accès aux routes licence est protégé par JWT + rôle `ADMIN`.
- L’interface `admin` permet de créer, consulter, modifier et supprimer une licence.

### Fichiers concernés

- Backend API licence : [backend_moustass/src/modules/license/license.routes.ts](backend_moustass/src/modules/license/license.routes.ts)
- Service licence : [backend_moustass/src/modules/license/license.service.ts](backend_moustass/src/modules/license/license.service.ts)
- Schéma base de données : [backend_moustass/prisma/schema.prisma](backend_moustass/prisma/schema.prisma)
- Écran admin licence : [admin/src/licenses.tsx](admin/src/licenses.tsx)
- Data provider admin : [admin/src/dataProvider.ts](admin/src/dataProvider.ts)

## Comparaison avec ce qui est demandé

### 1. Création d’une fenêtre texte LICENCE obligatoire

Demandé : une fenêtre licence obligatoire, avant ou au lancement de l’application.

Actuel : non implémenté.

Le projet possède un écran de gestion licence dans l’admin, mais pas une vraie fenêtre obligatoire côté application client qui bloque ou autorise l’exécution.

### 2. Sauvegarde dans la base MySQL

Demandé : la licence doit être sauvegardée dans MySQL.

Actuel : oui.

La table `License` existe déjà dans Prisma et les données sont persistées en base.

### 3. Champs obligatoires à afficher

Demandé :
- nom de la société cliente et adresse
- logo de la société cliente
- contact email et numéro de téléphone
- numéro de série / licence
- nombre maximal d’utilisateurs
- date de création et date d’expiration

Actuel : partiellement couvert.

Couvert aujourd’hui :
- nom de la société cliente (`clientName`)
- logo (`logoUrl`)
- email de contact (`email`)
- téléphone (`phone`)
- numéro de série (`serialNumber`)
- nombre maximal d’utilisateurs (`maxUsers`)
- date de création (`createdAt`)
- date d’expiration (`expiresAt`)

Manquant aujourd’hui :
- adresse de la société cliente

### 4. CRUD licence

Demandé : une app complétée avec fenêtre licence et CRUD.

Actuel : oui pour le CRUD admin.

Le backend et l’admin permettent déjà :
- liste
- création
- consultation
- modification
- suppression

### 5. Sécurité, signature, exécution

Demandé : sécurité, signature, exécution.

Actuel : partiellement couvert.

Ce qui est déjà présent :
- routes protégées par JWT
- accès admin protégé par rôle `ADMIN`
- stockage en base

Ce qui manque encore pour répondre pleinement au livrable :
- signature de licence comme objet métier vérifiable au démarrage
- contrôle d’exécution basé sur une licence valide
- affichage obligatoire de la licence côté application client

## Conclusion

La licence est déjà bien présente comme ressource d’administration et comme donnée persistée en base.

Mais elle ne couvre pas encore complètement la demande du livrable, parce qu’il manque surtout :
- la fenêtre licence obligatoire,
- l’adresse de la société cliente,
- la vérification de signature licence,
- le contrôle d’exécution au lancement de l’app.

## Résumé rapide

- Oui pour : CRUD, MySQL, nom société, logo, email, téléphone, numéro de série, max users, dates.
- Non encore pour : fenêtre licence obligatoire, adresse, signature licence, blocage d’exécution si licence invalide.
