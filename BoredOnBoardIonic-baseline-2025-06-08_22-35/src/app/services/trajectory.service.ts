import { Injectable } from '@angular/core';

export interface TrajectoryPoint {
  lat: number;
  lng: number;
  alt: number;
  spd: number;
  ts: number;
}

@Injectable({ providedIn: 'root' })
export class TrajectoryService {
  private readonly EARTH_RADIUS_KM = 6371;

  /**
   * Calcule un grand cercle entre deux points (start, end) et retourne `count` points.
   * Chaque point intègre lat, lng, alt, spd et ts.
   */
  computeGreatCircle(
    start: [number, number], // [lat, lng]
    end: [number, number],   // [lat, lng]
    count: number
  ): TrajectoryPoint[] {
    const [lat1, lon1] = start.map(this.toRad);
    const [lat2, lon2] = end.map(this.toRad);
    const points: TrajectoryPoint[] = [];
    const d = this.angularDistance(lat1, lon1, lat2, lon2);
    const now = Date.now();
    for (let i = 0; i < count; i++) {
      const f = i / (count - 1);
      const A = Math.sin((1 - f) * d) / Math.sin(d);
      const B = Math.sin(f * d) / Math.sin(d);
      const x = A * Math.cos(lat1) * Math.cos(lon1) + B * Math.cos(lat2) * Math.cos(lon2);
      const y = A * Math.cos(lat1) * Math.sin(lon1) + B * Math.cos(lat2) * Math.sin(lon2);
      const z = A * Math.sin(lat1) + B * Math.sin(lat2);
      const lat = Math.atan2(z, Math.sqrt(x * x + y * y));
      const lon = Math.atan2(y, x);
      // Altitude et vitesse simulées (profil simple)
      const alt = this.simulateAltitude(f);
      const spd = this.simulateSpeed(f);
      points.push({
        lat: this.toDeg(lat),
        lng: this.toDeg(lon),
        alt,
        spd,
        ts: now + i * 60 * 1000 // 1 min d'écart par point (exemple)
      });
    }
    return points;
  }

  /**
   * Charge la trajectoire démo depuis un fichier local (assets/demo/trajectory_gva_ath.json)
   */
  async loadDemoTrajectory(): Promise<TrajectoryPoint[]> {
    const resp = await fetch('/assets/demo/trajectory_gva_ath.json');
    if (!resp.ok) throw new Error('Impossible de charger la trajectoire démo');
    return await resp.json();
  }

  private toRad(deg: number): number { return deg * Math.PI / 180; }
  private toDeg(rad: number): number { return rad * 180 / Math.PI; }
  private angularDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    return Math.acos(
      Math.sin(lat1) * Math.sin(lat2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1)
    );
  }
  private simulateAltitude(f: number): number {
    // Profil simple : montée, croisière, descente
    if (f < 0.1) return 0 + f * 10 * 1000; // montée à 10 000m
    if (f > 0.9) return 10000 * (1 - (f - 0.9) * 10); // descente
    return 10000;
  }
  private simulateSpeed(f: number): number {
    // Profil simple : accélération, croisière, décélération
    if (f < 0.1) return 250 + f * 10 * 80;
    if (f > 0.9) return 330 - (f - 0.9) * 10 * 80;
    return 330;
  }
} 