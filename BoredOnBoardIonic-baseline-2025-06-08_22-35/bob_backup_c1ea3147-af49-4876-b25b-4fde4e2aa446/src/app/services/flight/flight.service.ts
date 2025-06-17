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
        aircraft: {
          registration: 'HB-JHB',
          type: 'Airbus A320-214',
          icao24: '4b1a9a'
        },
        route: {
          departure: {
            airport: 'LSGG',
            city: 'Genève',
            country: 'Suisse',
            scheduledTime: '10:00',
            actualTime: '10:00',
            terminal: '1',
            gate: 'A1'
          },
          arrival: {
            airport: 'LGAV',
            city: 'Athènes',
            country: 'Grèce',
            scheduledTime: '13:30',
            actualTime: '13:30',
            terminal: '2',
            gate: 'B12'
          },
          currentPosition: {
            latitude: 46.2381,
            longitude: 6.1080,
            altitude: 0,
            speed: 0,
            heading: 0,
            timestamp: new Date().toISOString()
          }
        },
        status: 'En vol',
        lastUpdated: new Date().toISOString()
      });
    }

    // Pour les autres vols, faire une requête à l'API
    return this.http.get<any>(`${environment.apiUrl}/flights/${flightNumber}/${date}`).pipe(
      map(response => this.transformFlightData(response)),
      catchError(error => {
        console.error('Error fetching flight data:', error);
        return of(null);
      })
    );
  }

  private transformFlightData(apiData: any): FlightData {
    if (!apiData) {
      return null;
    }

    return {
      flightNumber: apiData.flightNumber,
      airline: apiData.airline,
      aircraft: {
        registration: apiData.aircraft.registration,
        type: apiData.aircraft.type,
        icao24: apiData.aircraft.icao24
      },
      route: {
        departure: {
          airport: apiData.route.departure.airport,
          city: apiData.route.departure.city,
          country: apiData.route.departure.country,
          scheduledTime: apiData.route.departure.scheduledTime,
          actualTime: apiData.route.departure.actualTime,
          terminal: apiData.route.departure.terminal,
          gate: apiData.route.departure.gate
        },
        arrival: {
          airport: apiData.route.arrival.airport,
          city: apiData.route.arrival.city,
          country: apiData.route.arrival.country,
          scheduledTime: apiData.route.arrival.scheduledTime,
          actualTime: apiData.route.arrival.actualTime,
          terminal: apiData.route.arrival.terminal,
          gate: apiData.route.arrival.gate
        },
        currentPosition: apiData.route.currentPosition
      },
      status: apiData.status,
      lastUpdated: apiData.lastUpdated
    };
  }
} 