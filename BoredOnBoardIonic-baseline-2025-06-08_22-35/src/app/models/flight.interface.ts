export interface Waypoint {
  lat: number;
  lng: number;
  timestamp: number;
  altitude: number;
  speed: number;
}

export interface FlightData {
  // Informations de base
  flightNumber: string;
  airline: string;
  aircraft: string;
  
  // Aéroports
  departureAirport: string;
  departureCity: string;
  arrivalAirport: string;
  arrivalCity: string;
  
  // Horaires
  departureLocal: string;
  departureTimeGeneva: string;
  departureTimeAthens: string;
  arrivalLocal: string;
  arrivalTimeGeneva: string;
  arrivalTimeAthens: string;
  
  // État du vol
  status: string;
  phase: string;
  progressPercent: number;
  
  // Données de vol
  lat_t_deg: number;
  lon_t_deg: number;
  altitude: number;
  v_sol_kmh: number;
  v_sol_kt: number;
  d_elapsed_km: number;
  d_remaining_km: number;
  
  // Temps
  duration: string;
  elapsed: string;
  remaining: string;
  eta: string;
  
  // Heures locales
  nowGeneva: string;
  nowAthens: string;
} 