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

  getFlightData(flightNumber: string): Observable<FlightData> {
    // Vérifier le cache
    const cachedData = this.getCachedData(flightNumber);
    if (cachedData) {
      return of(this.transformToFlightData(cachedData));
    }

    // Construire les paramètres de requête
    const params = new HttpParams()
      .set('access_key', this.API_KEY)
      .set('flight_iata', flightNumber);

    return this.http.get(`${this.API_URL}/flights`, { params }).pipe(
      retry(this.MAX_RETRIES),
      map(response => {
        const flightData = this.transformToFlightData(response);
        this.setCachedData(flightNumber, response);
        return flightData;
      }),
      catchError(error => {
        console.error('Error fetching flight data from Aviationstack:', error);
        return throwError(() => new Error('Failed to fetch flight data'));
      })
    );
  }

  private transformToFlightData(apiData: any): FlightData {
    const flight = apiData.data[0];
    return {
      flightNumber: flight.flight.iata,
      airline: flight.airline.name,
      aircraft: {
        registration: flight.aircraft?.registration || '',
        type: flight.aircraft?.iata || '',
        icao24: flight.aircraft?.icao24 || '',
        manufacturer: flight.aircraft?.manufacturer,
        model: flight.aircraft?.model
      },
      route: {
        departure: {
          airport: flight.departure.iata,
          city: flight.departure.city,
          country: flight.departure.country,
          scheduledTime: flight.departure.scheduled,
          actualTime: flight.departure.actual,
          terminal: flight.departure.terminal,
          gate: flight.departure.gate,
          estimatedBlockoutTime: flight.departure.estimated,
          actualBlockoutTime: flight.departure.actual,
          delayMinutes: flight.departure.delay,
          status: this.mapFlightStatus(flight.departure.status)
        },
        arrival: {
          airport: flight.arrival.iata,
          city: flight.arrival.city,
          country: flight.arrival.country,
          scheduledTime: flight.arrival.scheduled,
          actualTime: flight.arrival.actual,
          terminal: flight.arrival.terminal,
          gate: flight.arrival.gate,
          estimatedBlockinTime: flight.arrival.estimated,
          actualBlockinTime: flight.arrival.actual,
          delayMinutes: flight.arrival.delay,
          status: this.mapFlightStatus(flight.arrival.status),
          baggageClaim: flight.arrival.baggage
        },
        currentPosition: flight.live ? {
          latitude: flight.live.latitude || 0,
          longitude: flight.live.longitude || 0,
          altitude: flight.live.altitude || 0,
          speed: flight.live.speed || 0,
          heading: flight.live.heading || 0,
          timestamp: flight.live.updated || new Date().toISOString()
        } : { latitude: 0, longitude: 0, altitude: 0, speed: 0, heading: 0, timestamp: '' },
        distance: {
          kilometers: flight.distance || 0,
          miles: (flight.distance || 0) * 0.621371
        },
        duration: {
          scheduledMinutes: this.calculateDuration(
            flight.departure.scheduled,
            flight.arrival.scheduled
          ),
          actualMinutes: flight.arrival.actual ? 
            this.calculateDuration(
              flight.departure.actual,
              flight.arrival.actual
            ) : undefined
        },
        waypoints: []
      },
      status: this.mapFlightStatus(flight.flight_status),
      lastUpdated: flight.live?.updated || new Date().toISOString(),
      codeshares: flight.flight.codeshared?.map((cs: any) => cs.flight_iata),
      waypoints: [] // À remplir avec les données de trajectoire d'OpenSky
    };
  }

  private mapFlightStatus(status: string): { type: 'ON_TIME' | 'DELAYED' | 'CANCELLED' | 'DIVERTED'; description: string } {
    switch (status?.toUpperCase()) {
      case 'DELAYED':
        return { type: 'DELAYED', description: 'Retardé' };
      case 'CANCELLED':
        return { type: 'CANCELLED', description: 'Annulé' };
      case 'DIVERTED':
        return { type: 'DIVERTED', description: 'Détourné' };
      case 'ON_TIME':
      default:
        return { type: 'ON_TIME', description: 'À l\'heure' };
    }
  }

  private calculateDuration(departure: string, arrival: string): number {
    const dep = new Date(departure);
    const arr = new Date(arrival);
    return Math.round((arr.getTime() - dep.getTime()) / (1000 * 60));
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