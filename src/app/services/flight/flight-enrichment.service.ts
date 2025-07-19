import { Injectable } from '@angular/core';
import { Observable, switchMap, map, catchError, tap } from 'rxjs';
import { OpenSkyService } from './opensky.service';
import { FlightResamplingService } from './flight-resampling.service';
import { TrackPoint } from './models/track-point.interface';
import { from } from 'rxjs';

interface Flight {
  icao24: string;
  firstSeen: number;
  lastSeen: number;
}

@Injectable({
  providedIn: 'root'
})
export class FlightEnrichmentService {
  constructor(
    public openSkyService: OpenSkyService,
    private resamplingService: FlightResamplingService
  ) {}

  /**
   * Enrichit les données d'un vol avec des données réelles d'OpenSky
   * @param callsign Le numéro de vol (ex: "AFR345")
   * @param date La date du vol au format "YYYY-MM-DD"
   * @param mode Le mode de resampling ('time' ou 'distance')
   */
  enrichFlightData(
    callsign: string,
    date: string,
    mode: 'time' | 'distance' = 'time'
  ): Observable<TrackPoint[]> {
    // Convertir la date en timestamps Unix (début et fin de journée)
    const begin = this.dateToUnixTimestamp(date + ' 00:00:00');
    const end = this.dateToUnixTimestamp(date + ' 23:59:59');

    // 1. Récupérer les infos de base du vol pour obtenir l'icao24
    return this.openSkyService.getFlightInfo(callsign, begin, end).pipe(
      // 2. Extraire l'icao24 et le timestamp de départ
      map(flights => {
        if (!flights || flights.length === 0) {
          throw new Error(`Aucun vol trouvé pour ${callsign} le ${date}`);
        }
        const flight = flights[0];
        return {
          icao24: flight.icao24,
          time: flight.firstSeen
        };
      }),
      // 3. Récupérer la trajectoire complète
      switchMap(({ icao24, time }) => 
        this.openSkyService.getFlightTrackPoints(icao24, time)
      ),
      // 4. Resample en 101 points
      map(track => {
        return this.resamplingService.resampleTo200(track);
      })
    );
  }

  /**
   * Convertit une date au format "YYYY-MM-DD HH:mm:ss" en timestamp Unix
   */
  private dateToUnixTimestamp(dateStr: string): number {
    return Math.floor(new Date(dateStr).getTime() / 1000);
  }

  /**
   * Enrichit les données du vol GVA->ATH le plus proche dans le temps
   */
  enrichLatestGvaToAthFlight(): Observable<TrackPoint[]> {
    return from(this.openSkyService.findLatestGvaToAthFlight()).pipe(
      switchMap((flight: Flight) => {
        if (!flight || !flight.icao24 || !flight.firstSeen) {
          throw new Error('Aucun vol GVA->ATH trouvé ou données incomplètes');
        }

        return from(this.openSkyService.getFlightTrack(
          flight.icao24,
          flight.firstSeen,
          flight.lastSeen
        ));
      }),
      catchError(err => {
        console.error('[OpenSky] Erreur dans enrichLatestGvaToAthFlight:', err);
        throw err;
      })
    );
  }
} 