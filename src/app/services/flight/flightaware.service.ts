import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, from, of, throwError } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { FlightData, FlightStatus, RouteInfo } from './models/flight.interface';
import { environment } from '../../../environments/environment';

const DEFAULT_API_URL = environment.flightawareApiUrl || 'https://aeroapi.flightaware.com/aeroapi';
const DEFAULT_CACHE_DURATION = environment.flightawareCacheDuration || 5 * 60 * 1000; // 5 minutes

@Injectable({
  providedIn: 'root'
})
export class FlightAwareService {
  private readonly API_URL = DEFAULT_API_URL;
  private readonly CACHE_DURATION = DEFAULT_CACHE_DURATION;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'x-apikey': environment.flightRadar24ApiKey,
    });
  }

  private getCachedData(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }
    return null;
  }

  private setCachedData(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  getFlightData(flightNumber: string): Observable<FlightData> {
    return this.http.get<any>(`${this.API_URL}/flights/${flightNumber}`).pipe(
      map(response => {
        const flight = response.data[0];
        return {
          flightNumber: flight.flight_number,
          airline: flight.airline.name,
          aircraft: {
            type: flight.aircraft.type,
            registration: flight.aircraft.registration,
            age: flight.aircraft.age,
            icao24: flight.aircraft.icao24
          },
          route: {
            departure: {
              airport: flight.departure.code,
              city: flight.departure.city,
              country: flight.departure.country,
              scheduledTime: flight.departure.scheduled,
              actualTime: flight.departure.actual,
              terminal: flight.departure.terminal,
              gate: flight.departure.gate,
              status: {
                type: this.mapFlightStatus(flight.departure.status),
                description: flight.departure.status
              },
              location: {
                latitude: flight.departure.latitude,
                longitude: flight.departure.longitude
              }
            },
            arrival: {
              airport: flight.arrival.code,
              city: flight.arrival.city,
              country: flight.arrival.country,
              scheduledTime: flight.arrival.scheduled,
              actualTime: flight.arrival.actual,
              terminal: flight.arrival.terminal,
              gate: flight.arrival.gate,
              status: {
                type: this.mapFlightStatus(flight.arrival.status),
                description: flight.arrival.status
              },
              location: {
                latitude: flight.arrival.latitude,
                longitude: flight.arrival.longitude
              }
            },
            currentPosition: {
              latitude: flight.live?.latitude || 0,
              longitude: flight.live?.longitude || 0,
              altitude: flight.live?.altitude || 0,
              speed: flight.live?.speed || 0,
              heading: flight.live?.heading || 0,
              timestamp: flight.live?.updated || new Date().toISOString()
            },
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
          status: {
            type: this.mapFlightStatus(flight.status),
            description: flight.status
          },
          lastUpdated: flight.live?.updated || new Date().toISOString(),
          codeshares: flight.codeshares || [],
          waypoints: []
        };
      }),
      catchError(error => {
        console.error('Error fetching flight data from FlightAware:', error);
        return throwError(() => new Error('Failed to fetch flight data'));
      })
    );
  }

  private getAirportData(airportCode: string): Observable<any> {
    const cacheKey = `airport_${airportCode}`;
    const cachedData = this.getCachedData(cacheKey);
    
    if (cachedData) {
      return of(cachedData);
    }

    return this.http.get(`${this.API_URL}/airports/${airportCode}`, {
      headers: this.getHeaders()
    }).pipe(
      map(response => {
        this.setCachedData(cacheKey, response);
        return response;
      }),
      catchError(error => {
        console.error('Error fetching airport data:', error);
        return of({});
      })
    );
  }

  private transformRouteData(apiData: any): RouteInfo {
    return {
      departure: {
        airport: apiData.departure.code,
        city: apiData.departure.city,
        country: apiData.departure.country,
        scheduledTime: apiData.departure.scheduled,
        actualTime: apiData.departure.actual,
        terminal: apiData.departure.terminal,
        gate: apiData.departure.gate,
        status: {
          type: this.mapFlightStatus(apiData.departure.status),
          description: apiData.departure.status
        },
        location: {
          latitude: apiData.departure.latitude,
          longitude: apiData.departure.longitude
        }
      },
      arrival: {
        airport: apiData.arrival.code,
        city: apiData.arrival.city,
        country: apiData.arrival.country,
        scheduledTime: apiData.arrival.scheduled,
        actualTime: apiData.arrival.actual,
        terminal: apiData.arrival.terminal,
        gate: apiData.arrival.gate,
        status: {
          type: this.mapFlightStatus(apiData.arrival.status),
          description: apiData.arrival.status
        },
        location: {
          latitude: apiData.arrival.latitude,
          longitude: apiData.arrival.longitude
        }
      },
      currentPosition: {
        latitude: apiData.live?.latitude || 0,
        longitude: apiData.live?.longitude || 0,
        altitude: apiData.live?.altitude || 0,
        speed: apiData.live?.speed || 0,
        heading: apiData.live?.heading || 0,
        timestamp: apiData.live?.updated || new Date().toISOString()
      },
      distance: {
        kilometers: apiData.distance || 0,
        miles: (apiData.distance || 0) * 0.621371
      },
      duration: {
        scheduledMinutes: this.calculateDuration(
          apiData.departure.scheduled,
          apiData.arrival.scheduled
        ),
        actualMinutes: apiData.arrival.actual ? 
          this.calculateDuration(
            apiData.departure.actual,
            apiData.arrival.actual
          ) : undefined
      },
      waypoints: []
    };
  }

  clearCache(): void {
    this.cache.clear();
  }

  clearFlightCache(flightNumber: string): void {
    this.cache.delete(`flight_${flightNumber}`);
  }

  private mapFlightStatus(status: string): 'ON_TIME' | 'DELAYED' | 'CANCELLED' | 'DIVERTED' {
    switch (status?.toUpperCase()) {
      case 'DELAYED':
        return 'DELAYED';
      case 'CANCELLED':
        return 'CANCELLED';
      case 'DIVERTED':
        return 'DIVERTED';
      case 'ON_TIME':
      default:
        return 'ON_TIME';
    }
  }

  private calculateDuration(departure: string, arrival: string): number {
    const dep = new Date(departure);
    const arr = new Date(arrival);
    return Math.round((arr.getTime() - dep.getTime()) / (1000 * 60));
  }
} 