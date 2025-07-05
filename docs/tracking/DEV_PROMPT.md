# Prompt développeur – Suivi du projet BOBICONIC

## Qu'est-ce que l'application ?
BoredOnBoard (BOBICONIC) est une application de divertissement et d'information pour passagers aériens, développée en Angular/Ionic. Elle propose le suivi de vol, la météo, la visualisation de la carte, des points d'intérêt, et la gestion des voyages (trips), avec un mode offline robuste et une UX moderne.

## Où sont les fichiers de documentation ?
- La documentation principale et détaillée se trouve dans `Documentation BoB.txt` à la racine du projet
- Tous les fichiers de suivi, plans d'action, TODO/DONE, prompts, etc. sont dans le dossier `docs/tracking/`
- Les anciens suivis, cahiers des charges, bugs, etc. sont dans `docs/` ou `docs/architecture/`

## Comment suivre l'avancement ?
- La documentation complète est dans `Documentation BoB.txt`
- Le plan d'action principal est dans `docs/tracking/PLAN_ACTIONS_TRIPS.md`
- Les tâches à faire sont dans `docs/tracking/TODO_TRIPS.md`
- Les tâches réalisées sont à cocher dans `docs/tracking/DONE_TRIPS.md`
- Mets à jour ces fichiers à chaque étape importante

## Documentation de référence
La `Documentation BoB.txt` contient :
- Architecture technique détaillée
- Documentation page par page
- Flux de données et sécurité
- Propositions d'améliorations futures
- Guide de déploiement et configuration
- Internationalisation et traductions

## Bonnes pratiques
- Lis toujours la documentation principale et le plan d'action avant toute modification majeure
- Utilise le cache local pour garantir la robustesse offline
- Respecte la gestion des utilisateurs (standard, admin, démo) et la sécurité des données

## Présentation générale

Cette application Angular/Ionic vise à offrir une expérience moderne pour la gestion de voyages aériens, avec des fonctionnalités avancées de météo, de suivi de vols, et de gestion des voyages (Trips). Elle est conçue pour être robuste, fonctionnelle hors-ligne, et agréable à utiliser.

## Fonctionnement de la page Trips

La page Trips (`src/app/pages/trips.page.ts`) permet à l'utilisateur de consulter ses voyages, d'accéder aux plans associés (vols, hôtels, activités, etc.), et de bénéficier d'une expérience fluide même en cas de coupure réseau.

### Points clés de la logique :
- **Sécurité** :
  - Accès filtré selon le rôle utilisateur (admin, demo, standard)
  - Vérification des permissions à chaque chargement de voyage ou de plan
  - Validation stricte des données (présence des champs, cohérence des dates et types)
- **Robustesse** :
  - Gestion du cache local avec Ionic Storage (séparé par utilisateur et type de données)
  - Fallback automatique sur le cache en cas d'échec réseau
  - Gestion fine des erreurs et notifications utilisateur (toasts)
- **Expérience utilisateur (UX)** :
  - Messages explicites si aucun voyage trouvé ou en cas d'erreur
  - Chargement progressif (cache puis Firestore)
  - Interface adaptée offline/online

### Structure du code
- **Résumé en haut du fichier** : chaque fichier clé contient un résumé de la logique et des responsabilités.
- **Commentaires JSDoc** : chaque méthode importante est documentée pour faciliter la maintenance.
- **Utilitaires regroupés** : méthodes de validation, gestion du cache, sécurité, etc.

## Bonnes pratiques pour contribuer
- Respecter la séparation des responsabilités (chargement, validation, sécurité, UX)
- Documenter toute nouvelle méthode ou modification majeure
- Mettre à jour le suivi des changements dans `docs/tracking/CHANGES.md`
- Marquer les tâches terminées dans `docs/tracking/DONE_TRIPS.md`
- Ajouter toute nouvelle tâche ou idée dans `docs/tracking/TODO_TRIPS.md`

## Suivi des tâches et documentation
- **Plan d'actions détaillé** : `docs/tracking/PLAN_ACTIONS_TRIPS.md`
- **Tâches à faire** : `docs/tracking/TODO_TRIPS.md`
- **Tâches terminées** : `docs/tracking/DONE_TRIPS.md`
- **Historique des changements** : `docs/tracking/CHANGES.md`

## Pour aller plus loin
- Vérifier la cohérence des traductions dans `src/assets/i18n/`
- Tester les cas offline/online, multi-utilisateur, et rôles différents
- Proposer des améliorations UX ou de sécurité via le suivi des tâches

## Méthodes de debug et correction UX utilisées (2025-06-18)

- Pour les problèmes de composant non affiché dans un slot Ionic :
  - Création d'un composant de test minimaliste pour valider l'instanciation Angular.
  - Vérification du slot end Ionic (limitation connue avec Angular standalone).
  - Placement du composant sous le header avec style CSS responsive.
- Pour les problèmes de traduction manquante :
  - Recherche de la clé dans le code et les fichiers i18n.
  - Ajout direct de la clé dans `en.json` et `fr.json` avec une baseline moderne.
- Pour les problèmes d'accès réseau Flask (backend) :
  - Diagnostic de l'erreur `ERR_CONNECTION_REFUSED` sur l'IP de la machine.
  - Correction du lancement Flask avec `host='0.0.0.0'` pour exposition sur toutes les interfaces réseau (compatibilité mobile/PC).

### [2024-07-XX] Génération automatique de la structure Firestore template

- Un script Node.js (`scripts/init-firestore-templates.js`) permet de créer la structure Firestore de base (users/template-user, trips, items).
- Utilisation : `node scripts/init-firestore-templates.js`
- Sert de base pour :
  - Générer de nouveaux users types
  - Générer des voyages types (templates)
  - Onboarding, tests, documentation
- Tous les champs sont vides ou à valeur de template, à compléter selon les besoins.

---

**Contact** : Pour toute question ou suggestion, documenter dans le suivi ou contacter le responsable technique du projet.

---

**Note Firestore/Firebase** :
Le compte Firestore principal utilisé pour ce projet est :
- suzyetdario@gmail.com
À utiliser pour la configuration, l'accès administrateur, le debug ou tout besoin lié à Firebase/Firestore. 