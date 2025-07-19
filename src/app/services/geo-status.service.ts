import { Injectable } from '@angular/core';

export type GeoMode = 'REAL' | 'DISCONNECTED' | 'DEMO';

@Injectable({ providedIn: 'root' })
export class GeoStatusService {
  private demoForced = false;

  /** Force le mode démo, indépendamment du GPS/Wi‑Fi */
  setDemoForced(flag: boolean) { this.demoForced = flag; }

  /** Vérifie si le GPS est activé et accessible */
  // HACK DEV : Les méthodes isGpsEnabled et isWifiConnected sont forcées à true pour tester le mode REAL. À remettre à false ou à implémenter pour la prod.
  async isGpsEnabled(): Promise<boolean> {
    return true; // Forcé à true pour tests : simule un GPS actif
  }

  /** Vérifie si une connexion Wi‑Fi est active */
  async isWifiConnected(): Promise<boolean> {
    return true; // Forcé à true pour tests : simule un Wi-Fi actif
  }

  /** Vérifie si des tuiles de la zone ont été mises en cache */
  private hasCachedTiles(): boolean {
    // TODO: Lire le stockage local pour savoir si des tuiles existent
    return false; // À implémenter
  }

  /** Retourne le mode courant { mode: 'REAL' | 'DISCONNECTED' | 'DEMO' } */
  async getStatus(): Promise<{ mode: GeoMode }> {
    if (this.demoForced) return { mode: 'DEMO' };
    const gps = await this.isGpsEnabled();
    const wifi = await this.isWifiConnected();
    if (gps) {
      if (wifi || this.hasCachedTiles()) return { mode: 'REAL' };
      else return { mode: 'DISCONNECTED' };
    }
    if (wifi || this.hasCachedTiles()) return { mode: 'DISCONNECTED' };
    return { mode: 'DEMO' };
  }
} 