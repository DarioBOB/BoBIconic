export interface FlightData {
  flightNumber: string;
  airline: string;
  aircraft: {
    registration: string;
    type: string;
    icao24: string;
  };
  route: {
    departure: {
      airport: string;
      city: string;
      country: string;
      scheduledTime: string;
      actualTime: string;
      terminal: string;
      gate: string;
    };
    arrival: {
      airport: string;
      city: string;
      country: string;
      scheduledTime: string;
      actualTime: string;
      terminal: string;
      gate: string;
    };
    currentPosition: {
      latitude: number;
      longitude: number;
      altitude: number;
      speed: number;
      heading: number;
      timestamp: string;
    };
  };
  status: string;
  lastUpdated: string;
}

export interface AirportInfo {
  code: string;
  name: string;
  scheduledTime: string;
  actualTime: string;
  terminal: string;
  gate: string;
  baggageClaim: string;
  averageDelay: number;
  location?: {
    latitude: number;
    longitude: number;
  };
  weather?: {
    temperature: number;
    conditions: string;
    windSpeed: number;
    windDirection: number;
  };
}

export interface RouteData {
  distance: number;
  averageDuration: number;
  waypoints: Array<{
    latitude: number;
    longitude: number;
    altitude: number;
    timestamp: string;
  }>;
  currentPosition?: {
    latitude: number;
    longitude: number;
    altitude: number;
    speed: number;
    heading: number;
    timestamp: string;
  };
}

export interface DelayInfo {
  reason: string;
  frequency: number;
  averageDuration: number;
}

export interface FlightStatistics {
  onTimePercentage: number;
  averageDelay: number;
  mostCommonDelays: DelayInfo[];
  totalFlights: number;
  cancelledFlights: number;
  divertedFlights: number;
}

export interface AircraftInfo {
  type: string;
  registration: string;
  age: number;
  icao24: string;
} 