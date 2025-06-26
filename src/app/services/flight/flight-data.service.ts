import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Storage } from '@ionic/storage-angular';
import { FlightData, AirportInfo, Waypoint, RouteData, FlightStatistics } from './models/flight-data.interface';
import { Observable, from, of, throwError, Subscription, interval, forkJoin, timer } from 'rxjs';
import { map, catchError, switchMap, tap } from 'rxjs/operators';
import { FR24Service } from './fr24.service';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FlightDataService {
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private flightDataCache: Map<string, { data: FlightData; timestamp: number }> = new Map();
  private trackingSubscription?: Subscription;

  constructor(
    private http: HttpClient,
    private storage: Storage,
    private fr24Service: FR24Service
  ) {
    this.initStorage();
  }

  private async initStorage() {
    await this.storage.create();
    const cachedData = await this.storage.get('flight_data_cache');
    if (cachedData) {
      this.flightDataCache = new Map(JSON.parse(cachedData));
    }
  }

  private async saveCache() {
    await this.storage.set('flight_data_cache', JSON.stringify(Array.from(this.flightDataCache.entries())));
  }

  /**
   * Récupère le dernier vol achevé d'un numéro donné via FlightRadar24
   */
  getLastCompletedFlight(flightNumber: string): Observable<FlightData> {
    return this.fr24Service.getLastCompletedFlight(flightNumber);
  }

  getFlightData(flightNumber: string): Observable<FlightData> {
    const cachedData = this.getCachedFlightData(flightNumber);
    if (cachedData) {
      return of(cachedData);
    }

    return this.fr24Service.getFlightData(flightNumber).pipe(
      tap(data => this.cacheFlightData(flightNumber, data)),
      catchError(error => {
        console.error('Error fetching flight data:', error);
        return throwError(() => error);
      })
    );
  }

  private getCachedFlightData(flightNumber: string): FlightData | null {
    const cached = this.flightDataCache.get(flightNumber);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }
    return null;
  }

  private cacheFlightData(flightNumber: string, data: FlightData): void {
    this.flightDataCache.set(flightNumber, {
      data,
      timestamp: Date.now()
    });
  }

  getFlightStatus(flightNumber: string): Observable<string> {
    return this.getFlightData(flightNumber).pipe(
      map(flightData => flightData?.status.type || 'UNKNOWN'),
      catchError(() => of('UNKNOWN'))
    );
  }

  getFlightRoute(flightNumber: string): Observable<any> {
    return this.getFlightData(flightNumber).pipe(
      map(flightData => flightData?.route),
      catchError(() => of(null))
    );
  }

  getAircraftInfo(flightNumber: string): Observable<any> {
    return this.getFlightData(flightNumber).pipe(
      map(flightData => flightData?.aircraft || null),
      catchError(() => of(null))
    );
  }

  startRealTimeUpdates(flightNumber: string): Observable<FlightData> {
    return timer(0, 10000).pipe( // Update every 10 seconds
      switchMap(() => this.getFlightData(flightNumber))
    );
  }

  stopTracking(): void {
    if (this.trackingSubscription) {
      this.trackingSubscription.unsubscribe();
      this.trackingSubscription = undefined;
    }
  }

  clearCache(flightNumber?: string): void {
    if (flightNumber) {
      this.flightDataCache.delete(flightNumber);
    } else {
      this.flightDataCache.clear();
    }
    this.saveCache();
  }

  // Méthode pour mettre à jour les données en temps réel
  updateFlightData(flightNumber: string): Observable<FlightData> {
    return this.getFlightData(flightNumber);
  }

  private getBasicFlightInfo(flightNumber: string): Observable<Partial<FlightData>> {
    // TODO: Implémenter l'appel à l'API FlightAware
    return of({
      flightNumber,
      airline: 'Swiss',
      departure: {
        code: 'GVA',
        name: 'Genève',
        terminal: '1',
        gate: 'A1',
        scheduledTime: '10:00',
        averageDelay: 15,
        baggageClaim: '3'
      },
      arrival: {
        code: 'ATH',
        name: 'Athènes',
        terminal: '2',
        gate: 'B2',
        scheduledTime: '13:00',
        averageDelay: 10,
        baggageClaim: '4'
      }
    });
  }

  private getHistoricalData(flightNumber: string): Observable<any> {
    // TODO: Implémenter l'appel à l'API AviationStack
    return of({
      delays: [
        { reason: 'Météo', frequency: 30 },
        { reason: 'Trafic', frequency: 20 }
      ],
      onTimePercentage: 85
    });
  }

  private getRouteData(flightNumber: string): Observable<RouteData> {
    return of({
      distance: 0,
      averageDuration: 180, // minutes
      waypoints: [
        { latitude: 46.2381, longitude: 6.1080, altitude: 0, speed: 0, heading: 0, timestamp: '2024-01-01T10:00:00Z' },
        { latitude: 45.0, longitude: 10.0, altitude: 35000, speed: 0, heading: 0, timestamp: '2024-01-01T11:00:00Z' },
        { latitude: 37.9364, longitude: 23.9445, altitude: 0, speed: 0, heading: 0, timestamp: '2024-01-01T13:00:00Z' }
      ]
    });
  }

  private calculateStatistics(historicalData: any): FlightStatistics {
    return {
      onTimePercentage: historicalData.onTimePercentage,
      averageDelay: 15, // Calculé à partir des données historiques
      mostCommonDelays: historicalData.delays,
      totalFlights: 0,
      cancelledFlights: 0,
      divertedFlights: 0
    };
  }

  // Méthode pour forcer la mise à jour des données
  async refreshFlightData(flightNumber: string): Promise<FlightData> {
    this.flightDataCache.delete(flightNumber);
    const data = await this.getFlightData(flightNumber).toPromise();
    if (!data) throw new Error('Failed to get flight data');
    return data;
  }

  ngOnDestroy() {
    if (this.trackingSubscription) {
      this.trackingSubscription.unsubscribe();
    }
  }
} 