import { Injectable } from '@angular/core';

export type GeoMode = 'REAL' | 'DISCONNECTED' | 'DEMO';

@Injectable({ providedIn: 'root' })
export class GeoStatusService {
  private demoForced = false;

  /** Force le mode démo, indépendamment du GPS/Wi‑Fi */
  setDemoForced(flag: boolean) { this.demoForced = flag; }

  /** Vérifie si le GPS est activé et accessible */
  async isGpsEnabled(): Promise<boolean> {
    // TODO: Utiliser le plugin Capacitor/cordova pour vérifier la permission et l'état du GPS
    // Ex: return await Geolocation.checkPermissions() ...
    return false; // À implémenter selon la plateforme
  }

  /** Vérifie si une connexion Wi‑Fi est active */
  async isWifiConnected(): Promise<boolean> {
    // TODO: Utiliser Capacitor Network ou équivalent
    // Ex: return (await Network.getStatus()).connectionType === 'wifi';
    return false; // À implémenter selon la plateforme
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