import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiKeyService {
  private readonly API_KEY_CHECK_INTERVAL = 3600000; // 1 heure
  private apiStatus = {
    aviationstack: true,
    opensky: true
  };
  private keys: { [api: string]: string } = {
    aviationstack: '',
    opensky: '',
  };
  private quotaMap = new Map<string, number>();
  private quotaLimits: { [api: string]: number } = {
    aviationstack: 500, // requêtes/mois
    opensky: 400,       // requêtes/heure
  };

  constructor(private http: HttpClient) {
    this.checkApiKeys();
    // Vérifier périodiquement les clés
    setInterval(() => this.checkApiKeys(), this.API_KEY_CHECK_INTERVAL);
  }

  private checkApiKeys() {
    // Vérifier Aviationstack
    this.http.get(
      'http://api.aviationstack.com/v1/flights',
      {
        params: new HttpParams()
          .set('access_key', environment.aviationstack.apiKey)
          .set('flight_iata', 'LX1820')
      }
    ).pipe(
      map(() => true),
      catchError(error => {
        console.error('Erreur de clé Aviationstack:', error);
        this.apiStatus.aviationstack = false;
        return of(false);
      })
    ).subscribe(status => {
      this.apiStatus.aviationstack = status;
    });

    // Vérifier OpenSky
    this.http.get(
      'https://opensky-network.org/api/states/all',
      {
        headers: {
          'Authorization': 'Basic ' + btoa(`${environment.opensky.username}:${environment.opensky.password}`)
        }
      }
    ).pipe(
      map(() => true),
      catchError(error => {
        console.error('Erreur de clé OpenSky:', error);
        this.apiStatus.opensky = false;
        return of(false);
      })
    ).subscribe(status => {
      this.apiStatus.opensky = status;
    });
  }

  getApiStatus() {
    return this.apiStatus;
  }

  isAviationstackAvailable(): boolean {
    return this.apiStatus.aviationstack;
  }

  isOpenSkyAvailable(): boolean {
    return this.apiStatus.opensky;
  }

  setKey(api: string, key: string) {
    this.keys[api] = key;
  }

  getKey(api: string): string {
    return this.keys[api];
  }

  checkQuota(api: string): boolean {
    const currentQuota = this.quotaMap.get(api) || 0;
    return currentQuota < this.getQuotaLimit(api);
  }

  updateQuota(api: string) {
    const currentQuota = this.quotaMap.get(api) || 0;
    this.quotaMap.set(api, currentQuota + 1);
  }

  getQuotaLimit(api: string): number {
    return this.quotaLimits[api] || 0;
  }
}