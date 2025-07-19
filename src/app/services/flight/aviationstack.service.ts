import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { map, catchError, retry } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { FlightData } from './models/flight.interface';

@Injectable({
  providedIn: 'root'
})
export class AviationstackService {
  private readonly API_URL = environment.aviationstack.baseUrl;
  private readonly API_KEY = environment.aviationstack.apiKey;
  private readonly MAX_RETRIES = 3;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private cache = new Map<string, { data: any, timestamp: number }>();

  constructor(private http: HttpClient) {}

  getFlightData(flightNumber: string): Observable<FlightData | null> {
    // Vérifier le cache
    const cachedData = this.getCachedData(flightNumber);
    if (cachedData) {
      return of(this.transformToFlightData(cachedData));
    }

    // Recherche sur les 15 derniers jours
    const now = new Date();
    const flightsRequests: Observable<any>[] = [];
    for (let i = 0; i < 15; i++) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      const params = new HttpParams()
        .set('access_key', this.API_KEY)
        .set('flight_iata', flightNumber)
        .set('flight_date', dateStr);
      flightsRequests.push(
        this.http.get(`${this.API_URL}/flights`, { params })
      );
    }

    // Exécute les requêtes en série jusqu'à trouver un vol complet
    return new Observable<FlightData | null>(observer => {
      const tryNext = (idx: number) => {
        if (idx >= flightsRequests.length) {
          observer.next(null);
          observer.complete();
          return;
        }
        flightsRequests[idx].pipe(
          catchError(() => of(null))
        ).subscribe(apiData => {
          const flight = this.findCompleteFlight(apiData);
          if (flight) {
            this.setCachedData(flightNumber, apiData);
            observer.next(this.transformToFlightData({ data: [flight] }));
            observer.complete();
          } else {
            tryNext(idx + 1);
          }
        });
      };
      tryNext(0);
    });
  }

  private findCompleteFlight(apiData: any): any | null {
    if (!apiData || !apiData.data || !apiData.data.length) return null;
    // Un vol complet a une arrivée ET un départ avec horaires effectifs
    return apiData.data.find((f: any) =>
      f.departure && f.arrival &&
      f.departure.actual && f.arrival.actual
    ) || null;
  }

  private transformToFlightData(apiData: any): FlightData | null {
    if (!apiData || !apiData.data || !apiData.data.length) {
      return null;
    }
    const flight = apiData.data[0];
    return {
      flightNumber: flight.flight?.iata || '',
      airline: flight.airline?.name || '',
      departure: {
        code: flight.departure?.iata || '',
        name: flight.departure?.airport || '',
        latitude: flight.departure?.latitude || 0,
        longitude: flight.departure?.longitude || 0,
        scheduledTime: flight.departure?.scheduled || ''
      },
      arrival: {
        code: flight.arrival?.iata || '',
        name: flight.arrival?.airport || '',
        latitude: flight.arrival?.latitude || 0,
        longitude: flight.arrival?.longitude || 0,
        scheduledTime: flight.arrival?.scheduled || ''
      },
      waypoints: [],
      currentPosition: flight.live ? {
        latitude: flight.live.latitude || 0,
        longitude: flight.live.longitude || 0,
        heading: flight.live.heading || 0,
        altitude: flight.live.altitude || 0
      } : undefined,
      statistics: {
        onTimePercentage: 0,
        averageDelay: 0
      }
    };
  }

  private getCachedData(flightNumber: string): any {
    const cached = this.cache.get(flightNumber);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }
    return null;
  }

  private setCachedData(flightNumber: string, data: any): void {
    this.cache.set(flightNumber, {
      data,
      timestamp: Date.now()
    });
  }

  clearCache(flightNumber?: string): void {
    if (flightNumber) {
      this.cache.delete(flightNumber);
    } else {
      this.cache.clear();
    }
  }
} 