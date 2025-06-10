# Systèmes d'enrichissement API pour BoB

## 1. Enrichissement des vols

| API              | Avantages principaux                                 | Inconvénients / Limites         | Statut dans BoB |
|------------------|-----------------------------------------------------|---------------------------------|-----------------|
| **FlightAware**  | Données temps réel, position, historique, fiable    | Payant, clé API requise         | Implémenté      |
| **AviationStack**| Facile, plan gratuit, infos compagnies/aéroports    | Moins précis, quotas            | Implémenté      |
| **AirLabs**      | Historique, compagnies, plan gratuit généreux       | Moins de détails techniques     | À faire         |
| **OpenSky**      | Temps réel, open source, gratuit                    | Couverture partielle, instable  | À faire         |

## 2. Points d'intérêt (POIs) autour des aéroports

| API                  | Avantages principaux                        | Inconvénients / Limites         | Statut dans BoB |
|----------------------|---------------------------------------------|---------------------------------|-----------------|
| **OpenStreetMap**    | Gratuit, exportable offline, riche          | Données parfois incomplètes     | À faire         |
| **Google Places API**| Très riche, photos, avis, descriptions      | Payant, quotas, pas offline natif| À faire         |
| **Wikipedia**        | Infos historiques, culturelles, gratuites   | Structure variable, pas temps réel| Partiel         |

## 3. Calcul de position et suivi de vol

| API / Méthode           | Avantages principaux                        | Inconvénients / Limites         | Statut dans BoB |
|-------------------------|---------------------------------------------|---------------------------------|-----------------|
| **Great Circle Mapper** | Calcul précis, open source, offline possible| Pas d'API officielle            | À faire         |
| **OpenSky Network**     | Données live, open source                   | Couverture partielle            | À faire         |
| **FlightAware**         | Données live, estimation automatique        | Payant                          | Implémenté      |

## 4. Gestion des données hors ligne

| Solution                  | Avantages principaux                        | Inconvénients / Limites         | Statut dans BoB |
|---------------------------|---------------------------------------------|---------------------------------|-----------------|
| **Export OSM/POIs**       | Données offline, personnalisable            | Nécessite gestion de synchro    | À faire         |
| **Cache local Firestore** | Intégré à l'app, facile à synchroniser      | Limité par quota                | Partiel         |

## Scripts à prévoir
- `src/scripts/airlabs-enrichment.js` : Enrichissement vols AirLabs
- `src/scripts/poi-fetcher.js` : Récupération/export POIs
- `src/scripts/flight-tracker.js` : Calcul trajectoire/position
- `src/scripts/offline-data-manager.js` : Gestion offline/synchro

## Notes
- Prioriser les APIs gratuites/open source, fallback si indispo.
- Documenter chaque script et clé API.
- Prévoir gestion des quotas et erreurs.
- Exporter POIs et vols en local pour offline.

## Mode démo local
- Jeu de données complet (FR/EN), accessible sans compte
- Choix de langue à l'entrée
- Permet de tester toutes les fonctionnalités principales sans authentification 