import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, tap, throwError, switchMap, from, concatMap, reduce, of, filter, take, forkJoin } from 'rxjs';
import { TrackPoint } from './models/track-point.interface';
import { environment } from '../../../environments/environment';

// Centralisation des variables en haut du fichier
const DEFAULT_API_BASE_URL = environment.openskyProxyBaseUrl || 'http://localhost:3000/api/opensky';
const DEFAULT_MAX_DAYS = environment.openskyMaxDays || 5;
const DEFAULT_SEARCH_DURATION = environment.openskyDefaultSearchDuration || 3600; // 1h

@Injectable({
  providedIn: 'root'
})
export class OpenSkyService {
  private readonly API_BASE_URL = DEFAULT_API_BASE_URL;
  private readonly MAX_DAYS = DEFAULT_MAX_DAYS;
  private readonly DEFAULT_SEARCH_DURATION = DEFAULT_SEARCH_DURATION;
  private readonly GVA_ATH_DISTANCE = 1800; // Distance en km entre GVA et ATH

  constructor(private http: HttpClient) {}

  /**
   * Récupère les informations de base d'un vol à partir de son callsign
   */
  getFlightInfo(callsign: string, begin: number, end: number): Observable<any> {
    const now = Math.floor(Date.now() / 1000);
    if (end > now) {
        console.warn(`[OpenSky] Correction: end (${end}) > now (${now}), on force end = now`);
        end = now;
    }
    if (begin > end) {
        console.warn(`[OpenSky] Correction: begin (${begin}) > end (${end}), on force begin = end - ${this.DEFAULT_SEARCH_DURATION}`);
        begin = end - this.DEFAULT_SEARCH_DURATION;
    }
    const url = `${this.API_BASE_URL}/flights/callsign/${callsign}?begin=${begin}&end=${end}`;
    console.log(`[OpenSky] REQ: callsign='${callsign}', begin=${begin}, end=${end}, url=${url}`);
    return this.http.get(url).pipe(
      catchError(error => {
        if (error.status === 0) {
          alert('Le serveur proxy OpenSky n\'est pas lancé. Lancez-le avec "node server.js" dans le dossier du projet.');
        }
        return throwError(() => error);
      })
    );
  }

  /**
   * Récupère la trajectoire complète d'un vol
   */
  async getFlightTrack(icao24: string, startTime: number, endTime: number): Promise<TrackPoint[]> {
    try {
      // Utiliser l'API directe d'OpenSky pour avoir plus de points
      const url = `https://opensky-network.org/api/tracks/all?icao24=${icao24}&time=${startTime}`;
      const auth = btoa(`${environment.opensky.username}:${environment.opensky.password}`);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Basic ${auth}`
        }
      });

      if (!response.ok) {
        throw new Error('Erreur HTTP ' + response.status);
      }

      const data = await response.json() as { path: number[][] };
      
      if (!data || !Array.isArray(data.path) || data.path.length === 0) {
        console.error('[OpenSky] Trajectoire absente ou vide');
        return [];
      }

      // Filtrer les points pour ne garder que ceux entre startTime et endTime
      const filteredPoints = data.path.filter((point: number[]) => {
        const pointTime = point[0];
        return pointTime >= startTime && pointTime <= endTime;
      });

      // Convertir en TrackPoints
      const track = this.convertRawTrackToPoints(filteredPoints);
      
      console.log('[OpenSky] Trajectoire complète:', track.length, 'points');
      if (track.length > 0) {
        console.log('[OpenSky] Premier point:', track[0]);
        console.log('[OpenSky] Dernier point:', track[track.length - 1]);
      }

      return track;
    } catch (error) {
      console.error('[OpenSky] Erreur récupération trajectoire:', error);
      return [];
    }
  }

  /**
   * Convertit les données brutes de trajectoire en tableau de TrackPoint
   */
  private convertRawTrackToPoints(rawTrack: any[]): TrackPoint[] {
    return rawTrack.map(point => ({
      time: point[0],
      lat: point[1],
      lon: point[2],
      alt: point[3],
      vel: point[4]
    }));
  }

  /**
   * Récupère et convertit la trajectoire d'un vol
   */
  getFlightTrackPoints(icao24: string, time: number): Observable<TrackPoint[]> {
    return from(this.getFlightTrack(icao24, time, time + 3600)).pipe(
      catchError(err => {
        console.error('[OpenSky] Erreur mapping trajectoire:', err);
        return of([]);
      })
    );
  }

  /**
   * Récupère le dernier vol GVA->ATH
   */
  async findLatestGvaToAthFlight(): Promise<any> {
    const now = new Date();
    const endTime = Math.floor(now.getTime() / 1000);
    const startTime = endTime - 24 * 3600; // 24h avant

    console.log(`[OpenSky] Recherche vols GVA->ATH du ${new Date(startTime * 1000).toISOString()} au ${new Date(endTime * 1000).toISOString()}`);

    const url = `${this.API_BASE_URL}/flights/all?begin=${startTime}&end=${endTime}`;
    const response = await fetch(url);
    const flights = await response.json();

    // Filtrer les vols GVA->ATH
    const gvaToAth = flights.find((f: any) => 
      f.estDepartureAirport === 'GVA' && 
      f.estArrivalAirport === 'ATH'
    );

    if (gvaToAth) {
      console.log('[OpenSky] Vol GVA->ATH trouvé (retourné à l\'enrichissement):', gvaToAth);
      return gvaToAth;
    }

    return null;
  }

  /**
   * Calcule le nombre de segments nécessaires en fonction de la distance
   * @param distance Distance en kilomètres
   * @returns Nombre de segments à récupérer
   */
  private calculateRequiredSegments(distance: number): number {
    // Base: 1 segment par 100km
    const baseSegments = Math.ceil(distance / 100);
    // Minimum 3 segments (décollage, croisière, atterrissage)
    return Math.max(3, baseSegments);
  }

  /**
   * Calcule la durée de chaque segment en fonction de sa position dans le vol
   * @param totalDuration Durée totale du vol en secondes
   * @param segmentIndex Index du segment (0 = décollage, dernier = atterrissage)
   * @param totalSegments Nombre total de segments
   * @returns Durée du segment en secondes
   */
  private calculateSegmentDuration(totalDuration: number, segmentIndex: number, totalSegments: number): number {
    // Les segments de décollage et d'atterrissage sont plus courts
    if (segmentIndex === 0 || segmentIndex === totalSegments - 1) {
      return Math.min(300, totalDuration / (totalSegments * 2)); // 5 minutes max pour décollage/atterrissage
    }
    // Les segments de croisière sont plus longs
    return (totalDuration - 600) / (totalSegments - 2); // Soustraire 10 minutes pour décollage/atterrissage
  }

  /**
   * Récupère une trajectoire complète avec une densité de points adaptative
   * @param icao24 Identifiant de l'avion
   * @param startTime Timestamp de départ
   * @param endTime Timestamp d'arrivée
   * @param distance Distance totale en kilomètres
   */
  getCompleteFlightTrack(icao24: string, startTime: number, endTime: number, distance: number): Observable<TrackPoint[]> {
    const totalDuration = endTime - startTime;
    const totalSegments = this.calculateRequiredSegments(distance);
    const segmentRequests: Observable<any>[] = [];

    console.log(`[OpenSky] Calcul trajectoire: ${totalSegments} segments pour ${distance}km`);

    // Générer les requêtes pour chaque segment
    for (let i = 0; i < totalSegments; i++) {
      const segmentDuration = this.calculateSegmentDuration(totalDuration, i, totalSegments);
      const segmentStartTime = startTime + (i * segmentDuration);
      const segmentEndTime = segmentStartTime + segmentDuration;

      console.log(`[OpenSky] Segment ${i + 1}/${totalSegments}: ${new Date(segmentStartTime * 1000).toISOString()} -> ${new Date(segmentEndTime * 1000).toISOString()}`);

      // Utiliser le proxy local, pas d'auth côté frontend
      const url = `${this.API_BASE_URL}/tracks/all?icao24=${icao24}&time=${Math.floor(segmentStartTime)}`;

      const request = from(
        fetch(url)
          .then(r => {
            if (!r.ok) throw new Error('Erreur HTTP ' + r.status);
            return r.json();
          })
      ).pipe(
        map(response => {
          if (!response || !Array.isArray(response.path)) {
            throw new Error(`Pas de données pour le segment ${i + 1}`);
          }
          // Filtrer les points pour ne garder que ceux du segment
          return response.path.filter((point: any[]) => {
            const pointTime = point[0];
            return pointTime >= segmentStartTime && pointTime <= segmentEndTime;
          });
        }),
        catchError(error => {
          console.error(`[OpenSky] Erreur segment ${i + 1}:`, error);
          return of([]); // Retourner un tableau vide en cas d'erreur
        })
      );

      segmentRequests.push(request);
    }

    // Combiner tous les segments
    return forkJoin(segmentRequests).pipe(
      map(segments => {
        // Aplatir tous les segments en un seul tableau
        const allPoints = ([] as any[]).concat(...segments);
        // Trier les points par timestamp
        allPoints.sort((a: any, b: any) => a[0] - b[0]);
        // Convertir en TrackPoints
        return this.convertRawTrackToPoints(allPoints);
      }),
      tap(points => {
        console.log(`[OpenSky] Trajectoire complète: ${points.length} points`);
        // Vérifier les points de départ et d'arrivée
        if (points.length > 0) {
          console.log('[OpenSky] Premier point:', points[0]);
          console.log('[OpenSky] Dernier point:', points[points.length - 1]);
        }
      })
    );
  }

  /**
   * Recherche le vol complet le plus récent pour un callsign sur les 7 derniers jours (1 appel par jour, multi-variantes callsign)
   */
  getLatestCompleteFlight(callsign: string): Observable<any | null> {
    const now = new Date();
    const nowTimestamp = Math.floor(now.getTime() / 1000);
    // Génère différentes variantes du callsign (original, padding, OACI, espace)
    const variants = [
      callsign,
      callsign.toUpperCase(),
      callsign.toUpperCase().padEnd(8, ' '),
      callsign.toUpperCase().padStart(8, '0'),
      callsign.replace(/\s+/g, ''),
      callsign.replace(/\s+/g, '').padEnd(8, ' '),
      callsign.replace(/\s+/g, '').padStart(8, '0'),
    ];
    // Ajoute OACI si connu (ex: AF -> AFR, BA -> BAW, LX -> SWR, LH -> DLH)
    const oaciMap: { [key: string]: string } = {
      AF: 'AFR', BA: 'BAW', LX: 'SWR', LH: 'DLH', KL: 'KLM', AZ: 'ITY', SN: 'BEL', OS: 'AUA', IB: 'IBE', TP: 'TAP', U2: 'EZY', EZY: 'EZY', VY: 'VLG', HV: 'TRA', EW: 'EWE', X3: 'TUI', FR: 'RYR', W6: 'WZZ', A3: 'AEE', TK: 'THY', SU: 'AFL', LO: 'LOT', SK: 'SAS', DY: 'NOZ', OU: 'CTN', RO: 'ROT', BT: 'BTI', D8: 'IBK', '4U': 'GWI', AB: 'BER', HG: 'VOE', XG: 'SXS', PC: 'PGT', QS: 'TVS', OK: 'CSA', PS: 'AUI', UX: 'AEA', YW: 'ANE', ZB: 'MON', ZI: 'AUI', ZS: 'EZS', ZY: 'EZY'
    };
    const match = callsign.match(/^([A-Z]{2,3})(\d{1,4})$/i);
    if (match && oaciMap[match[1].toUpperCase()]) {
      const oaci = oaciMap[match[1].toUpperCase()] + match[2];
      variants.push(oaci);
      variants.push(oaci.padEnd(8, ' '));
      variants.push(oaci.padStart(8, '0'));
    }
    // Pour chaque jour et chaque variante, fait un appel
    const requests: { variant: string, begin: number, end: number }[] = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const begin = Math.floor(new Date(day.getFullYear(), day.getMonth(), day.getDate()).getTime() / 1000);
      let end = begin + 24 * 60 * 60;
      // Si c'est aujourd'hui, end = maintenant
      if (i === 0) {
        end = nowTimestamp;
      }
      for (const variant of variants) {
        requests.push({ variant, begin, end });
      }
    }
    // Exécute les requêtes en série jusqu'à trouver un vol complet
    return new Observable<any | null>(observer => {
      const tryNext = (idx: number) => {
        if (idx >= requests.length) {
          observer.next(null);
          observer.complete();
          return;
        }
        const { variant, begin, end } = requests[idx];
        console.log(`[OpenSky] Recherche callsign='${variant}' du ${new Date(begin * 1000).toISOString()} au ${new Date(end * 1000).toISOString()}`);
        this.getFlightInfo(variant, begin, end).pipe(
          catchError(() => of([]))
        ).subscribe((flights: any[]) => {
          if (flights && flights.length) {
            const complete = flights
              .filter(f => f.firstSeen && f.lastSeen && f.estDepartureAirport && f.estArrivalAirport)
              .sort((a, b) => b.lastSeen - a.lastSeen);
            if (complete.length) {
              observer.next(complete[0]);
              observer.complete();
              return;
            }
          }
          tryNext(idx + 1);
        });
      };
      tryNext(0);
    });
  }

  /**
   * Retourne tous les vols arrivant à Genève (GVA) pour un callsign donné sur une période donnée
   */
  getArrivalsToGenevaForCallsign(callsign: string, begin: number, end: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_BASE_URL}/flights/arrival`, {
      params: {
        airport: 'GVA',
        begin: begin.toString(),
        end: end.toString()
      }
    }).pipe(
      map(flights => flights.filter(f => f.callsign && f.callsign.trim() === callsign))
    );
  }

  /**
   * Retourne tous les vols partis de Genève (GVA) pour un callsign donné sur une période donnée
   */
  getDeparturesFromGenevaByCallsign(callsign: string, begin: number, end: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_BASE_URL}/flights/departure`, {
      params: {
        airport: 'GVA',
        begin: begin.toString(),
        end: end.toString()
      }
    }).pipe(
      map(flights => flights.filter(f => f.callsign && f.callsign.trim() === callsign))
    );
  }

  /**
   * Retourne tous les vols partis de Genève (GVA) sur une période donnée (pour debug/test)
   */
  getDeparturesFromGenevaForTest(begin: number, end: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_BASE_URL}/flights/departure`, {
      params: {
        airport: 'GVA',
        begin: begin.toString(),
        end: end.toString()
      }
    });
  }

  /**
   * Récupère l'historique d'un vol via le serveur local FlightRadar24 (pyflightdata)
   */
  getFlightRadarHistory(flightNumber: string): Observable<any> {
    return this.http.get<any>(`http://localhost:5001/api/flightradar/history/${flightNumber}`);
  }
} 