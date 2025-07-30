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
  ): Array<{ lat: number; lng: number; alt: number; spd: number; ts: number }> {
    const points: any[] = [];
    // 1) Calculer distance totale via formule Haversine
    const R = 6371; // Rayon de la Terre en km
    const toRad = (deg: number) => deg * Math.PI / 180;
    const φ1 = toRad(start[0]);
    const φ2 = toRad(end[0]);
    const λ1 = toRad(start[1]);
    const λ2 = toRad(end[1]);
    const Δφ = toRad(end[0] - start[0]);
    const Δλ = toRad(end[1] - start[1]);
    const hav = (Δ: number) => Math.sin(Δ / 2) ** 2;
    const a = hav(Δφ) + Math.cos(φ1) * Math.cos(φ2) * hav(Δλ);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const D_gc_km = R * c;

    // 2) Pour i = 0..count-1, f = i / (count - 1)
    for (let i = 0; i < count; i++) {
      const f = i / (count - 1);
      
      // 3) Interpolation orthodromique (grande-cercle) pour lat, lng
      const A = Math.sin((1 - f) * c) / Math.sin(c);
      const B = Math.sin(f * c) / Math.sin(c);
      const x = A * Math.cos(φ1) * Math.cos(λ1) + B * Math.cos(φ2) * Math.cos(λ2);
      const y = A * Math.cos(φ1) * Math.sin(λ1) + B * Math.cos(φ2) * Math.sin(λ2);
      const z = A * Math.sin(φ1) + B * Math.sin(φ2);
      const φ_t = Math.atan2(z, Math.sqrt(x * x + y * y));
      const λ_t = Math.atan2(y, x);
      const lat = φ_t * 180 / Math.PI;
      const lng = λ_t * 180 / Math.PI;

      // 4) Interpolation altitude & vitesse selon profil monté/croisière/descente
      let alt = 0;
      let spd = 0;
      if (f < 0.1) {
        // Montée
        alt = 35000 * (f / 0.1);
        spd = 280 + (f / 0.1) * 220;
      } else if (f < 0.9) {
        // Croisière
        alt = 35000;
        spd = 500;
      } else {
        // Descente
        alt = 35000 * (1 - (f - 0.9) / 0.1);
        spd = 500 - ((f - 0.9) / 0.1) * 200;
      }

      // 5) Calcul d'un timestamp fictif
      const ts = Date.now() + i * 60000; // 1 minute entre chaque point

      points.push({ lat, lng, alt, spd, ts });
    }

    return points;
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
  private haversine(a: {lat:number,lng:number}, b: {lat:number,lng:number}): number {
    const R = this.EARTH_RADIUS_KM;
    const dLat = this.toRad(b.lat - a.lat);
    const dLng = this.toRad(b.lng - a.lng);
    const lat1 = this.toRad(a.lat);
    const lat2 = this.toRad(b.lat);
    const aVal = Math.sin(dLat/2)**2 + Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLng/2)**2;
    return 2 * R * Math.asin(Math.sqrt(aVal));
  }
} 