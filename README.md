<img align="center" width="100" height="100" src="https://yaprof.fr/favicon.ico">

# [Yaprof](https://yaprof.fr) - La nouvelle app des étudiants

Bienvenue sur le readme de la **REST-API** 🎉<br>
Avant de commencer, il est important de lire ce fichier et de respecter les différentes règles pour le bon fonctionnement du projet.

## 🎈 Informations contribuateurs

Tout d'abord, merci à vous de nous aider sur le projet. Grâce à vous, Yaprof peut vivre et se mettre à jour régulièrement.
En ce qui concerne le développement, quelques règles basiques :
- Utilisez des noms de commits adéquats et raisonnables
- N'hésitez pas à commenter votre code
- Résolvez les conflits à tête reposée

## Installation

Pour commencer, installez les modules :

```bash
npm install
```

## Configuration

La rest-api est connectée à une base de données Postgresql.
Pour cela, veuillez créer un `.env` avec comme schema : 

```env
DATABASE_URL="postgres://root:password@localhost:5432/yaprof"
PRONOTE_API="PRONOTE_API_URL"

JSON_WEB_TOKEN="YOUR_SECRET_KEY"
```

N'oubliez pas de migrer les bases de données afin de créer les tables et les colonnes :

```bash
prisma migrate dev --name init
```

## Lancement

Lancez le serveur sur `http://localhost:3000`

```bash
npm run dev
```

Pour toutes informations veuillez rejoindre notre [Discord](https://discord.gg/yaprof)
