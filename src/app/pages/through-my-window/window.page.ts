import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { WindowService } from '../../services/window.service';
import { TranslationService } from '../../services/translation.service';
import { Auth } from '@angular/fire/auth';
import { DemoService } from '../../services/demo.service';

interface FlightInfo {
  flightNumber: string;
  airline: string;
  aircraft: string;
  callsign?: string;
  registration?: string;
  departure: string;
  arrival: string;
  originIata?: string;
  destinationIata?: string;
  originCity?: string;
  destinationCity?: string;
  originCountry?: string;
  destinationCountry?: string;
  originTimezone?: string;
  destinationTimezone?: string;
  departureTerminal?: string;
  departureGate?: string;
  arrivalTerminal?: string;
  arrivalGate?: string;
  scheduledDeparture?: string;
  realDeparture?: string;
  scheduledArrival?: string;
  realArrival?: string;
  scheduledDepartureUTC?: string;
  realDepartureUTC?: string;
  scheduledArrivalUTC?: string;
  realArrivalUTC?: string;
  duration?: string;
  status: string;
  statusText?: string;
  delay?: string;
  distance?: string;
  altitude?: string;
  speed?: string;
  seat?: string;
  baggage?: string;
  photoUrl?: string;
  arrivalWeather?: any;
  flightDate?: string;
}

@Component({
  selector: 'app-window',
  templateUrl: './window.page.html',
  styleUrls: ['./window.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    FormsModule,
    TranslateModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class WindowPage implements OnInit {
  callsign: string = '';
  loading: boolean = false;
  error: string = '';
  flightInfo: FlightInfo | null = null;
  locale: string;
  dateFormat: string;
  
  // Propriétés pour la gestion des voyages en cours
  hasOngoingTrip: boolean = false;
  ongoingTripInfo: any = null;
  isDemoUser: boolean = false;
  showManualSearch: boolean = false;

  constructor(
    private translate: TranslateService,
    private windowService: WindowService,
    private translationService: TranslationService,
    private auth: Auth,
    private demoService: DemoService
  ) {
    this.locale = this.translationService.getCurrentLang() || 'fr';
    this.dateFormat = this.locale === 'fr' ? 'EEEE d MMMM yyyy à HH:mm' : 'EEEE, MMMM d, yyyy, h:mm a';
  }

  ngOnInit() {
    // Détecter si c'est un rafraîchissement de page
    if (this.isPageRefresh()) {
      console.log('[Window] Rafraîchissement de page détecté - vidage des données');
      this.clearSavedData();
    } else {
      console.log('[Window] Navigation normale - conservation des données');
    }

    // Détecter le mode démo
    this.detectDemoMode();
    
    // Vérifier les voyages en cours
    this.checkOngoingTrips();
  }

  /**
   * Détecte si la page a été rechargée (F5) ou si c'est une navigation normale
   * @returns true si c'est un rafraîchissement, false si c'est une navigation
   */
  private isPageRefresh(): boolean {
    return window.performance.navigation.type === window.performance.navigation.TYPE_RELOAD;
  }

  /**
   * Sauvegarde le callsign pour la navigation entre tuiles (sessionStorage)
   * et pour la persistance longue durée (localStorage)
   */
  private saveCallsign(callsign: string) {
    // SessionStorage pour la navigation entre tuiles
    sessionStorage.setItem('window-callsign-session', callsign);
    // LocalStorage pour la persistance longue durée (optionnel)
    this.windowService.setCallsign(callsign);
  }

  /**
   * Récupère le callsign depuis sessionStorage (priorité) ou localStorage
   */
  getSavedCallsign(): string {
    // Priorité à sessionStorage pour la navigation entre tuiles
    const sessionCallsign = sessionStorage.getItem('window-callsign-session');
    if (sessionCallsign) {
      return sessionCallsign;
    }
    // Fallback sur localStorage
    return this.windowService.getCallsign();
  }

  /**
   * Vérifie s'il y a des données précédentes disponibles
   */
  hasPreviousData(): boolean {
    return !!this.getSavedCallsign();
  }

  /**
   * Restaure les données précédentes
   */
  async restorePreviousData() {
    const savedCallsign = this.getSavedCallsign();
    if (savedCallsign) {
      this.callsign = savedCallsign;
      await this.searchFlight();
    }
  }

  /**
   * Efface toutes les données sauvegardées
   */
  private clearSavedData() {
    sessionStorage.removeItem('window-callsign-session');
    this.callsign = '';
    this.flightInfo = null;
    this.error = '';
    this.loading = false;
  }

  async searchFlight() {
    if (!this.callsign) {
      this.error = 'WINDOW.SEARCH.ERRORS.EMPTY_CALLSIGN';
      return;
    }

    // Sauvegarder le callsign pour la navigation entre tuiles
    this.saveCallsign(this.callsign);

    this.loading = true;
    this.error = '';
    this.flightInfo = null;

    try {
      await this.windowService.searchFlight(this.callsign);
      
      // S'abonner aux mises à jour des données de vol
      this.windowService.flightData$.subscribe(data => {
        if (data.flightNumber) {
          this.flightInfo = {
            flightNumber: data.flightNumber,
            airline: data.airline,
            aircraft: data.aircraftType,
            callsign: data.callsign,
            registration: data.registration,
            departure: data.departure,
            arrival: data.arrival,
            originIata: data.originIata,
            destinationIata: data.destinationIata,
            originCity: data.originCity,
            destinationCity: data.destinationCity,
            originCountry: data.originCountry,
            destinationCountry: data.destinationCountry,
            originTimezone: data.originTimezone,
            destinationTimezone: data.destinationTimezone,
            departureTerminal: data.departureTerminal,
            departureGate: data.departureGate,
            arrivalTerminal: data.arrivalTerminal,
            arrivalGate: data.arrivalGate,
            scheduledDeparture: data.scheduledDeparture,
            realDeparture: data.realDeparture,
            scheduledArrival: data.scheduledArrival,
            realArrival: data.realArrival,
            scheduledDepartureUTC: data.scheduledDepartureUTC,
            realDepartureUTC: data.realDepartureUTC,
            scheduledArrivalUTC: data.scheduledArrivalUTC,
            realArrivalUTC: data.realArrivalUTC,
            duration: data.duration,
            status: data.status,
            statusText: data.statusText,
            delay: data.delay,
            distance: data.distance,
            altitude: data.altitude,
            speed: data.speed,
            seat: data.seat,
            baggage: data.baggage,
            photoUrl: data.photoUrl,
            arrivalWeather: data.arrivalWeather,
            flightDate: data.flightDate
          };
        }
      });

      // S'abonner aux données dynamiques
      this.windowService.dynamicData$.subscribe(data => {
        if (this.flightInfo) {
          this.flightInfo.altitude = data.altitude !== undefined ? String(data.altitude) : undefined;
          this.flightInfo.speed = data.speed !== undefined ? String(data.speed) : undefined;
        }
      });

    } catch (error) {
      this.error = 'WINDOW.SEARCH.ERRORS.API_ERROR';
    } finally {
      this.loading = false;
    }
  }

  arrivalWeatherKeys() {
    return this.flightInfo && this.flightInfo.arrivalWeather
      ? Object.keys(this.flightInfo.arrivalWeather)
      : [];
  }

  getWeatherIcon(condition: string): string {
    if (!condition) return 'wi wi-na';
    const c = condition.toLowerCase();
    if (c.includes('sun') || c.includes('clear') || c.includes('soleil')) return '☀️';
    if (c.includes('cloud') || c.includes('nuage')) return '⛅';
    if (c.includes('rain') || c.includes('pluie')) return '🌧️';
    if (c.includes('storm') || c.includes('orage')) return '⛈️';
    if (c.includes('snow') || c.includes('neige')) return '❄️';
    if (c.includes('fog') || c.includes('brume') || c.includes('mist')) return '🌫️';
    return '🌡️';
  }

  getWeatherEmoji(condition: string): string {
    if (!condition) return '❓';
    const c = condition.toLowerCase();
    if (c.includes('cavok') || c.includes('clear')) return '☀️';
    if (c.includes('nuageux') || c.includes('cloud') || c.includes('few') || c.includes('bkn') || c.includes('ovc') || c.includes('nsc')) return '⛅️';
    if (c.includes('rain') || c.includes('shra') || c.includes('drizzle')) return '🌧️';
    if (c.includes('snow') || c.includes('sn')) return '❄️';
    if (c.includes('fog') || c.includes('br') || c.includes('mist')) return '🌫️';
    if (c.includes('storm') || c.includes('tsra')) return '⛈️';
    return '🌡️';
  }

  getWeatherDesc(condition: string): string {
    if (!condition) return 'Conditions inconnues';
    const c = condition.toLowerCase();
    if (c.includes('cavok')) return 'Ciel dégagé';
    if (c.includes('nuageux') || c.includes('cloud') || c.includes('few') || c.includes('bkn') || c.includes('ovc') || c.includes('nsc')) return 'Nuageux';
    if (c.includes('rain') || c.includes('shra') || c.includes('drizzle')) return 'Pluie';
    if (c.includes('snow') || c.includes('sn')) return 'Neige';
    if (c.includes('fog') || c.includes('br') || c.includes('mist')) return 'Brouillard';
    if (c.includes('storm') || c.includes('tsra')) return 'Orage';
    return condition;
  }

  formatWind(wind: string | {direction?: any, speed?: any, gust?: any}): string {
    if (!wind) return '';
    if (typeof wind === 'string') {
      // Ex: "250° 11kt" ou "VRB02KT"
      const match = wind.match(/(\d{3}|VRB)[° ]*(\d{2,3})kt?/i);
      if (match) {
        const dir = match[1] === 'VRB' ? 'Variable' : match[1] + '°';
        const speed = Math.round(parseInt(match[2], 10) * 1.852); // kt -> km/h
        return `${dir} ${speed} km/h`;
      }
      return wind;
    }
    // Objet
    const dir = wind.direction !== undefined ? (wind.direction === 'VRB' ? 'Variable' : wind.direction + '°') : '';
    const speed = wind.speed !== undefined ? Math.round(Number(wind.speed) * 1.852) + ' km/h' : '';
    const gust = wind.gust !== undefined ? ` (rafales ${Math.round(Number(wind.gust) * 1.852)} km/h)` : '';
    return `${dir} ${speed}${gust}`.trim();
  }

  /**
   * Détecte si l'utilisateur est en mode démo
   */
  private detectDemoMode() {
    const user = this.auth.currentUser;
    if (user) {
      this.isDemoUser = user.uid === 'fUBBVpboDeaUjD6w2nz0xKni9mG3' || 
                       user.uid === 'guest-demo' ||
                       user.email?.endsWith('@demo.com') ||
                       false;
      console.log('[Window] Mode démo détecté:', this.isDemoUser);
    }
  }

  /**
   * Vérifie si l'utilisateur a un voyage en cours et charge automatiquement le vol
   */
  private async checkOngoingTrips() {
    const user = this.auth.currentUser;
    if (!user) {
      console.log('[Window] Aucun utilisateur connecté - pas de vérification de voyage en cours');
      return;
    }

    try {
      console.log('[Window] Vérification des voyages en cours pour:', user.uid);
      
      // Vérifier si l'utilisateur a un voyage en cours
      this.hasOngoingTrip = await this.windowService.hasOngoingTrip(user.uid);
      
      if (this.hasOngoingTrip) {
        console.log('[Window] Voyage en cours détecté');
        
        // Récupérer les détails du voyage en cours
        const ongoingTrips = await this.windowService.getOngoingTrips(user.uid);
        if (ongoingTrips.length > 0) {
          this.ongoingTripInfo = ongoingTrips[0]; // Prendre le premier voyage en cours
          
          // Récupérer les plans de vol
          const flightPlans = await this.windowService.getFlightPlans(this.ongoingTripInfo.id);
          
          if (flightPlans.length > 0) {
            // Extraire le numéro de vol du premier plan de vol
            const flightNumber = this.windowService.extractFlightNumber(flightPlans[0]);
            
            if (flightNumber) {
              console.log('[Window] Numéro de vol extrait du voyage en cours:', flightNumber);
              this.callsign = flightNumber;
              
              // Lancer automatiquement la recherche
              await this.searchFlight();
              return;
            }
          }
        }
      }
      
      // Si pas de voyage en cours ou pas de numéro de vol trouvé
      console.log('[Window] Aucun vol automatique trouvé');
      
      // En mode démo, permettre la recherche manuelle
      if (this.isDemoUser) {
        this.showManualSearch = true;
        console.log('[Window] Mode démo activé - recherche manuelle autorisée');
      }
      
    } catch (error) {
      console.error('[Window] Erreur lors de la vérification des voyages en cours:', error);
    }
  }
} 