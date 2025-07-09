# Spécifications du module Window (Flight Tracking)

## Architecture générale

Le module Window ("Through My Window") permet d'afficher la progression d'un vol (GVA→ATH) en priorisant l'utilisation de données réelles issues de l'API OpenSky, avec fallback automatique sur une simulation si besoin.

- **FlightEnrichmentService** :
  - Recherche le dernier vol GVA→ATH dans OpenSky (24h glissantes)
  - Récupère la trajectoire réelle (points GPS, altitude, vitesse)
  - Découpe la trajectoire en 101 segments uniformes (temps ou distance)
  - Si aucun vol réel n'est trouvé, génère 101 segments simulés par interpolation linéaire
  - Fournit un indicateur d'origine des données (isRealData)

- **WindowService** :
  - Centralise les données statiques (vol, compagnie, horaires, etc.), dynamiques (position, altitude, vitesse, météo, ETA) et POIs
  - Expose un observable de progression (0-100%)
  - Fournit les données dynamiques issues soit du tableau réel, soit de la simulation

- **UI (WindowTabsPage, Map, Hublot, TextData)** :
  - Affiche la progression, la trajectoire, les POIs, les données dynamiques
  - Affiche un bandeau coloré indiquant l'origine des données (bleu = réel, rouge = simulé)

## Flux de données

1. Tentative de récupération de la trajectoire réelle via OpenSky
2. Si succès : découpage en 101 segments, affichage des données réelles
3. Si échec : fallback sur la simulation (interpolation linéaire)
4. Le slider pilote la progression (0-100%), chaque sous-page s'abonne aux données dynamiques
5. L'utilisateur est informé de l'origine des données via un bandeau

Voir `docs/architecture/window-module-summary.md` pour le détail complet. 