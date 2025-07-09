import { Injectable } from '@angular/core';
import { TrackPoint } from './models/track-point.interface';

@Injectable({
  providedIn: 'root'
})
export class FlightResamplingService {
  /**
   * Calcule la distance entre deux points en utilisant la formule de Haversine
   */
  private distanceBetween(a: TrackPoint, b: TrackPoint): number {
    const R = 6371000; // Rayon de la Terre en mètres
    const φ1 = this.toRadians(a.lat);
    const φ2 = this.toRadians(b.lat);
    const Δφ = this.toRadians(b.lat - a.lat);
    const Δλ = this.toRadians(b.lon - a.lon);

    const sin2φ = Math.sin(Δφ/2) * Math.sin(Δφ/2);
    const sin2λ = Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const cosφ1 = Math.cos(φ1);
    const cosφ2 = Math.cos(φ2);
    const a1 = sin2φ;
    const a2 = cosφ1 * cosφ2 * sin2λ;
    const haversineA = a1 + a2;
    const c = 2 * Math.atan2(Math.sqrt(haversineA), Math.sqrt(1-haversineA));

    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Calcule les distances cumulées le long de la trajectoire
   */
  private computeCumulativeDistances(track: TrackPoint[]): number[] {
    const cumDist: number[] = [0];
    for (let i = 1; i < track.length; i++) {
      const dSeg = this.distanceBetween(track[i - 1], track[i]);
      cumDist.push(cumDist[i - 1] + dSeg);
    }
    return cumDist;
  }

  /**
   * Resample la trajectoire en 101 points uniformes par temps
   */
  resampleByTime(track: TrackPoint[]): TrackPoint[] {
    const nSeg = 100; // 0%..100% → 101 points
    const resampled: TrackPoint[] = [];

    const tStart = track[0].time;
    const tEnd = track[track.length - 1].time;
    const totalTime = tEnd - tStart;

    let idx = 0;

    for (let p = 0; p <= nSeg; p++) {
      const targetT = tStart + (p / nSeg) * totalTime;

      while (idx < track.length - 1 && track[idx + 1].time < targetT) {
        idx++;
      }

      if (targetT <= track[0].time) {
        resampled.push({ ...track[0] });
      } else if (targetT >= track[track.length - 1].time) {
        resampled.push({ ...track[track.length - 1] });
      } else {
        const ptA = track[idx];
        const ptB = track[idx + 1];
        const dt = ptB.time - ptA.time;
        const frac = (targetT - ptA.time) / dt;

        resampled.push({
          time: targetT,
          lat: ptA.lat + frac * (ptB.lat - ptA.lat),
          lon: ptA.lon + frac * (ptB.lon - ptA.lon),
          alt: ptA.alt + frac * (ptB.alt - ptA.alt),
          vel: ptA.vel + frac * (ptB.vel - ptA.vel)
        });
      }
    }

    return resampled;
  }

  /**
   * Resample la trajectoire en 101 points uniformes par distance
   */
  resampleByDistance(track: TrackPoint[]): TrackPoint[] {
    const nSeg = 100;
    const resampled: TrackPoint[] = [];
    const cumDist = this.computeCumulativeDistances(track);
    const Dtotal = cumDist[cumDist.length - 1];
    let idx = 0;

    for (let p = 0; p <= nSeg; p++) {
      const targetD = (p / nSeg) * Dtotal;

      while (idx < cumDist.length - 1 && cumDist[idx + 1] < targetD) {
        idx++;
      }

      if (targetD <= 0) {
        resampled.push({ ...track[0] });
      } else if (targetD >= Dtotal) {
        resampled.push({ ...track[track.length - 1] });
      } else {
        const ptA = track[idx];
        const ptB = track[idx + 1];
        const dA = cumDist[idx];
        const dB = cumDist[idx + 1];
        const frac = (targetD - dA) / (dB - dA);

        resampled.push({
          time: ptA.time + frac * (ptB.time - ptA.time),
          lat: ptA.lat + frac * (ptB.lat - ptA.lat),
          lon: ptA.lon + frac * (ptB.lon - ptA.lon),
          alt: ptA.alt + frac * (ptB.alt - ptA.alt),
          vel: ptA.vel + frac * (ptB.vel - ptA.vel)
        });
      }
    }

    return resampled;
  }

  /**
   * Resample la trajectoire en 200 points non uniformes (plus dense en début/fin)
   */
  resampleTo200(track: TrackPoint[]): TrackPoint[] {
    if (!track || track.length < 2) return [];
    const n1 = 60, n2 = 80, n3 = 60;
    const cumDist = this.computeCumulativeDistances(track);
    const Dtotal = cumDist[cumDist.length - 1];
    // Générer les 200 distances cibles
    const targets: number[] = [];
    // 0-20% (60 points)
    for (let i = 0; i < n1; i++) {
      targets.push((i / (n1 - 1)) * 0.20 * Dtotal);
    }
    // 20-80% (80 points)
    for (let i = 1; i < n2; i++) {
      targets.push(0.20 * Dtotal + (i / n2) * 0.60 * Dtotal);
    }
    // 80-100% (60 points)
    for (let i = 1; i < n3; i++) {
      targets.push(0.80 * Dtotal + (i / (n3 - 1)) * 0.20 * Dtotal);
    }
    // Correction : s'assurer qu'on a bien 200 points
    if (targets.length < 200) targets.push(Dtotal);
    // Interpolation
    const resampled: TrackPoint[] = [];
    let idx = 0;
    for (const dTarget of targets) {
      while (idx < cumDist.length - 2 && cumDist[idx + 1] < dTarget) idx++;
      const ptA = track[idx];
      const ptB = track[idx + 1];
      const dA = cumDist[idx];
      const dB = cumDist[idx + 1];
      const frac = (dTarget - dA) / (dB - dA);
      resampled.push({
        time: ptA.time + frac * (ptB.time - ptA.time),
        lat: ptA.lat + frac * (ptB.lat - ptA.lat),
        lon: ptA.lon + frac * (ptB.lon - ptA.lon),
        alt: ptA.alt + frac * (ptB.alt - ptA.alt),
        vel: ptA.vel + frac * (ptB.vel - ptA.vel)
      });
    }
    return resampled;
  }
} 