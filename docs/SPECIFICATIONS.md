# 📖 SPECIFICATIONS.md

## Sommaire
- [Cahier des charges](#cahier-des-charges)
- [Spécifications fonctionnelles](#spécifications-fonctionnelles)
- [Spécifications techniques](#spécifications-techniques)
- [Algorithmes](#algorithmes)
- [Flight Tracking](#flight-tracking)
- [ThroughMyWindow](#throughmywindow)

---

## Cahier des charges
// Fusionne ici les cahiers des charges

## Spécifications fonctionnelles
// Fusionne ici toutes les specs fonctionnelles

## Spécifications techniques
// Fusionne ici toutes les specs techniques

## Algorithmes
// Fusionne ici les algorithmes importants 

---

## Flight Tracking
// ... contenu de docs/flight-tracking/SPECIFICATIONS.md ...
// ... contenu de docs/flight-tracking/SPECS.md ...
// ... contenu de docs/architecture/window-module-summary.md ...

---

## ThroughMyWindow
// ... contenu de src/app/pages/through-my-window/SPECIFICATIONS.md ... 

### Structure Firestore template (2024-07-XX)

- Une structure de base Firestore est générée par le script `scripts/init-firestore-templates.js`.
- Elle comprend :
  - `users/template-user`
  - `users/template-user/trips/template-trip`
  - `users/template-user/trips/template-trip/items/{type}` (flight, hotel, car, ferry, activity, expense, document)
- Tous les champs sont vides ou à valeur de template.
- Cette structure sert de référence pour la création de nouveaux users, voyages, et plans types.
- Objectif : garantir la cohérence, la maintenabilité et la scalabilité de la base de données. 