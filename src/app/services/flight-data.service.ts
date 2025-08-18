import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { LoggerService } from './logger.service';

@Injectable({
  providedIn: 'root'
})
export class FlightDataService {
  private apiKey = environment.aviationStackApiKey;
  private baseUrl = 'http://api.aviationstack.com/v1';

  constructor(
    private http: HttpClient,
    private logger: LoggerService
  ) {}

  getFlightInfo(flightNumber: string): Observable<any> {
    const startTime = Date.now();
    const requestId = this.logger.generateRequestId();
    
    this.logger.info('FlightData', `Recherche d'informations de vol: ${flightNumber}`, {
      requestId,
      flightNumber,
      apiKey: this.apiKey ? 'Présent' : 'Manquant'
    });

    if (!this.apiKey) {
      this.logger.error('FlightData', 'Clé API AviationStack manquante', { requestId });
      return throwError(() => new Error('Clé API AviationStack manquante'));
    }

    const url = `${this.baseUrl}/flights?access_key=${this.apiKey}&flight_iata=${flightNumber}`;
    
    return this.http.get(url).pipe(
      tap(response => {
        this.logger.performance('FlightData', `getFlightInfo_${flightNumber}`, startTime);
        this.logger.info('FlightData', `Réponse reçue pour ${flightNumber}`, {
          requestId,
          responseSize: JSON.stringify(response).length,
          hasData: !!response
        });
      }),
      map(response => {
        if (response && response.data && response.data.length > 0) {
          this.logger.info('FlightData', `Vol trouvé: ${flightNumber}`, {
            requestId,
            flightCount: response.data.length
          });
          return response.data[0];
        } else {
          this.logger.warn('FlightData', `Aucun vol trouvé: ${flightNumber}`, { requestId });
          return null;
        }
      }),
      catchError(error => {
        this.logger.requestError('FlightData', 'GET', url, error, requestId, { startTime });
        return throwError(() => error);
      })
    );
  }

  getAirportInfo(airportCode: string): Observable<any> {
    const startTime = Date.now();
    const requestId = this.logger.generateRequestId();
    
    this.logger.info('FlightData', `Recherche d'informations d'aéroport: ${airportCode}`, {
      requestId,
      airportCode
    });

    if (!this.apiKey) {
      this.logger.error('FlightData', 'Clé API AviationStack manquante pour recherche aéroport', { requestId });
      return throwError(() => new Error('Clé API AviationStack manquante'));
    }

    const url = `${this.baseUrl}/airports?access_key=${this.apiKey}&iata_code=${airportCode}`;
    
    return this.http.get(url).pipe(
      tap(response => {
        this.logger.performance('FlightData', `getAirportInfo_${airportCode}`, startTime);
        this.logger.info('FlightData', `Réponse aéroport reçue pour ${airportCode}`, {
          requestId,
          responseSize: JSON.stringify(response).length
        });
      }),
      map(response => {
        if (response && response.data && response.data.length > 0) {
          this.logger.info('FlightData', `Aéroport trouvé: ${airportCode}`, { requestId });
          return response.data[0];
        } else {
          this.logger.warn('FlightData', `Aucun aéroport trouvé: ${airportCode}`, { requestId });
          return null;
        }
      }),
      catchError(error => {
        this.logger.requestError('FlightData', 'GET', url, error, requestId, { startTime });
        return throwError(() => error);
      })
    );
  }

  getAircraftInfo(aircraftCode: string): Observable<any> {
    const startTime = Date.now();
    const requestId = this.logger.generateRequestId();
    
    this.logger.info('FlightData', `Recherche d'informations d'avion: ${aircraftCode}`, {
      requestId,
      aircraftCode
    });

    if (!this.apiKey) {
      this.logger.error('FlightData', 'Clé API AviationStack manquante pour recherche avion', { requestId });
      return throwError(() => new Error('Clé API AviationStack manquante'));
    }

    const url = `${this.baseUrl}/airplanes?access_key=${this.apiKey}&iata_code=${aircraftCode}`;
    
    return this.http.get(url).pipe(
      tap(response => {
        this.logger.performance('FlightData', `getAircraftInfo_${aircraftCode}`, startTime);
        this.logger.info('FlightData', `Réponse avion reçue pour ${aircraftCode}`, {
          requestId,
          responseSize: JSON.stringify(response).length
        });
      }),
      map(response => {
        if (response && response.data && response.data.length > 0) {
          this.logger.info('FlightData', `Avion trouvé: ${aircraftCode}`, { requestId });
          return response.data[0];
        } else {
          this.logger.warn('FlightData', `Aucun avion trouvé: ${aircraftCode}`, { requestId });
          return null;
        }
      }),
      catchError(error => {
        this.logger.requestError('FlightData', 'GET', url, error, requestId, { startTime });
        return throwError(() => error);
      })
    );
  }

  // Méthode pour simuler des données de vol (pour les tests)
  getMockFlightData(flightNumber: string): Observable<any> {
    this.logger.info('FlightData', `Utilisation de données mock pour: ${flightNumber}`);
    
    const mockData = {
      flight: {
        number: flightNumber,
        iata: flightNumber,
        icao: `MOCK${flightNumber}`,
        codeshared: null
      },
      departure: {
        airport: 'CDG',
        timezone: 'Europe/Paris',
        scheduled: new Date().toISOString(),
        estimated: new Date().toISOString(),
        actual: null,
        terminal: '2F',
        gate: 'A12'
      },
      arrival: {
        airport: 'JFK',
        timezone: 'America/New_York',
        scheduled: new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString(),
        estimated: new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString(),
        actual: null,
        terminal: '8',
        gate: 'B15'
      },
      airline: {
        name: 'Mock Airlines',
        iata: 'MA',
        icao: 'MOCK'
      },
      aircraft: {
        registration: 'F-MOCK',
        iata: 'A320',
        icao: 'A320'
      },
      status: 'scheduled'
    };

    this.logger.info('FlightData', `Données mock générées pour ${flightNumber}`, {
      mockDataSize: JSON.stringify(mockData).length
    });

    return of(mockData);
  }
} 