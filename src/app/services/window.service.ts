import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { TrackPoint } from './flight/models/track-point.interface';

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
  private dynamicData = new BehaviorSubject<{ position: { lat: number; lng: number } | null }>({ position: null });
  private pois = new BehaviorSubject<POI[]>([]);
  private currentPercent = new BehaviorSubject<number>(0);

  dynamicData$ = this.dynamicData.asObservable();
  pois$ = this.pois.asObservable();
  currentPercent$ = this.currentPercent.asObservable();

  constructor() {}

  getSegments(): Observable<TrackPoint[]> {
    return of(this.segments);
  }

  setSegments(segments: TrackPoint[]) {
    this.segments = segments;
  }

  updatePosition(position: { lat: number; lng: number } | null) {
    this.dynamicData.next({ position });
  }

  updatePOIs(pois: POI[]) {
    this.pois.next(pois);
  }

  updateProgress(percent: number) {
    this.currentPercent.next(percent);
  }
} 