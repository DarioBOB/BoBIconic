# Debug BoB (Bored on Board)

> **Règle d'or :**
> Toute correction ou debug doit garantir la robustesse, la sécurité, la performance et l'expérience utilisateur optimale. Ne jamais introduire de régression ou de faille. Documenter chaque correction.

## Structure du dépôt
- Frontend (Ionic/Angular) à la racine
- Backend (Node.js/scripts) dans `backend/`
- Documentation dans `docs/`

## Gestion professionnelle des conflits
- Toujours faire un `git pull` avant de commencer
- En cas de conflit :
  - Fusionner manuellement les fichiers (voir README.md, .gitignore, package.json)
  - Garder la séparation frontend/backend
  - Documenter la résolution dans les commits et dans ce fichier
- Utiliser le stash si besoin pour sauvegarder le travail en cours

## Bonnes pratiques de debug
- Tester séparément le frontend (`ionic serve`) et le backend (`cd backend && npm start`)
- Vérifier les logs des deux parties
- Utiliser des outils adaptés (Angular DevTools, Firebase Console, Node.js Inspector)
- Documenter tout problème ou solution dans ce fichier

## Prompt Cursor pour debug
```
Quand tu aides à débugger, commence toujours par demander :
- Est-ce un problème frontend, backend ou d'intégration ?
- Quelle est la page ou le script concerné ?
- Y a-t-il des logs d'erreur ?

Propose des solutions étape par étape, et documente toute solution dans DEBUG.md.
```

## Historique des résolutions
- 2024-05-21 : Réorganisation pro du dépôt, résolution des conflits majeurs, documentation du workflow.

## Problèmes en cours

### 1. Menu Hamburger
**Symptôme**: Le menu hamburger ne fonctionne pas sur toutes les pages
**Cause**: Problème d'import des composants Ionic et de gestion du contexte Angular
**Solution en cours**:
- Ajout de NgZone pour gérer le contexte Angular
- Mise à jour des imports dans les composants
- Vérification de l'injection des services

### 2. Icônes du Menu
**Symptôme**: Les icônes du menu latéral sont en gris (pas de couleurs)
**Cause**: Styles CSS manquants ou mal appliqués
**Solution en cours**:
- Vérification des styles dans le fichier de thème
- Ajout des variables CSS pour les couleurs
- Mise à jour des classes des icônes

### 3. Avertissements Firebase
**Symptôme**: "Firebase API called outside injection context"
**Cause**: Opérations Firebase exécutées hors de la zone Angular
**Solution en cours**:
- Utilisation de NgZone pour encapsuler les opérations Firebase
- Mise à jour des composants pour utiliser le bon contexte
- Amélioration de la gestion des états

## Solutions appliquées

### 1. Correction du menu hamburger
- Ajout de NgZone dans les composants
- Mise à jour des imports Ionic
- Correction de l'injection des services

### 2. Gestion du contexte Firebase
- Encapsulation des opérations Firebase dans NgZone
- Amélioration de la gestion des états
- Optimisation des requêtes Firestore

## À surveiller

### 1. Performance
- Temps de chargement des pages
- Utilisation de la mémoire
- Nombre de requêtes Firebase

### 2. Stabilité
- Erreurs dans la console
- Comportement du menu
- Gestion des états

### 3. UX
- Réactivité de l'interface
- Animations fluides
- Cohérence visuelle

## Notes de debug

### Commandes utiles
```bash
# Vérifier les erreurs
ionic serve --verbose

# Nettoyer le cache
ionic cache clear

# Reconstruire l'application
ionic build --prod
```

### Points de vérification
1. Console du navigateur
2. Logs Firebase
3. Performance Angular
4. État des composants

### Ressources de debug
- [Angular DevTools](https://angular.io/guide/devtools)
- [Firebase Console](https://console.firebase.google.com)
- [Ionic DevTools](https://ionicframework.com/docs/troubleshooting)

## Incident GitLab (21/05/2024)
- Push impossible (erreur réseau/serveur, volume trop important)
- Causes possibles :
  - Trop gros volume de données à transférer
  - Limitation réseau ou proxy
  - Quota GitLab dépassé
- Solutions envisagées :
  - Diagnostic taille dépôt
  - Nettoyage historique (BFG, git filter-repo)
  - Utilisation de Git LFS
  - Retenter push sur un autre réseau
- Aucun impact sur la stabilité locale du projet.

## Incident dépendance Angular (21/05/2024)
- Erreur : "It appears that '@angular/core' is missing as a dependency."
- Cause probable : node_modules absent, package.json modifié, ou installation incomplète.
- Solution :
  - Se placer à la racine du projet (pas dans src/)
  - Exécuter `npm install` pour restaurer toutes les dépendances
  - Relancer `ionic serve`
- Si le problème persiste :
  - Supprimer node_modules et package-lock.json, puis refaire `npm install` 