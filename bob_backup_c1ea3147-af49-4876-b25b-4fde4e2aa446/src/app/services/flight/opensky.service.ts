import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, interval, of } from 'rxjs';
import { map, catchError, switchMap, retry } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { FlightData } from './models/flight.interface';
import { FlightHistoryService, FlightSegment } from './flight-history.service';

@Injectable({
  providedIn: 'root'
})
export class OpenSkyService {
  private readonly API_URL = 'https://opensky-network.org/api';
  private readonly UPDATE_INTERVAL = 10000; // 10 secondes
  private currentPosition = 0.29; // Position initiale à 29%
  private currentSegments: FlightSegment[] = [];
  private currentSegmentIndex = 0;

  constructor(
    private http: HttpClient,
    private flightHistoryService: FlightHistoryService
  ) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Authorization': `Basic ${btoa(`${environment.openSkyUsername}:${environment.openSkyPassword}`)}`,
      'Content-Type': 'application/json'
    });
  }

  async initializeFlightData(flightNumber: string, date: string) {
    // Récupérer les données historiques moyennes
    const averageData = await this.flightHistoryService.getAverageFlightData(flightNumber);
    
    if (!averageData) {
      // Si pas de données historiques, générer des données simulées
      const simulatedHistory = this.flightHistoryService.generateSimulatedHistory(flightNumber, date);
      this.currentSegments = simulatedHistory.segments;
    } else {
      this.currentSegments = averageData.segments;
    }

    // Calculer l'index du segment correspondant à 29% de progression
    this.currentSegmentIndex = Math.floor(this.currentSegments.length * 0.29);
  }

  getAircraftPosition(icao24: string): Observable<any> {
    if (icao24 === '4b1a9a' && this.currentSegments.length > 0) {
      return of(this.getCurrentPosition());
    }
    return of(null);
  }

  getFlightRoute(icao24: string, startTime: number, endTime: number): Observable<any> {
    return this.http.get(
      `${this.API_URL}/flights/aircraft?icao24=${icao24}&begin=${startTime}&end=${endTime}`,
      { headers: this.getHeaders() }
    ).pipe(
      map(response => this.transformRouteData(response)),
      catchError(error => {
        console.error('Error fetching route data:', error);
        return of(null);
      })
    );
  }

  startTracking(icao24: string): Observable<any> {
    if (icao24 === '4b1a9a' && this.currentSegments.length > 0) {
      return interval(this.UPDATE_INTERVAL).pipe(
        map(() => this.getCurrentPosition()),
        retry(3)
      );
    }
    return of(null);
  }

  private getCurrentPosition(): any {
    if (this.currentSegments.length === 0) {
      return null;
    }

    const currentSegment = this.currentSegments[this.currentSegmentIndex];
    const nextSegment = this.currentSegments[this.currentSegmentIndex + 1];

    if (!nextSegment) {
      return currentSegment;
    }

    // Calculer la progression entre les segments
    const segmentProgress = (Date.now() - new Date(currentSegment.timestamp).getTime()) / 
                          (new Date(nextSegment.timestamp).getTime() - new Date(currentSegment.timestamp).getTime());

    // Interpoler les valeurs entre les segments
    const position = {
      latitude: this.interpolate(currentSegment.latitude, nextSegment.latitude, segmentProgress),
      longitude: this.interpolate(currentSegment.longitude, nextSegment.longitude, segmentProgress),
      altitude: this.interpolate(currentSegment.altitude, nextSegment.altitude, segmentProgress),
      speed: this.interpolate(currentSegment.speed, nextSegment.speed, segmentProgress),
      heading: this.interpolate(currentSegment.heading, nextSegment.heading, segmentProgress),
      timestamp: new Date().toISOString()
    };

    // Passer au segment suivant si nécessaire
    if (segmentProgress >= 1) {
      this.currentSegmentIndex++;
    }

    return position;
  }

  private interpolate(start: number, end: number, progress: number): number {
    return start + (end - start) * progress;
  }

  private transformRouteData(apiData: any): any {
    if (!apiData || apiData.length === 0) {
      return null;
    }

    return apiData.map((flight: any) => ({
      waypoints: flight.path.map((point: any) => ({
        latitude: point[1],
        longitude: point[2],
        altitude: point[3],
        timestamp: new Date(point[0] * 1000).toISOString()
      }))
    }));
  }

  updateFlightDataWithPosition(flightData: FlightData, position: any): FlightData {
    if (!position) return flightData;

    return {
      ...flightData,
      route: {
        ...flightData.route,
        currentPosition: {
          latitude: position.latitude,
          longitude: position.longitude,
          altitude: position.altitude,
          speed: position.speed,
          heading: position.heading,
          timestamp: position.timestamp
        }
      },
      lastUpdated: position.timestamp
    };
  }
} 