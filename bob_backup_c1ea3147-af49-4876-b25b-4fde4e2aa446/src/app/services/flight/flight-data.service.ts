import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Storage } from '@ionic/storage-angular';
import { FlightData, AirportInfo, RouteData, FlightStatistics } from './models/flight.interface';
import { Observable, from, of, throwError, Subscription } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { FlightAwareService } from './flightaware.service';
import { FlightMapService } from './flight-map.service';
import { OpenSkyService } from './opensky.service';

@Injectable({
  providedIn: 'root'
})
export class FlightDataService {
  private cache = new Map<string, {
    data: FlightData,
    timestamp: number
  }>();
  
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private readonly STORAGE_KEY = 'flight_data_cache';
  private trackingSubscription?: Subscription;

  constructor(
    private http: HttpClient,
    private storage: Storage,
    private flightAwareService: FlightAwareService,
    private flightMapService: FlightMapService,
    private openSkyService: OpenSkyService
  ) {
    this.initStorage();
  }

  private async initStorage() {
    await this.storage.create();
    // Charger le cache depuis le stockage local
    const cachedData = await this.storage.get(this.STORAGE_KEY);
    if (cachedData) {
      this.cache = new Map(JSON.parse(cachedData));
    }
  }

  private async saveCache() {
    await this.storage.set(this.STORAGE_KEY, JSON.stringify(Array.from(this.cache.entries())));
  }

  getFlightData(flightNumber: string): Observable<FlightData> {
    // Vérifier le cache local
    const cachedData = this.getCachedData(flightNumber);
    if (cachedData) {
      return of(cachedData);
    }

    // Récupérer les données de FlightAware
    return this.flightAwareService.getFlightData(flightNumber).pipe(
      switchMap(flightData => {
        // Mettre à jour la carte avec les nouvelles données
        this.flightMapService.updateFlightData(flightData);
        
        // Mettre en cache les données
        this.setCachedData(flightNumber, flightData);
        
        return of(flightData);
      }),
      catchError(error => {
        console.error('Error in FlightDataService:', error);
        return throwError(() => new Error('Failed to fetch flight data'));
      })
    );
  }

  startTracking(flightNumber: string, icao24: string): Observable<FlightData> {
    // Arrêter le suivi précédent s'il existe
    this.stopTracking();

    // Démarrer le nouveau suivi
    this.trackingSubscription = this.openSkyService.startTracking(icao24)
      .subscribe(position => {
        if (position) {
          const cachedData = this.getCachedData(flightNumber);
          if (cachedData) {
            const updatedData = this.openSkyService.updateFlightDataWithPosition(cachedData, position);
            this.flightMapService.updateFlightData(updatedData);
            this.setCachedData(flightNumber, updatedData);
          }
        }
      });

    return this.getFlightData(flightNumber);
  }

  stopTracking(): void {
    if (this.trackingSubscription) {
      this.trackingSubscription.unsubscribe();
      this.trackingSubscription = undefined;
    }
  }

  private getCachedData(flightNumber: string): FlightData | null {
    try {
      const cached = localStorage.getItem(`${this.STORAGE_KEY}_${flightNumber}`);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < this.CACHE_DURATION) {
          return data;
        }
      }
    } catch (error) {
      console.error('Error reading from cache:', error);
    }
    return null;
  }

  private setCachedData(flightNumber: string, data: FlightData): void {
    try {
      const cacheData = {
        data,
        timestamp: Date.now()
      };
      localStorage.setItem(`${this.STORAGE_KEY}_${flightNumber}`, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Error writing to cache:', error);
    }
  }

  clearCache(flightNumber?: string): void {
    if (flightNumber) {
      localStorage.removeItem(`${this.STORAGE_KEY}_${flightNumber}`);
    } else {
      // Supprimer tous les éléments du cache
      Object.keys(localStorage)
        .filter(key => key.startsWith(this.STORAGE_KEY))
        .forEach(key => localStorage.removeItem(key));
    }
  }

  // Méthode pour mettre à jour les données en temps réel
  updateFlightData(flightNumber: string): Observable<FlightData> {
    return this.getFlightData(flightNumber).pipe(
      map(flightData => {
        // Mettre à jour la carte
        this.flightMapService.updateFlightData(flightData);
        return flightData;
      })
    );
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
    // TODO: Implémenter l'appel à l'API OpenSky
    return of({
      waypoints: [
        { lat: 46.2381, lon: 6.1080, altitude: 0, timestamp: '2024-01-01T10:00:00Z' },
        { lat: 45.0, lon: 10.0, altitude: 35000, timestamp: '2024-01-01T11:00:00Z' },
        { lat: 37.9364, lon: 23.9445, altitude: 0, timestamp: '2024-01-01T13:00:00Z' }
      ],
      averageDuration: 180 // minutes
    });
  }

  private calculateStatistics(historicalData: any): FlightStatistics {
    return {
      onTimePercentage: historicalData.onTimePercentage,
      averageDelay: 15, // Calculé à partir des données historiques
      mostCommonDelays: historicalData.delays
    };
  }

  // Méthode pour forcer la mise à jour des données
  async refreshFlightData(flightNumber: string): Promise<FlightData> {
    this.cache.delete(flightNumber);
    return this.getFlightData(flightNumber).toPromise();
  }
} 