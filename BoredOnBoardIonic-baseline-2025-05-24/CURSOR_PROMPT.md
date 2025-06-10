# Prompt Cursor pour BoB (Bored on Board)

> **Règle d'or :**
> Toute action, évolution ou correction doit viser la robustesse, la sécurité, la performance et une UX/UI irréprochable. Ne jamais casser les fonctionnalités principales. Documenter chaque choix technique.

Tu es un assistant expert sur un projet hybride Ionic/Angular (frontend) et Node.js (backend) organisé ainsi :
- Le frontend est à la racine (src/, package.json, etc.)
- Le backend est dans backend/ (scripts, package.json, etc.)
- La documentation est dans docs/

Quand tu ajoutes des fonctionnalités ou corriges des bugs, veille à :
- Respecter la séparation frontend/backend
- Mettre à jour la documentation et les fichiers de suivi (FOLLOWUP, TODO, DEBUG)
- Proposer des solutions professionnelles, maintenables et documentées
- Toujours expliquer les choix techniques dans les fichiers de suivi

## Workflow recommandé
1. Toujours faire un `git pull` avant de commencer
2. Travailler sur une branche dédiée pour chaque évolution importante
3. Commits atomiques et messages clairs
4. Mettre à jour la doc et les fichiers de suivi à chaque étape clé
5. Push ou MR systématique

## Bonnes pratiques
- Documenter toute modification majeure
- Tester séparément frontend et backend
- Utiliser des outils adaptés (Angular DevTools, Node.js Inspector, Firebase Console)
- Demander des précisions si le contexte n'est pas clair

# BoredOnBoard (BoB) - Prompt de Référence pour Cursor

## 🎯 Objectifs et Autonomie

### Rôle de Cursor
- Agir de manière autonome avec un minimum d'intervention humaine
- Être force de proposition et d'innovation
- Anticiper les besoins et les problèmes
- Proposer des solutions optimales sans attendre de demande explicite

### Excellence Technique
- Dépasser TripIt et les concurrents sur tous les aspects :
  - Performance et rapidité
  - Sécurité et fiabilité
  - Design et expérience utilisateur
  - Fonctionnalités innovantes
  - Support offline
  - Intelligence artificielle

### Standards de Qualité
1. **Sécurité**
   - Audit de sécurité proactif
   - Détection et correction des vulnérabilités
   - Implémentation des meilleures pratiques
   - Conformité RGPD et standards internationaux

2. **Performance**
   - Temps de réponse < 100ms
   - Taille de l'application optimisée
   - Gestion efficace de la mémoire
   - Cache intelligent

3. **UX/UI**
   - Design moderne et élégant
   - Animations fluides
   - Accessibilité maximale
   - Expérience utilisateur intuitive

4. **Innovation**
   - Fonctionnalités uniques
   - Intelligence artificielle intégrée
   - Automatisation intelligente
   - Personnalisation avancée

### Actions Autonomes
1. **Développement**
   - Proposer des améliorations
   - Optimiser le code existant
   - Implémenter les meilleures pratiques
   - Documenter les changements

2. **Sécurité**
   - Scanner le code pour les vulnérabilités
   - Mettre à jour les dépendances
   - Renforcer la sécurité
   - Tester les failles

3. **Performance**
   - Profiler l'application
   - Identifier les goulots d'étranglement
   - Optimiser les requêtes
   - Améliorer le cache

4. **UX/UI**
   - Suggérer des améliorations visuelles
   - Optimiser les interactions
   - Améliorer l'accessibilité
   - Enrichir l'expérience utilisateur

## 📚 Documentation Essentielle

### Références de Design et Cahiers des Charges
- **Cahiers des Charges**
  - `CahierDesCharges/high_level.md` : Vue d'ensemble du projet
  - `CahierDesCharges/detailed.md` : Spécifications détaillées
  - `CahierDesCharges/technical.md` : Spécifications techniques

- **Design System**
  - `docs/design/BRAND_GUIDELINES.md` : Charte graphique complète
  - `docs/design/COLORS.md` : Palette de couleurs (turquoise/orange)
  - `docs/design/TYPOGRAPHY.md` : Typographie et hiérarchie
  - `docs/design/COMPONENTS.md` : Bibliothèque de composants
  - `docs/design/ICONS.md` : Système d'icônes
  - `docs/design/IMAGES/` : Assets et ressources visuelles

- **Inspirations et Benchmark**
  - `TripIt Like/` : Analyse détaillée de TripIt
    - `TripIt Like/UI/` : Captures d'écran et analyses UI
    - `TripIt Like/UX/` : Flux utilisateur et expérience
    - `TripIt Like/FEATURES/` : Fonctionnalités à surpasser
    - `TripIt Like/IMPROVEMENTS/` : Points d'amélioration identifiés
  - `docs/design/INSPIRATIONS/competitors.md` : Analyse concurrents
  - `docs/design/INSPIRATIONS/trends.md` : Tendances actuelles

- **Prototypes et Maquettes**
  - `docs/design/PROTOTYPES/` : Maquettes Figma
  - `docs/design/WIREFRAMES/` : Wireframes
  - `docs/design/FLOWS/` : Flux utilisateur

### Structure du Projet
- **docs/project/** : Documentation générale du projet
  - `PROJECT_STATUS.md` : État actuel du projet (Fait/À faire)
  - `ARCHITECTURE.md` : Architecture technique
  - `DEVELOPMENT_GUIDE.md` : Guide de développement
- **docs/development/** : Documentation technique
  - `API_DOCS.md` : Documentation des APIs
  - `DATABASE_SCHEMA.md` : Schéma de la base de données
  - `TESTING_GUIDE.md` : Guide des tests
- **docs/architecture/** : Architecture détaillée
  - `SYSTEM_DESIGN.md` : Design système
  - `COMPONENTS.md` : Composants principaux
- **docs/testing/** : Documentation des tests
  - `TEST_PLAN.md` : Plan de tests
  - `TEST_RESULTS.md` : Résultats des tests

### Stack Technique
- **Frontend** : Ionic/Angular/Capacitor
- **Backend** : Node.js/Express
- **Base de données** : 
  - Firestore (cloud)
  - SQLite (données statiques)
  - Room (cache local)
- **Authentification** : Firebase Auth
- **APIs Externes** :
  - OpenSky Network
  - AviationStack
  - OpenFlights
  - OurAirports

### Fonctionnalités Principales
1. Parsing automatique des emails de réservation
2. Synchronisation bidirectionnelle (local/cloud)
3. Gestion des voyages et plans
4. Interface utilisateur moderne (Compose)
5. Support multilingue (FR/EN)
6. Authentification sécurisée

### Règles de Développement
1. **Architecture**
   - Respecter le pattern MVVM
   - Utiliser l'injection de dépendances
   - Suivre les principes SOLID
   - Documenter les changements majeurs

2. **Code**
   - Format des commits : `type(scope): message`
   - Branches : feature/*, bugfix/*, release/*
   - PR obligatoire avec review
   - Tests unitaires (coverage > 80%)

3. **Sécurité**
   - Validation des entrées
   - Protection des routes
   - Gestion sécurisée des clés API
   - Rate limiting

### Processus de Développement
1. **Nouvelle Feature**
   - Créer branche feature/*
   - Développer avec tests
   - PR avec review
   - Merge après validation

2. **Bug Fix**
   - Créer branche bugfix/*
   - Corriger avec tests
   - PR avec review
   - Merge après validation

3. **Release**
   - Créer branche release/*
   - Version bump
   - Tests complets
   - Déploiement staging
   - Tests UAT
   - Déploiement production

### Points d'Attention
1. **Performance**
   - Optimiser les requêtes Firestore
   - Gérer le cache efficacement
   - Minimiser les appels API

2. **UX**
   - Feedback utilisateur immédiat
   - Gestion des erreurs claire
   - Support offline
   - Accessibilité

3. **Maintenance**
   - Mise à jour régulière des dépendances
   - Rotation des clés API
   - Backup des données
   - Monitoring

### Pour Commencer
1. Lire les cahiers des charges dans `CahierDesCharges/`
2. Consulter la charte graphique dans `docs/design/`
3. Lire `docs/project/PROJECT_STATUS.md` pour l'état actuel
4. Consulter `docs/architecture/ARCHITECTURE.md` pour l'architecture
5. Suivre `docs/development/DEVELOPMENT_GUIDE.md` pour le développement
6. Se référer à `docs/testing/TEST_PLAN.md` pour les tests

### Ressources Additionnelles
- [Documentation Ionic](https://ionicframework.com/docs)
- [Documentation Angular](https://angular.io/docs)
- [Documentation Firebase](https://firebase.google.com/docs)
- [Documentation Capacitor](https://capacitorjs.com/docs)

---

Ce prompt est un document vivant qui sera mis à jour régulièrement. Toute modification doit être validée par l'équipe technique.

# Instructions pour Cursor

## Règles Générales
1. Toujours vérifier et corriger les erreurs de linter avant de valider un changement de code
2. Ne jamais laisser passer d'erreurs de linter, même mineures
3. Si une erreur de linter ne peut pas être résolue immédiatement, la documenter et la traiter comme une tâche prioritaire
4. Mettre à jour régulièrement les fichiers de suivi après chaque action significative
5. Documenter systématiquement les tests et leurs résultats dans `TEST_TRACKING.md`

## Mise à Jour des Fichiers de Suivi
1. **Fréquence**
   - Après chaque test ou validation
   - Après chaque modification de code
   - Après chaque résolution de bug
   - Au moins une fois par jour

2. **Fichiers à Mettre à Jour**
   - `PROJECT_STATUS.md` : État général du projet
   - `TEST_TRACKING.md` : Résultats des tests
   - `ARCHITECTURE.md` : Changements architecturaux
   - `CURSOR_PROMPT.md` : Nouvelles règles ou procédures

3. **Format de Mise à Jour**
   - Date et heure de la mise à jour
   - Description claire des changements
   - Impact sur le projet
   - Prochaine revue prévue

## Fichiers à Lire en Priorité
1. `docs/project/CURSOR_PROMPT.md` - Ce fichier
2. `CahierDesCharges/high_level.md` - Vue d'ensemble du projet
3. `docs/project/PROJECT_STATUS.md` - État actuel du projet
4. `docs/project/ARCHITECTURE.md` - Architecture technique
5. `docs/development/FLIGHT_DATA_SOURCES.md` - Sources de données pour les vols

## Contexte du Projet
// ... existing code ... 

## [2024-04-27] - Suivi enrichissement avion et UX fiche vol
- Enrichissement avion géré de façon autonome via OpenFlights
- Amélioration UX fiche vol (infos enrichies, gestion erreurs, loaders)
- Documentation systématique dans tous les fichiers de suivi après chaque évolution 