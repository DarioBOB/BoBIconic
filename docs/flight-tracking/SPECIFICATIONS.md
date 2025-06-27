# ⚠️ Identifiants et conventions pour le mode démo

- **UID démo principal** : `fUBBVpboDeaUJd6w2nz0xKni9mG3`
- **Email démo** : `guestuser@demo.com`
- **Champ utilisateur démo** : `isDemo: true`
- **Champ trip démo** : `createdByDemo: true`
- **Champ userId des trips démo** : `userId: "fUBBVpboDeaUJd6w2nz0xKni9mG3"`
- **Règle Firestore** : seuls les trips/plans avec ce userId sont accessibles en mode démo

**À ne pas modifier sans mettre à jour les règles Firestore et la documentation !**

---

# Spécifications du Système de Suivi de Vol

## Vue d'ensemble

Le système de suivi de vol utilise **uniquement FlightRadar24 (FR24)** pour toutes les recherches et enrichissements de données de vol.

## Architecture

### Services Utilisés

- **FR24Service** : Service principal pour toutes les données de vol
- **FlightDataService** : Service de cache et d'orchestration
- **Fallback** : Données statiques en cas d'échec API

### Voyage démo « ongoing » dynamique

- **ID** : `trip-ongoing` (Firestore)
- **Source** : Document Firestore
- **Dynamisme** : à chaque chargement, interroger FlightRadar24 pour récupérer le dernier vol LX1820 **achevé**,  
  puis recalculer `startDate`/`endDate` pour être à 1/3 du vol, et recréer le plan `flight`.

#### Algorithme de Recalage

1. **Chargement** : Récupérer le document `trip-ongoing` depuis Firestore
2. **Recherche vol** : Interroger FR24 pour le dernier vol LX1820 avec status 'landed'/'arrived'/'completed'
3. **Calcul position** : Positionner le voyage à 1/3 de la durée totale du vol
4. **Mise à jour** : Recalculer `startDate`, `endDate` et recréer le plan de vol
5. **Affichage** : Traiter et afficher le voyage recalé

#### Formule de Recalage

```typescript
const dep0 = new Date(lastFlight.route.departure.actualTime);
const arr0 = new Date(lastFlight.route.arrival.actualTime);
const durationMs = arr0.getTime() - dep0.getTime();
const nowMs = Date.now();
const newDep = new Date(nowMs - durationMs / 3);  // Position à 1/3
const newArr = new Date(newDep.getTime() + durationMs);
```

#### Fallback

En cas d'échec de l'API FR24, utilisation de données statiques pour LX1820 :
- **Départ** : Zurich (ZRH) - 3h dans le passé
- **Arrivée** : Athènes (ATH) - 1h dans le passé
- **Durée** : 2h (180 minutes)

## API FlightRadar24

### Endpoint Principal

```
GET https://api.flightradar24.com/common/v1/flight/list.json?query={flightNumber}
```

### Réponse Attendue

```json
{
  "data": {
    "flights": [
      {
        "identification": { "number": "LX1820" },
        "status": "landed",
        "departure": { "iata": "ZRH", "city": "Zurich" },
        "arrival": { "iata": "ATH", "city": "Athens" },
        "times": {
          "scheduled": { "departure": "...", "arrival": "..." },
          "actual": { "departure": "...", "arrival": "..." }
        }
      }
    ]
  }
}
```

### Gestion d'Erreurs

- **Timeout** : 10 secondes
- **Fallback** : Données statiques pour LX1820
- **Logging** : Erreurs détaillées dans la console

## Interface FlightData

```typescript
interface FlightData {
  flightNumber: string;
  airline: string;
  aircraft: AircraftInfo;
  route: RouteInfo;
  status: FlightStatus;
  lastUpdated: string;
  waypoints: Waypoint[];
}
```

## Cache et Performance

- **Cache intelligent** : 5 minutes pour les données de vol
- **Compression** : Pour les objets > 1KB
- **Versioning** : Compatibilité des versions de cache

## Logs et Debug

### Console Logs

- `[FR24] Recherche vol LX1820: ...`
- `[FR24] Vol trouvé: ...`
- `[Trips] Voyage démo recalé: ...`
- `[Trips] Mode Démo détecté. Recalage sur dernier vol LX1820…`

### Interface Admin

- **Logs** : http://localhost:8100/admin/logs
- **Statistiques** : Cache, erreurs, performance

## Tests

### Mode Démo

1. Se connecter en mode démo
2. Aller sur la page Trips
3. Vérifier que le voyage "ongoing" est recalé sur LX1820
4. Recharger la page pour vérifier le recalage dynamique

### Validation

- ✅ Document `trip-ongoing` chargé depuis Firestore
- ✅ Dernier vol LX1820 récupéré via FR24
- ✅ Position calculée à 1/3 du vol
- ✅ Dates et plans mis à jour
- ✅ Fallback en cas d'échec API

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