# Suivi du projet BoB (Bored on Board)

> **Recommandation permanente :**
> Le projet doit être développé selon les plus hauts standards de robustesse, sécurité, performance, UX/UI et professionnalisme. Toute évolution doit :
> - Garantir la robustesse et la stabilité de l'application (tests, gestion d'erreurs, monitoring)
> - Appliquer les meilleures pratiques de sécurité (audit, validation, RGPD, gestion des secrets)
> - Viser une expérience utilisateur exceptionnelle (UI moderne, accessibilité, animations, feedbacks)
> - Être documentée et maintenable (commits clairs, doc à jour, code commenté si besoin)
> - Ne jamais casser les fonctionnalités principales de BoB

## Structure professionnelle du dépôt

- **Frontend (Ionic/Angular)** : à la racine (`src/`, `package.json`, etc.)
- **Backend (Node.js/scripts)** : dans le dossier `backend/` (avec son propre `package.json`, scripts, etc.)
- **Documentation** : dans `docs/`

## Workflow professionnel

1. **Avant de travailler** :
   - Toujours faire `git pull origin master` pour récupérer les dernières modifications.
   - Résoudre les éventuels conflits AVANT de commencer à coder.
2. **Développement** :
   - Travailler sur une branche dédiée si la tâche est importante.
   - Commits atomiques et messages clairs.
3. **Avant de pousser** :
   - S'assurer que le projet build côté frontend (`ionic build`) et backend (`npm run build` dans `backend/` si applicable).
   - Mettre à jour la documentation si besoin.
4. **Push** :
   - `git push origin master` (ou ouvrir une MR si sur une branche).

## Prompt Cursor à utiliser pour la reprise du projet

```
Tu es un assistant expert sur un projet hybride Ionic/Angular (frontend) et Node.js (backend) organisé ainsi :
- Le frontend est à la racine (src/, package.json, etc.)
- Le backend est dans backend/ (scripts, package.json, etc.)
- La documentation est dans docs/

Quand tu ajoutes des fonctionnalités ou corriges des bugs, veille à :
- Respecter la séparation frontend/backend
- Mettre à jour la documentation et les fichiers de suivi
- Proposer des solutions professionnelles, maintenables et documentées
- Toujours expliquer les choix techniques dans les fichiers de suivi
```

## Points de vigilance
- Toujours vérifier la cohérence entre frontend et backend
- Documenter toute modification majeure
- Utiliser des branches pour les évolutions importantes

---

(voir aussi TODO.md et DEBUG.md pour les tâches et problèmes en cours)

## État actuel (2024-03-19)

### Fonctionnalités implémentées
- ✅ Authentification Firebase
- ✅ Structure de base de l'application
- ✅ Navigation entre les pages
- ✅ Système de traduction (i18n)
- ✅ Page des voyages (trips)
- ✅ Intégration Firebase Firestore
- ✅ Parser d'emails pour les voyages

### Problèmes en cours
- ❌ Menu hamburger ne fonctionne pas sur toutes les pages
- ❌ Icônes du menu latéral sans couleurs
- ❌ Avertissements Firebase concernant le contexte d'injection
- ❌ Problèmes de détection de changements Angular

### À faire
1. Résoudre les problèmes de menu
   - [ ] Corriger le menu hamburger sur toutes les pages
   - [ ] Ajouter les couleurs aux icônes du menu
   - [ ] Améliorer l'animation du menu

2. Optimiser Firebase
   - [ ] Corriger les avertissements de contexte d'injection
   - [ ] Améliorer la gestion des états
   - [ ] Optimiser les requêtes Firestore

3. Améliorer l'UI/UX
   - [ ] Uniformiser le style des composants
   - [ ] Ajouter des animations de transition
   - [ ] Améliorer la réactivité mobile

4. Fonctionnalités à implémenter
   - [ ] Page Window (vue carte)
   - [ ] Page Chat
   - [ ] Page BoBBers
   - [ ] Page Games
   - [ ] Page Notifications
   - [ ] Page Documents
   - [ ] Page Support
   - [ ] Page Preferences

### Debug en cours
- Problème de menu hamburger
  - Symptôme: Le menu ne s'ouvre pas sur certaines pages
  - Cause possible: Problème d'import des composants Ionic
  - Solution en cours: Mise à jour des imports et ajout de NgZone

- Problème de couleurs des icônes
  - Symptôme: Les icônes du menu sont en gris
  - Cause possible: Styles manquants ou mal appliqués
  - Solution en cours: Vérification des styles CSS

- Avertissements Firebase
  - Symptôme: "Firebase API called outside injection context"
  - Cause possible: Opérations Firebase hors zone Angular
  - Solution en cours: Utilisation de NgZone

### Notes techniques
- Utilisation d'Angular 17 avec Ionic 7
- Architecture standalone components
- Firebase pour l'authentification et la base de données
- Système de traduction personnalisé

### Prochaines étapes
1. Résoudre les problèmes de menu et d'icônes
2. Corriger les avertissements Firebase
3. Implémenter la page Window
4. Améliorer la gestion des états

### Ressources
- Documentation Ionic: https://ionicframework.com/docs
- Documentation Angular: https://angular.io/docs
- Documentation Firebase: https://firebase.google.com/docs

## Problème GitLab (21/05/2024)
- Le push vers GitLab échoue à cause d'un volume de données trop important ou d'une limitation réseau/serveur (erreur HTTP 500, broken pipe, etc.).
- Le code et la documentation sont à jour localement, conformes aux standards pro.
- Prochaines étapes recommandées :
  - Diagnostiquer la taille du dépôt (`git count-objects -vH`)
  - Nettoyer l'historique si besoin (BFG, git filter-repo)
  - Migrer les gros fichiers vers Git LFS si nécessaire
  - Retenter le push depuis un autre réseau ou machine
- Les fonctionnalités de BoB ne sont pas impactées localement. 