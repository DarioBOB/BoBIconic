import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, from, of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { FlightData } from './models/flight.interface';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FlightAwareService {
  private readonly API_URL = 'https://aeroapi.flightaware.com/aeroapi';
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private cache: Map<string, { data: any; timestamp: number }> = new Map();

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'x-apikey': environment.flightAwareApiKey,
      'Content-Type': 'application/json'
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
    // Simulation des données pour le vol LX 1820
    if (flightNumber === 'LX1820') {
      return of({
        flightNumber: 'LX1820',
        airline: 'Swiss International Air Lines',
        aircraft: {
          type: 'Airbus A320-214',
          registration: 'HB-IJQ',
          age: 8,
          icao24: '4b1a9a' // Code ICAO24 réel de l'avion
        },
        departure: {
          code: 'GVA',
          name: 'Aéroport International de Genève',
          scheduledTime: '2025-05-31T10:00:00Z',
          actualTime: '2025-05-31T10:15:00Z',
          terminal: '1',
          gate: 'A12',
          baggageClaim: '3',
          averageDelay: 15,
          location: {
            latitude: 46.2381,
            longitude: 6.1080
          },
          weather: {
            temperature: 22,
            conditions: 'Ensoleillé',
            windSpeed: 8,
            windDirection: 270
          }
        },
        arrival: {
          code: 'ATH',
          name: 'Aéroport International d\'Athènes Elefthérios-Venizélos',
          scheduledTime: '2025-05-31T13:45:00Z',
          actualTime: '2025-05-31T14:00:00Z',
          terminal: '2',
          gate: 'B15',
          baggageClaim: '4',
          averageDelay: 10,
          location: {
            latitude: 37.9364,
            longitude: 23.9445
          },
          weather: {
            temperature: 28,
            conditions: 'Dégagé',
            windSpeed: 12,
            windDirection: 180
          }
        },
        route: {
          distance: 1800,
          averageDuration: 180,
          waypoints: [
            {
              latitude: 46.2381,
              longitude: 6.1080,
              altitude: 0,
              timestamp: '2025-05-31T10:00:00Z'
            },
            {
              latitude: 45.0,
              longitude: 10.0,
              altitude: 35000,
              timestamp: '2025-05-31T11:00:00Z'
            },
            {
              latitude: 37.9364,
              longitude: 23.9445,
              altitude: 0,
              timestamp: '2025-05-31T13:45:00Z'
            }
          ]
        },
        statistics: {
          onTimePercentage: 85,
          averageDelay: 15,
          mostCommonDelays: [
            {
              reason: 'Météo',
              frequency: 30,
              averageDuration: 20
            },
            {
              reason: 'Trafic',
              frequency: 20,
              averageDuration: 15
            }
          ],
          totalFlights: 100,
          cancelledFlights: 2,
          divertedFlights: 1
        },
        status: {
          code: 'SCHEDULED',
          description: 'Vol à l\'heure',
          lastUpdate: '2025-05-31T09:00:00Z'
        },
        lastUpdated: '2025-05-31T09:00:00Z'
      });
    }

    // Pour les autres vols, retourner une erreur
    return of(null).pipe(
      map(() => {
        throw new Error('Vol non trouvé');
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

  private transformFlightData(apiData: any): FlightData {
    // Transformation des données de l'API en notre format FlightData
    return {
      flightNumber: apiData.flight_number,
      airline: apiData.operator?.name || 'Unknown',
      departure: {
        code: apiData.origin?.code || '',
        name: apiData.origin?.name || '',
        scheduledTime: apiData.scheduled_out || '',
        actualTime: apiData.actual_out || '',
        terminal: apiData.origin_terminal || '',
        gate: apiData.origin_gate || '',
        baggageClaim: '',
        averageDelay: 0
      },
      arrival: {
        code: apiData.destination?.code || '',
        name: apiData.destination?.name || '',
        scheduledTime: apiData.scheduled_in || '',
        actualTime: apiData.actual_in || '',
        terminal: apiData.destination_terminal || '',
        gate: apiData.destination_gate || '',
        baggageClaim: '',
        averageDelay: 0
      },
      route: {
        distance: apiData.distance || 0,
        averageDuration: apiData.estimated_duration || 0,
        waypoints: []
      },
      statistics: {
        onTimePercentage: 0,
        averageDelay: 0,
        mostCommonDelays: []
      }
    };
  }

  clearCache(): void {
    this.cache.clear();
  }

  clearFlightCache(flightNumber: string): void {
    this.cache.delete(`flight_${flightNumber}`);
  }
} 