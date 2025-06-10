import { POI } from './poi.interface';

export interface Waypoint {
  latitude: number;
  longitude: number;
  altitude: number;
  speed: number;
  heading: number;
  timestamp: string;
}

export interface FlightStatus {
  type: 'ON_TIME' | 'DELAYED' | 'CANCELLED' | 'DIVERTED';
  description: string;
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
  location?: {
    latitude: number;
    longitude: number;
  };
}

export interface AircraftInfo {
  registration: string;
  type: string;
  icao24: string;
  manufacturer?: string;
  model?: string;
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
  departure: {
    code: string;
    name: string;
    latitude: number;
    longitude: number;
    scheduledTime: string;
  };
  arrival: {
    code: string;
    name: string;
    latitude: number;
    longitude: number;
    scheduledTime: string;
  };
  waypoints: Waypoint[];
  currentPosition?: {
    latitude: number;
    longitude: number;
    heading: number;
    altitude: number;
  };
  statistics: {
    onTimePercentage: number;
    averageDelay: number;
  };
}

export interface RouteData {
  distance: number;
  averageDuration: number;
  waypoints: Array<{
    latitude: number;
    longitude: number;
    altitude: number;
    speed: number;
    heading: number;
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
  mostCommonDelays: Array<{
    reason: string;
    frequency: number;
  }>;
  totalFlights: number;
  cancelledFlights: number;
  divertedFlights: number;
}

export interface FlightSegment {
    percent: number;
    lat: number;
    lng: number;
    altitude: number;
    speed: number;
    elapsedMin: number;
    heure: string;
    pois: POI[];
} 