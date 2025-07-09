import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { DateTime, Duration } from 'luxon';
import { FlightData, FlightStatus, Aircraft, RouteInfo, AirportInfo, Location, Waypoint } from './models/flight-data.interface';

export interface Airport {
  code: string;
  city: string;
  name: string;
  tz: string;
  lat: number;
  lon: number;
}

export interface FlightProfile {
  durationMin: number;
  climbTime: number;
  descentTime: number;
  climbSpeedKt: number;
  descentSpeedKt: number;
}

export interface CalculatedFlightData {
  departureCity: string;
  departureAirport: string;
  departureTimeGeneva: string;
  departureTimeAthens: string;
  arrivalCity: string;
  arrivalAirport: string;
  arrivalTimeGeneva: string;
  arrivalTimeAthens: string;
  nowGeneva: string;
  nowAthens: string;
  progressPercent: number;
  elapsed: string;
  remaining: string;
  duration: string;
  status: FlightStatus;
  phase: string;
  v_sol_kt: number;
  v_sol_kmh: number;
  d_elapsed_km: number;
  d_remaining_km: number;
  D_gc_km: number;
  fraction_f: number;
  lat_t_deg: number;
  lon_t_deg: number;
}

@Injectable({
  providedIn: 'root'
})
export class FlightCalculatorService {
  private readonly KT_TO_KMH = 1.852;
  private readonly EARTH_RADIUS_KM = 6371;

  private flightData = new BehaviorSubject<FlightData>({
    flightNumber: 'LX1234',
    airline: 'Swiss International Air Lines',
    departureCity: 'Genève',
    departureAirport: 'Aéroport de Genève',
    arrivalCity: 'Athènes',
    arrivalAirport: 'Aéroport international d\'Athènes',
    departureTimeGeneva: new Date().toLocaleTimeString(),
    arrivalTimeAthens: new Date(Date.now() + 7200000).toLocaleTimeString(),
    status: {
      type: 'IN_FLIGHT',
      description: 'En vol'
    },
    progressPercent: 0,
    elapsed: '00:00',
    remaining: '02:00',
    aircraft: {
      type: 'Airbus A320',
      registration: 'HB-IJQ',
      altitude: 11000,
      speed: 850
    },
    lat_t_deg: 46.204391,
    lon_t_deg: 6.143158,
    altitude: 11000,
    waypoints: [{
      timestamp: Date.now(),
      latitude: 46.204391,
      longitude: 6.143158,
      altitude: 11000,
      speed: 850,
      heading: 135
    }],
    D_gc_km: 1800,
    routeInfo: {
      departure: {
        name: 'Aéroport de Genève',
        city: 'Genève',
        country: 'Suisse',
        iata: 'GVA',
        scheduledTime: new Date().toLocaleTimeString(),
        actualTime: new Date().toLocaleTimeString(),
        terminal: '1',
        gate: 'A1',
        status: {
          type: 'ON_TIME',
          description: 'À l\'heure'
        },
        location: {
          latitude: 46.204391,
          longitude: 6.143158
        }
      },
      arrival: {
        name: 'Aéroport international d\'Athènes',
        city: 'Athènes',
        country: 'Grèce',
        iata: 'ATH',
        scheduledTime: new Date(Date.now() + 7200000).toLocaleTimeString(),
        actualTime: new Date(Date.now() + 7200000).toLocaleTimeString(),
        terminal: '2',
        gate: 'B2',
        status: {
          type: 'ON_TIME',
          description: 'À l\'heure'
        },
        location: {
          latitude: 37.936389,
          longitude: 23.947222
        }
      },
      distance: 1800,
      duration: {
        scheduled: 180,
        actual: 180
      },
      currentPosition: {
        latitude: 46.204391,
        longitude: 6.143158
      }
    }
  });

  constructor() {
    this.startFlightSimulation();
  }

  getCurrentFlightData(): FlightData {
    return this.flightData.value;
  }

  private startFlightSimulation() {
    setInterval(() => {
      const currentData = this.flightData.value;
      const now = new Date();
      const departureTime = new Date(now.getTime() - 3600000); // 1 hour ago
      const arrivalTime = new Date(now.getTime() + 7200000); // 2 hours from now
      const totalDuration = arrivalTime.getTime() - departureTime.getTime();
      const elapsed = now.getTime() - departureTime.getTime();
      const progress = (elapsed / totalDuration) * 100;

      // Calculate new position (simple linear interpolation)
      const startLat = currentData.routeInfo.departure.location.latitude;
      const startLon = currentData.routeInfo.departure.location.longitude;
      const endLat = currentData.routeInfo.arrival.location.latitude;
      const endLon = currentData.routeInfo.arrival.location.longitude;

      const newLat = startLat + (endLat - startLat) * (progress / 100);
      const newLon = startLon + (endLon - startLon) * (progress / 100);

      // Update flight data
      this.flightData.next({
        ...currentData,
        departureTimeGeneva: departureTime.toLocaleTimeString(),
        arrivalTimeAthens: arrivalTime.toLocaleTimeString(),
        progressPercent: Math.min(progress, 100),
        elapsed: this.formatDuration(elapsed),
        remaining: this.formatDuration(totalDuration - elapsed),
        lat_t_deg: newLat,
        lon_t_deg: newLon,
        waypoints: [{
          timestamp: now.getTime(),
          latitude: newLat,
          longitude: newLon,
          altitude: 11000,
          speed: 850,
          heading: 135
        }],
        routeInfo: {
          ...currentData.routeInfo,
          currentPosition: {
            latitude: newLat,
            longitude: newLon
          }
        }
      });
    }, 1000);
  }

  private formatDuration(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  calculateFlightData(
    flightNumber: string,
    airline: string,
    departureCity: string,
    departureAirport: string,
    arrivalCity: string,
    arrivalAirport: string,
    departureTime: string,
    arrivalTime: string
  ): FlightData {
    const now = new Date();
    const departure = new Date(departureTime);
    const arrival = new Date(arrivalTime);
    const elapsed = now.getTime() - departure.getTime();
    const total = arrival.getTime() - departure.getTime();
    const progress = Math.min(Math.max(elapsed / total, 0), 1);
    const remaining = total - elapsed;

    const departureInfo: AirportInfo = {
      name: departureAirport,
      city: departureCity,
      country: 'Switzerland',
      iata: 'GVA',
      scheduledTime: departureTime,
      actualTime: departureTime,
      terminal: '1',
      gate: 'A1',
      status: {
        type: 'ON_TIME',
        description: 'À l\'heure'
      },
      location: {
        latitude: 46.2381,
        longitude: 6.1089
      }
    };

    const arrivalInfo: AirportInfo = {
      name: arrivalAirport,
      city: arrivalCity,
      country: 'Greece',
      iata: 'ATH',
      scheduledTime: arrivalTime,
      actualTime: arrivalTime,
      terminal: '2',
      gate: 'B2',
      status: {
        type: 'ON_TIME',
        description: 'À l\'heure'
      },
      location: {
        latitude: 37.9364,
        longitude: 23.9445
      }
    };

    const routeInfo: RouteInfo = {
      departure: departureInfo,
      arrival: arrivalInfo,
      distance: 1800,
      duration: {
        scheduled: 180,
        actual: 180
      },
      currentPosition: this.interpolatePosition(
        departureInfo.location,
        arrivalInfo.location,
        progress
      )
    };

    const aircraft: Aircraft = {
      type: 'A320',
      registration: 'HB-JLA',
      altitude: this.calculateAltitude(progress),
      speed: 850
    };

    const status: FlightStatus = {
      type: progress >= 1 ? 'ARRIVED' : 'IN_FLIGHT',
      description: progress >= 1 ? 'Arrivé' : 'En vol'
    };

    return {
      flightNumber,
      airline,
      aircraft,
      departureCity,
      departureAirport,
      arrivalCity,
      arrivalAirport,
      departureTimeGeneva: this.formatTime(departure),
      arrivalTimeAthens: this.formatTime(arrival),
      status,
      progressPercent: Math.round(progress * 100),
      elapsed: this.formatDuration(elapsed),
      remaining: this.formatDuration(remaining),
      lat_t_deg: routeInfo.currentPosition.latitude,
      lon_t_deg: routeInfo.currentPosition.longitude,
      altitude: aircraft.altitude,
      D_gc_km: routeInfo.distance,
      routeInfo,
      waypoints: this.generateWaypoints(departureInfo.location, arrivalInfo.location, progress)
    };
  }

  private formatTime(date: Date): string {
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  private calculateAltitude(progress: number): number {
    if (progress < 0.1) {
      return 11000 * (progress / 0.1);
    } else if (progress > 0.9) {
      return 11000 * (1 - (progress - 0.9) / 0.1);
    }
    return 11000;
  }

  private interpolatePosition(start: Location, end: Location, progress: number): Location {
    return {
      latitude: start.latitude + (end.latitude - start.latitude) * progress,
      longitude: start.longitude + (end.longitude - start.longitude) * progress
    };
  }

  private generateWaypoints(start: Location, end: Location, progress: number): Waypoint[] {
    const waypoints: Waypoint[] = [];
    const steps = 10;
    for (let i = 0; i <= steps; i++) {
      const stepProgress = i / steps;
      if (stepProgress <= progress) {
        waypoints.push({
          timestamp: Date.now(),
          latitude: start.latitude + (end.latitude - start.latitude) * stepProgress,
          longitude: start.longitude + (end.longitude - start.longitude) * stepProgress,
          altitude: this.calculateAltitude(stepProgress),
          speed: 850,
          heading: this.calculateHeading(start, end)
        });
      }
    }
    return waypoints;
  }

  private calculateHeading(start: Location, end: Location): number {
    const lat1 = start.latitude * Math.PI / 180;
    const lat2 = end.latitude * Math.PI / 180;
    const lon1 = start.longitude * Math.PI / 180;
    const lon2 = end.longitude * Math.PI / 180;

    const y = Math.sin(lon2 - lon1) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) -
      Math.sin(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1);
    let heading = Math.atan2(y, x) * 180 / Math.PI;
    heading = (heading + 360) % 360;
    return heading;
  }
} 