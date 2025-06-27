# BoB (Bored On Board)

Application mobile pour les passagers d'avion, développée avec Ionic/Angular.

[![CI/CD](https://github.com/${{github.repository}}/actions/workflows/ci-cd.yml/badge.svg?branch=main)](https://github.com/${{github.repository}}/actions/workflows/ci-cd.yml)

## Prérequis

- Node.js (version 18 ou supérieure)
- npm (version 9 ou supérieure)
- Git

## Installation

1. Cloner le dépôt :
```bash
git clone https://github.com/DarioBOB/BoBIconic.git
cd BoBIconic
```

2. Installer les dépendances :
```bash
npm install
```

Le script `setup.sh` s'exécutera automatiquement après l'installation des dépendances. Il installera :
- Angular CLI
- Ionic CLI
- Toutes les dépendances du projet

## Démarrage

Pour lancer l'application en mode développement :

```bash
# Avec Angular CLI
npm start

# Ou avec Ionic CLI
npm run ionic:serve
```

L'application sera accessible à l'adresse : http://localhost:4200

## Scripts disponibles

- `npm start` : Lance l'application en mode développement
- `npm run build` : Compile l'application pour la production
- `npm run test` : Lance les tests unitaires
- `npm run lint` : Vérifie le code avec ESLint
- `npm run ionic:serve` : Lance l'application avec Ionic
- `npm run ionic:build` : Compile l'application avec Ionic
- `npm run ionic:test` : Lance les tests avec Ionic

## Configuration

Le fichier `.npmrc` configure les paramètres npm pour :
- Autoriser l'accès réseau
- Configurer le registre npm
- Gérer les permissions
- Optimiser le cache

## Support

Pour toute question ou problème, veuillez ouvrir une issue sur GitHub.

# Suivi de la migration et des corrections de la page "Mes Voyages"

## ✅ Réalisé
- Migration de la page "Mes Voyages" vers Ionic/Angular moderne, design responsive.
- Chargement des voyages depuis Firestore (en cours, à venir, passés).
- Chargement des plans/étapes depuis la collection globale `plans`.
- Ajout du routage et navigation vers `/trips`.
- Ajout de la gestion multilingue avec ngx-translate (fichiers fr/en, suppression du pipe custom, initialisation de la langue, etc.).
- Correction des statuts de badge (en cours, à venir, terminé).
- Génération dynamique du titre de voyage pour les vols (Flight from X to Y → Vol de X à Y).
- Fallbacks robustes pour les titres et labels manquants.
- Préparation du code pour d'autres types de voyages (train, hôtel, etc.).
- Préparation à la compatibilité offline (mode avion).

## 🛠️ Tentatives infructueuses
- Utilisation de `this.translate.instant` dans le TypeScript pour générer dynamiquement le titre du voyage : la traduction ne se met pas à jour lors du changement de langue.
- Utilisation du pipe `translate` dans le template avec paramètres pour le titre du voyage : le titre reste en anglais même en français.
- Vérification de la présence de toutes les clés dans les fichiers de langue : toutes les clés sont bien présentes.

## ⚠️ Problèmes restants
- La traduction dynamique du titre de voyage pour les vols n'est pas réactive à la langue (le titre reste en anglais même si l'interface est en français).

## 🕑 À faire / pistes futures
- Diagnostiquer plus en profondeur le problème de réactivité du pipe `translate` avec paramètres.
- Activer la persistance offline de Firestore pour un vrai mode avion.
- Ajouter la gestion multilingue pour d'autres types de voyages (train, hôtel, etc.).
- Ajouter des tests unitaires et e2e pour la robustesse.
- Améliorer l'UX pour un effet "waw" (animations, transitions, etc.).

## 🟢 Fonctionne
- Toutes les autres traductions de l'interface (menus, statuts, boutons, etc.).
- Chargement et affichage des voyages et plans.
- Navigation et routage.
- Changement de langue pour tous les labels standards.

---

**Prochain sujet à traiter :**
_(à compléter selon la demande)_

## Identifiants et conventions du mode démo

- **UID démo principal** : `fUBBVpboDeaUJd6w2nz0xKni9mG3`
- **Email démo** : `guestuser@demo.com`
- **Champ utilisateur démo** : `isDemo: true`
- **Champ trip démo** : `createdByDemo: true`
- **Champ userId des trips démo** : `userId: "fUBBVpboDeaUJd6w2nz0xKni9mG3"`
- **Règle Firestore** : seuls les trips/plans avec ce userId sont accessibles en mode démo

**À ne pas modifier sans mettre à jour les règles Firestore et la documentation !**

## DateTimeService - Gestion des dates/heures

**⚠️ RÈGLE OBLIGATOIRE :** Pour tout calcul de date/heure dans l'application, utiliser UNIQUEMENT le `DateTimeService` :

```typescript
// ✅ CORRECT
constructor(private dateTimeService: DateTimeService) {}
const current = this.dateTimeService.getCurrentDateTime();

// ❌ INCORRECT
const now = new Date(); // Ne pas faire ça !
```

Le service fournit :
- Détection automatique du fuseau horaire
- Logging automatique des calculs
- Méthodes de comparaison et de décalage de dates
- Cohérence dans toute l'application

**Voir `docs/LOGGING_IMPROVEMENTS.md` pour plus de détails.** 