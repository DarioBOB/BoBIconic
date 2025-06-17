import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
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
  position: { lat: number; lng: number };
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
  private _progress = new BehaviorSubject<number>(0);
  private _flightData = new BehaviorSubject<FlightData>({
    flightNumber: 'LX 4334',
    airline: 'Swiss',
    departure: 'Genève',
    arrival: 'Athènes',
    departureTime: '10:00',
    duration: '3h 15m',
    status: 'En vol',
    aircraftType: 'A320'
  });
  private _dynamicData = new BehaviorSubject<DynamicData>({
    altitude: 35000,
    speed: 850,
    position: { lat: 45.0, lng: 12.0 },
    weather: 'Dégagé',
    estimatedTimeRemaining: '1h 45m'
  });
  private _pois = new BehaviorSubject<POI[]>([]);
  private _segmentsReal = new BehaviorSubject<TrackPoint[]>([]);
  private _segmentsSimulated = new BehaviorSubject<TrackPoint[]>([]);
  private _segmentsDemo = new BehaviorSubject<TrackPoint[]>([]);
  private _currentMode: WindowMode = 'DEMO';

  constructor() {
    // TODO: Charger les données depuis Firebase
    this.loadPOIs();
  }

  // Getters pour les BehaviorSubjects
  get progress() { return this._progress; }
  get flightData() { return this._flightData; }
  get dynamicData() { return this._dynamicData; }
  get pois() { return this._pois; }

  // Observables
  get progress$(): Observable<number> {
    return this._progress.asObservable();
  }

  get flightData$(): Observable<FlightData> {
    return this._flightData.asObservable();
  }

  get dynamicData$(): Observable<DynamicData> {
    return this._dynamicData.asObservable();
  }

  get pois$(): Observable<POI[]> {
    return this._pois.asObservable();
  }

  get currentMode(): WindowMode {
    return this._currentMode;
  }

  // Mise à jour de la progression
  updateProgress(progress: number) {
    this._progress.next(progress);
    this.updateDynamicData(progress);
  }

  // Mise à jour des données dynamiques en fonction de la progression
  private updateDynamicData(progress: number) {
    // TODO: Calculer les données en fonction de la progression
    const currentData = this._dynamicData.value;
    this._dynamicData.next({
      ...currentData,
      altitude: this.calculateAltitude(progress),
      speed: this.calculateSpeed(progress),
      position: this.calculatePosition(progress),
      estimatedTimeRemaining: this.calculateTimeRemaining(progress)
    });
  }

  // Chargement des POIs
  private loadPOIs() {
    const pois: POI[] = [
      {
        name: 'Genève',
        description: 'Point de départ',
        position: { lat: 46.2382, lng: 6.1089 },
        type: 'city'
      },
      {
        name: 'Milan',
        description: 'Première étape',
        position: { lat: 45.4642, lng: 9.1900 },
        type: 'city'
      },
      {
        name: 'Rome',
        description: 'Deuxième étape',
        position: { lat: 41.9028, lng: 12.4964 },
        type: 'city'
      },
      {
        name: 'Athènes',
        description: 'Point d\'arrivée',
        position: { lat: 37.9838, lng: 23.7275 },
        type: 'city'
      }
    ];
    this._pois.next(pois);
  }

  // Calculs des données en fonction de la progression
  private calculateAltitude(progress: number): number {
    // Simulation d'une courbe d'altitude
    if (progress < 10) return progress * 3500; // Montée
    if (progress > 90) return (100 - progress) * 3500; // Descente
    return 35000; // Croisière
  }

  private calculateSpeed(progress: number): number {
    // Simulation de la vitesse
    if (progress < 10) return 500 + progress * 35; // Accélération
    if (progress > 90) return 850 - (progress - 90) * 35; // Décélération
    return 850; // Croisière
  }

  private calculatePosition(progress: number): { lat: number; lng: number } {
    // Utiliser les segments selon le mode
    switch (this._currentMode) {
      case 'REAL':
        return this.calculatePositionReal(progress);
      case 'DISCONNECTED':
        return this.calculatePositionSimulated(progress);
      case 'DEMO':
        return this.calculatePositionDemo(progress);
      default:
        throw new Error('Invalid mode');
    }
  }

  private calculatePositionReal(progress: number): { lat: number; lng: number } {
    // Utiliser les segments réels
    const segments = this._segmentsReal.value;
    if (segments.length < 2) {
      // Fallback linéaire si pas de segments
      const start = { lat: 46.2382, lng: 6.1089 };
      const end = { lat: 37.9838, lng: 23.7275 };
      return {
        lat: start.lat + (end.lat - start.lat) * (progress / 100),
        lng: start.lng + (end.lng - start.lng) * (progress / 100)
      };
    }
    // Index flottant sur 0..199
    const idx = (segments.length - 1) * (progress / 100);
    const i = Math.floor(idx);
    const t = idx - i;
    if (i >= segments.length - 1) {
      return { lat: segments[segments.length - 1].lat, lng: segments[segments.length - 1].lon };
    }
    // Interpolation entre i et i+1
    const p0 = segments[i];
    const p1 = segments[i + 1];
    return {
      lat: p0.lat + (p1.lat - p0.lat) * t,
      lng: p0.lon + (p1.lon - p0.lon) * t
    };
  }

  private calculatePositionSimulated(progress: number): { lat: number; lng: number } {
    // Utiliser les segments simulés
    const segments = this._segmentsSimulated.value;
    if (segments.length < 2) {
      // Fallback linéaire si pas de segments
      const start = { lat: 46.2382, lng: 6.1089 };
      const end = { lat: 37.9838, lng: 23.7275 };
      return {
        lat: start.lat + (end.lat - start.lat) * (progress / 100),
        lng: start.lng + (end.lng - start.lng) * (progress / 100)
      };
    }
    // Index flottant sur 0..199
    const idx = (segments.length - 1) * (progress / 100);
    const i = Math.floor(idx);
    const t = idx - i;
    if (i >= segments.length - 1) {
      return { lat: segments[segments.length - 1].lat, lng: segments[segments.length - 1].lon };
    }
    // Interpolation entre i et i+1
    const p0 = segments[i];
    const p1 = segments[i + 1];
    return {
      lat: p0.lat + (p1.lat - p0.lat) * t,
      lng: p0.lon + (p1.lon - p0.lon) * t
    };
  }

  private calculatePositionDemo(progress: number): { lat: number; lng: number } {
    // Utiliser les segments démo
    const segments = this._segmentsDemo.value;
    if (segments.length < 2) {
      // Fallback linéaire si pas de segments
      const start = { lat: 46.2382, lng: 6.1089 };
      const end = { lat: 37.9838, lng: 23.7275 };
      return {
        lat: start.lat + (end.lat - start.lat) * (progress / 100),
        lng: start.lng + (end.lng - start.lng) * (progress / 100)
      };
    }
    // Index flottant sur 0..199
    const idx = (segments.length - 1) * (progress / 100);
    const i = Math.floor(idx);
    const t = idx - i;
    if (i >= segments.length - 1) {
      return { lat: segments[segments.length - 1].lat, lng: segments[segments.length - 1].lon };
    }
    // Interpolation entre i et i+1
    const p0 = segments[i];
    const p1 = segments[i + 1];
    return {
      lat: p0.lat + (p1.lat - p0.lat) * t,
      lng: p0.lon + (p1.lon - p0.lon) * t
    };
  }

  private calculateTimeRemaining(progress: number): string {
    const totalMinutes = 195; // 3h 15m
    const remainingMinutes = Math.round(totalMinutes * (1 - progress / 100));
    const hours = Math.floor(remainingMinutes / 60);
    const minutes = remainingMinutes % 60;
    return `${hours}h ${minutes}m`;
  }

  /** Définit le mode courant et réinitialise la progression/segments */
  setMode(mode: WindowMode) {
    this._currentMode = mode;
    this._progress.next(0);
    // Réinitialise les segments selon le mode
    switch (mode) {
      case 'REAL':
        this._segmentsSimulated.next([]);
        this._segmentsDemo.next([]);
        break;
      case 'DISCONNECTED':
        this._segmentsReal.next([]);
        this._segmentsDemo.next([]);
        break;
      case 'DEMO':
        this._segmentsReal.next([]);
        this._segmentsSimulated.next([]);
        break;
    }
  }

  /** Définit les segments réels (mode REAL) */
  setRealSegments(points: TrackPoint[]) {
    this._segmentsReal.next(points);
  }
  /** Définit les segments simulés (mode DISCONNECTED) */
  setSimulatedSegments(points: TrackPoint[]) {
    this._segmentsSimulated.next(points);
  }
  /** Définit les segments démo (mode DEMO) */
  setDemoSegments(points: TrackPoint[]) {
    this._segmentsDemo.next(points);
  }

  /** Retourne les segments du mode courant */
  getSegments(): Observable<TrackPoint[]> {
    switch (this._currentMode) {
      case 'REAL':
        return this._segmentsReal.asObservable();
      case 'DISCONNECTED':
        return this._segmentsSimulated.asObservable();
      case 'DEMO':
      default:
        return this._segmentsDemo.asObservable();
    }
  }

  /** Pour compatibilité avec l'existant (segments200) */
  setSegments(points: TrackPoint[]) {
    switch (this._currentMode) {
      case 'REAL':
        this.setRealSegments(points); break;
      case 'DISCONNECTED':
        this.setSimulatedSegments(points); break;
      case 'DEMO':
      default:
        this.setDemoSegments(points); break;
    }
  }
} 