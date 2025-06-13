import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, firstValueFrom } from 'rxjs';
import { TrackPoint } from './flight/models/track-point.interface';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface FlightData {
  flightNumber: string;
  airline: string;
  departure: string;
  arrival: string;
  departureTime: string;
  duration: string;
  status: string;
  aircraftType: string;
}

export interface DynamicData {
  altitude: number;
  speed: number;
  position: { lat: number; lng: number } | null;
  weather: string;
  estimatedTimeRemaining: string;
}

export interface POI {
  name: string;
  description: string;
  position: { lat: number; lng: number };
  type: 'city' | 'monument' | 'landmark';
  image?: string;
}

export type WindowMode = 'REAL' | 'DISCONNECTED' | 'DEMO';

@Injectable({
  providedIn: 'root'
})
export class WindowService {
  private segments: TrackPoint[] = [];
  private flightData = new BehaviorSubject<FlightData>({
    flightNumber: '',
    airline: '',
    departure: '',
    arrival: '',
    departureTime: '',
    duration: '',
    status: '',
    aircraftType: ''
  });
  private dynamicData = new BehaviorSubject<DynamicData>({
    altitude: 0,
    speed: 0,
    position: null,
    weather: '',
    estimatedTimeRemaining: ''
  });
  private pois = new BehaviorSubject<POI[]>([]);
  private progress = new BehaviorSubject<number>(0);
  private callsign = new BehaviorSubject<string>(localStorage.getItem('window-callsign') || '');

  flightData$ = this.flightData.asObservable();
  dynamicData$ = this.dynamicData.asObservable();
  pois$ = this.pois.asObservable();
  progress$ = this.progress.asObservable();
  callsign$ = this.callsign.asObservable();

  constructor(private http: HttpClient) {}

  getSegments(): Observable<TrackPoint[]> {
    return of(this.segments);
  }

  setSegments(segments: TrackPoint[]) {
    this.segments = segments;
  }

  updatePosition(position: { lat: number; lng: number } | null) {
    const prev = this.dynamicData.value;
    this.dynamicData.next({
      altitude: prev.altitude || 0,
      speed: prev.speed || 0,
      position,
      weather: prev.weather || '',
      estimatedTimeRemaining: prev.estimatedTimeRemaining || ''
    });
  }

  updatePOIs(pois: POI[]) {
    this.pois.next(pois);
  }

  updateFlightData(data: FlightData) {
    this.flightData.next(data);
  }

  updateDynamicData(data: DynamicData) {
    this.dynamicData.next(data);
  }

  updateProgress(percent: number) {
    this.progress.next(percent);
  }

  setCallsign(cs: string) {
    this.callsign.next(cs);
    localStorage.setItem('window-callsign', cs);
  }

  getCallsign(): string {
    return this.callsign.value;
  }

  /**
   * Recherche un vol par callsign, tente AviationStack puis OpenSky en fallback.
   */
  async searchFlight(callsign: string) {
    this.setCallsign(callsign);
    try {
      const proxyUrl = `http://localhost:3000/api/flight?callsign=${callsign}`;
      const resp: any = await firstValueFrom(this.http.get(proxyUrl));
      if (resp && resp.data) {
        const flight = resp.data;
        this.updateFlightData({
          flightNumber: flight.flight?.iata || callsign,
          airline: flight.airline?.name || '',
          departure: flight.departure?.airport || '',
          arrival: flight.arrival?.airport || '',
          departureTime: flight.departure?.scheduled || '',
          duration: '',
          status: flight.flight_status || '',
          aircraftType: flight.aircraft?.icao || ''
        });
        return;
      }
    } catch (e) {
      this.updateFlightData({
        flightNumber: callsign,
        airline: 'Non trouvé',
        departure: '',
        arrival: '',
        departureTime: '',
        duration: '',
        status: 'Aucun vol trouvé',
        aircraftType: ''
      });
    }
  }
} 