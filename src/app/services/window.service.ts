/**
 * WindowService – Service principal pour la gestion de la fenêtre de vol
 * ---------------------------------------------------------------------
 * Rôle :
 *   - Centralise la gestion des données de vol (FlightData), données dynamiques (vitesse, altitude, position),
 *     points d'intérêt (POI), progression, et callsign utilisateur.
 *   - Fournit des utilitaires pour le formatage des durées, heures, délais, et le décodage METAR.
 *   - Gère la récupération des données de vol (via backend proxy, FR24, AVWX, etc.) et la météo d'arrivée.
 *   - Assure la robustesse de l'expérience utilisateur (fallback, gestion d'erreur, affichage moderne).
 *
 * Bonnes pratiques :
 *   - Utiliser les observables exposés pour la réactivité de l'UI.
 *   - Documenter toute nouvelle méthode ou modification majeure.
 *   - Respecter la séparation des responsabilités (données statiques, dynamiques, POI, etc.).
 *   - Gérer les erreurs de façon explicite et notifier l'utilisateur si besoin.
 *   - Mettre à jour la documentation développeur en cas d'évolution majeure.
 *
 * Pour toute contribution, se référer au fichier DEV_PROMPT.md dans docs/tracking/.
 */

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, firstValueFrom } from 'rxjs';
import { TrackPoint } from './flight/models/track-point.interface';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { OpenSkyService } from './flight/opensky.service';
import { AviationstackService } from './flight/aviationstack.service';
import { TranslationService } from './translation.service';
import { Timestamp } from '@angular/fire/firestore';
import { Firestore, collection, query, where, getDocs } from '@angular/fire/firestore';
import { DemoService } from './demo.service';
import { Auth } from '@angular/fire/auth';

export interface FlightData {
  flightNumber: string;
  airline: string;
  departure: string;
  arrival: string;
  departureTime: string;
  duration: string;
  status: string;
  aircraftType: string;
  callsign?: string;
  registration?: string;
  scheduledDeparture?: string;
  realDeparture?: string;
  scheduledArrival?: string;
  realArrival?: string;
  scheduledDepartureUTC?: string;
  realDepartureUTC?: string;
  scheduledArrivalUTC?: string;
  realArrivalUTC?: string;
  statusText?: string;
  live?: boolean;
  originIata?: string;
  destinationIata?: string;
  originCity?: string;
  destinationCity?: string;
  originCountry?: string;
  destinationCountry?: string;
  originTimezone?: string;
  destinationTimezone?: string;
  photoUrl?: string;
  arrivalWeather?: any;
  arrivalGate?: string;
  arrivalTerminal?: string;
  departureGate?: string;
  departureTerminal?: string;
  delay?: string;
  distance?: string;
  altitude?: string;
  speed?: string;
  seat?: string;
  baggage?: string;
  flightDate?: string;
}

export interface DynamicData {
  altitude: number;
  speed: number;
  position: { lat: number; lng: number } | null;
  weather: string;
  estimatedTimeRemaining: string;
}

export interface POI {
  name: string;
  description: string;
  position: { lat: number; lng: number };
  type: 'city' | 'monument' | 'landmark';
  image?: string;
}

export type WindowMode = 'REAL' | 'DISCONNECTED' | 'DEMO';

@Injectable({
  providedIn: 'root'
})
export class WindowService {
  private segments: TrackPoint[] = [];
  private flightData = new BehaviorSubject<FlightData>({
    flightNumber: '',
    airline: '',
    departure: '',
    arrival: '',
    departureTime: '',
    duration: '',
    status: '',
    aircraftType: ''
  });
  private dynamicData = new BehaviorSubject<DynamicData>({
    altitude: 0,
    speed: 0,
    position: null,
    weather: '',
    estimatedTimeRemaining: ''
  });
  private pois = new BehaviorSubject<POI[]>([]);
  private progress = new BehaviorSubject<number>(0);
  private callsign = new BehaviorSubject<string>(localStorage.getItem('window-callsign') || '');

  flightData$ = this.flightData.asObservable();
  dynamicData$ = this.dynamicData.asObservable();
  pois$ = this.pois.asObservable();
  progress$ = this.progress.asObservable();
  callsign$ = this.callsign.asObservable();

  constructor(
    private http: HttpClient,
    private openSkyService: OpenSkyService,
    private aviationstackService: AviationstackService,
    private translationService: TranslationService,
    private firestore: Firestore,
    private demoService: DemoService,
    private auth: Auth
  ) {}

  getSegments(): Observable<TrackPoint[]> {
    return of(this.segments);
  }

  setSegments(segments: TrackPoint[]) {
    this.segments = segments;
  }

  updatePosition(position: { lat: number; lng: number } | null) {
    const prev = this.dynamicData.value;
    this.dynamicData.next({
      altitude: prev.altitude || 0,
      speed: prev.speed || 0,
      position,
      weather: prev.weather || '',
      estimatedTimeRemaining: prev.estimatedTimeRemaining || ''
    });
  }

  updatePOIs(pois: POI[]) {
    this.pois.next(pois);
  }

  updateFlightData(data: FlightData) {
    this.flightData.next(data);
  }

  updateDynamicData(data: DynamicData) {
    this.dynamicData.next(data);
  }

  updateProgress(percent: number) {
    this.progress.next(percent);
  }

  setCallsign(cs: string) {
    this.callsign.next(cs);
    localStorage.setItem('window-callsign', cs);
  }

  getCallsign(): string {
    return this.callsign.value;
  }

  /**
   * Détecte si l'utilisateur a un voyage en cours
   * @param userId ID de l'utilisateur
   * @returns Promise<boolean> true si un voyage en cours existe
   */
  async hasOngoingTrip(userId: string): Promise<boolean> {
    try {
      const ongoingTrips = await this.getOngoingTrips(userId);
      return ongoingTrips.length > 0;
    } catch (error) {
      console.error('[WindowService] Erreur lors de la détection du voyage en cours:', error);
      return false;
    }
  }

  /**
   * Récupère les voyages en cours de l'utilisateur
   * @param userId ID de l'utilisateur
   * @returns Promise<any[]> Liste des voyages en cours
   */
  async getOngoingTrips(userId: string): Promise<any[]> {
    try {
      // Vérifier si l'utilisateur est en mode démo
      const user = this.auth.currentUser;
      const isDemoUser = user && (
        user.uid === 'fUBBVpboDeaUjD6w2nz0xKni9mG3' || 
        user.uid === 'guest-demo' ||
        user.email?.endsWith('@demo.com')
      );

      if (isDemoUser) {
        // Utiliser le DemoService pour les données démo avec décalages temporels
        const dynamicTrips = await this.demoService.getDynamicDemoData();
        const now = new Date();
        const ongoingTrips: any[] = [];

        for (const trip of dynamicTrips) {
          const startDate = new Date(trip.startDate);
          const endDate = new Date(trip.endDate);
          
          // Un voyage est en cours si la date actuelle est entre startDate et endDate
          if (now >= startDate && now <= endDate) {
            ongoingTrips.push({
              id: trip.id,
              ...trip,
              startDate,
              endDate
            });
          }
        }

        return ongoingTrips;
      }

      // Logique standard pour les utilisateurs non-démo
      const tripsQuery = query(
        collection(this.firestore, 'trips'),
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(tripsQuery);
      const now = new Date();
      const ongoingTrips: any[] = [];

      for (const doc of querySnapshot.docs) {
        const data = doc.data();
        const startDate = data['startDate'] instanceof Timestamp ? data['startDate'].toDate() : new Date(data['startDate']);
        const endDate = data['endDate'] instanceof Timestamp ? data['endDate'].toDate() : new Date(data['endDate']);
        
        // Un voyage est en cours si la date actuelle est entre startDate et endDate
        if (now >= startDate && now <= endDate) {
          ongoingTrips.push({
            id: doc.id,
            ...data,
            startDate,
            endDate
          });
        }
      }

      return ongoingTrips;
    } catch (error) {
      console.error('[WindowService] Erreur lors de la récupération des voyages en cours:', error);
      return [];
    }
  }

  /**
   * Récupère les plans de vol d'un voyage en cours
   * @param tripId ID du voyage
   * @returns Promise<any[]> Liste des plans de vol
   */
  async getFlightPlans(tripId: string): Promise<any[]> {
    try {
      // Vérifier si l'utilisateur est en mode démo
      const user = this.auth.currentUser;
      const isDemoUser = user && (
        user.uid === 'fUBBVpboDeaUjD6w2nz0xKni9mG3' || 
        user.uid === 'guest-demo' ||
        user.email?.endsWith('@demo.com')
      );

      if (isDemoUser) {
        // Utiliser le DemoService pour les données démo avec décalages temporels
        const dynamicTrips = await this.demoService.getDynamicDemoData();
        const trip = dynamicTrips.find(t => t.id === tripId);
        
        if (trip && trip.plans) {
          // Filtrer les plans de type 'flight'
          return trip.plans.filter((plan: any) => plan.type === 'flight').map((plan: any) => ({
            id: plan.id,
            ...plan
          }));
        }
        
        return [];
      }

      // Logique standard pour les utilisateurs non-démo
      const plansQuery = query(
        collection(this.firestore, 'plans'),
        where('tripId', '==', tripId),
        where('type', '==', 'flight')
      );
      
      const querySnapshot = await getDocs(plansQuery);
      const flightPlans: any[] = [];

      for (const doc of querySnapshot.docs) {
        const data = doc.data();
        flightPlans.push({
          id: doc.id,
          ...data
        });
      }

      return flightPlans;
    } catch (error) {
      console.error('[WindowService] Erreur lors de la récupération des plans de vol:', error);
      return [];
    }
  }

  /**
   * Extrait le numéro de vol d'un plan de vol
   * @param plan Plan de vol
   * @returns string | null Numéro de vol ou null
   */
  extractFlightNumber(plan: any): string | null {
    // Essayer d'extraire le numéro de vol du titre ou des détails
    const title = plan.title || '';
    const details = plan.details || {};
    
    // Chercher dans le titre
    const titleMatch = title.match(/([A-Z]{2,3}\d{1,4})/);
    if (titleMatch) {
      return titleMatch[1];
    }
    
    // Chercher dans les détails du vol
    if (details.flight) {
      const flightNumber = details.flight.flight_number || details.flight.flightNumber || details.flight.callsign;
      if (flightNumber) {
        return flightNumber;
      }
    }
    
    // Chercher dans les détails généraux
    const flightNumber = details.flightNumber || details.flight_number || details.callsign;
    if (flightNumber) {
      return flightNumber;
    }
    
    // Chercher dans la description
    const description = plan.description || '';
    const descMatch = description.match(/([A-Z]{2,3}\d{1,4})/);
    if (descMatch) {
      return descMatch[1];
    }
    
    return null;
  }

  // Utilitaire pour formater une durée en secondes en "Xh YY min" ou "YY min"
  formatDuration(seconds: number): string {
    if (!seconds || isNaN(seconds)) return '';
    const totalMinutes = Math.round(seconds / 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours > 0) {
      return minutes > 0 ? `${hours}h ${minutes} min` : `${hours}h`;
    }
    return `${minutes} min`;
  }

  // Utilitaire pour formater un délai en secondes en "Xh YY" ou "YY" (sans "min")
  formatDelay(seconds: number): string {
    if (!seconds || isNaN(seconds)) return '';
    const totalMinutes = Math.round(seconds / 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours > 0) {
      return minutes > 0 ? `${hours}h ${minutes}` : `${hours}h`;
    }
    return `${minutes}`;
  }

  // Formate une heure (timestamp ou string HHmm) selon la langue (24h pour fr, 12h pour en)
  formatHour(value: any, timezone?: string): string {
    if (!value) return '';
    let date: Date | null = null;
    if (typeof value === 'number' && value > 1000000000) { // timestamp (s ou ms)
      date = new Date(value * (value < 1000000000000 ? 1000 : 1));
    } else if (typeof value === 'string' && value.length === 4 && /^\d{4}$/.test(value)) { // HHmm
      const h = parseInt(value.substring(0, 2), 10);
      const m = parseInt(value.substring(2, 4), 10);
      date = new Date();
      date.setHours(h, m, 0, 0);
    }
    if (!date) return value;
    const lang = this.translationService.getCurrentLang?.() || 'fr';
    const opts: Intl.DateTimeFormatOptions = lang === 'fr'
      ? { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: timezone }
      : { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: timezone };
    return date.toLocaleTimeString(lang === 'fr' ? 'fr-FR' : 'en-US', opts);
  }

  // Décodage simple d'un METAR brut (extraction des infos principales)
  decodeMetarRaw(raw: string) {
    if (!raw) return {};
    const result: any = { raw };
    // Température / point de rosée
    const tempMatch = raw.match(/ (\d{2})\/(\d{2}) /);
    if (tempMatch) {
      result.temperature = parseInt(tempMatch[1], 10);
      result.dewpoint = parseInt(tempMatch[2], 10);
    }
    // Pression QNH
    const qnhMatch = raw.match(/ Q(\d{4})/);
    if (qnhMatch) result.pressure = parseInt(qnhMatch[1], 10);
    // Vent
    const windMatch = raw.match(/ (\d{3}|VRB)(\d{2,3})KT/);
    if (windMatch) {
      result.wind = `${windMatch[1]}° ${windMatch[2]}kt`;
    }
    // Condition CAVOK ou nuages
    if (raw.includes('CAVOK')) result.weather = 'CAVOK';
    else if (raw.match(/ FEW| SCT| BKN| OVC/)) result.weather = 'Nuageux';
    // Heure d'observation
    const timeMatch = raw.match(/ (\d{6})Z/);
    if (timeMatch) {
      // Format : DDHHMMZ
      const now = new Date();
      const day = parseInt(timeMatch[1].slice(0, 2), 10);
      const hour = parseInt(timeMatch[1].slice(2, 4), 10);
      const min = parseInt(timeMatch[1].slice(4, 6), 10);
      const obsDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), day, hour, min));
      result.time = obsDate.toISOString();
    }
    return result;
  }

  /**
   * Affiche un message utilisateur (toast ou log) traduit
   * @param key Clé de traduction
   */
  private async showUserMessage(key: string) {
    const message = this.translationService?.instant
      ? this.translationService.instant(key)
      : key;
    // TODO: Afficher un toast si l'UI le permet, sinon fallback log
    // Par défaut, log
    console.warn('[WindowService]', message);
  }

  /**
   * Recherche le dernier vol complet (atterri) pour un callsign, sur 8 jours, via le backend proxy
   */
  async searchFlight(callsign: string) {
    this.setCallsign(callsign);
    // Utilise l'URL du backend depuis l'environnement
    const fr24BaseUrl = environment.fr24ApiBaseUrl || 'http://localhost:5001';
    try {
      const fr24Url = `${fr24BaseUrl}/api/flightradar/history/${callsign}`;
      console.log('Recherche via serveur FR24:', fr24Url);
      const fr24Response = await firstValueFrom(this.http.get<any>(fr24Url));
      if (fr24Response && fr24Response.length > 0) {
        const landedFlight = fr24Response.find((f: any) =>
          f.status?.generic?.status?.text?.toLowerCase() === 'landed'
        ) || fr24Response[0];

        // 1. Photo de l'avion
        let photoUrl = '';
        let photoCopyright = '';
        let photoLink = '';
        if (landedFlight.aircraft?.registration) {
          try {
            const photoRes = await firstValueFrom(this.http.get<any>(`http://localhost:5001/api/flightradar/photo/${landedFlight.aircraft.registration}`));
            if (Array.isArray(photoRes) && photoRes.length > 0) {
              const images = photoRes[0].images;
              if (images?.large?.[0]?.src) {
                photoUrl = images.large[0].src;
                photoCopyright = images.large[0].copyright || '';
                photoLink = images.large[0].link || '';
              } else if (images?.medium?.[0]?.src) {
                photoUrl = images.medium[0].src;
                photoCopyright = images.medium[0].copyright || '';
                photoLink = images.medium[0].link || '';
              } else if (images?.thumbnails?.[0]?.src) {
                photoUrl = images.thumbnails[0].src;
                photoCopyright = images.thumbnails[0].copyright || '';
                photoLink = images.thumbnails[0].link || '';
              }
            }
          } catch (e) { console.error('Erreur photo', e); }
        }

        // 2. Météo à l'arrivée (via AVWX)
        let arrivalWeather = null;
        let iata = landedFlight.airport?.destination?.code?.iata;
        if (iata) {
          try {
            // Heure d'arrivée réelle (en secondes ou ISO)
            let arrivalTime = landedFlight.time?.real?.arrival || landedFlight.time?.scheduled?.arrival;
            if (arrivalTime && typeof arrivalTime === 'string' && arrivalTime.includes('T')) {
              arrivalTime = Date.parse(arrivalTime) / 1000;
            }

            if (arrivalTime && typeof arrivalTime === 'number') {
              // Récupère l'historique METAR
              let metarHistory = await firstValueFrom(this.http.get<any[]>(`http://localhost:5001/api/metar/${iata}/history`));
              // Patch : si c'est un objet {timestamp: metar}, transforme-le en tableau [{time, raw}]
              if (!Array.isArray(metarHistory) && typeof metarHistory === 'object' && metarHistory !== null) {
                metarHistory = Object.entries(metarHistory).map(([time, raw]) => ({ time, raw }));
              }
              if (Array.isArray(metarHistory) && metarHistory.length > 0) {
                // Cherche le METAR dont le timestamp est le plus proche de l'heure d'arrivée
                let bestMetar = metarHistory[0];
                // Patch : supporte time.dt (AVWX) ou time (pyflightdata)
                let minDiff = Math.abs((Date.parse(bestMetar.time?.dt || bestMetar.time) / 1000) - arrivalTime);
                for (const m of metarHistory) {
                  const metarTime = Date.parse(m.time?.dt || m.time) / 1000;
                  const diff = Math.abs(metarTime - arrivalTime);
                  if (diff < minDiff) {
                    minDiff = diff;
                    bestMetar = m;
                  }
                }
                // Si le METAR est à plus de 2h de l'arrivée, on utilise la météo actuelle
                if (minDiff > 7200) { // 2h en secondes
                  const currentMetar = await firstValueFrom(this.http.get<any>(`http://localhost:5001/api/metar/${iata}`));
                  bestMetar = currentMetar;
                }
                // Mapping robuste
                console.log('bestMetar', bestMetar);
                if (bestMetar.temperature || bestMetar.altimeter) {
                  arrivalWeather = {
                    temperature: bestMetar.temperature?.value,
                    dewpoint: bestMetar.dewpoint?.value,
                    wind: {
                      direction: bestMetar.wind_direction?.value,
                      speed: bestMetar.wind_speed?.value,
                      gust: bestMetar.wind_gust?.value
                    },
                    visibility: bestMetar.visibility?.repr,
                    clouds: bestMetar.clouds,
                    pressure: bestMetar.altimeter?.value,
                    raw: bestMetar.raw,
                    time: bestMetar.time?.dt || bestMetar.time,
                    flight_rules: bestMetar.flight_rules,
                    humidity: Math.round((bestMetar.relative_humidity ?? 0) * 100),
                    is_historical: minDiff <= 7200
                  };
                } else if (bestMetar.raw_metar) {
                  arrivalWeather = {
                    raw: bestMetar.raw_metar,
                    time: bestMetar.time?.dt || bestMetar.time,
                    is_historical: minDiff <= 7200
                  };
                } else if (bestMetar.raw) {
                  const decoded = this.decodeMetarRaw(bestMetar.raw);
                  arrivalWeather = {
                    ...decoded,
                    raw: bestMetar.raw,
                    time: bestMetar.time?.dt || bestMetar.time,
                    is_historical: minDiff <= 7200
                  };
                } else if (typeof bestMetar === 'string') {
                  arrivalWeather = {
                    raw: bestMetar,
                    is_historical: minDiff <= 7200
                  };
                }
              }
            } else {
              // Si pas d'heure d'arrivée, on utilise la météo actuelle
              const metarRes = await firstValueFrom(this.http.get<any>(`http://localhost:5001/api/metar/${iata}`));
              console.log('metarRes', metarRes);
              if (metarRes) {
                if (metarRes.temperature || metarRes.altimeter) {
                  arrivalWeather = {
                    temperature: metarRes.temperature?.value,
                    dewpoint: metarRes.dewpoint?.value,
                    wind: {
                      direction: metarRes.wind_direction?.value,
                      speed: metarRes.wind_speed?.value,
                      gust: metarRes.wind_gust?.value
                    },
                    visibility: metarRes.visibility?.repr,
                    clouds: metarRes.clouds,
                    pressure: metarRes.altimeter?.value,
                    raw: metarRes.raw,
                    time: metarRes.time?.dt,
                    flight_rules: metarRes.flight_rules,
                    humidity: Math.round((metarRes.relative_humidity ?? 0) * 100),
                    is_historical: false
                  };
                } else if (metarRes.raw_metar) {
                  arrivalWeather = {
                    raw: metarRes.raw_metar,
                    is_historical: false
                  };
                } else if (metarRes.raw) {
                  const decoded = this.decodeMetarRaw(metarRes.raw);
                  arrivalWeather = {
                    ...decoded,
                    raw: metarRes.raw,
                    is_historical: false
                  };
                } else if (typeof metarRes === 'string') {
                  arrivalWeather = {
                    raw: metarRes,
                    is_historical: false
                  };
                }
              }
            }
          } catch (e) { 
            console.error('Erreur météo AVWX', e);
            // Fallback sur l'ancienne méthode si AVWX échoue
            try {
              const metarRes = await firstValueFrom(this.http.get<any>(`http://localhost:5001/api/flightradar/airport_metars/${iata}`));
              // Mapping robuste fallback
              console.log('metarRes fallback', metarRes);
              if (metarRes) {
                if (metarRes.temperature || metarRes.altimeter) {
                  arrivalWeather = {
                    temperature: metarRes.temperature?.value,
                    dewpoint: metarRes.dewpoint?.value,
                    wind: {
                      direction: metarRes.wind_direction?.value,
                      speed: metarRes.wind_speed?.value,
                      gust: metarRes.wind_gust?.value
                    },
                    visibility: metarRes.visibility?.repr,
                    clouds: metarRes.clouds,
                    pressure: metarRes.altimeter?.value,
                    raw: metarRes.raw,
                    time: metarRes.time?.dt,
                    flight_rules: metarRes.flight_rules,
                    humidity: Math.round((metarRes.relative_humidity ?? 0) * 100),
                    is_historical: false
                  };
                } else if (metarRes.raw_metar) {
                  arrivalWeather = {
                    raw: metarRes.raw_metar,
                    is_historical: false
                  };
                } else if (metarRes.raw) {
                  const decoded = this.decodeMetarRaw(metarRes.raw);
                  arrivalWeather = {
                    ...decoded,
                    raw: metarRes.raw,
                    is_historical: false
                  };
                } else if (typeof metarRes === 'string') {
                  arrivalWeather = {
                    raw: metarRes,
                    is_historical: false
                  };
                }
              }
            } catch (e2) {
              console.error('Erreur metar fallback', e2);
            }
          }
        }

        // Ajout de la date du vol (UTC -> string ISO)
        let flightDate = '';
        if (landedFlight.time?.real?.departure) {
          flightDate = new Date(landedFlight.time.real.departure * 1000).toISOString();
        } else if (landedFlight.time?.scheduled?.departure) {
          flightDate = new Date(landedFlight.time.scheduled.departure * 1000).toISOString();
        }

        // Patch : arrivalWeather ne doit jamais être null
        if (!arrivalWeather) arrivalWeather = {};

        this.updateFlightData({
          flightNumber: landedFlight.identification?.number?.default || callsign,
          callsign: landedFlight.identification?.callsign || '',
          airline: landedFlight.airline?.name || '',
          departure: landedFlight.airport?.origin?.name || '',
          arrival: landedFlight.airport?.destination?.name || '',
          departureTime: this.formatHour(landedFlight.time?.real?.departure, landedFlight.airport?.origin?.timezone?.name),
          scheduledDeparture: this.formatHour(landedFlight.time?.scheduled?.departure_time, landedFlight.airport?.origin?.timezone?.name),
          realDeparture: this.formatHour(landedFlight.time?.real?.departure_time, landedFlight.airport?.origin?.timezone?.name),
          scheduledArrival: this.formatHour(landedFlight.time?.scheduled?.arrival_time, landedFlight.airport?.destination?.timezone?.name),
          realArrival: this.formatHour(landedFlight.time?.real?.arrival_time, landedFlight.airport?.destination?.timezone?.name),
          scheduledDepartureUTC: landedFlight.time?.scheduled?.departure || '',
          realDepartureUTC: landedFlight.time?.real?.departure || '',
          scheduledArrivalUTC: landedFlight.time?.scheduled?.arrival || '',
          realArrivalUTC: landedFlight.time?.real?.arrival || '',
          duration: landedFlight.time?.other?.duration
            ? this.formatDuration(landedFlight.time.other.duration)
            : '',
          status: landedFlight.status?.generic?.status?.text || '',
          statusText: landedFlight.status?.text || '',
          aircraftType: landedFlight.aircraft?.model?.text || '',
          registration: landedFlight.aircraft?.registration || '',
          live: landedFlight.status?.live || false,
          originIata: landedFlight.airport?.origin?.code?.iata || '',
          destinationIata: landedFlight.airport?.destination?.code?.iata || '',
          originCity: landedFlight.airport?.origin?.position?.region?.city || '',
          destinationCity: landedFlight.airport?.destination?.position?.region?.city || '',
          originCountry: landedFlight.airport?.origin?.position?.country?.name || '',
          destinationCountry: landedFlight.airport?.destination?.position?.country?.name || '',
          originTimezone: landedFlight.airport?.origin?.timezone?.name || '',
          destinationTimezone: landedFlight.airport?.destination?.timezone?.name || '',
          photoUrl,
          arrivalWeather,
          arrivalGate: landedFlight.airport?.destination?.gate || '',
          arrivalTerminal: landedFlight.airport?.destination?.terminal || '',
          departureGate: landedFlight.airport?.origin?.gate || '',
          departureTerminal: landedFlight.airport?.origin?.terminal || '',
          delay: landedFlight.status?.generic?.status?.delay
            ? this.formatDelay(landedFlight.status.generic.status.delay)
            : '',
          distance: landedFlight.trail?.distance || '',
          altitude: landedFlight.trail?.altitude || '',
          speed: landedFlight.trail?.speed || '',
          seat: landedFlight.seat || '',
          baggage: landedFlight.baggage || '',
          flightDate,
        });
        return;
      }
    } catch (error) {
      await this.showUserMessage('WINDOW.ERROR_FR24');
      console.error('Erreur serveur FR24:', error);
    }
    // Aucun vol trouvé
    this.updateFlightData({
      flightNumber: callsign,
      airline: this.translationService?.instant ? this.translationService.instant('WINDOW.NO_FLIGHT_AIRLINE') : 'Non trouvé',
      departure: '',
      arrival: '',
      departureTime: '',
      duration: '',
      status: this.translationService?.instant ? this.translationService.instant('WINDOW.NO_FLIGHT_FOUND') : 'Aucun vol trouvé sur les 8 derniers jours',
      aircraftType: '',
      callsign: '',
      registration: '',
      scheduledDeparture: '',
      realDeparture: '',
      scheduledArrival: '',
      realArrival: '',
      statusText: '',
      live: false,
      originIata: '',
      destinationIata: '',
      originCity: '',
      destinationCity: '',
      photoUrl: '',
      arrivalWeather: {},
      arrivalGate: '',
      arrivalTerminal: '',
      departureGate: '',
      departureTerminal: '',
      delay: ''
    });
  }
} 