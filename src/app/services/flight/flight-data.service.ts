import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Storage } from '@ionic/storage-angular';
import { FlightData, AirportInfo, Waypoint, RouteData, FlightStatistics } from './models/flight-data.interface';
import { Observable, from, of, throwError, Subscription, interval, forkJoin, timer } from 'rxjs';
import { map, catchError, switchMap, tap } from 'rxjs/operators';
import { FlightAwareService } from './flightaware.service';
import { FlightMapService } from './flight-map.service';
import { OpenSkyService } from './opensky.service';
import { environment } from '../../../environments/environment';
import { AviationstackService } from './aviationstack.service';
import { ApiKeyService } from '../api-key.service';

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
    private flightAwareService: FlightAwareService,
    private flightMapService: FlightMapService,
    private openSkyService: OpenSkyService,
    private aviationstackService: AviationstackService,
    private apiKeyService: ApiKeyService
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

  getFlightData(flightNumber: string): Observable<FlightData> {
    const cachedData = this.getCachedFlightData(flightNumber);
    if (cachedData) {
      return of(cachedData);
    }

    return this.aviationstackService.getFlightData(flightNumber).pipe(
      switchMap(aviationstackData => {
        if (!aviationstackData.aircraft.icao24) {
          return throwError(() => new Error('No ICAO24 code available for aircraft'));
        }

        return this.openSkyService.getTrajectory(aviationstackData.aircraft.icao24).pipe(
          map(trajectory => this.mergeFlightData(aviationstackData, trajectory))
        );
      }),
      tap(data => this.cacheFlightData(flightNumber, data)),
      catchError(error => {
        console.error('Error fetching flight data:', error);
        return throwError(() => error);
      })
    );
  }

  private mergeFlightData(aviationstackData: FlightData, trajectory: Waypoint[]): FlightData {
    // Ensure we have at least the departure and arrival points
    const waypoints: Waypoint[] = trajectory.length > 0 ? trajectory : [
      {
        latitude: aviationstackData.route.departure.location?.latitude || 0,
        longitude: aviationstackData.route.departure.location?.longitude || 0,
        altitude: 0,
        speed: 0,
        heading: 0,
        timestamp: aviationstackData.route.departure.scheduledTime
      },
      {
        latitude: aviationstackData.route.arrival.location?.latitude || 0,
        longitude: aviationstackData.route.arrival.location?.longitude || 0,
        altitude: 0,
        speed: 0,
        heading: 0,
        timestamp: aviationstackData.route.arrival.scheduledTime
      }
    ];

    const lastWaypoint = waypoints[waypoints.length - 1];

    // Calculate distance between departure and arrival airports
    const distance = this.calculateDistance(
      aviationstackData.route.departure.location?.latitude || 0,
      aviationstackData.route.departure.location?.longitude || 0,
      aviationstackData.route.arrival.location?.latitude || 0,
      aviationstackData.route.arrival.location?.longitude || 0
    );

    // Calculate duration based on scheduled times
    const scheduledDeparture = new Date(aviationstackData.route.departure.scheduledTime);
    const scheduledArrival = new Date(aviationstackData.route.arrival.scheduledTime);
    const scheduledMinutes = Math.round((scheduledArrival.getTime() - scheduledDeparture.getTime()) / (1000 * 60));

    // Calculate actual duration if available
    let actualMinutes: number | undefined;
    if (aviationstackData.route.departure.actualTime && aviationstackData.route.arrival.actualTime) {
      const actualDeparture = new Date(aviationstackData.route.departure.actualTime);
      const actualArrival = new Date(aviationstackData.route.arrival.actualTime);
      actualMinutes = Math.round((actualArrival.getTime() - actualDeparture.getTime()) / (1000 * 60));
    }

    return {
      ...aviationstackData,
      waypoints,
      route: {
        ...aviationstackData.route,
        currentPosition: {
          latitude: lastWaypoint.latitude,
          longitude: lastWaypoint.longitude,
          altitude: lastWaypoint.altitude,
          speed: lastWaypoint.speed,
          heading: lastWaypoint.heading,
          timestamp: lastWaypoint.timestamp
        },
        distance: {
          kilometers: distance,
          miles: distance * 0.621371 // Convert km to miles
        },
        duration: {
          scheduledMinutes,
          actualMinutes
        },
        waypoints
      }
    };
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
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
      switchMap(flightData => {
        if (!flightData?.aircraft.icao24) {
          return of(flightData?.aircraft);
        }

        return this.openSkyService.getAircraftInfo(flightData.aircraft.icao24).pipe(
          map(aircraftInfo => ({
            ...flightData.aircraft,
            ...aircraftInfo
          }))
        );
      }),
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