export interface FlightStatus {
  type: 'ON_TIME' | 'DELAYED' | 'CANCELLED' | 'DIVERTED';
  description: string;
  phase?: string;
  scheduledDeparture?: string;
  scheduledArrival?: string;
  actualDeparture?: string;
  actualArrival?: string;
}

export interface AircraftInfo {
  registration: string;
  type: string;
  icao24: string;
  model?: string;
  manufacturer?: string;
  altitude?: number;
  speed?: number;
  heading?: number;
  latitude?: number;
  longitude?: number;
}

export interface Location {
  latitude: number;
  longitude: number;
}

export interface AirportInfo {
  airport: string;
  city: string;
  country: string;
  scheduledTime: string;
  actualTime?: string;
  terminal?: string;
  gate?: string;
  estimatedBlockoutTime?: string;
  actualBlockoutTime?: string;
  estimatedBlockinTime?: string;
  actualBlockinTime?: string;
  delayMinutes?: number;
  status: FlightStatus;
  baggageClaim?: string;
  location?: Location;
}

export interface RouteInfo {
  departure: AirportInfo;
  arrival: AirportInfo;
  currentPosition: {
    latitude: number;
    longitude: number;
    altitude: number;
    speed: number;
    heading: number;
    timestamp: string;
  };
  distance: {
    kilometers: number;
    miles: number;
  };
  duration: {
    scheduledMinutes: number;
    actualMinutes?: number;
  };
  waypoints: Waypoint[];
}

export interface FlightData {
  flightNumber: string;
  airline: string;
  aircraft: AircraftInfo;
  route: RouteInfo;
  status: FlightStatus;
  lastUpdated: string;
  codeshares?: string[];
  waypoints: Waypoint[];
}

export interface Waypoint {
  latitude: number;
  longitude: number;
  altitude: number;
  speed: number;
  heading: number;
  timestamp: string;
}

export interface RouteData {
  distance: number;
  averageDuration: number;
  waypoints: Waypoint[];
  currentPosition?: {
    latitude: number;
    longitude: number;
    altitude: number;
    speed: number;
    heading: number;
    timestamp: string;
  };
}

export interface FlightStatistics {
  onTimePercentage: number;
  averageDelay: number;
  mostCommonDelays: Array<{
    reason: string;
    frequency: number;
  }>;
  totalFlights: number;
  cancelledFlights: number;
  divertedFlights: number;
} 