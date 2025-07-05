# Algorithme de classification des phases de vol (taxi, climb, cruise, descent, approach, taxi-in)

Pour déterminer à quelle « phase de vol » (taxi, décollage/climb, croisière, descente, approche/atterrissage, taxi final) appartient un segment donné parmi les 101, on peut s'appuyer essentiellement sur deux variables : **l'altitude** et **la vitesse sol** de l'avion (voire la tendance d'altitude d'un segment à l'autre). Voici une méthode pas à pas pour calculer la phase de vol d'un segment :

---

## 1. Définition des phases principales

Dans le cycle standard d'un vol commercial, on distingue classiquement :

1. **Pré-vol / Taxi au sol**
   * L'avion se déplace sur le tarmac (au sol), vitesse faible (≤ 30 km/h ou 15 kt environ), altitude = 0 ou très proche.
2. **Décollage & montée (Takeoff/Climb)**
   * L'avion accélère puis décolle : vitesse sol passe rapidement à plusieurs centaines de nœuds, altitude augmente fortement.
   * Typiquement de l'altitude 0 jusqu'à la « cruise altitude » (ex. FL350 pour un A320).
3. **Croisière (Cruise)**
   * L'avion a atteint son altitude de croisière (ex. 10 000 m / FL350) et la conserve quasi-constante.
   * Vitesse sol stable (850–950 km/h environ).
4. **Descente (Descent)**
   * L'avion amorce une baisse d'altitude systématique, de la cruise à l'approche.
   * Altitude décroissante de manière continue (quelques milliers de pieds de descente par minute).
5. **Approche / Atterrissage (Approach/Landing)**
   * L'avion passe sous 3000 ft (≈ 900 m) et se rapproche de l'aéroport de destination.
   * Vitesse sol diminue et altitude approche 0 m au moment du toucher.
6. **Taxi final / Arrêt (Taxi-Out)**
   * Après touchdown, l'avion roule jusqu'à la porte : vitesse faible, altitude = 0 m.

Selon les données dont on dispose (latitude, longitude, altitude, vitesse sol pour chaque segment), on peut classer chaque segment dans l'une de ces phases en appliquant des seuils et des règles simples.

---

## 2. Stratégie de calcul en pseudo-algorithme

Supposons qu'on ait un tableau `segments[0..100]` (101 points) où chaque élément contient au moins :

* `lat`, `lng` (pas nécessaire pour la phase)
* `altitude` (en mètres)
* `speed` (vitesse sol, en km/h ou nœuds, selon ce que tu as)

On va ajouter un champ calculé, `phase`, pour chaque segment.

### 2.1. Choix de seuils (exemples indicatifs)

* **Seuil d'altitude pour « au sol »** : altitude ≤ 50 m (100–150 ft).
* **Seuil de vitesse pour « au sol »** : speed ≤ 30 km/h (≈ 16 kt).
* **Altitude de croisière** (cruise altitude) : typiquement 12000 m (FL390), mais la plupart des vols GVA→ATH volent ≈ 11000 m. Pour un vol de démonstration, on peut fixer un `CRUISE_ALT_M = 11000` m (ou 10000 m).
* **Seuil d'écart d'altitude pour « croisière »** : si `abs(altitude – CRUISE_ALT_M) ≤ 300` m (soit ±300 m) on considère qu'on est en palier de croisière.
* **Descente vs montée** :
  * Si `altitude[i] < altitude[i+1] – 30` → montée (climb).
  * Si `altitude[i] > altitude[i+1] + 30` → descente (descent).
  * (La marge de 30 m évite le bruit de mesures/jitter).
* **Approche** (approach/landing) : lorsque `altitude ≤ 300 m` et vitesse sol entre 150–300 km/h (≈ 80–160 kt) sur un ou deux segments consécutifs.
* **Taxi final** (post-touchdown) : `altitude ≤ 50 m` et `speed ≤ 30 km/h`.

Ces seuils sont donnés à titre d'exemple ; tu peux les ajuster selon la simulation (démonstration) ou selon le profil issu de ton parser.

---

### 2.2. Pseudo-code de classification

```ts
interface Segment {
  lat: number;
  lng: number;
  altitude: number;  // en mètres
  speed: number;     // en km/h (ou knots)
  phase?: string;    // à remplir : "TAXI_OUT", "CLIMB", "CRUISE", "DESCENT", "APPROACH", "TAXI_IN"
}

// Paramètres (à ajuster selon ton vol réel ou simulation)
const ALTITUDE_GROUND_M = 50;       // ≤ 50m on est considéré au sol
const SPEED_GROUND_KMH = 30;        // ≤ 30 km/h on est taxi au sol
const CRUISE_ALT_M = 11000;         // altitude de croisière (m)
const CRUISE_TOLERANCE_M = 300;     // ± 300 m autour de l'altitude de croisière
const APPROACH_ALT_M = 300;         // altitude inférieure à 300 m => approche
const APPROACH_SPEED_MIN_KMH = 150; // vitesse typique en approche min (km/h)
const APPROACH_SPEED_MAX_KMH = 300; // vitesse typique en approche max (km/h)

/**
 * Détermine la phase de vol pour chaque segment du vol
 * en remplissant segment.phase (string).
 */
function classifyFlightPhases(segments: Segment[]): void {
  if (segments.length === 0) return;

  const n = segments.length;

  for (let i = 0; i < n; i++) {
    const curr = segments[i];
    const alt = curr.altitude;
    const spd = curr.speed;

    // PHASE "TAXI_OUT" : au sol et faible vitesse => premier segment(s) avant décollage
    if (alt <= ALTITUDE_GROUND_M && spd <= SPEED_GROUND_KMH) {
      curr.phase = "TAXI_OUT";
      continue;
    }

    // Si on n'est pas au sol, regarde la tendance d'altitude entre i et i+1 (si possible)
    let nextAlt = alt;
    if (i < n - 1) {
      nextAlt = segments[i + 1].altitude;
    }

    // PHASE "CLIMB" : altitude augmente significativement, et on n'est pas au sol
    if (alt > ALTITUDE_GROUND_M
        && nextAlt > alt + 30  // montée positive > 30 m
        && spd > SPEED_GROUND_KMH // on est déjà en bonne vitesse
    ) {
      curr.phase = "CLIMB";
      continue;
    }

    // PHASE "CRUISE" : altitude proche de l'altitude de croisière
    if (alt >= (CRUISE_ALT_M - CRUISE_TOLERANCE_M)
        && alt <= (CRUISE_ALT_M + CRUISE_TOLERANCE_M)
        && spd > SPEED_GROUND_KMH // voler à vitesse de croisière
    ) {
      curr.phase = "CRUISE";
      continue;
    }

    // PHASE "DESCENT" : altitude en diminution significative
    if (alt > ALTITUDE_GROUND_M
        && nextAlt < alt - 30  // descente > 30 m
        && alt > APPROACH_ALT_M // pas encore en approche finale
    ) {
      curr.phase = "DESCENT";
      continue;
    }

    // PHASE "APPROACH" : basse altitude (<300m), vitesse réduite (150–300 km/h)
    if (alt <= APPROACH_ALT_M
        && alt > ALTITUDE_GROUND_M // toujours en l'air mais bas
        && spd >= APPROACH_SPEED_MIN_KMH
        && spd <= APPROACH_SPEED_MAX_KMH
    ) {
      curr.phase = "APPROACH";
      continue;
    }

    // PHASE "TAXI_IN" : après atterrissage (altitude ≤ 50 m, vitesse ≤ 30 km/h)
    if (alt <= ALTITUDE_GROUND_M && spd <= SPEED_GROUND_KMH) {
      curr.phase = "TAXI_IN";
      continue;
    }

    // Au cas où rien n'a matché, on peut utiliser une heuristique de segment :
    // si on est dans les 10% premiers ou derniers segments, on peut supposer taxi/approach
    const pct = (i / (n - 1)) * 100;
    if (pct < 5) {
      curr.phase = "TAXI_OUT";
    } else if (pct > 95) {
      curr.phase = "TAXI_IN";
    } else {
      // si on est au-dessus de l'altitude ground mais pas assez haut, c'est possiblement un vol bas (pendant décollage)
      if (alt > ALTITUDE_GROUND_M && alt < CRUISE_ALT_M - CRUISE_TOLERANCE_M) {
        curr.phase = "CLIMB";
      } else if (alt > CRUISE_ALT_M + CRUISE_TOLERANCE_M) {
        curr.phase = "DESCENT";
      } else {
        curr.phase = "CRUISE";
      }
    }
  }
}
```

---

## 3. Explications détaillées des règles

(…voir texte fourni…)

---

## 4. Exemple d'utilisation dans une structure Leaflet + Angular

Imaginons qu'on soit dans un composant Angular et qu'on ait déjà un tableau de segments :

```ts
export interface Segment {
  lat: number;
  lng: number;
  altitude: number; // m
  speed: number;    // km/h
  phase?: string;
}

// Dans ton service ou composant, tu charges ou simules 101 segments :
const flightSegments: Segment[] = generateFlightSegments(101);

// Tu appelles ensuite la fonction pour classer chaque segment :
classifyFlightPhases(flightSegments);

// Si tu veux afficher visuellement chaque segment, tu peux par exemple colorer les points différemment :
flightSegments.forEach(seg => {
  let color = '';
  switch (seg.phase) {
    case 'TAXI_OUT':
    case 'TAXI_IN':
      color = 'gray';    // taxi au sol en gris
      break;
    case 'CLIMB':
      color = 'orange';  // montée en orange
      break;
    case 'CRUISE':
      color = 'blue';    // croisière en bleu
      break;
    case 'DESCENT':
      color = 'purple';  // descente en violet
      break;
    case 'APPROACH':
      color = 'red';     // approche en rouge
      break;
    default:
      color = 'black';
  }
  // Par exemple, tu crées un marker Leaflet coloré :
  L.circleMarker([seg.lat, seg.lng], { radius: 4, color: color }).addTo(map);
});
```

---

## 5. Ajustements et extensions

(…voir texte fourni…)

---

### En résumé

(…voir texte fourni…) 