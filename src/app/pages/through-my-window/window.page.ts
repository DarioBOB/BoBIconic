import { Component, OnInit, OnDestroy } from '@angular/core';
import { IonicModule, AlertController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { WindowService } from '../../services/window.service';
import { TranslationService } from '../../services/translation.service';
import { Auth } from '@angular/fire/auth';
import { DemoService } from '../../services/demo.service';
import { DateTimeService } from '../../services/date-time.service';
import { LoggerService } from '../../services/logger.service';
import { OngoingFlightService, OngoingFlightInfo } from '../../services/ongoing-flight.service';
import { Router } from '@angular/router';
import { FlightMapService } from '../../services/flight/flight-map.service';
import { TrajectoryService } from '../../services/trajectory.service';
import { POIService, POIVisibility } from '../../services/poi/poi.service';
import { POIIconService } from '../../services/poi/poi-icon.service';
import { WindowHublotComponent } from '../../components/window-hublot.component';

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
    TranslateModule,
    WindowHublotComponent
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class WindowPage implements OnInit, OnDestroy {
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
  
  // Propriétés pour les onglets
  selectedTab: string = 'map'; // Changé de 'info' à 'map' pour afficher la carte par défaut
  currentPercent: number = 0;
  currentPOIs: POIVisibility[] = [];
  visiblePOIsLeft: POIVisibility[] = [];
  visiblePOIsRight: POIVisibility[] = [];

  constructor(
    private translate: TranslateService,
    private windowService: WindowService,
    private translationService: TranslationService,
    private auth: Auth,
    private demoService: DemoService,
    private dateTimeService: DateTimeService,
    private loggerService: LoggerService,
    private ongoingFlightService: OngoingFlightService,
    private router: Router,
    private alertController: AlertController,
    private flightMapService: FlightMapService,
    private trajectoryService: TrajectoryService,
    private poiService: POIService,
    private poiIconService: POIIconService
  ) {
    this.locale = this.translationService.getCurrentLang() || 'fr';
    this.dateFormat = this.locale === 'fr' ? 'EEEE d MMMM yyyy à HH:mm' : 'EEEE, MMMM d, yyyy, h:mm a';
  }

  ngOnInit() {
    console.log('[Window] Initialisation de la page window...');
    
    // S'abonner aux changements du vol en cours via le service
    this.ongoingFlightService.ongoingFlight$.subscribe(ongoingFlight => {
      console.log('[Window] Changement détecté dans le vol en cours:', ongoingFlight);
      
      if (ongoingFlight) {
        console.log('[Window] Nouveau vol en cours détecté:', ongoingFlight);
        this.setFlightFromOngoingTrip(ongoingFlight);
        
        // AFFICHER IMMÉDIATEMENT LES INFORMATIONS DU VOL
        this.displayOngoingFlightInfo(ongoingFlight);
      } else {
        console.log('[Window] Aucun vol en cours - effacement des données');
        this.clearSavedData();
      }
    });
    
    // Vérifier s'il y a un vol en cours passé via la navigation
    const navigation = this.router.getCurrentNavigation();
    const ongoingFlight = navigation?.extras?.state?.['ongoingFlight'] as OngoingFlightInfo;
    
    console.log('[Window] Navigation state:', navigation?.extras?.state);
    console.log('[Window] OngoingFlight from navigation:', ongoingFlight);
    
          if (ongoingFlight) {
        console.log('[Window] Vol en cours reçu via navigation:', ongoingFlight);
        this.setFlightFromOngoingTrip(ongoingFlight);
        this.displayOngoingFlightInfo(ongoingFlight);
        
        // Initialiser la carte si on est sur l'onglet carte
        if (this.selectedTab === 'map') {
          setTimeout(() => {
            this.initializeMap();
          }, 500);
        }
      } else {
      // Vérifier s'il y a un vol en cours dans le service
      const savedFlight = this.ongoingFlightService.getCurrentFlightInfo();
      console.log('[Window] SavedFlight from service:', savedFlight);
      
      if (savedFlight) {
        console.log('[Window] Vol en cours trouvé dans le service:', savedFlight);
        this.setFlightFromOngoingTrip(savedFlight);
        this.displayOngoingFlightInfo(savedFlight);
        
        // Initialiser la carte si on est sur l'onglet carte
        if (this.selectedTab === 'map') {
          setTimeout(() => {
            this.initializeMap();
          }, 500);
        }
      } else {
        console.log('[Window] Aucun vol en cours trouvé');
      }
    }
    
    // Détecter si c'est un rafraîchissement de page
    if (this.isPageRefresh()) {
      console.log('[Window] Rafraîchissement de page détecté - vidage des données');
      this.clearSavedData();
    } else {
      // Si ce n'est pas un rafraîchissement, vérifier s'il y a des données à restaurer
      if (this.hasPreviousData()) {
        console.log('[Window] Données précédentes trouvées, restauration...');
        this.restorePreviousData();
      } else {
        console.log('[Window] Navigation normale - aucune donnée précédente');
      }
    }

    // Détecter le mode démo
    this.detectDemoMode();
    
    // Vérifier les voyages en cours
    this.checkOngoingTrips();
    
    // AFFICHER LES VARIABLES GLOBALES DU VOL EN COURS
    this.displayGlobalFlightInfo();
    
    // Initialiser la carte si on est sur l'onglet carte et qu'un vol est détecté
    if (this.selectedTab === 'map' && this.flightInfo) {
      setTimeout(() => {
        this.initializeMap();
      }, 500); // Délai pour s'assurer que le DOM est prêt
    }

    // S'abonner aux POIs visibles
    this.flightMapService.getCurrentPOIs().subscribe(pois => {
      this.currentPOIs = pois;
      this.visiblePOIsLeft = pois.filter(p => p.poi.side === 'left');
      this.visiblePOIsRight = pois.filter(p => p.poi.side === 'right');
      
      this.loggerService.info('Window', 'POIs visibles mis à jour', {
        total: pois.length,
        left: this.visiblePOIsLeft.length,
        right: this.visiblePOIsRight.length
      });
    });
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

  /**
   * Configure le vol à partir des informations du voyage en cours
   */
  private setFlightFromOngoingTrip(ongoingFlight: OngoingFlightInfo): void {
    console.log('[Window] Configuration du vol depuis le voyage en cours:', ongoingFlight);
    
    // Utiliser le numéro de vol comme callsign
    this.callsign = ongoingFlight.flightNumber;
    
    // Créer l'objet FlightInfo
    this.flightInfo = {
      flightNumber: ongoingFlight.flightNumber,
      airline: ongoingFlight.airline,
      aircraft: 'A320', // Valeur par défaut
      departure: ongoingFlight.departure,
      arrival: ongoingFlight.arrival,
      originIata: ongoingFlight.departureIata,
      destinationIata: ongoingFlight.arrivalIata,
      scheduledDeparture: ongoingFlight.scheduledDeparture,
      scheduledArrival: ongoingFlight.scheduledArrival,
      status: ongoingFlight.status,
      statusText: this.getStatusText(ongoingFlight.status)
    };
    
    // Sauvegarder les données dans sessionStorage ET localStorage
    this.saveCallsign(this.callsign);
    sessionStorage.setItem('window-callsign-session', this.callsign);
    localStorage.setItem('window_flight_info', JSON.stringify(this.flightInfo));
    
    console.log('[Window] Vol configuré avec succès:', this.flightInfo);
    console.log('[Window] Callsign sauvegardé:', this.callsign);
    
    // AFFICHER LE NUMÉRO DE VOL DANS LA CONSOLE POUR DEBUG
    console.log('=== DEBUG VOL EN COURS ===');
    console.log('Numéro de vol:', this.callsign);
    console.log('Compagnie:', this.flightInfo?.airline);
    console.log('Départ:', this.flightInfo?.departure);
    console.log('Arrivée:', this.flightInfo?.arrival);
    console.log('========================');
    
    // Forcer la détection de changement pour l'interface
    setTimeout(() => {
      console.log('[Window] Vérification finale - callsign:', this.callsign);
      console.log('[Window] Vérification finale - sessionStorage:', sessionStorage.getItem('window-callsign-session'));
      console.log('[Window] Vérification finale - hasPreviousData:', this.hasPreviousData());
    }, 100);
  }

  /**
   * Convertit le statut en texte lisible
   */
  private getStatusText(status: string): string {
    switch (status) {
      case 'ongoing': return 'En cours';
      case 'upcoming': return 'À venir';
      case 'past': return 'Terminé';
      default: return 'Inconnu';
    }
  }

  /**
   * Affiche immédiatement les informations du vol en cours
   */
  private displayOngoingFlightInfo(ongoingFlight: OngoingFlightInfo): void {
    console.log('[Window] 🔥 AFFICHAGE AUTOMATIQUE DU VOL EN COURS 🔥');
    console.log('[Window] Numéro de vol:', ongoingFlight.flightNumber);
    console.log('[Window] Compagnie:', ongoingFlight.airline);
    console.log('[Window] Départ:', ongoingFlight.departureIata, '→', ongoingFlight.arrivalIata);
    console.log('[Window] Heure départ:', ongoingFlight.scheduledDeparture);
    console.log('[Window] Heure arrivée:', ongoingFlight.scheduledArrival);
    
    // Afficher les variables globales du service
    this.ongoingFlightService.displayCurrentFlightInfo();
    
    // Créer un objet FlightInfo complet pour l'affichage
    this.flightInfo = {
      flightNumber: ongoingFlight.flightNumber,
      airline: ongoingFlight.airline,
      aircraft: 'A320', // Valeur par défaut
      departure: ongoingFlight.departure,
      arrival: ongoingFlight.arrival,
      originIata: ongoingFlight.departureIata,
      destinationIata: ongoingFlight.arrivalIata,
      scheduledDeparture: ongoingFlight.scheduledDeparture,
      scheduledArrival: ongoingFlight.scheduledArrival,
      status: ongoingFlight.status,
      statusText: this.getStatusText(ongoingFlight.status)
    };
    
    // Mettre à jour le callsign pour la recherche automatique
    this.callsign = ongoingFlight.flightNumber;
    
    // Sauvegarder les données
    this.saveCallsign(this.callsign);
    sessionStorage.setItem('window-callsign-session', this.callsign);
    localStorage.setItem('window_flight_info', JSON.stringify(this.flightInfo));
    
    // Afficher une notification à l'utilisateur avec les variables globales
    const departureTime = new Date(ongoingFlight.scheduledDeparture).toLocaleString('fr-FR');
    const arrivalTime = new Date(ongoingFlight.scheduledArrival).toLocaleString('fr-FR');
    
    this.alertController.create({
      header: '🛩️ Vol en cours détecté !',
      message: `Vol ${ongoingFlight.flightNumber} de ${ongoingFlight.departureIata} vers ${ongoingFlight.arrivalIata}\n\nDépart: ${departureTime}\nArrivée: ${arrivalTime}\n\nCompagnie: ${ongoingFlight.airline}`,
      buttons: ['OK']
    }).then(alert => alert.present());
    
    console.log('[Window] ✅ Informations du vol affichées automatiquement !');
  }

  /**
   * Affiche les variables globales du vol en cours
   */
  private displayGlobalFlightInfo(): void {
    console.log('[Window] 🔍 VÉRIFICATION DES VARIABLES GLOBALES 🔍');
    
    const flightNumber = this.ongoingFlightService.getCurrentFlightNumber();
    const airline = this.ongoingFlightService.getCurrentAirline();
    const departureIata = this.ongoingFlightService.getCurrentDepartureIata();
    const arrivalIata = this.ongoingFlightService.getCurrentArrivalIata();
    const departureTime = this.ongoingFlightService.getCurrentDepartureTime();
    const arrivalTime = this.ongoingFlightService.getCurrentArrivalTime();
    
    if (flightNumber) {
      console.log('[Window] ✅ Variables globales trouvées:');
      console.log('[Window] - Numéro de vol:', flightNumber);
      console.log('[Window] - Compagnie:', airline);
      console.log('[Window] - Départ:', departureIata);
      console.log('[Window] - Arrivée:', arrivalIata);
      console.log('[Window] - Heure départ:', departureTime);
      console.log('[Window] - Heure arrivée:', arrivalTime);
      
      // Afficher une notification avec les variables globales
      const departureTimeFormatted = departureTime ? new Date(departureTime).toLocaleString('fr-FR') : 'Non définie';
      const arrivalTimeFormatted = arrivalTime ? new Date(arrivalTime).toLocaleString('fr-FR') : 'Non définie';
      
      this.alertController.create({
        header: '🛩️ Vol en cours - Variables Globales',
        message: `Vol ${flightNumber} de ${departureIata} vers ${arrivalIata}\n\nDépart: ${departureTimeFormatted}\nArrivée: ${arrivalTimeFormatted}\n\nCompagnie: ${airline}`,
        buttons: ['OK']
      }).then(alert => alert.present());
      
      // Mettre à jour l'interface
      this.callsign = flightNumber;
      this.flightInfo = {
        flightNumber: flightNumber,
        airline: airline,
        aircraft: 'A320',
        departure: departureIata,
        arrival: arrivalIata,
        originIata: departureIata,
        destinationIata: arrivalIata,
        scheduledDeparture: departureTime,
        scheduledArrival: arrivalTime,
        status: 'ongoing',
        statusText: 'En cours'
      };
    } else {
      console.log('[Window] ❌ Aucune variable globale trouvée');
    }
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
      this.loggerService.info('Window', 'Mode démo détecté', { 
        userId: user.uid,
        email: user.email,
        isDemoUser: this.isDemoUser
      });
    }
  }

  /**
   * Vérifie si l'utilisateur a un voyage en cours et charge automatiquement le vol
   */
  private async checkOngoingTrips() {
    const user = this.auth.currentUser;
    if (!user) {
      this.loggerService.warn('Window', 'Aucun utilisateur connecté - pas de vérification de voyage en cours');
      return;
    }

    const currentDateTime = this.dateTimeService.getCurrentDateTime();
    this.loggerService.info('Window', 'Vérification des voyages en cours', {
      userId: user.uid,
      currentDateTime: currentDateTime.iso,
      timeZone: currentDateTime.timeZone
    });

    try {
      // Vérifier si l'utilisateur a un voyage en cours
      this.hasOngoingTrip = await this.windowService.hasOngoingTrip(user.uid);
      this.loggerService.debug('Window', 'Vérification hasOngoingTrip', { 
        userId: user.uid, 
        hasOngoingTrip: this.hasOngoingTrip 
      });
      
      if (this.hasOngoingTrip) {
        this.loggerService.info('Window', 'Voyage en cours détecté');
        
        // Récupérer les détails du voyage en cours
        const ongoingTrips = await this.windowService.getOngoingTrips(user.uid);
        this.loggerService.debug('Window', 'Voyages en cours récupérés', { 
          count: ongoingTrips.length,
          trips: ongoingTrips.map(t => ({ id: t.id, title: t.title, startDate: t.startDate, endDate: t.endDate }))
        });
        
        if (ongoingTrips.length > 0) {
          this.ongoingTripInfo = ongoingTrips[0]; // Prendre le premier voyage en cours
          
          // Récupérer les plans de vol
          const flightPlans = await this.windowService.getFlightPlans(this.ongoingTripInfo.id);
          this.loggerService.debug('Window', 'Plans de vol récupérés', { 
            tripId: this.ongoingTripInfo.id,
            plansCount: flightPlans.length,
            plans: flightPlans.map(p => ({ id: p.id, type: p.type, title: p.title }))
          });
          
          if (flightPlans.length > 0) {
            // Extraire le numéro de vol du premier plan de vol
            const flightNumber = this.windowService.extractFlightNumber(flightPlans[0]);
            
            this.loggerService.debug('Window', 'Extraction du numéro de vol', { 
              planId: flightPlans[0].id,
              planTitle: flightPlans[0].title,
              extractedFlightNumber: flightNumber
            });
            
            if (flightNumber) {
              this.loggerService.info('Window', 'Numéro de vol extrait du voyage en cours', { 
                flightNumber: flightNumber,
                tripId: this.ongoingTripInfo.id,
                tripTitle: this.ongoingTripInfo.title
              });
              
              this.callsign = flightNumber;
              
              // Lancer automatiquement la recherche
              await this.searchFlight();
              return;
            }
          }
        }
      }
      
      // Si pas de voyage en cours ou pas de numéro de vol trouvé
      this.loggerService.info('Window', 'Aucun vol automatique trouvé', { 
        hasOngoingTrip: this.hasOngoingTrip,
        ongoingTripsCount: this.ongoingTripInfo ? 1 : 0
      });
      
      // En mode démo, permettre la recherche manuelle
      if (this.isDemoUser) {
        this.showManualSearch = true;
        this.loggerService.info('Window', 'Mode démo activé - recherche manuelle autorisée');
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.loggerService.error('Window', 'Erreur lors de la vérification des voyages en cours', { 
        userId: user.uid,
        error: errorMessage
      }, error instanceof Error ? error : new Error(errorMessage));
    }
  }

  // Méthode pour gérer le changement d'onglet
  onTabChange(event: any) {
    this.selectedTab = event.detail.value;
    this.loggerService.info('Window', `Onglet changé vers: ${this.selectedTab}`);
    
    if (this.selectedTab === 'map' && this.flightInfo) {
      this.initializeMap();
    } else if (this.selectedTab !== 'map') {
      // Nettoyer la carte quand on quitte l'onglet carte
      this.flightMapService.destroy();
    }
  }

  // Méthode pour initialiser la carte
  private initializeMap() {
    if (!this.flightInfo) {
      this.loggerService.warn('Window', 'Impossible d\'initialiser la carte : aucune information de vol');
      return;
    }
    
    this.loggerService.info('Window', 'Initialisation de la carte', {
      flightNumber: this.flightInfo.flightNumber,
      departure: this.flightInfo.departure,
      arrival: this.flightInfo.arrival
    });
    
    try {
      // Calculer le pourcentage de progression basé sur l'heure actuelle
      this.calculateFlightProgress();
      
      // Créer la carte Leaflet avec un délai pour s'assurer que le DOM est prêt
      setTimeout(() => {
        this.loggerService.info('Window', 'Création de la carte Leaflet');
        const map = this.flightMapService.createMap('flight-map');
        
        // Créer les données de vol pour la carte
        const flightData = this.createFlightDataForMap();
        if (flightData) {
          this.loggerService.info('Window', 'Affichage du vol sur la carte');
          this.flightMapService.displayFlight(flightData);
          this.flightMapService.setProgress(this.currentPercent);
          
          // Forcer un refresh de la carte
          setTimeout(() => {
            this.loggerService.info('Window', 'Refresh de la carte');
            this.flightMapService.forceRefresh();
          }, 200);
        } else {
          this.loggerService.error('Window', 'Impossible de créer les données de vol pour la carte');
        }
      }, 200);
      
      this.loggerService.info('Window', 'Carte initialisée pour le vol', {
        flightNumber: this.flightInfo.flightNumber,
        progress: this.currentPercent
      });
    } catch (error) {
      this.loggerService.error('Window', 'Erreur lors de l\'initialisation de la carte', error);
    }
  }

  // Méthode pour créer les données de vol pour la carte
  private createFlightDataForMap(): any {
    if (!this.flightInfo) {
      this.loggerService.warn('Window', 'Aucune information de vol disponible pour la carte');
      return null;
    }

    this.loggerService.info('Window', 'Création des données de vol pour la carte', {
      flightNumber: this.flightInfo.flightNumber,
      departure: this.flightInfo.departure,
      arrival: this.flightInfo.arrival,
      originIata: this.flightInfo.originIata,
      destinationIata: this.flightInfo.destinationIata
    });

    // Coordonnées par défaut (à remplacer par de vraies données d'aéroports)
    const defaultCoords = {
      'CDG': { lat: 49.0097, lng: 2.5479 }, // Paris Charles de Gaulle
      'ORY': { lat: 48.7262, lng: 2.3652 }, // Paris Orly
      'JFK': { lat: 40.6413, lng: -73.7781 }, // New York JFK
      'LAX': { lat: 33.9416, lng: -118.4085 }, // Los Angeles
      'LHR': { lat: 51.4700, lng: -0.4543 }, // London Heathrow
      'FRA': { lat: 50.0379, lng: 8.5622 }, // Frankfurt
      'MAD': { lat: 40.4983, lng: -3.5676 }, // Madrid
      'BCN': { lat: 41.2974, lng: 2.0833 }, // Barcelona
      'AMS': { lat: 52.3105, lng: 4.7683 }, // Amsterdam
      'ZRH': { lat: 47.4588, lng: 8.5559 }, // Zurich
      'GVA': { lat: 46.2381, lng: 6.1089 }, // Genève
      'MUC': { lat: 48.3538, lng: 11.7861 }, // Munich
      'VIE': { lat: 48.1102, lng: 16.5697 }, // Vienna
      'CPH': { lat: 55.6180, lng: 12.6508 }, // Copenhagen
      'ARN': { lat: 59.6498, lng: 17.9238 }, // Stockholm
      'OSL': { lat: 60.1975, lng: 11.1004 }, // Oslo
      'HEL': { lat: 60.3172, lng: 24.9633 }, // Helsinki
      'WAW': { lat: 52.1657, lng: 20.9671 }, // Warsaw
      'PRG': { lat: 50.1009, lng: 14.2600 }, // Prague
      'BUD': { lat: 47.4369, lng: 19.2556 }, // Budapest
      'ATH': { lat: 37.9364, lng: 23.9445 }, // Athens
      'IST': { lat: 41.2751, lng: 28.7519 }, // Istanbul
      'DXB': { lat: 25.2532, lng: 55.3657 }, // Dubai
      'BOM': { lat: 19.0896, lng: 72.8656 }, // Mumbai
      'DEL': { lat: 28.5562, lng: 77.1000 }, // Delhi
      'PEK': { lat: 40.0799, lng: 116.6031 }, // Beijing
      'NRT': { lat: 35.7720, lng: 140.3929 }, // Tokyo Narita
      'SYD': { lat: -33.9399, lng: 151.1753 }, // Sydney
      'YUL': { lat: 45.4706, lng: -73.7408 }, // Montreal
      'YYZ': { lat: 43.6777, lng: -79.6248 }, // Toronto
      'YVR': { lat: 49.1967, lng: -123.1815 }, // Vancouver
      'YOW': { lat: 45.3225, lng: -75.6692 }, // Ottawa
      'YEG': { lat: 53.3097, lng: -113.5792 }, // Edmonton
      'YYC': { lat: 51.1314, lng: -114.0103 }, // Calgary
      'YWG': { lat: 49.9100, lng: -97.2399 }, // Winnipeg
      'YQR': { lat: 50.4319, lng: -104.6658 }, // Regina
      'YXE': { lat: 52.1707, lng: -106.6997 }, // Saskatoon
      'YQB': { lat: 46.7911, lng: -71.3933 }, // Quebec
      'YHZ': { lat: 44.8808, lng: -63.5086 }, // Halifax
      'YQM': { lat: 46.1122, lng: -64.6786 }, // Moncton
      'YYG': { lat: 46.2900, lng: -63.1211 }, // Charlottetown
      'YFC': { lat: 45.8689, lng: -66.5372 }, // Fredericton
      'YQX': { lat: 48.9369, lng: -54.5681 }, // Gander
      'YDF': { lat: 49.2108, lng: -57.3914 }, // Deer Lake
      'YYT': { lat: 47.6186, lng: -52.7519 }, // St. John's
    };

    // Extraire les codes IATA des aéroports
    let originIata = this.flightInfo.originIata;
    let destinationIata = this.flightInfo.destinationIata;

    // Si les codes IATA ne sont pas disponibles, essayer de les extraire des noms
    if (!originIata && this.flightInfo.departure) {
      const extractedOriginIata = this.extractIataFromName(this.flightInfo.departure);
      if (extractedOriginIata) {
        originIata = extractedOriginIata;
        this.loggerService.info('Window', 'Code IATA extrait du nom de départ', {
          departure: this.flightInfo.departure,
          extractedIata: originIata
        });
      }
    }
    if (!destinationIata && this.flightInfo.arrival) {
      const extractedDestIata = this.extractIataFromName(this.flightInfo.arrival);
      if (extractedDestIata) {
        destinationIata = extractedDestIata;
        this.loggerService.info('Window', 'Code IATA extrait du nom d\'arrivée', {
          arrival: this.flightInfo.arrival,
          extractedIata: destinationIata
        });
      }
    }

    // Obtenir les coordonnées des aéroports
    const originCoords = originIata && defaultCoords[originIata as keyof typeof defaultCoords];
    const destCoords = destinationIata && defaultCoords[destinationIata as keyof typeof defaultCoords];

    if (!originCoords || !destCoords) {
      this.loggerService.warn('Window', 'Coordonnées d\'aéroport non trouvées', {
        originIata,
        destinationIata,
        availableAirports: Object.keys(defaultCoords)
      });
      return null;
    }

    this.loggerService.info('Window', 'Coordonnées d\'aéroports trouvées', {
      origin: { iata: originIata, coords: originCoords },
      destination: { iata: destinationIata, coords: destCoords }
    });

    // Générer des points de tracé réaliste avec le service de trajectoire
    const trajectoryPoints = this.trajectoryService.computeGreatCircle(
      [originCoords.lat, originCoords.lng],
      [destCoords.lat, destCoords.lng],
      100 // 100 points pour un tracé fluide
    );

    // Convertir en waypoints pour le service de carte
    const waypoints = trajectoryPoints.map(point => ({
      latitude: point.lat,
      longitude: point.lng
    }));

    this.loggerService.info('Window', 'Points de trajectoire générés', {
      pointCount: waypoints.length,
      firstPoint: waypoints[0],
      lastPoint: waypoints[waypoints.length - 1]
    });

    const flightData = {
      departure: {
        name: this.flightInfo.departure,
        code: originIata,
        latitude: originCoords.lat,
        longitude: originCoords.lng
      },
      arrival: {
        name: this.flightInfo.arrival,
        code: destinationIata,
        latitude: destCoords.lat,
        longitude: destCoords.lng
      },
      waypoints: waypoints,
      flightNumber: this.flightInfo.flightNumber,
      airline: this.flightInfo.airline
    };

    this.loggerService.info('Window', 'Données de vol créées pour la carte', flightData);
    return flightData;
  }

  // Méthode pour calculer la progression du vol
  private calculateFlightProgress() {
    if (!this.flightInfo) return;

    const now = new Date();
    let startTime: Date | null = null;
    let endTime: Date | null = null;

    // Essayer d'utiliser les heures réelles d'abord, puis les heures prévues
    if (this.flightInfo.realDepartureUTC) {
      startTime = new Date(this.flightInfo.realDepartureUTC);
    } else if (this.flightInfo.scheduledDepartureUTC) {
      startTime = new Date(this.flightInfo.scheduledDepartureUTC);
    }

    if (this.flightInfo.realArrivalUTC) {
      endTime = new Date(this.flightInfo.realArrivalUTC);
    } else if (this.flightInfo.scheduledArrivalUTC) {
      endTime = new Date(this.flightInfo.scheduledArrivalUTC);
    }

    if (startTime && endTime) {
      const totalDuration = endTime.getTime() - startTime.getTime();
      const elapsed = now.getTime() - startTime.getTime();
      
      this.currentPercent = Math.max(0, Math.min(100, (elapsed / totalDuration) * 100));
    } else {
      this.currentPercent = 50; // Valeur par défaut si on ne peut pas calculer
    }
  }

  // Méthode pour mettre à jour la progression (appelée par le slider)
  onProgressChange(event: any) {
    console.log('🎛️ Slider changé:', event);
    this.currentPercent = event.detail.value;
    console.log('🎛️ Nouvelle valeur:', this.currentPercent);
    
    this.loggerService.info('Window', `Progression mise à jour: ${this.currentPercent}%`);
    
    // Mettre à jour la position de l'avion sur la carte
    if (this.flightInfo) {
      console.log('🎛️ Mise à jour de la carte avec la progression:', this.currentPercent);
      
      // Si la carte n'est pas encore initialisée, l'initialiser
      if (this.selectedTab === 'map') {
        this.flightMapService.setProgress(this.currentPercent);
      }
    } else {
      console.log('🎛️ Pas de vol en cours, pas de mise à jour de carte');
    }
  }

  onProgressionChange(event: any) {
    this.currentPercent = event.detail.value;
    this.onProgressChange(event);
  }

  getCurrentTime(): string {
    if (!this.flightInfo) return '';
    
    const departureTime = this.flightInfo.scheduledDepartureUTC || this.flightInfo.realDepartureUTC;
    const arrivalTime = this.flightInfo.scheduledArrivalUTC || this.flightInfo.realArrivalUTC;
    
    if (!departureTime || !arrivalTime) return '';
    
    const departure = new Date(departureTime);
    const arrival = new Date(arrivalTime);
    const totalDuration = arrival.getTime() - departure.getTime();
    const currentTime = departure.getTime() + (totalDuration * this.currentPercent / 100);
    
    return new Date(currentTime).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  ngOnDestroy() {
    // Nettoyer la carte quand on quitte la page
    this.flightMapService.destroy();
  }

  // Méthode pour forcer l'initialisation de la carte (bouton de test)
  forceInitializeMap() {
    console.log('🔄 Forçage de l\'initialisation de la carte');
    this.loggerService.info('Window', 'Forçage de l\'initialisation de la carte');
    
    if (this.flightInfo) {
      this.initializeMap();
    } else {
      console.log('🔄 Pas de vol en cours, impossible d\'initialiser la carte');
      this.loggerService.warn('Window', 'Pas de vol en cours, impossible d\'initialiser la carte');
    }
  }

  // Méthode pour déboguer le statut de la carte
  debugMapStatus() {
    console.log('🔍 Debug du statut de la carte:');
    console.log('- selectedTab:', this.selectedTab);
    console.log('- flightInfo:', this.flightInfo);
    console.log('- currentPercent:', this.currentPercent);
    console.log('- callsign:', this.callsign);
    
    this.loggerService.info('Window', 'Debug du statut de la carte', {
      selectedTab: this.selectedTab,
      hasFlightInfo: !!this.flightInfo,
      currentPercent: this.currentPercent,
      callsign: this.callsign
    });
  }

  /**
   * Obtient l'icône pour le type de POI
   */
  getPOIIcon(type: string): string {
    return this.poiIconService.getIcon(type);
  }

  /**
   * Obtient la couleur pour le type de POI
   */
  getPOIColor(type: string): string {
    return this.poiIconService.getColor(type);
  }

  /**
   * Ouvre le lien Wikipedia d'un POI
   */
  openPOIWiki(poi: any): void {
    if (poi.wiki_url) {
      window.open(poi.wiki_url, '_blank');
    }
  }

  /**
   * Formate la distance pour l'affichage
   */
  formatDistance(distance: number): string {
    if (distance < 1) {
      return `${Math.round(distance * 1000)} m`;
    } else {
      return `${distance.toFixed(1)} km`;
    }
  }

  /**
   * Formate l'angle d'élévation pour l'affichage
   */
  formatElevation(angle: number): string {
    if (angle > 0) {
      return `+${angle.toFixed(1)}°`;
    } else {
      return `${angle.toFixed(1)}°`;
    }
  }

  /**
   * Calcule la latitude pour le hublot gauche ou droit
   */
  getHublotLat(side: 'left' | 'right'): number {
    if (!this.flightInfo) return 46.2381; // GVA par défaut
    
    // Calculer la position actuelle selon la progression
    const position = this.calculateCurrentPosition();
    if (!position) return 46.2381;
    
    // Décalage latéral de 10km selon le côté
    const offsetKm = 10;
    const offsetDeg = offsetKm / 111; // 1 degré ≈ 111km
    
    if (side === 'left') {
      return position.lat - offsetDeg;
    } else {
      return position.lat + offsetDeg;
    }
  }

  /**
   * Calcule la longitude pour le hublot gauche ou droit
   */
  getHublotLon(side: 'left' | 'right'): number {
    if (!this.flightInfo) return 6.1089; // GVA par défaut
    
    // Calculer la position actuelle selon la progression
    const position = this.calculateCurrentPosition();
    if (!position) return 6.1089;
    
    // Décalage latéral de 10km selon le côté
    const offsetKm = 10;
    const offsetDeg = offsetKm / (111 * Math.cos(position.lat * Math.PI / 180));
    
    if (side === 'left') {
      return position.lon - offsetDeg;
    } else {
      return position.lon + offsetDeg;
    }
  }

  /**
   * Calcule la position actuelle selon la progression du vol
   */
  private calculateCurrentPosition(): { lat: number, lon: number } | null {
    if (!this.flightInfo) return null;
    
    // Coordonnées des aéroports
    const defaultCoords: { [key: string]: { lat: number, lng: number } } = {
      GVA: { lat: 46.2381, lng: 6.1089 },
      ATH: { lat: 37.9364, lng: 23.9445 },
      BRU: { lat: 50.9010, lng: 4.4844 },
      CDG: { lat: 49.0097, lng: 2.5479 },
      LHR: { lat: 51.4700, lng: -0.4543 },
      JFK: { lat: 40.6413, lng: -73.7781 }
    };

    // Extraire les codes IATA
    let originIata = this.flightInfo.originIata;
    let destinationIata = this.flightInfo.destinationIata;

    if (!originIata && this.flightInfo.departure) {
      const extractedOriginIata = this.extractIataFromName(this.flightInfo.departure);
      if (extractedOriginIata) {
        originIata = extractedOriginIata;
      }
    }

    if (!destinationIata && this.flightInfo.arrival) {
      const extractedDestIata = this.extractIataFromName(this.flightInfo.arrival);
      if (extractedDestIata) {
        destinationIata = extractedDestIata;
      }
    }

    // Obtenir les coordonnées des aéroports
    const originCoords = originIata && defaultCoords[originIata as keyof typeof defaultCoords];
    const destCoords = destinationIata && defaultCoords[destinationIata as keyof typeof defaultCoords];

    if (!originCoords || !destCoords) {
      return null;
    }

    // Interpolation linéaire selon la progression
    const progress = this.currentPercent / 100;
    const lat = originCoords.lat + (destCoords.lat - originCoords.lat) * progress;
    const lon = originCoords.lng + (destCoords.lng - originCoords.lng) * progress;

    return { lat, lon };
  }

  /**
   * Calcule l'altitude actuelle selon la progression
   */
  getCurrentAltitude(): number {
    // Profil d'altitude réaliste : montée, croisière, descente
    if (this.currentPercent < 10) {
      // Montée : 0 à 35000 ft en 10% du trajet
      return (this.currentPercent / 10) * 35000;
    } else if (this.currentPercent > 90) {
      // Descente : 35000 à 0 ft dans les 10% finaux
      return ((100 - this.currentPercent) / 10) * 35000;
    } else {
      // Croisière : 35000 ft
      return 35000;
    }
  }

  // Méthode pour extraire le code IATA à partir du nom d'aéroport
  private extractIataFromName(airportName: string): string | null {
    const iataMap: { [key: string]: string } = {
      'genève': 'GVA',
      'geneva': 'GVA',
      'athens': 'ATH',
      'athènes': 'ATH',
      'paris': 'CDG',
      'london': 'LHR',
      'frankfurt': 'FRA',
      'madrid': 'MAD',
      'barcelona': 'BCN',
      'amsterdam': 'AMS',
      'zurich': 'ZRH',
      'munich': 'MUC',
      'vienna': 'VIE',
      'copenhagen': 'CPH',
      'stockholm': 'ARN',
      'oslo': 'OSL',
      'helsinki': 'HEL',
      'warsaw': 'WAW',
      'prague': 'PRG',
      'budapest': 'BUD',
      'istanbul': 'IST',
      'dubai': 'DXB',
      'mumbai': 'BOM',
      'delhi': 'DEL',
      'beijing': 'PEK',
      'tokyo': 'NRT',
      'sydney': 'SYD',
      'montreal': 'YUL',
      'toronto': 'YYZ',
      'vancouver': 'YVR',
      'ottawa': 'YOW',
      'edmonton': 'YEG',
      'calgary': 'YYC',
      'winnipeg': 'YWG',
      'regina': 'YQR',
      'saskatoon': 'YXE',
      'quebec': 'YQB',
      'halifax': 'YHZ',
      'moncton': 'YQM',
      'charlottetown': 'YYG',
      'fredericton': 'YFC',
      'gander': 'YQX',
      'deer lake': 'YDF',
      'st. john\'s': 'YYT'
    };

    const normalizedName = airportName.toLowerCase();
    
    // Recherche exacte
    if (iataMap[normalizedName]) {
      return iataMap[normalizedName];
    }

    // Recherche partielle
    for (const [name, iata] of Object.entries(iataMap)) {
      if (normalizedName.includes(name) || name.includes(normalizedName)) {
        return iata;
      }
    }

    return null;
  }
} 