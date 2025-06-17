# TODO BoB (Bored on Board)

> **Règle d'or :**
> Toute tâche doit viser la robustesse, la sécurité, la performance et une UX/UI irréprochable. Priorité à la non-régression et à la qualité pro.

## Tâches structurelles
- [x] Séparer le backend dans `backend/` avec son propre package.json
- [x] Fusionner les .gitignore pour couvrir les deux environnements
- [x] Fusionner les README en une doc claire pour frontend et backend
- [x] Documenter le workflow pro et le prompt Cursor

## Tâches courantes
- [ ] Corriger le menu hamburger sur toutes les pages frontend
- [ ] Ajouter les couleurs aux icônes du menu
- [ ] Corriger les avertissements Firebase (contexte Angular)
- [ ] Améliorer la cohérence UI/UX
- [ ] Documenter toute évolution majeure dans les fichiers de suivi

## Bonnes pratiques
- Toujours pull avant de commencer
- Utiliser des branches pour les évolutions importantes
- Documenter les choix techniques
- Mettre à jour README, FOLLOWUP, TODO, DEBUG à chaque étape clé

## Priorités immédiates

### 1. Correction des problèmes de menu
- [ ] Résoudre le problème du menu hamburger sur toutes les pages
  - Vérifier les imports Ionic dans chaque composant
  - S'assurer que MenuController est correctement injecté
  - Tester le menu sur chaque page

- [ ] Corriger les couleurs des icônes du menu
  - Ajouter les variables CSS pour les couleurs
  - Mettre à jour les styles des icônes
  - Tester la cohérence visuelle

### 2. Optimisation Firebase
- [ ] Corriger les avertissements de contexte d'injection
  - Implémenter NgZone dans tous les composants
  - Vérifier la gestion des états
  - Optimiser les requêtes Firestore

### 3. Amélioration de l'UI/UX
- [ ] Uniformiser le style des composants
  - Créer un système de design cohérent
  - Mettre à jour les composants existants
  - Documenter les styles

- [ ] Améliorer les animations
  - Ajouter des transitions de page
  - Optimiser les animations du menu
  - Améliorer le feedback utilisateur

## Fonctionnalités à implémenter

### 1. Page Window (vue carte)
- [ ] Créer le composant de base
- [ ] Intégrer la carte
- [ ] Ajouter les marqueurs pour les voyages
- [ ] Implémenter la navigation

### 2. Page Chat
- [ ] Créer l'interface de chat
- [ ] Intégrer Firebase Realtime Database
- [ ] Ajouter les fonctionnalités de messagerie
- [ ] Implémenter les notifications

### 3. Page BoBBers
- [ ] Créer la liste des utilisateurs
- [ ] Ajouter les profils
- [ ] Implémenter la recherche
- [ ] Ajouter les interactions sociales

### 4. Autres pages
- [ ] Page Games
- [ ] Page Notifications
- [ ] Page Documents
- [ ] Page Support
- [ ] Page Preferences

## Améliorations techniques

### 1. Performance
- [ ] Optimiser le chargement des pages
- [ ] Réduire la taille du bundle
- [ ] Améliorer le caching

### 2. Tests
- [ ] Ajouter des tests unitaires
- [ ] Implémenter les tests e2e
- [ ] Mettre en place CI/CD

### 3. Documentation
- [ ] Mettre à jour la documentation technique
- [ ] Créer un guide utilisateur
- [ ] Documenter l'API

## Tâches GitLab
- [ ] Diagnostiquer la taille du dépôt (`git count-objects -vH`)
- [ ] Nettoyer l'historique si besoin (BFG, git filter-repo)
- [ ] Migrer les gros fichiers vers Git LFS si nécessaire
- [ ] Retenter le push sur GitLab après correction

## Notes
- Prioriser la correction des problèmes de menu et Firebase
- Maintenir la cohérence du code
- Suivre les bonnes pratiques Angular/Ionic
- Documenter les changements importants 