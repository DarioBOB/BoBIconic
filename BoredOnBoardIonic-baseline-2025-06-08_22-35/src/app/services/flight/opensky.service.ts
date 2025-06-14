import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, tap, throwError, switchMap, from, concatMap, reduce, of, filter, take, forkJoin } from 'rxjs';
import { TrackPoint } from './models/track-point.interface';
import { environment } from '../../../environments/environment';

// Centralisation des variables en haut du fichier
const DEFAULT_API_BASE_URL = environment.openskyProxyBaseUrl || 'http://localhost:3000/api/opensky/api';
const DEFAULT_MAX_DAYS = environment.openskyMaxDays || 5;
const DEFAULT_SEARCH_DURATION = environment.openskyDefaultSearchDuration || 3600; // 1h

@Injectable({
  providedIn: 'root'
})
export class OpenSkyService {
  private readonly API_BASE_URL = DEFAULT_API_BASE_URL;
  private readonly MAX_DAYS = DEFAULT_MAX_DAYS;
  private readonly DEFAULT_SEARCH_DURATION = DEFAULT_SEARCH_DURATION;

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
    console.log(`[OpenSky] getFlightInfo: callsign=${callsign}, begin=${begin}, end=${end}`);
    const url = `${this.API_BASE_URL}/flights/callsign/${callsign}?begin=${begin}&end=${end}`;
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
   * Récupère la trajectoire complète d'un vol à partir de son icao24
   */
  getFlightTrack(icao24: string, time: number): Observable<any> {
    // Utiliser l'API directe d'OpenSky pour avoir plus de points
    const url = `https://opensky-network.org/api/tracks/all?icao24=${icao24}&time=${time}`;
    const auth = btoa(`${environment.opensky.username}:${environment.opensky.password}`);
    
    return from(
      fetch(url, {
        headers: {
          'Authorization': `Basic ${auth}`
        }
      })
        .then(r => {
          if (!r.ok) throw new Error('Erreur HTTP ' + r.status);
          return r.json();
        })
    ).pipe(
      tap(response => console.log('[OpenSky] Réponse brute trajectoire:', response)),
      catchError(error => {
        console.error('[OpenSky] Erreur récupération trajectoire:', error);
        alert('Erreur lors de la récupération de la trajectoire. Vérifiez vos identifiants OpenSky.');
        return throwError(() => error);
      })
    );
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
    return this.getFlightTrack(icao24, time).pipe(
      tap(response => console.log('[OpenSky] Réponse brute trajectoire:', response)),
      map(response => {
        if (!response || !Array.isArray(response.path) || response.path.length === 0) {
          console.error('[OpenSky] Trajectoire absente ou vide, fallback simulation');
          throw new Error('Trajectoire indisponible ou vide pour ce vol');
        }
        const points = this.convertRawTrackToPoints(response.path);
        console.log('[OpenSky] Points convertis:', points);
        return points;
      }),
      catchError(err => {
        console.error('[OpenSky] Erreur mapping trajectoire:', err);
        throw err;
      })
    );
  }

  /**
   * Recherche le vol GVA -> ATH le plus proche dans les 5 derniers jours (optimisé : s'arrête au premier trouvé)
   */
  findLatestGvaToAthFlight(): Observable<any | null> {
    const nowDate = new Date();
    const maxDays = this.MAX_DAYS;
    const requests: (() => Observable<any[]>)[] = [];
    for (let i = 1; i <= maxDays; i++) {
      const day = new Date(Date.UTC(nowDate.getUTCFullYear(), nowDate.getUTCMonth(), nowDate.getUTCDate() - i, 0, 0, 0));
      const begin = Math.floor(day.getTime() / 1000);
      const end = begin + 24 * 3600;
      console.log(`[OpenSky] Recherche vols GVA->ATH du ${new Date(begin * 1000).toISOString()} au ${new Date(end * 1000).toISOString()}`);
      const url = `${this.API_BASE_URL}/flights/arrival?airport=LGAV&begin=${begin}&end=${end}`;
      requests.push(() => this.http.get<any[]>(url).pipe(
        tap(result => {
          console.log(`[OpenSky] Vols bruts pour ${new Date(begin * 1000).toISOString()}:`, result);
        }),
        catchError(error => {
          if (error.status === 0) {
            alert('Le serveur proxy OpenSky n\'est pas lancé. Lancez-le avec "node server.js" dans le dossier du projet.');
          }
          return of([]);
        })
      ));
    }
    // Exécute les requêtes en série et s'arrête au premier vol trouvé
    return from(requests).pipe(
      concatMap(reqFn => reqFn()),
      map(result => result.filter(f =>
        f.estDepartureAirport === "LSGG" &&
        f.estArrivalAirport === "LGAV"
      )),
      concatMap(filtered => {
        if (filtered.length > 0) {
          console.log('[OpenSky] Vol GVA->ATH trouvé (retourné à l\'enrichissement):', filtered[0]);
          return of(filtered[0]);
        }
        return of(null);
      }),
      filter(flight => !!flight), // Ne garde que les vols trouvés
      take(1), // Prend le premier vol trouvé et s'arrête
      tap(flight => console.log('[OpenSky] Vol transmis à enrichLatestGvaToAthFlight:', flight)),
    );
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
} 