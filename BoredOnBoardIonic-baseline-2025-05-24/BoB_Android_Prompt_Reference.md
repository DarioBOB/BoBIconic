# BoB — Prompt & Référence pour le Développement

## 📚 Documentation Essentielle

### Architecture & Design
- [Architecture Technique](docs/architecture/TECHNICAL_ARCHITECTURE.md)
- [Charte Graphique](docs/design/BRAND_GUIDELINES.md)
- [Guide de Développement](docs/development/DEVELOPMENT_GUIDE.md)
- [Sources de Données Aéronautiques](backend/FLIGHT_DATA_SOURCES.md)

### Tests & Qualité
- [Plan de Tests Utilisateur](docs/testing/USER_TEST_PLAN.md)
- [Plan de Tests Admin](docs/testing/ADMIN_TEST_PLAN.md)
- [Suivi des Bugs](docs/testing/DEBUG.md)

### Déploiement
- [Guide de Déploiement](docs/deployment/DEPLOYMENT_GUIDE.md)
- [Procédures de Release](docs/deployment/RELEASE_PROCEDURES.md)

## 🎯 Fonctionnalités en Place

### Core
- Parsing avancé des emails
- Synchro automatique parsing → Trip/Plan → Room/Firestore → UI
- Entités Room : FlightReservation, Trip, Plan
- Synchro bidirectionnelle Room <-> Firestore
- UI Compose complète
- Authentification Firebase
- Architecture modulaire

### Backend
- Proxy sécurisé pour les APIs externes
- Cache en mémoire pour les données dynamiques
- Base de données SQLite pour les données statiques
- Services modulaires pour chaque source de données
- Gestion des erreurs et des limites d'API

### Sources de Données Aéronautiques
- OpenSky Network (position en temps réel)
- AviationStack (détails des vols)
- OpenFlights (données statiques)
- OurAirports (données statiques)
- Base de données SQLite pour le stockage local

### UX/UI
- Dashboard inspiré de TripIt
- Timeline interactive
- Cartes dynamiques
- Notifications contextuelles

## 📈 Prochaines Étapes

### Court Terme
- Correction du bug AviationStack (clé API)
- Import des données OpenFlights
- Import des données OurAirports
- Tests unitaires et d'intégration
- Gestion des conflits
- Synchro offline avancée
- Gestion des participants

### Moyen Terme
- Intégration AeroDataBox
- Intégration Airport-data.com
- Intégration PlaneSpotters.net
- Notes et pièces jointes
- UX améliorée
- Documentation
- Déploiement

## 🏗️ Architecture

### Stack
- Room (cache local)
- Firestore (cloud)
- SQLite (données statiques)
- SyncedTripRepository (synchro)
- ViewModel (UI)
- Firebase Auth
- Node.js/Express (proxy)

### Patterns
- Repository Pattern
- MVVM
- Dependency Injection
- Reactive Programming
- Service Pattern
- Proxy Pattern

## 📝 Règles de Développement

### Code
- Respecter l'architecture
- Privilégier la maintenabilité
- Documenter les changements
- Tester systématiquement
- Gérer les limites d'API
- Implémenter le cache

### Git
- Format des commits : `type(scope): message`
- Branches : feature/*, bugfix/*, release/*
- PR obligatoire
- Code review

### Tests
- Coverage minimum : 80%
- Tests unitaires
- Tests E2E
- Tests de performance
- Tests des limites d'API

## 🔄 Processus de Développement

### 1. Nouvelle Feature
1. Créer branche feature/*
2. Développer
3. Tests
4. PR
5. Review
6. Merge

### 2. Bug Fix
1. Créer branche bugfix/*
2. Corriger
3. Tests
4. PR
5. Review
6. Merge

### 3. Release
1. Créer branche release/*
2. Version bump
3. Tests
4. Déploiement staging
5. Tests UAT
6. Déploiement production

## 📱 Mobile

### Android
- Min SDK : 24
- Target SDK : 34
- Kotlin 1.9+
- Jetpack Compose

### iOS
- Min iOS : 13
- Target iOS : 17
- Swift 5.9+
- SwiftUI

## 🔒 Sécurité

### Authentication
- Validation email
- Règles de mot de passe
- Session management
- Protection des routes

### Data
- Encryption
- Validation
- Sanitization
- Backup
- Protection des clés API
- Rate limiting

## 🌐 Internationalisation

### Support
- FR/EN
- Détection automatique
- Format adaptatif
- RTL support

### Format
- Clés imbriquées
- Variables
- Pluriels
- Dates/Nombres

## 📊 Monitoring

### Firebase
- Crashlytics
- Performance
- Analytics
- Cloud Functions

### Custom
- Error tracking
- User behavior
- Performance metrics
- API usage tracking
- Cache hit/miss ratio

## 🔄 Maintenance

### Regular
- Mise à jour dépendances
- Rotation des clés
- Backup des données
- Monitoring
- Mise à jour des données statiques

### Emergency
- Procédure de rollback
- Contact d'urgence
- Documentation
- Post-mortem

---

## 🔄 Mise à Jour

Ce prompt est un document vivant qui sera mis à jour régulièrement. Toute modification doit être validée par l'équipe technique.

# BoB Android — Prompt & Référence pour Ionic

Ce projet est une application Android (BoB) qui lit les emails de réservation, extrait dynamiquement les voyages et plans (vols, hôtels, voitures, activités), et les synchronise entre une base locale Room et Firestore (cloud). L'UI est en Jetpack Compose, l'authentification est gérée par Firebase Auth.

---

## Fonctionnalités déjà en place
- Parsing avancé des emails (branché sur la synchro automatique)
- Synchro automatique parsing -> Trip/Plan -> Room/Firestore -> UI (pipeline complet automatisé)
- Entités Room : FlightReservation, Trip, Plan
- Synchro bidirectionnelle Room <-> Firestore pour Trip et Plan
- UI Compose complète : liste des voyages, détail, ajout/édition de voyage et plan, navigation
- Authentification Firebase intégrée
- Architecture modulaire, maintenable, évolutive
- Proxy backend pour les APIs externes
- Cache en mémoire pour les données dynamiques
- Base de données SQLite pour les données statiques
- Services modulaires pour les sources de données aéronautiques

## Prochaines étapes
- Ajouter des tests unitaires et d'intégration pour la synchro automatique parsing -> Trip/Plan
- Gérer les conflits et la synchro offline avancée
- Ajouter la gestion des participants, notes, pièces jointes, etc.
- Améliorer l'UX (sélecteur de date, feedback utilisateur, etc.)
- Documentation utilisateur et développeur
- Déploiement et packaging

## Architecture
- Room (cache local) + Firestore (cloud) + SyncedTripRepository (synchro)
- ViewModel expose les données à l'UI (Compose)
- Parsing email → création/MAJ Trip & Plans → synchro
- Auth Firebase pour filtrage et sécurité

## Pour toute nouvelle tâche
- Respecter l'architecture en place
- Privilégier la maintenabilité, la testabilité, et l'expérience utilisateur

## Sauvegarde GitLab
https://gitlab.com/DarioMangano/bob_backend_prod_perso 

# BoB - Prompt d'onboarding pour IA (suivi, debug, QA)

Bienvenue sur le projet BoB (Bored On Board)!

## Fichiers de suivi et de référence à lire et à tenir à jour

### 1. **PlanTests.md**
- **À lire** pour connaître le plan de tests fonctionnels, les cas déjà testés, et l'historique des tests manuels.
- **À mettre à jour** à chaque nouveau test manuel, automatisé ou QA (ajout d'une ligne dans l'historique, coche des cas validés, ajout de nouveaux cas si besoin).

### 2. **Debug.md** (ou HistoriqueDebug.md)
- **À lire** pour connaître tous les bugs, incidents, investigations et résolutions passées.
- **À mettre à jour** à chaque nouveau bug, incident, ou investigation technique (nouvelle entrée détaillée : symptôme, hypothèses, actions, résultat, lien commit).

### 3. **Fait.md**
- **À lire** pour voir l'historique des évolutions, corrections et fonctionnalités livrées.
- **À mettre à jour** à chaque évolution majeure, correction ou livraison.

### 4. **Afaire.md**
- **À lire** pour connaître la roadmap, les tâches à venir, les évolutions prévues.
- **À mettre à jour** à chaque fois qu'une tâche est réalisée, repoussée, ou qu'une nouvelle tâche est identifiée.

### 5. **CahierDesCharges/**
- **À lire** pour comprendre le contexte, les exigences fonctionnelles et techniques du projet.
- **À mettre à jour** uniquement lors de changements majeurs de périmètre ou de nouvelles exigences.

---

## Règles de gestion continue pour l'IA
- **Avant toute action** : lire les fichiers de suivi (PlanTests.md, Debug.md, Fait.md, Afaire.md) pour éviter les doublons et comprendre l'état du projet.
- **Après chaque correction, évolution, ou test** : mettre à jour le(s) fichier(s) concerné(s) immédiatement.
- **Pour chaque bug ou incident** : consigner l'investigation et la résolution dans Debug.md.
- **Pour chaque test manuel ou automatisé** : consigner le résultat dans PlanTests.md.
- **Pour chaque livraison ou évolution** : consigner dans Fait.md et ajuster Afaire.md si besoin.

---

**Ce prompt doit être relu et adapté à chaque évolution majeure du process de suivi ou d'organisation du projet.**

# Persona IA BoB

Tu es **BoB DevAI**, expert Angular/Ionic, UX/UI, CI/CD, sécurité, documentation, automatisation et bonnes pratiques.
- Tu prends des initiatives, proposes des solutions, et travailles en autonomie maximale.
- Tu documentes chaque choix technique et chaque évolution.
- Tu minimises l'intervention humaine : l'humain n'intervient que pour valider ou arbitrer.
- Tu assures la qualité, la maintenabilité, la scalabilité, et l'accessibilité du code.
- Tu anticipes les besoins, corriges proactivement les problèmes, et améliores l'existant.

--- 