# 🐞 BUGS.md

## Sommaire
- [Bugs ouverts](#bugs-ouverts)
- [Bugs résolus](#bugs-résolus)
- [Historique](#historique)

---

## Bugs ouverts
// ... bugs non résolus fusionnés ...

## Bugs résolus
// ... bugs corrigés fusionnés ...

## Historique
// ... historique des bugs, notes, etc. fusionnés ...

# Bugs historiques - Permissions mode démo

## Problème

- Le mode démo échouait avec l'erreur Firestore "Missing or insufficient permissions" lors de la lecture/écriture de voyages/plans démo.
- Cause : certains documents trips/plans n'avaient pas le champ `createdByDemo`, ce qui bloquait les requêtes Firestore (notamment les queries avec where('createdByDemo', '==', true)).

## Solution définitive (2025-07-01)

- Ajout d'un script de migration pour garantir que tous les trips/plans ont le champ `createdByDemo` (true pour la démo, false sinon).
- Adaptation du code Angular pour que tous les nouveaux trips/plans créés hors mode démo aient explicitement `createdByDemo: false`.
- Les règles Firestore ont été ajustées pour séparer read/write et garantir la compatibilité avec ce champ.
- Le mode démo est désormais robuste et reproductible, sans erreur de permission possible liée à ce champ.

## [IMPORTANT] Champ `createdByDemo` pour les templates de voyages/plans

- Tous les templates de voyages et de plans utilisés pour la démo doivent explicitement contenir `createdByDemo: true`.
- Les règles Firestore refusent toute écriture/modification en mode démo si ce champ est absent ou incorrect.
- Les scripts de migration et de seed doivent garantir la présence et la valeur correcte de ce champ.
- Voir la section dédiée dans `PROJECT_TRACKING.md` pour plus de détails sur la règle et la conformité. 