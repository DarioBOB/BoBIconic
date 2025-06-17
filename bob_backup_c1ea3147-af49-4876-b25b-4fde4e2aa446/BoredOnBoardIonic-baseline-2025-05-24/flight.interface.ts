export interface Airport {
  name: string;
  city: string;
  country: string;
  iata: string;
  icao: string;
  latitude: number;
  longitude: number;
  altitude: number;
  timezone: string;
  dst: string;
  tz: string;
  type: string;
  source: string;
  terminal?: string;
  gate?: string;
  services?: string;
  lastUpdated?: string;
}

export interface Airline {
  name: string;
  alias: string;
  iata: string;
  icao: string;
  callsign: string;
  country: string;
  active: boolean;
}

export interface Aircraft {
  icao: string;
  name: string;
  manufacturer: string;
  type: string;
  engines: number;
  seats: number;
  speed: number;
  range: number;
  configuration?: string;
}

export interface FlightData {
  flightNumber: string;
  departureTime: Date;
  arrivalTime: Date;
  departureAirport: Airport;
  arrivalAirport: Airport;
  airline: Airline;
  aircraft: Aircraft;
} 