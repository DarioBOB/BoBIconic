# Génération de 101 segments de vol à partir de données réelles (API OpenSky, etc.)

Dans ta version actuelle, les "101 segments" sont très probablement obtenus par simple interpolation linéaire entre les coordonnées (latitude, longitude), l'altitude et la vitesse de départ (Genève) et celles d'arrivée (Athènes). Concrètement, pour chaque indice $i$ de 0 à 100, on calcule :

* $\text{lat}_i = \text{lat}_{\text{dep}} + \frac{i}{100} \times (\text{lat}_{\text{arr}} - \text{lat}_{\text{dep}})$
* $\text{lon}_i = \text{lon}_{\text{dep}} + \frac{i}{100} \times (\text{lon}_{\text{arr}} - \text{lon}_{\text{dep}})$
* $\text{alt}_i = \text{alt}_{\text{dep}} + \frac{i}{100} \times (\text{alt}_{\text{arr}} - \text{alt}_{\text{dep}})$
* $\text{speed}_i = \text{speed}_{\text{dep}} + \frac{i}{100} \times (\text{speed}_{\text{arr}} - \text{speed}_{\text{dep}})$

Cela fonctionne pour une démonstration rapide, mais ne reflète pas le profil réel du vol (montée, palier, descente, virages, vents, trajectoire non‐linéaire, etc.). Pour obtenir des "données réelles" de type latitude/longitude/altitude/vitesse à chaque point du vol — et ainsi construire tes 101 segments sur la base d'une vraie trajectoire — il faut :

## 1. Choisir une source de données de suivi de vols ("flight tracking")

Plusieurs services proposent des API publiques ou semi‐publiques basées sur les flux ADS-B (OpenSky, ADS-B Exchange, FlightAware, FlightRadar24, AviationStack, etc.).

- **OpenSky Network (gratuit, bien documenté)** :
  - REST API "Tracks by flight" ou "Flights by callsign" (via l'endpoint `/tracks/all` ou `/flights/aircraft`).
  - Nécessite parfois de s'inscrire pour obtenir des crédits d'API (mais en mode "sandbox" on peut faire quelques requêtes gratuites).
- **ADS-B Exchange** ou **FlightAware**/**FlightRadar24** (nécessitent un compte pro ou un abonnement).

## 2. Récupérer la trajectoire brute du vol à partir de son numéro

1. **Identifier le "callsign" ou "flight ICAO" correspondant** au numéro de vol (par ex. "AF345" pour un Air France 345). Souvent l'API attend plutôt un "callsign" ADS-B (ex. "AFR345") ou le numéro IATA + jour/temps.
2. **Choisir la date/heure du vol** (la même journée, parfois l'heure UTC de départ). On parle de "history" ou "past data" pour l'API.
3. **Faire une requête à l'API** du type (OpenSky) :

   ```
   GET https://opensky-network.org/api/flights/callsign/AFR345?begin=SECONDS_SINCE_EPOCH&end=SECONDS_SINCE_EPOCH
   ```

   Ce JSON renvoie, pour chaque signal ADS-B reçu du vol, un objet :

   ```json
   {
     "icao24": "a4b6c3",
     "firstSeen": 1625140800,
     "estDepartureAirport": "LSGG",
     "lastSeen": 1625145000,
     "estArrivalAirport": "LGAV"
   }
   ```

   → Ici on obtient surtout des metadata.
4. **Ensuite, récupérer les "tracks" (la liste des positions GPS pendant le vol)** :

   ```
   GET https://opensky-network.org/api/tracks/all?icao24=a4b6c3&time=FLIGHT_TIMESTAMP
   ```

   Ce call renvoie un objet comportant un tableau `path` de points successifs :

   ```json
   {
     "icao24": "a4b6c3",
     "callsign": "AFR345",
     "startTime": 1625140800,
     "endTime": 1625145000,
     "path": [
       [1625140800, 46.2361, 6.1083, 0, 0],
       [1625140860, 46.2400, 6.1100, 300, 50],
       [1625140920, 46.2500, 6.1150, 2000, 300],
       … 
     ]
   }
   ```

   Chaque entrée de `path` est un tableau `[time, lat, lon, altitude, velocity]` (altitude en m, vitesse en m/s ou nœuds selon l'API).
5. **Filtrer et transformer ces données brutes** pour obtenir 101 points "uniformement répartis" (en temps ou distance).

## 3. Re‐mailler (resample) la trajectoire sur 101 segments uniformes

Tu disposes maintenant d'un tableau `track[]` de M points capturés à intervalles irréguliers (selon la fréquence ADS-B, souvent ~ 1 min ou moins). Pour en extraire **exactement 101 points** ("segments à 0%, 1%, 2%, …, 100%"), voici une méthode générique :

### 3.1. Uniformisation par temps

- Définis la durée totale du vol : `tStart = track[0][0]`, `tEnd = track[M-1][0]`.
- Pour chaque pourcentage $p = 0..100$, calcule la `targetTime = tStart + p/100 × (tEnd − tStart)`.
- Pour ce `targetTime`, cherche dans `track[]` les deux points encadrant (celui à temps juste avant et juste après), puis fais une interpolation linéaire sur `lat`, `lon`, `altitude`, `velocity` en fonction du temps.

#### Exemple en pseudo‐TypeScript (par temps)

```ts
interface TrackPoint {
  time: number;     // timestamp Unix
  lat: number;
  lon: number;
  alt: number;      // m
  vel: number;      // m/s ou km/h suivant l'API
}

function resampleByTime(track: TrackPoint[]): TrackPoint[] {
  const nSeg = 100; // 0%..100% → 101 points
  const nPoints = nSeg + 1; // 101
  const resampled: TrackPoint[] = [];

  const tStart = track[0].time;
  const tEnd   = track[track.length - 1].time;
  const totalTime = tEnd - tStart;

  let idx = 0; // index pour parcourir track[]

  for (let p = 0; p <= nSeg; p++) {
    const targetT = tStart + (p / nSeg) * totalTime;
    while (idx < track.length - 1 && track[idx + 1].time < targetT) {
      idx++;
    }
    if (targetT <= track[0].time) {
      resampled.push({ ...track[0] });
    } else if (targetT >= track[track.length - 1].time) {
      resampled.push({ ...track[track.length - 1] });
    } else {
      const ptA = track[idx];
      const ptB = track[idx + 1];
      const dt   = ptB.time - ptA.time;
      const frac = (targetT - ptA.time) / dt; // ∈ [0,1]
      const lat = ptA.lat + frac * (ptB.lat - ptA.lat);
      const lon = ptA.lon + frac * (ptB.lon - ptA.lon);
      const alt = ptA.alt + frac * (ptB.alt - ptA.alt);
      const vel = ptA.vel + frac * (ptB.vel - ptA.vel);
      resampled.push({
        time: targetT,
        lat, lon, alt, vel
      });
    }
  }
  return resampled;
}
```

### 3.2. Uniformisation par distance

- Calcule la distance cumulée le long de la trajectoire (sommes successives des distances géodésiques entre chaque point).
- Si `Dtotal` est la distance totale, pour chaque $p$, calcule `targetDist = p/100 × Dtotal`.
- Parcours la liste jusqu'à trouver l'arête (i, i+1) où la distance cumulée dépasse `targetDist`, puis interpole linéairement en fonction de la proportion de `targetDist` entre `cumDist[i]` et `cumDist[i+1]`.
- Interpole sur `lat`, `lon`, `altitude`, `velocity` selon cette fraction.

#### Exemple en pseudo‐TypeScript (par distance)

```ts
function distanceBetween(a: TrackPoint, b: TrackPoint): number {
  const R = 6371000; // radius Terre en m
  // implémentation haversine ou toute formule géodésique
  // …
}

function computeCumulativeDistances(track: TrackPoint[]): number[] {
  const cumDist: number[] = [0];
  for (let i = 1; i < track.length; i++) {
    const dSeg = distanceBetween(track[i - 1], track[i]);
    cumDist.push(cumDist[i - 1] + dSeg);
  }
  return cumDist;
}

function resampleByDistance(track: TrackPoint[]): TrackPoint[] {
  const nSeg = 100;
  const nPoints = nSeg + 1;
  const resampled: TrackPoint[] = [];
  const cumDist = computeCumulativeDistances(track);
  const Dtotal = cumDist[cumDist.length - 1];
  let idx = 0;
  for (let p = 0; p <= nSeg; p++) {
    const targetD = (p / nSeg) * Dtotal;
    while (idx < cumDist.length - 1 && cumDist[idx + 1] < targetD) {
      idx++;
    }
    if (targetD <= 0) {
      resampled.push({ ...track[0] });
    } else if (targetD >= Dtotal) {
      resampled.push({ ...track[track.length - 1] });
    } else {
      const ptA = track[idx];
      const ptB = track[idx + 1];
      const dA = cumDist[idx];
      const dB = cumDist[idx + 1];
      const frac = (targetD - dA) / (dB - dA);
      const lat = ptA.lat + frac * (ptB.lat - ptA.lat);
      const lon = ptA.lon + frac * (ptB.lon - ptA.lon);
      const alt = ptA.alt + frac * (ptB.alt - ptA.alt);
      const vel = ptA.vel + frac * (ptB.vel - ptA.vel);
      const tIm = ptA.time + frac * (ptB.time - ptA.time);
      resampled.push({
        time: tIm,
        lat, lon, alt, vel
      });
    }
  }
  return resampled;
}
```

## 4. Utilisation dans un projet Angular/Leaflet

- Récupère la trajectoire brute via l'API (OpenSky, etc.)
- Re‐maille en 101 points avec `resampleByTime` ou `resampleByDistance`
- Utilise ces points pour afficher la trajectoire, la progression, etc. dans ton application (tableau, carte, etc.)

---

**Ce document sert de référence pour remplacer l'interpolation linéaire par des données réelles dans la génération des segments de vol.** 