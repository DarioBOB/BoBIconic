export interface Waypoint {
  lat: number;
  lng: number;
  etaOffsetSec?: number;  // Optionnel : décalage en secondes depuis le décollage
}

export interface FlightPlan {
  flightId: string;            // ex: "GVA-ATH-2025-06-05"
  departureIATA: string;       // ex: "GVA"
  arrivalIATA: string;         // ex: "ATH"
  departureTimeUTC: string;    // ex: "2025-06-05T08:30:00Z"
  arrivalTimeUTC: string;      // ex: "2025-06-05T12:00:00Z"
  waypoints: Waypoint[];       // liste ordonnée de points lat/lng
  // Éventuellement : liste de POIs, données météo, etc.
  pois?: Array<{
    lat: number;
    lng: number;
    name: string;
    type: string;
  }>;
  weatherLayers?: Array<{
    type: string;
    data: any;
  }>;
} 