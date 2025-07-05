# 📊 PROJECT_TRACKING.md

## Sommaire
- [Trips](#trips)
  - [TODO](#trips-todo)
  - [DONE](#trips-done)
  - [Plan d'actions](#trips-plan)
  - [UAT](#trips-uat)
  - [Historique](#trips-historique)
- [Flight Tracking](#flight-tracking)
  - [TODO](#flight-tracking-todo)
  - [DONE](#flight-tracking-done)
  - [Historique](#flight-tracking-historique)
- [ThroughMyWindow](#throughmywindow)
  - [TODO](#throughmywindow-todo)
  - [DONE](#throughmywindow-done)
  - [TRIED/Expériences](#throughmywindow-tried)
- [Prompts & Méthodologie](#prompts)

---

## Trips

### TODO
// ... contenu de docs/tracking/TODO_TRIPS.md ...

### DONE
// ... contenu de docs/tracking/DONE_TRIPS.md ...

### Plan d'actions
// ... contenu de docs/tracking/PLAN_ACTIONS_TRIPS.md ...

### UAT
// ... contenu de docs/tracking/UAT_TRIPS.md ...

### Historique
// ... contenu de docs/tracking/CHANGES.md ...

---

## Flight Tracking

### TODO
// ... contenu de docs/flight-tracking/TODO.md ...

### DONE
// ... contenu de docs/flight-tracking/DONE.md ...

### Historique
// ... contenu de docs/flight-tracking/AI_PROMPT.md ...

---

## ThroughMyWindow

### TODO
// ... contenu de src/app/pages/through-my-window/TODO.md ...

### DONE
// ... contenu de src/app/pages/through-my-window/DONE.md ...

### TRIED/Expériences
// ... contenu de src/app/pages/through-my-window/TRIED.md ...

---

## Prompts & Méthodologie
// ... contenu de docs/tracking/DEV_PROMPT.md ...

---

## [2024-07-XX] Initialisation de la structure Firestore template

- Création d'un script `scripts/init-firestore-templates.js` pour générer la structure Firestore de base :
  - `users/template-user`
  - `users/template-user/trips/template-trip`
  - `users/template-user/trips/template-trip/items/{type}` (flight, hotel, car, ferry, activity, expense, document)
- Tous les champs sont vides ou à valeur de template.
- Le script est idempotent et peut être relancé sans effet de bord.
- **Objectif** : garantir une base de données professionnelle, scalable, maintenable, et faciliter l'onboarding, les tests, la documentation et la génération de nouveaux voyages types.

---

## [2024-07-XX] Script de correction des valeurs clés des users

- Ajout du script `scripts/fix-users-values.js` pour corriger/compléter les champs displayName, firstName, lastName, email des users admin, template et user réel.
- Usage : `node scripts/fix-users-values.js`
- Objectif : garantir une base utilisateurs professionnelle, lisible et prête pour l'admin, la démo et l'onboarding.
- Le script est idempotent et logue les changements effectués.

---

## [2024-07-XX] Script de migration des voyages (trips)

- Ajout du script `scripts/migrate-trips-uniform.js` pour uniformiser la structure de tous les voyages (trips) selon la spec Strcture Firebase BoB.txt.
- Usage : `node scripts/migrate-trips-uniform.js`
- Objectif : garantir une base voyages cohérente, professionnelle, et prête pour la prod, la démo et l'analytics.
- Le script est idempotent, logue les changements, et initialise tous les champs attendus.

---

## [2025-07-01] Migration et fiabilisation du mode démo

- Ajout d'un script de migration (`add-createdByDemo-false.js`) qui ajoute le champ `createdByDemo: false` à tous les trips et plans qui n'avaient pas ce champ dans Firestore.
- Modification du code Angular (pages register et register-profile) pour que tous les nouveaux utilisateurs aient `createdByDemo: false` dans leur profil.
- Vérification que tous les trips/plans créés hors mode démo incluent explicitement `createdByDemo: false`.
- Les règles Firestore sont désormais robustes : toutes les requêtes (y compris en mode démo) fonctionnent sans erreur de permission.
- Le mode démo est maintenant fiable, reproductible et ne peut plus être bloqué par des documents orphelins ou mal formés.

---

## Templates de voyages et de plans

L'application BoBIconic utilise des **templates** (modèles) pour générer rapidement des voyages et des plans de démonstration. Ces templates sont utilisés lors de l'initialisation du mode démo ou pour la génération de données de test. Ils se trouvent dans les scripts de seed (ex : `scripts/load-demo-trips-complete.js`, `scripts/load-montreal-demo-trip.js`, etc.) et dans certains fichiers de configuration (ex : `src/app/demo/demo-data.ts`).

Chaque template de voyage ou de plan doit explicitement définir le champ :

```js
createdByDemo: true
```

pour être reconnu comme une donnée de démonstration. Les documents générés à partir de ces templates seront ainsi accessibles et modifiables par le compte démo, conformément aux règles Firestore.

### Règle Firestore sur `createdByDemo`

- **Données de démo** : tout document (trip, plan, sous-plan) utilisé en mode démo doit avoir `createdByDemo: true`.
- **Données utilisateur réelles** : tout document créé hors mode démo doit avoir `createdByDemo: false` (ou être absent, mais il est recommandé de toujours le renseigner pour éviter les erreurs de requête).

**Extrait de règle Firestore :**
```js
allow write: if isDemo() && request.resource.data.createdByDemo == true
           || isAdmin()
           || (request.resource.data.userId == request.auth.uid && !isDemo());
```

**Résumé :**
- Les scripts de seed, les templates et le code applicatif doivent TOUJOURS renseigner ce champ selon le contexte (démo ou réel).
- Toute absence ou incohérence de ce champ provoquera des erreurs de permission Firestore en mode démo.

---

// Pour chaque section, remplacer le commentaire par le contenu réel du fichier source correspondant. 