# Simulation de la vue hublot (horizon, bounding box, etc.)

Pour simuler au mieux ce qu'un passager voit par le hublot, il faut comprendre que :

1. **Le passager voit jusqu'à l'horizon géométrique**, c'est-à-dire la limite où la courbure de la Terre masque le sol.
2. **La fenêtre de l'avion ne lui donne qu'un champ de vision limité** (quelques dizaines de degrés), mais la distance jusqu'à l'horizon est beaucoup plus grande. Pour un globe de rayon $R \approx 6371\,\text{km}$ et une altitude $h$ (en mètres), la distance à l'horizon est :

$$
d_{\text{horizon}} \;=\; \sqrt{\bigl(R + h/1000\bigr)^2 - R^2}\quad (\text{en km})
$$

où on convertit l'altitude $h$ en kilomètres. Par exemple, à $h = 11\,000\,\text{m}$ (soit $11\,\text{km}$), on obtient :

$$
d_{\text{horizon}} \;=\; \sqrt{(6371 + 11)^2 - 6371^2}
\;\approx\; 371\,\text{km}.
$$

Cela signifie qu'un passager à 11 000 m peut, en théorie, discerner le sol jusqu'à environ 371 km autour de lui (sous réserve de conditions météo et de visibilité).

---

## 1. Calcul de la distance à l'horizon en fonction de l'altitude

Pour chaque segment $i$ (avec altitude $h_i$ en mètres), calcule la distance à l'horizon $d_i$ (en mètres) selon :

1. Passe $h_i$ en kilomètres :

   $$
   H_i = \frac{h_i}{1000}.
   $$
2. Calcule la distance géométrique à l'horizon (en kilomètres) :

   $$
   D_i = \sqrt{(R + H_i)^2 - R^2}\,,\quad 
   \text{où }R=6371\text{ km}.
   $$
3. Convertis $D_i$ en mètres pour être cohérent avec Leaflet (qui travaille typiquement en m) :

   $$
   d_i = D_i \times 1000 \quad (\text{en }m).
   $$

### Exemple de calcul en TypeScript/Pseudo-code

```ts
const EARTH_RADIUS_KM = 6371;

// altitudeMeters : altitude du segment en mètres
function horizonDistance(altitudeMeters: number): number {
  const H = altitudeMeters / 1000;               // km
  const D_km = Math.sqrt((EARTH_RADIUS_KM + H)**2 - EARTH_RADIUS_KM**2);
  return D_km * 1000;                            // en mètres
}

// Exemple pour 11 000 m :
const dh = horizonDistance(11000); // ≈ 371000 (m)
console.log(`Horizon à 11 000 m : ${dh/1000} km`); // ≈ 371 km
```

---

## 2. Conversion de cette distance en "bounds" géographiques

Leaflet sait afficher un rectangle (une "bounding box") donné par deux coins (latitude/min, longitude/min) et (latitude/max, longitude/max). Si vous placez l'avion au centre de ce rectangle et que ses coins sont à la distance $d_i$ de lui (en mètres) dans toutes les directions, alors la carte correspondra à la vue au hublot (horizon incluse).

### 2.1. Conversion d'une distance en degrés de latitude

1 degré de latitude (vers le Nord/Sud) vaut environ 111 320 mètres (à proximité de l'équateur) et légèrement moins aux pôles. Pour être précis, on peut utiliser la formule :

$$
1°\text{ de latitude} \approx \frac{\pi \times R}{180} \;\approx\; 111\,195 \,\text{m}
$$

(on prendra 111 320 m comme approximation simple, ou on peut faire $(2\pi R)/360$ exactement).

Donc, pour convertir une distance $d$ (en m) en variation de latitude (en degrés) :

$$
\Delta\varphi = \frac{d}{111\,320} \quad (\text{en degrés})
$$

### 2.2. Conversion en degrés de longitude

1 degré de longitude (vers l'Est/Ouest) dépend de la latitude $\varphi$ (en degrés). À la latitude $\varphi$, la longueur d'un degré de longitude est :

$$
\text{lon\_meter\_per\_degree}(\varphi) \;=\; \frac{\pi \times R \times 1000}{180} \times \cos\bigl(\varphi \times \tfrac{\pi}{180}\bigr) 
\approx 111\,320 \times \cos(\varphi)\quad (\text{m/°}).
$$

Donc, pour convertir $d$ (en mètres) en variation de longitude :

$$
\Delta \lambda \;=\; \frac{d}{111\,320 \times \cos(\varphi)}
\quad (\text{en degrés}).
$$

Où $\varphi$ est la latitude (en degrés) du segment où se trouve l'avion.

---

## 3. Construire la bounding box Leaflet au segment $i$

Pour chaque segment $i$ (avec

* latitude $\varphi_i$ (en degrés),
* longitude $\lambda_i$ (en degrés),
* altitude $h_i$ (en mètres)
  ), on fait :

1. Calcule la distance à l'horizon :

   $$
   d_i = \text{horizonDistance}(h_i)\quad(\text{en mètres}).
   $$
2. Calcule la variation de latitude en degrés :

   $$
   \Delta \varphi_i = \frac{d_i}{111320}.
   $$
3. Calcule la variation de longitude en degrés :

   $$
   \Delta \lambda_i = \frac{d_i}{111320 \times \cos\bigl(\varphi_i \times \frac{\pi}{180}\bigr)}.
   $$
4. Détermine les coins Nord-Ouest (NW) et Sud-Est (SE) de la zone visible :

   ```ts
   const latCenter = segment[i].lat;
   const lonCenter = segment[i].lng;

   const dMeters = horizonDistance(segment[i].altitude);
   const dLatDeg = dMeters / 111320.0;
   const dLonDeg = dMeters / (111320.0 * Math.cos(latCenter * Math.PI / 180));

   const southWest = [ latCenter - dLatDeg, lonCenter - dLonDeg ];
   const northEast = [ latCenter + dLatDeg, lonCenter + dLonDeg ];
   ```
5. Dans Leaflet, on applique :

   ```ts
   // Suppose map est ton objet L.Map Leaflet initialisé
   const bounds = L.latLngBounds(southWest, northEast);
   map.fitBounds(bounds, { animate: false,  padding: [20,20] });
   ```

   → `padding: [20,20]` ajoute une petite marge pour que la carte ne colle pas exactement aux bords du conteneur.
   → `animate: false` (ou `true`) selon si tu veux un effet de zoom fluide ou instantané.

---

## 4. Exemple complet en JavaScript/TypeScript (Leaflet + Angular ou simple JS)

```ts
// ❶ Paramètres constants
const EARTH_RADIUS_KM = 6371;
const M_PER_DEG_LAT = 111320.0; // Approximatif : 1° de latitude = ~111 320 m

/**
 * Calcule la distance géométrique (en mètres) jusqu'à l'horizon, pour une altitude donnée.
 * @param altitudeM Altitude en mètres.
 * @returns Distance jusqu'à l'horizon en mètres.
 */
function horizonDistance(altitudeM: number): number {
  const H = altitudeM / 1000.0; // km
  const dKm = Math.sqrt((EARTH_RADIUS_KM + H)**2 - EARTH_RADIUS_KM**2);
  return dKm * 1000.0; // conversion en mètres
}

/**
 * Renvoie les "bounds" Leaflet (coin SW + coin NE) pour simuler la vue hublot.
 * @param latC Latitude du segment (en degrés).
 * @param lonC Longitude du segment (en degrés).
 * @param altitudeM Altitude du segment (en mètres).
 * @returns Un objet { southWest: [lat,lon], northEast: [lat,lon] }
 */
function computeHublotBounds(latC: number, lonC: number, altitudeM: number) {
  // ❷ Distance jusqu'à l'horizon (en m)
  const d = horizonDistance(altitudeM);

  // ❸ Variation en degrés de latitude
  const deltaLat = d / M_PER_DEG_LAT; 

  // ❹ Variation en degrés de longitude dépendante de la latitude
  const latRad = latC * Math.PI / 180.0;
  const metersPerDegLon = M_PER_DEG_LAT * Math.cos(latRad);
  const deltaLon = d / metersPerDegLon;

  // ❺ Calcul des coins SW et NE
  const southWest: [number, number] = [latC - deltaLat, lonC - deltaLon];
  const northEast: [number, number] = [latC + deltaLat, lonC + deltaLon];

  return { southWest, northEast };
}

// Exemple d'utilisation sur un segment i
const segment = {
  lat: 46.2044,      // Genève (exemple)
  lng: 6.1432,
  altitude: 11000,   // 11 000 m
  speed: 900         // juste pour info
};

const { southWest, northEast } = computeHublotBounds(
  segment.lat,
  segment.lng,
  segment.altitude
);

// Imaginons que "map" est ton L.Map Leaflet déjà initialisé :
map.fitBounds([ southWest, northEast ], { animate: true, padding: [20,20] });
```

À chaque mise à jour du segment (tantôt 0 → 1 → 2 → … → 100), reprends exactement la même méthode pour recalculer `computeHublotBounds(...)` en fonction de la nouvelle position `lat/lon` et de la nouvelle altitude, puis fais `map.fitBounds(...)`.

Ainsi, **la carte se "zoome" à chaque segment pour inclure la zone visible jusqu'à l'horizon**, reproduisant au mieux l'impression d'un passager scrutant le sol et la mer depuis 11 000 m d'altitude.

---

## 5. Ajustement fin : champ de vision du hublot

En réalité, un passager ne voit pas **le cercle entier jusqu'à l'horizon** ; la fenêtre de l'avion se contente souvent d'un angle horizontal d'environ 60° à 70°. Si tu veux affiner encore :

1. **Supposons un champ de vision (FOV) horizontal de $\alpha$ degrés** (par ex. $\alpha = 60°$).
2. La largeur de la zone au sol visible se calcule alors comme :

   $$
   W = 2 \times (h \times \tan(\tfrac{\alpha}{2})) 
   $$

   où $h$ est l'altitude (en mètres).
   Exemple : $\alpha/2 = 30°$, $\tan(30°) ≈ 0{,}577$. À $h = 11 000\,m$,

   $$
   W ≈ 2 \times (11000 \times 0{,}577) ≈ 2 \times 6347 ≈ 12694\,m.
   $$

   → Le passager voit environ $12{,}7\,\text{km}$ de large au sol, et non 371 km (jusqu'à l'horizon).
3. S'il s'agit de simuler la **fenêtre elle-même** (donc un carré/rectangle de $\approx 12{,}7\,\text{km}$ de large), alors tu remplaces la distance d'horizon $d$ par ce $W/2 = h \times \tan(\alpha/2)$, et tu calcule tes $\Delta\varphi$ et $\Delta\lambda$ de la même manière.

   ```ts
   // Exemple si on souhaite limiter au FOV ≈ 60° (angle d'1/2 = 30°)
   function fovHalfWidth(altitudeM: number, halfFovDeg: number = 30): number {
     return altitudeM * Math.tan(halfFovDeg * Math.PI / 180); // en mètres
   }

   // Dans computeHublotBounds, remplacer `const d = horizonDistance(...)`
   // par `const d = fovHalfWidth(altitudeM, 30);`
   ```

   Cela revient à faire un "zoom" beaucoup plus poussé (la vue se limite au local) — mais un passager ne regarde pas seulement à plat au sol : il voit aussi l'horizon lointain.

---

## 6. Résumé de la méthode recommandée

* **Si tu veux simuler **la vraie limite** de ce que l'on voit (la courbure de la Terre)**, utilise la distance à l'horizon $d = \sqrt{(R+h)^2 - R^2}$, puis convertis en $\Delta\varphi$ et $\Delta\lambda$ pour construire tes bounds Leaflet.
* **Si tu veux simuler **le champ de vision par la fenêtre** (FOV d'environ 60°)**, remplace $d$ par $h \times \tan(30°)$, ce qui donne un rayon visuel plus petit (quelques kilomètres seulement).

La plupart des applications "in-flight" choisissent la première solution (horizon géométrique) pour donner au passager le sentiment de « voir tout autour » et non juste le sol immédiat. C'est donc la formule :

```ts
const dMeters = Math.sqrt((R_km + h/1000)**2 - R_km**2) * 1000;
const deltaLat = dMeters / 111320;
const deltaLon = dMeters / (111320 * Math.cos(latCenter * Math.PI/180));
const sw = [latCenter - deltaLat, lonCenter - deltaLon];
const ne = [latCenter + deltaLat, lonCenter + deltaLon];
map.fitBounds([sw, ne], { padding: [20,20] });
```

en guise de **meilleure façon** de zoomer la carte de façon réaliste, segment par segment, pour un vol GVA → ATH (ou tout autre vol).

---

### Exemple complet (TypeScript + Leaflet)

```ts
import * as L from 'leaflet';

// Rayon de la Terre en kilomètres
const EARTH_RADIUS_KM = 6371;

/** Calcule la distance en mètres jusqu'à l'horizon pour une altitude donnée (en m). */
function horizonDistance(altitudeM: number): number {
  const H_km = altitudeM / 1000;
  const d_km = Math.sqrt((EARTH_RADIUS_KM + H_km)**2 - EARTH_RADIUS_KM**2);
  return d_km * 1000; // m
}

/**
 * Calcule la bounding box Leaflet (coin SW & coin NE) correspondant
 * à la vue hublot (horizon géométrique) depuis la position (latC, lonC, alt).
 */
function computeHublotBounds(latC: number, lonC: number, altitudeM: number) {
  // 1. Distance jusqu'à l'horizon (m)
  const d = horizonDistance(altitudeM);

  // 2. En degrés de latitude
  const dLatDeg = d / 111320.0;

  // 3. En degrés de longitude (dépend de la latitude actuelle)
  const latRad = latC * Math.PI / 180.0;
  const metersPerDegLon = 111320.0 * Math.cos(latRad);
  const dLonDeg = d / metersPerDegLon;

  // 4. Coins SW & NE
  const southWest: [number, number] = [latC - dLatDeg, lonC - dLonDeg];
  const northEast: [number, number] = [latC + dLatDeg, lonC + dLonDeg];

  return { southWest, northEast };
}

// Supposons que `map` est déjà ta carte Leaflet initialisée ailleurs
let map: L.Map = L.map('map').setView([46.2, 6.14], 6);

// Exemple : simuler un segment (idx = 50, environ 50% du vol)
const segmentExample = {
  lat: 45.0,        // latitude média approximative GVA→ATH
  lng: 12.0,        // longitude approximative de la Méditerranée
  altitude: 11000,  // 11 000 m
  speed: 900        // km/h (juste pour info)
};

const { southWest, northEast } = computeHublotBounds(
  segmentExample.lat,
  segmentExample.lng,
  segmentExample.altitude
);

// Applique le zoom & centrage pour voir jusqu'à l'horizon
map.fitBounds([ southWest, northEast ], { animate: true, padding: [20,20] });
```

À chaque mise à jour du segment (tantôt 0 → 1 → 2 → … → 100), reprends exactement la même méthode pour recalculer `computeHublotBounds(...)` en fonction de la nouvelle position `lat/lon` et de la nouvelle altitude, puis fais `map.fitBounds(...)`.

Ainsi, **la carte se "zoome" à chaque segment pour inclure la zone visible jusqu'à l'horizon**, reproduisant au mieux l'impression d'un passager scrutant le sol et la mer depuis 11 000 m d'altitude. 