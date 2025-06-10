# Spécifications du Système de Suivi de Vol

## 1. Services API Utilisés

### 1.1 Aviationstack
- **Rôle** : Fournit les données de vol (horaires, statut, etc.)
- **Plan** : Gratuit (500 requêtes/mois)
- **Fonctionnalités** :
  - Informations de vol en temps réel
  - Statut des vols
  - Informations sur les aéroports
  - Données historiques (7 jours)

### 1.2 OpenSky Network
- **Rôle** : Fournit les données de trajectoire et position
- **Plan** : Gratuit (400 requêtes/heure)
- **Fonctionnalités** :
  - Position en temps réel (délai 30s)
  - Trajectoires de vol
  - Informations sur les aéronefs
  - Données historiques (30 jours)

## 2. Architecture du Système

### 2.1 Services Principaux
- `FlightDataService` : Service principal de gestion des données
- `AviationstackService` : Intégration avec Aviationstack
- `OpenSkyService` : Intégration avec OpenSky
- `ApiKeyService` : Gestion et vérification des clés API

### 2.2 Interfaces
- `FlightData` : Structure principale des données de vol
- `Waypoint` : Points de trajectoire
- `FlightStatus` : Statut du vol
- `AirportInfo` : Informations sur les aéroports
- `AircraftInfo` : Informations sur les aéronefs

## 3. Fonctionnalités

### 3.1 Suivi de Vol
- Récupération des données de vol
- Suivi de la position en temps réel
- Affichage de la trajectoire
- Gestion des statuts

### 3.2 Gestion des Données
- Mise en cache des données
- Gestion des erreurs
- Vérification des clés API
- Limites de requêtes

## 4. Configuration

### 4.1 Clés API
- Aviationstack : Clé API requise
- OpenSky : Username/Password requis

### 4.2 Environnement
- Variables d'environnement pour les clés
- Configuration de production/développement
- Gestion des quotas

## 5. Sécurité

### 5.1 Protection des Clés
- Clés non commitées dans le repo
- Variables d'environnement
- Vérification périodique des clés

### 5.2 Gestion des Erreurs
- Retry automatique
- Fallback en cas d'erreur
- Logging des erreurs

## 6. Performance

### 6.1 Optimisations
- Mise en cache des données
- Limitation des requêtes
- Gestion des quotas

### 6.2 Monitoring
- Vérification du statut des API
- Suivi des quotas
- Alertes en cas de problème

# Cahier des charges – Module Window (Flight Tracking)

## Objectif

Permettre à l'utilisateur de visualiser la progression d'un vol (Genève → Athènes) avec :
- Priorité à l'affichage de données réelles issues de l'API OpenSky (vol le plus récent sur 24h)
- Fallback automatique sur une simulation si aucun vol réel n'est disponible
- Expérience utilisateur fluide, informative et immersive (slider, carte, hublot 3D)

## Fonctionnalités principales

- **Recherche et affichage de trajectoire réelle**
  - Interrogation de l'API OpenSky pour trouver le dernier vol GVA→ATH
  - Récupération de la trajectoire (latitude, longitude, altitude, vitesse)
  - Découpage uniforme en 101 segments pour piloter la progression
  - Affichage d'un indicateur d'origine des données (bandeau bleu = réel, rouge = simulé)

- **Fallback simulation**
  - Si aucun vol réel n'est trouvé ou en cas d'erreur API, génération de 101 segments simulés (interpolation linéaire)
  - Calcul d'altitude, vitesse, position, temps restant selon un schéma réaliste (montée, croisière, descente)

- **Centralisation des données**
  - WindowService centralise : données statiques (vol, horaires, appareil), dynamiques (position, altitude, vitesse, météo, ETA), POIs
  - Expose un observable de progression (0-100%)
  - Fournit les données dynamiques issues soit du tableau réel, soit de la simulation

- **Interface utilisateur**
  - Slider de progression (0-100%)
  - Onglets : Text Data, Map, Hublot
  - Carte interactive (Leaflet) : trajectoire, avion animé, POIs, recentrage
  - Vue Hublot 3D immersive avec overlay des données dynamiques
  - Affichage d'un bandeau coloré selon l'origine des données

## Flux de données

1. Tentative de récupération de la trajectoire réelle via OpenSky
2. Si succès : découpage en 101 segments, affichage des données réelles
3. Si échec : fallback sur la simulation (interpolation linéaire)
4. Le slider pilote la progression, chaque sous-page s'abonne aux données dynamiques
5. L'utilisateur est informé de l'origine des données via un bandeau

## Axes d'amélioration (voir TODO.md)

- Saisie manuelle du callsign/date pour charger un vol précis
- Indicateurs visuels pour les POIs en vol réel (altitude, distance)
- Densité des nuages dynamique dans la vue Hublot
- Animations supplémentaires sur la carte (parcours progressif, transitions)
- Gestion avancée des erreurs et information utilisateur
- Tests automatisés pour le fallback et le découpage
- Optimisation des performances (resampling, affichage)

## Documentation

- Spécifications : `SPECS.md`
- Résumé détaillé : `architecture/window-module-summary.md`
- Suivi des tâches : `TODO.md`, `DONE.md` 