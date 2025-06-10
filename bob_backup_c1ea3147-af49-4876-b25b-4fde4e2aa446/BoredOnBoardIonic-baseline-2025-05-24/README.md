# BoredOnBoard (BoB)

Application mobile et service backend pour la gestion intelligente des voyages.

---

## Table des matières
- [Frontend (Ionic/Angular)](#frontend-ionicangular)
- [Backend (Node.js)](#backend-nodejs)
- [Structure du dépôt](#structure-du-dépôt)
- [Contribution](#contribution)
- [Licence](#licence)
- [User Acceptance Tests (UAT)](#user-acceptance-tests-uat)

---

## Frontend (Ionic/Angular)

Application mobile hybride de gestion de voyages intelligente, inspirée de TripIt, avec parsing automatique des emails et synchronisation cloud.

### Présentation
BoB est une application mobile hybride (Ionic/Angular/Capacitor) pour la gestion intelligente des voyages : parsing automatique des emails, synchronisation Firestore, expérience utilisateur avancée, multilingue, authentification sécurisée, dashboard inspiré de TripIt.

### Documentation principale
- [État du Projet](docs/project/PROJECT_STATUS.md)
- [Architecture](docs/architecture/ARCHITECTURE.md)
- [Guide de Développement](docs/development/DEVELOPMENT_GUIDE.md)
- [Plan de Tests](docs/testing/TEST_PLAN.md)

### Démarrage rapide
```bash
# Cloner le projet
 git clone [URL_REPO]

# Installer les dépendances
 npm install

# Démarrer le serveur de développement
 ionic serve
```

### Stack technique
- Ionic/Angular
- Capacitor
- Firebase Auth

### Fonctionnalités principales
- Parsing automatique des emails
- Synchronisation bidirectionnelle
- Gestion des voyages et plans
- Interface utilisateur moderne
- Support multilingue (FR/EN)
- Authentification sécurisée

---

## Backend (Node.js)

Service backend pour l'application BoredOnBoard, gérant la récupération et le traitement des emails de réservation de voyage.

### Fonctionnalités
- Récupération automatique des emails de réservation via IMAP
- Support pour plusieurs fournisseurs de voyage (EasyJet, TripIt, Air France, Lufthansa...)
- Stockage des réservations dans Firebase
- Traitement des informations de vol (dates, aéroports, sièges, etc.)

### Prérequis
- Node.js (v14 ou supérieur)
- npm
- Un compte Firebase
- Un compte email avec accès IMAP

### Installation
```bash
cd backend
npm install
cp .env.example .env
# Éditer .env avec vos informations
```

### Utilisation
```bash
npm start
```

---

## Structure du dépôt

```
/ (racine)
├── src/                # Frontend Ionic/Angular
├── backend/            # Backend Node.js (scripts, service email, etc.)
├── docs/               # Documentation
├── package.json        # Frontend
├── backend/package.json# Backend
├── README.md           # Ce fichier
└── ...
```

---

## Contribution

1. Fork le projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'feat: Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

---

## Licence

Ce projet est sous licence [LICENSE]. Voir le fichier `LICENSE` pour plus de détails.

## Script de maintenance du compte démo Firebase Auth

Un script Node.js est disponible pour supprimer puis recréer le compte démo (guestuser@demo.com) avec l'UID d'origine, afin de garantir la cohérence avec les données Firestore.

- **Emplacement :** `backend/scripts/recreate_demo_user.cjs`
- **Prérequis :**
  - Avoir un fichier `serviceAccount.json` à la racine du projet (clé admin Firebase)
  - Node.js installé
- **Usage :**

```bash
node backend/scripts/recreate_demo_user.cjs
```

Ce script :
- Supprime l'utilisateur de démo s'il existe (par UID)
- Le recrée avec le même UID, email et mot de passe (`DemoPassword123!`)
- Permet de garder tous les voyages et données liés à ce compte

**À utiliser en cas de problème de connexion du mode démo (mot de passe oublié, etc.)**

## Procédure en cas de changement d'UID du compte démo

Si le compte démo (guestuser@demo.com) est supprimé puis recréé dans Firebase Auth, un nouvel UID sera généré. Pour garantir la cohérence des données de démo :

1. Récupérer le nouvel UID dans la console Firebase Auth.
2. Mettre à jour la variable `DEMO_UID` dans `src/scripts/seed-demo-trips.ts` et recompiler le script.
3. Lancer le script de seed pour régénérer les voyages et plans de démo liés à ce nouvel utilisateur :
   ```bash
   npx tsc --target es2015 --module commonjs src/scripts/seed-demo-trips.ts --outDir src/scripts/
   node src/scripts/seed-demo-trips.js
   ```
4. Tester le mode démo dans l'application.

Ce process garantit que toutes les données de démo sont bien rattachées au bon utilisateur, même après un changement d'UID.

## User Acceptance Tests (UAT)

Les UAT (tests d'acceptation utilisateur) sont décrits dans le fichier `UAT.md`.

- Les scénarios sont rédigés en Gherkin (Given/When/Then) pour être compréhensibles par tous.
- L'automatisation peut se faire avec Cypress, Playwright, Appium, etc.
- Les tests UAT peuvent être intégrés dans la CI/CD pour garantir la conformité à chaque build.

Voir `UAT.md` pour la démarche détaillée, des exemples et des conseils d'automatisation.
