import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, firstValueFrom } from 'rxjs';
import { TrackPoint } from './flight/models/track-point.interface';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { OpenSkyService } from './flight/opensky.service';
import { AviationstackService } from './flight/aviationstack.service';

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

  constructor(
    private http: HttpClient,
    private openSkyService: OpenSkyService,
    private aviationstackService: AviationstackService
  ) {}

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
   * Recherche le dernier vol complet (atterri) pour un callsign, sur 8 jours, via OpenSky et enrichit avec AviationStack si possible
   */
  async searchFlight(callsign: string) {
    this.setCallsign(callsign);
    try {
      // 1. Recherche OpenSky (dernier vol complet)
      const latestFlight = await firstValueFrom(this.openSkyService.getLatestCompleteFlight(callsign));
      let enrichedData = null;
      if (latestFlight && latestFlight.callsign) {
        // 2. Recherche AviationStack pour enrichir (si possible)
        enrichedData = await firstValueFrom(this.aviationstackService.getFlightData(latestFlight.callsign.trim()));
      }
      if (latestFlight) {
        this.updateFlightData({
          flightNumber: latestFlight.callsign || callsign,
          airline: enrichedData?.airline || latestFlight.airline || '',
          departure: enrichedData?.departure?.name || latestFlight.estDepartureAirport || '',
          arrival: enrichedData?.arrival?.name || latestFlight.estArrivalAirport || '',
          departureTime: enrichedData?.departure?.scheduledTime || (latestFlight.firstSeen ? new Date(latestFlight.firstSeen * 1000).toISOString() : ''),
          duration: latestFlight.lastSeen && latestFlight.firstSeen ? `${Math.round((latestFlight.lastSeen - latestFlight.firstSeen) / 60)} min` : '',
          status: 'landed',
          aircraftType: (enrichedData && (enrichedData as any).aircraft?.model) || (enrichedData && (enrichedData as any).aircraft?.type) || latestFlight.icao24 || ''
        });
        // Tu peux aussi stocker ici les segments pour la carte plus tard
        // this.setSegments(...)
        return;
      } else {
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