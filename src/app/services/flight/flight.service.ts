import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { FlightData } from './models/flight.interface';

@Injectable({
  providedIn: 'root'
})
export class FlightService {
  constructor(private http: HttpClient) {}

  getFlightData(flightNumber: string, date: string): Observable<FlightData> {
    // Pour le vol LX 1820, retourner des données simulées
    if (flightNumber === 'LX 1820') {
      return of({
        flightNumber: 'LX 1820',
        airline: 'Swiss International Air Lines',
        departure: {
          code: 'LSGG',
          name: 'Genève',
          latitude: 46.2381,
          longitude: 6.1080,
          scheduledTime: '10:00'
        },
        arrival: {
          code: 'LGAV',
          name: 'Athènes',
          latitude: 37.9364,
          longitude: 23.9475,
          scheduledTime: '13:30'
        },
        waypoints: [],
        currentPosition: {
          latitude: 46.2381,
          longitude: 6.1080,
          heading: 90,
          altitude: 35000
        },
        statistics: {
          onTimePercentage: 92,
          averageDelay: 7
        }
      });
    }

    // Pour les autres vols, faire une requête à l'API
    return this.http.get<any>(`${environment.apiUrl}/flights/${flightNumber}/${date}`).pipe(
      map(response => this.transformFlightData(response)),
      catchError(error => {
        console.error('Error fetching flight data:', error);
        // Retourner un objet vide conforme à FlightData
        return of({
          flightNumber: flightNumber,
          airline: '',
          departure: { code: '', name: '', latitude: 0, longitude: 0, scheduledTime: '' },
          arrival: { code: '', name: '', latitude: 0, longitude: 0, scheduledTime: '' },
          waypoints: [],
          statistics: { onTimePercentage: 0, averageDelay: 0 }
        });
      })
    );
  }

  private transformFlightData(apiData: any): FlightData {
    if (!apiData) {
      // Retourner un objet vide conforme à FlightData
      return {
        flightNumber: '',
        airline: '',
        departure: { code: '', name: '', latitude: 0, longitude: 0, scheduledTime: '' },
        arrival: { code: '', name: '', latitude: 0, longitude: 0, scheduledTime: '' },
        waypoints: [],
        statistics: { onTimePercentage: 0, averageDelay: 0 }
      };
    }
    return {
      flightNumber: apiData.flightNumber || '',
      airline: apiData.airline || '',
      departure: apiData.departure || { code: '', name: '', latitude: 0, longitude: 0, scheduledTime: '' },
      arrival: apiData.arrival || { code: '', name: '', latitude: 0, longitude: 0, scheduledTime: '' },
      waypoints: apiData.waypoints || [],
      currentPosition: apiData.currentPosition || undefined,
      statistics: apiData.statistics || { onTimePercentage: 0, averageDelay: 0 }
    };
  }
} 