import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { FlightData, Waypoint } from '../models/flight.interface';

@Injectable({ providedIn: 'root' })
export class WindowPageService {
  private flightDataSubject = new BehaviorSubject<FlightData | null>(null);
  private waypointsSubject = new BehaviorSubject<Waypoint[]>([]);

  constructor() {
    this.initializeDemoData();
  }

  private initializeDemoData() {
    // Données de démo pour le vol GVA-ATH
    const demoFlightData: FlightData = {
      flightNumber: 'A3 1234',
      airline: 'Aegean Airlines',
      aircraft: 'Airbus A320',
      departureAirport: 'GVA',
      departureCity: 'Genève',
      arrivalAirport: 'ATH',
      arrivalCity: 'Athènes',
      departureLocal: '10:00',
      departureTimeGeneva: '10:00',
      departureTimeAthens: '12:00',
      arrivalLocal: '14:00',
      arrivalTimeGeneva: '12:00',
      arrivalTimeAthens: '14:00',
      status: 'En vol',
      phase: 'Croisière',
      progressPercent: 45,
      lat_t_deg: 42.5,
      lon_t_deg: 20.5,
      altitude: 35000,
      v_sol_kmh: 850,
      v_sol_kt: 460,
      d_elapsed_km: 1000,
      d_remaining_km: 1200,
      duration: '4h00',
      elapsed: '1h45',
      remaining: '2h15',
      eta: '14:00',
      nowGeneva: '11:45',
      nowAthens: '13:45'
    };

    const demoWaypoints: Waypoint[] = [
      { lat: 46.2381, lng: 6.1080, timestamp: Date.now() - 3600000, altitude: 0, speed: 0 },
      { lat: 42.5, lng: 20.5, timestamp: Date.now(), altitude: 35000, speed: 850 },
      { lat: 37.9364, lng: 23.9445, timestamp: Date.now() + 3600000, altitude: 0, speed: 0 }
    ];

    this.setFlightData(demoFlightData);
    this.setWaypoints(demoWaypoints);
  }

  setFlightData(data: FlightData) {
    this.flightDataSubject.next(data);
  }

  getFlightData(): FlightData | null {
    return this.flightDataSubject.value;
  }

  getFlightData$(): Observable<FlightData | null> {
    return this.flightDataSubject.asObservable();
  }

  setWaypoints(pts: Waypoint[]) {
    this.waypointsSubject.next(pts);
  }

  getWaypoints(): Waypoint[] {
    return this.waypointsSubject.value;
  }

  getWaypoints$(): Observable<Waypoint[]> {
    return this.waypointsSubject.asObservable();
  }
} 