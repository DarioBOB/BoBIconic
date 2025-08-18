import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';
import { IonicStorageModule } from '@ionic/storage-angular';

export interface FlightSegment {
  timestamp: string;
  latitude: number;
  longitude: number;
  altitude: number;
  speed: number;
  heading: number;
}

export interface FlightHistory {
  flightNumber: string;
  date: string;
  segments: FlightSegment[];
  averageSpeed: number;
  maxAltitude: number;
  totalDuration: number;
}

@Injectable({
  providedIn: 'root'
})
export class FlightHistoryService {
  private readonly STORAGE_KEY = 'flight_history';
  private readonly SEGMENT_DURATION = 10 * 60 * 1000; // 10 minutes en millisecondes

  constructor(private storage: Storage) {
    this.initStorage();
  }

  private async initStorage() {
    await this.storage.create();
  }

  async saveFlightHistory(history: FlightHistory): Promise<void> {
    await this.initStorage();
    const existingHistories = await this.getFlightHistories();
    existingHistories.push(history);
    await this.storage.set(this.STORAGE_KEY, existingHistories);
  }

  async getFlightHistories(): Promise<FlightHistory[]> {
    await this.initStorage();
    return await this.storage.get(this.STORAGE_KEY) || [];
  }

  async getFlightHistory(flightNumber: string, date: string): Promise<FlightHistory | null> {
    const histories = await this.getFlightHistories();
    return histories.find(h => h.flightNumber === flightNumber && h.date === date) || null;
  }

  async getAverageFlightData(flightNumber: string): Promise<{
    segments: FlightSegment[];
    averageSpeed: number;
    maxAltitude: number;
    totalDuration: number;
  } | null> {
    const histories = await this.getFlightHistories();
    const relevantHistories = histories.filter(h => h.flightNumber === flightNumber);

    if (relevantHistories.length === 0) {
      return null;
    }

    // Calculer les moyennes pour chaque segment
    const segmentCount = Math.max(...relevantHistories.map(h => h.segments.length));
    const averageSegments: FlightSegment[] = [];

    for (let i = 0; i < segmentCount; i++) {
      const segmentData = relevantHistories
        .map(h => h.segments[i])
        .filter(s => s !== undefined);

      if (segmentData.length > 0) {
        averageSegments.push({
          timestamp: new Date(Date.now() + i * this.SEGMENT_DURATION).toISOString(),
          latitude: this.average(segmentData.map(s => s.latitude)),
          longitude: this.average(segmentData.map(s => s.longitude)),
          altitude: this.average(segmentData.map(s => s.altitude)),
          speed: this.average(segmentData.map(s => s.speed)),
          heading: this.average(segmentData.map(s => s.heading))
        });
      }
    }

    return {
      segments: averageSegments,
      averageSpeed: this.average(relevantHistories.map(h => h.averageSpeed)),
      maxAltitude: this.average(relevantHistories.map(h => h.maxAltitude)),
      totalDuration: this.average(relevantHistories.map(h => h.totalDuration))
    };
  }

  private average(numbers: number[]): number {
    return numbers.reduce((a, b) => a + b, 0) / numbers.length;
  }

  // Méthode pour générer des données historiques simulées
  generateSimulatedHistory(flightNumber: string, date: string): FlightHistory {
    const segments: FlightSegment[] = [];
    const startTime = new Date(date).getTime();
    const totalDuration = 3 * 60 * 60 * 1000; // 3 heures
    const segmentCount = Math.floor(totalDuration / this.SEGMENT_DURATION);

    // Points de départ et d'arrivée
    const startPoint = { lat: 46.2381, lon: 6.1080 };
    const endPoint = { lat: 37.9364, lon: 23.9445 };

    for (let i = 0; i < segmentCount; i++) {
      const progress = i / segmentCount;
      const timestamp = new Date(startTime + i * this.SEGMENT_DURATION);

      // Calcul de l'altitude en fonction de la progression
      let altitude;
      if (progress < 0.2) {
        // Montée
        altitude = 0 + (35000 - 0) * (progress / 0.2);
      } else if (progress > 0.8) {
        // Descente
        altitude = 35000 - (35000 - 0) * ((progress - 0.8) / 0.2);
      } else {
        // Croisière
        altitude = 35000;
      }

      // Calcul de la vitesse en fonction de la progression
      let speed;
      if (progress < 0.2) {
        // Accélération
        speed = 400 + (progress / 0.2) * 450;
      } else if (progress > 0.8) {
        // Ralentissement
        speed = 850 - ((progress - 0.8) / 0.2) * 450;
      } else {
        // Croisière
        speed = 850;
      }

      segments.push({
        timestamp: timestamp.toISOString(),
        latitude: startPoint.lat + (endPoint.lat - startPoint.lat) * progress,
        longitude: startPoint.lon + (endPoint.lon - startPoint.lon) * progress,
        altitude: altitude,
        speed: speed,
        heading: this.calculateHeading(
          { lat: startPoint.lat, lon: startPoint.lon },
          { lat: endPoint.lat, lon: endPoint.lon }
        )
      });
    }

    return {
      flightNumber,
      date,
      segments,
      averageSpeed: 850,
      maxAltitude: 35000,
      totalDuration: totalDuration
    };
  }

  private calculateHeading(start: { lat: number; lon: number }, end: { lat: number; lon: number }): number {
    const lat1 = start.lat * Math.PI / 180;
    const lat2 = end.lat * Math.PI / 180;
    const dLon = (end.lon - start.lon) * Math.PI / 180;
    
    const y = Math.sin(dLon) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
    let heading = Math.atan2(y, x) * 180 / Math.PI;
    
    if (heading < 0) {
      heading += 360;
    }
    
    return heading;
  }
} 