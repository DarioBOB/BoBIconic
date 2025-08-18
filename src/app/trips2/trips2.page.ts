// src/app/trips2/trips2.page.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController } from '@ionic/angular';
import { Router } from '@angular/router';

import { TimezoneConverterServiceGeminiGenerated } from './services/timezone-converter-service-gemini-generated';
import { PlanGenerated, TripGenerated } from './models/trip-gemini-generated.model';
import { AviationstackService } from '../services/flight/aviationstack.service';
import { POIService } from '../services/poi/poi.service';
import { FlightData } from '../services/flight/models/flight.interface';
import { Trips2FirestoreService } from '../services/trips2-firestore.service';
import { Trips2LocalDBService } from '../services/trips2-local-db.service';
import { Trips2ImageService } from '../services/trips2-image.service';
import { OngoingFlightService, OngoingFlightInfo } from '../services/ongoing-flight.service';

@Component({
  selector: 'app-trips2',
  templateUrl: './trips2.page.html',
  styleUrls: ['./trips2.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class Trips2PageGenerated implements OnInit {

  pastTripsGenerated: TripGenerated[] = [];
  ongoingTripsGenerated: TripGenerated[] = [];
  upcomingTripsGenerated: TripGenerated[] = [];

  selectedSegmentGenerated: 'ongoing' | 'upcoming' | 'past' = 'ongoing';

  // Propriétés pour le modal d'image
  showImageModal = false;
  selectedTripForImage: any = null;
  activeTab: 'upload' | 'url' | 'preset' = 'upload';
  selectedFile: File | null = null;
  customImageUrl = '';
  predefinedImages = [
    'https://placehold.co/400x200/FF5733/FFFFFF?text=Marrakech',
    'https://placehold.co/400x200/33FF57/FFFFFF?text=Athens',
    'https://placehold.co/400x200/5733FF/FFFFFF?text=Montreal',
    'https://placehold.co/400x200/FF33F5/FFFFFF?text=Paris',
    'https://placehold.co/400x200/33FFF5/FFFFFF?text=Tokyo',
    'https://placehold.co/400x200/F5FF33/FFFFFF?text=New+York'
  ];

  constructor(
    private timezoneConverterServiceGeminiGenerated: TimezoneConverterServiceGeminiGenerated,
    private aviationstackService: AviationstackService,
    private poiService: POIService,
    private trips2FirestoreService: Trips2FirestoreService,
    public trips2LocalDBService: Trips2LocalDBService,
    private trips2ImageService: Trips2ImageService,
    private alertController: AlertController,
    private ongoingFlightService: OngoingFlightService,
    private router: Router
  ) { }

  ngOnInit() {
    // Exposer les services pour le debug
    (window as any).trips2Page = this;
    (window as any).trips2LocalDBService = this.trips2LocalDBService;
    (window as any).trips2ImageService = this.trips2ImageService;
    
    console.log('[Trips2] Services exposés pour debug:', {
      trips2Page: this,
      trips2LocalDBService: this.trips2LocalDBService,
      trips2ImageService: this.trips2ImageService
    });
    
    // FORCER la régénération avec décalage temporel
    console.log('[Trips2] FORÇAGE de la régénération au démarrage...');
    this.forceRegenerateWithOffset();
    
    // DÉTECTER ET STOCKER AUTOMATIQUEMENT LE VOL EN COURS
    console.log('[Trips2] 🔥 DÉTECTION AUTOMATIQUE DU VOL EN COURS 🔥');
    setTimeout(() => {
      this.detectAndSaveOngoingFlight();
    }, 2000); // Attendre 2 secondes que les données soient chargées
  }

  /**
   * Charge les voyages avec fallback : Firestore d'abord, puis DB locale
   */
  private loadTripsWithFallback(): void {
    console.log('[Trips2] Tentative de chargement depuis Firestore...');
    
    // Essayer d'abord Firestore
    this.trips2FirestoreService.getTripsWithEnrichedPlans().subscribe({
      next: (firestoreTrips) => {
        if (firestoreTrips && firestoreTrips.length > 0) {
          console.log('[Trips2] Voyages chargés depuis Firestore:', firestoreTrips.length);
          this.processAndDisplayTrips(firestoreTrips);
          
          // Synchroniser avec la DB locale
          this.trips2LocalDBService.syncWithFirestore(firestoreTrips).then(() => {
            console.log('[Trips2] Synchronisation avec DB locale terminée');
          });
        } else {
          console.log('[Trips2] Aucun voyage dans Firestore, tentative DB locale...');
          this.loadFromLocalDB();
        }
      },
      error: (error) => {
        console.warn('[Trips2] Erreur Firestore, fallback vers DB locale:', error);
        this.loadFromLocalDB();
      }
    });
  }

  /**
   * Charge les voyages depuis la DB locale
   */
  private loadFromLocalDB(): void {
    console.log('[Trips2] Chargement depuis la DB locale...');
    
    this.trips2LocalDBService.getTripsWithPlans().subscribe({
      next: (localTrips) => {
        console.log('[Trips2] Réponse DB locale reçue:', localTrips);
        console.log('[Trips2] Nombre de voyages:', localTrips?.length || 0);
        
        if (localTrips && localTrips.length > 0) {
          console.log('[Trips2] Voyages chargés depuis DB locale:', localTrips.length);
          localTrips.forEach((trip, index) => {
            console.log(`[Trips2] Voyage ${index + 1}: ${trip.name} (${trip.status}) - ${trip.plans?.length || 0} plans`);
            // Log des dates originales
            console.log(`[Trips2]   Dates originales: ${trip.startDate.toISOString()} → ${trip.endDate.toISOString()}`);
          });
          
          // FORCER le traitement avec décalage temporel
          console.log('[Trips2] Application FORCÉE du décalage temporel...');
          this.processAndDisplayTrips(localTrips);
        } else {
          console.log('[Trips2] Aucun voyage en local, génération des voyages de démo...');
          this.loadAndProcessDemoTripsGeminiGenerated();
        }
      },
      error: (error) => {
        console.error('[Trips2] Erreur DB locale, génération des voyages de démo:', error);
        this.loadAndProcessDemoTripsGeminiGenerated();
      }
    });
  }

  /**
   * Force la régénération des données avec décalage temporel
   */
  private forceRegenerateWithOffset(): void {
    console.log('[Trips2] FORÇAGE de la régénération avec décalage temporel...');
    
    // Nettoyer la DB locale
    this.trips2LocalDBService.clearAllData().then(() => {
      console.log('[Trips2] DB locale nettoyée, régénération des voyages de démo...');
      this.loadAndProcessDemoTripsGeminiGenerated();
    });
  }

  /**
   * Traite et affiche les voyages avec décalage temporel
   */
  private processAndDisplayTrips(trips: TripGenerated[]): void {
    console.log('[Trips2] Traitement des voyages avec décalage temporel...');
    console.log('[Trips2] Voyages reçus:', trips.length);
    
    // FORCER l'application du décalage temporel à chaque voyage
    trips.forEach((trip, index) => {
      console.log(`[Trips2] Traitement voyage ${index + 1}: ${trip.name} (${trip.status})`);
      
      // Sauvegarder les dates originales pour debug
      const originalStart = new Date(trip.startDate);
      const originalEnd = new Date(trip.endDate);
      
      // Appliquer le décalage temporel FORCÉ
      this.applyTimeOffset(trip, trip.status);
      
      // Log des changements de dates
      console.log(`[Trips2] Dates modifiées pour "${trip.name}":`);
      console.log(`[Trips2]   Début: ${originalStart.toISOString()} → ${trip.startDate.toISOString()}`);
      console.log(`[Trips2]   Fin: ${originalEnd.toISOString()} → ${trip.endDate.toISOString()}`);
      
      // Enrichir les plans avec des détails si nécessaire
      trip.plans.forEach(plan => {
        if (!plan.details || Object.keys(plan.details).length === 0) {
          this.enrichPlanWithDetails(plan);
        }
      });
    });

    // Répartir les voyages selon leur statut
    this.pastTripsGenerated = trips.filter(t => t.status === 'past');
    this.ongoingTripsGenerated = trips.filter(t => t.status === 'ongoing');
    this.upcomingTripsGenerated = trips.filter(t => t.status === 'upcoming');

    console.log('[Trips2] Voyages traités et affichés:', {
      past: this.pastTripsGenerated.length,
      ongoing: this.ongoingTripsGenerated.length,
      upcoming: this.upcomingTripsGenerated.length
    });
    
    // Log détaillé de chaque catégorie
    console.log('[Trips2] Voyages passés:', this.pastTripsGenerated.map(t => t.name));
    console.log('[Trips2] Voyages en cours:', this.ongoingTripsGenerated.map(t => t.name));
    console.log('[Trips2] Voyages futurs:', this.upcomingTripsGenerated.map(t => t.name));
    
    // Détecter et sauvegarder le vol en cours
    this.detectAndSaveOngoingFlight();
  }

  /**
   * Détecte et sauvegarde le vol en cours pour la page window
   */
  private detectAndSaveOngoingFlight(): void {
    console.log('[Trips2] Détection du vol en cours...');
    console.log('[Trips2] Nombre de voyages en cours:', this.ongoingTripsGenerated.length);
    
    if (this.ongoingTripsGenerated.length === 0) {
      console.log('[Trips2] ERREUR: Aucun voyage en cours trouvé !');
      console.log('[Trips2] Voyages disponibles:', {
        past: this.pastTripsGenerated.length,
        ongoing: this.ongoingTripsGenerated.length,
        upcoming: this.upcomingTripsGenerated.length
      });
      this.ongoingFlightService.clearOngoingFlight();
      return;
    }
    
    // Chercher dans les voyages en cours
    for (const trip of this.ongoingTripsGenerated) {
      console.log(`[Trips2] Vérification du voyage: ${trip.name}`);
      console.log(`[Trips2] Nombre de plans dans ce voyage: ${trip.plans.length}`);
      
      // Chercher le premier vol du voyage en cours et vérifier qu'il est vraiment en cours
      const firstFlight = trip.plans
        .filter(p => p.type === 'flight')
        .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())[0];
      
      if (firstFlight) {
        console.log('[Trips2] Premier vol trouvé dans le voyage en cours:', firstFlight);
        
        // Vérifier que "now" est bien entre startDate et endDate de CE vol
        const nowMs = Date.now();
        const flightStartMs = firstFlight.startDate.getTime();
        const flightEndMs = firstFlight.endDate.getTime();
        
        console.log('[Trips2] Vérification temporelle du vol:', {
          now: new Date(nowMs).toISOString(),
          flightStart: firstFlight.startDate.toISOString(),
          flightEnd: firstFlight.endDate.toISOString(),
          isNowBetween: nowMs >= flightStartMs && nowMs <= flightEndMs
        });
        
        if (nowMs < flightStartMs || nowMs > flightEndMs) {
          console.warn('[Trips2] Le premier vol n\'est pas en cours, je ne l\'envoie pas.');
          console.warn('[Trips2] Le vol est:', nowMs < flightStartMs ? 'pas encore commencé' : 'déjà terminé');
          continue; // Chercher dans le prochain voyage
        }
        
        console.log('[Trips2] Vol en cours confirmé !');
        console.log('[Trips2] Détails du vol:', {
          type: firstFlight.type,
          flightNumber: this.getFlightNumber(firstFlight),
          airline: this.getAirline(firstFlight),
          departure: this.getDepartureAirport(firstFlight),
          arrival: this.getArrivalAirport(firstFlight),
          startDate: firstFlight.startDate,
          endDate: firstFlight.endDate,
          status: firstFlight.status
        });
        
        // Créer l'objet FlightInfo avec les codes IATA corrects
        const flightInfo: OngoingFlightInfo = {
          flightNumber: this.getFlightNumber(firstFlight),
          airline: this.getAirline(firstFlight),
          departure: this.getDepartureAirport(firstFlight),
          arrival: this.getArrivalAirport(firstFlight),
          departureIata: firstFlight.details?.flight?.departure?.airport || '', // Code IATA (GVA, RAK, etc.)
          arrivalIata: firstFlight.details?.flight?.arrival?.airport || '', // Code IATA (GVA, RAK, etc.)
          scheduledDeparture: firstFlight.startDate.toISOString(),
          scheduledArrival: firstFlight.endDate.toISOString(),
          status: 'ongoing', // Forcer le statut ongoing
          tripId: trip.id,
          planId: firstFlight.id
        };
        
        console.log('[Trips2] FlightInfo créé:', flightInfo);
        
        // Sauvegarder dans le service
        this.ongoingFlightService.setOngoingFlight(flightInfo);
        console.log('[Trips2] Vol en cours sauvegardé pour la page window:', flightInfo);
        
        // Vérification immédiate
        const savedFlight = this.ongoingFlightService.getCurrentFlightInfo();
        console.log('[Trips2] Vérification - vol sauvegardé:', savedFlight);
        
        // Navigation explicite vers Window avec l'état (OPTIONNEL - peut être déclenchée par un bouton)
        // this.navigateToWindow(flightInfo);
        
        // Log du succès pour debug
        console.log('[Trips2] ✅ Vol en cours détecté et sauvegardé avec succès !');
        console.log('[Trips2] Numéro de vol:', flightInfo.flightNumber);
        console.log('[Trips2] Départ:', flightInfo.departureIata, '→', flightInfo.arrivalIata);
        console.log('[Trips2] Heure départ:', flightInfo.scheduledDeparture);
        console.log('[Trips2] Heure arrivée:', flightInfo.scheduledArrival);
        console.log('[Trips2] Prêt pour transmission vers Window');
        
        // AFFICHER IMMÉDIATEMENT LES INFORMATIONS DU VOL
        this.displayOngoingFlightInfo(flightInfo);
        
        return; // Sortir dès qu'on a trouvé un vol en cours
      } else {
        console.log('[Trips2] Aucun vol trouvé dans ce voyage');
      }
    }
    
    // Si aucun vol en cours trouvé, effacer les données précédentes
    console.log('[Trips2] Aucun vol en cours trouvé, effacement des données précédentes');
    this.ongoingFlightService.clearOngoingFlight();
  }

  /**
   * Applique un décalage temporel selon le statut du voyage
   */
  private applyTimeOffset(trip: TripGenerated, status: string): void {
    const now = new Date();
    const DAY = 24 * 60 * 60 * 1000;
    
    console.log(`[Trips2] Application du décalage temporel pour le voyage: ${trip.name} (${status})`);
    
    let offsetMs = 0;
    
    switch (status) {
      case 'past':
        // Voyage passé : décaler de -30 jours
        offsetMs = -30 * DAY;
        console.log(`[Trips2] Décalage passé: -30 jours`);
        break;
        
      case 'ongoing':
        // Voyage en cours : positionner le premier plan à 1/3 de la durée totale avant maintenant
        const tripDuration = trip.endDate.getTime() - trip.startDate.getTime();
        const newFirstStart = new Date(now.getTime() - tripDuration / 3);
        offsetMs = newFirstStart.getTime() - trip.startDate.getTime();
        console.log(`[Trips2] Décalage en cours: ${Math.round(offsetMs / (60 * 60 * 1000))}h`);
        break;
        
      case 'upcoming':
        // Voyage futur : décaler de +60 jours
        offsetMs = 60 * DAY;
        console.log(`[Trips2] Décalage futur: +60 jours`);
        break;
        
      default:
        console.log(`[Trips2] Aucun décalage appliqué pour le statut: ${status}`);
        return;
    }
    
    // Appliquer l'offset à toutes les dates du voyage
    trip.startDate = new Date(trip.startDate.getTime() + offsetMs);
    trip.endDate = new Date(trip.endDate.getTime() + offsetMs);
    
    // Appliquer l'offset à tous les plans
    trip.plans.forEach(plan => {
      plan.startDate = new Date(plan.startDate.getTime() + offsetMs);
      plan.endDate = new Date(plan.endDate.getTime() + offsetMs);
      
      // Corriger les heures pour qu'elles soient réalistes (06:00-22:00)
      const planStartHour = plan.startDate.getHours();
      if (planStartHour < 6 || planStartHour >= 22) {
        const originalStart = new Date(plan.startDate);
        const originalEnd = new Date(plan.endDate);
        const duration = originalEnd.getTime() - originalStart.getTime();
        
        // Forcer l'heure de début à 10:00
        plan.startDate.setHours(10, 0, 0, 0);
        plan.endDate = new Date(plan.startDate.getTime() + duration);
        
        console.log(`[Trips2] Heure corrigée pour "${plan.name}": ${planStartHour}h → 10h00`);
      }
    });
    
    // Recalculer le statut dynamique basé sur les nouvelles dates
    this.recalculateTripStatus(trip);
    
    console.log(`[Trips2] Décalage appliqué pour "${trip.name}": ${trip.startDate.toISOString()} → ${trip.endDate.toISOString()}`);
  }

  /**
   * Recalcule le statut du voyage basé sur les dates actuelles
   */
  private recalculateTripStatus(trip: TripGenerated): void {
    const now = new Date();
    
    // Calculer les statuts des plans individuels
    let hasOngoingPlans = false;
    let hasPastPlans = false;
    let hasUpcomingPlans = false;
    
    trip.plans.forEach(plan => {
      const planStart = plan.startDate.getTime();
      const planEnd = plan.endDate.getTime();
      const nowMs = now.getTime();
      
      if (nowMs < planStart) {
        plan.status = 'upcoming';
        hasUpcomingPlans = true;
      } else if (nowMs > planEnd) {
        plan.status = 'past';
        hasPastPlans = true;
      } else {
        plan.status = 'ongoing';
        hasOngoingPlans = true;
      }
    });
    
    // Déterminer le statut du voyage basé sur les plans
    if (hasOngoingPlans) {
      trip.status = 'ongoing';
    } else if (hasUpcomingPlans && !hasPastPlans) {
      trip.status = 'upcoming';
    } else if (hasPastPlans && !hasUpcomingPlans) {
      trip.status = 'past';
    } else {
      // Fallback sur la logique temporelle
      if (now > trip.endDate) {
        trip.status = 'past';
      } else if (now < trip.startDate) {
        trip.status = 'upcoming';
      } else {
        trip.status = 'ongoing';
      }
    }
    
    console.log(`[Trips2] Nouveau statut pour "${trip.name}": ${trip.status}`);
  }

  /**
   * Enrichit un plan avec des détails complets selon son type
   */
  private enrichPlanWithDetails(plan: PlanGenerated): void {
    if (!plan.details) {
      plan.details = {};
    }

    switch (plan.type) {
      case 'flight':
        this.enrichFlightPlan(plan);
        break;
      case 'hotel':
        this.enrichHotelPlan(plan);
        break;
      case 'activity':
        this.enrichActivityPlan(plan);
        break;
      case 'transport':
        this.enrichTransportPlan(plan);
        break;
      case 'car_rental':
        this.enrichCarRentalPlan(plan);
        break;
    }
  }

  private enrichFlightPlan(plan: PlanGenerated): void {
    const flightData = this.generateFlightData(plan);
    plan.details!.flight = flightData;
  }

  private enrichHotelPlan(plan: PlanGenerated): void {
    const hotelData = this.generateHotelData(plan);
    plan.details!.hotel = hotelData;
  }

  private enrichActivityPlan(plan: PlanGenerated): void {
    const activityData = this.generateActivityData(plan);
    plan.details!.activity = activityData;
  }

  private enrichTransportPlan(plan: PlanGenerated): void {
    const transportData = this.generateTransportData(plan);
    plan.details!.transport = transportData;
  }

  private enrichCarRentalPlan(plan: PlanGenerated): void {
    const carRentalData = this.generateCarRentalData(plan);
    plan.details!.car_rental = carRentalData;
  }

  private generateFlightData(plan: PlanGenerated): any {
    const isDeparture = plan.name.includes('Aller') || plan.name.includes('→');
    const isReturn = plan.name.includes('Retour') || plan.name.includes('←');
    
    // Extraire les villes depuis le nom ou la location
    const locationParts = plan.location.split(' / ');
    const departureCity = locationParts[0] || 'Genève';
    const arrivalCity = locationParts[1] || 'Marrakech';
    
    const airports = {
      'Genève': { code: 'GVA', city: 'Genève', country: 'Suisse', lat: 46.2381, lng: 6.1089 },
      'Marrakech': { code: 'RAK', city: 'Marrakech', country: 'Maroc', lat: 31.6069, lng: -7.9608 },
      'Athènes': { code: 'ATH', city: 'Athènes', country: 'Grèce', lat: 37.9364, lng: 23.9445 },
      'Montréal': { code: 'YUL', city: 'Montréal', country: 'Canada', lat: 45.4706, lng: -73.7408 }
    };

    const departure = airports[departureCity as keyof typeof airports] || airports['Genève'];
    const arrival = airports[arrivalCity as keyof typeof airports] || airports['Marrakech'];
    
    // Génération simple du numéro de vol basée sur les villes
    let flightNumber = 'LX1234';
    if (departureCity === 'Genève' && arrivalCity === 'Marrakech') flightNumber = 'LX1234';
    else if (departureCity === 'Marrakech' && arrivalCity === 'Genève') flightNumber = 'LX1235';
    else if (departureCity === 'Genève' && arrivalCity === 'Athènes') flightNumber = 'LX5678';
    else if (departureCity === 'Athènes' && arrivalCity === 'Genève') flightNumber = 'LX5679';
    else if (departureCity === 'Genève' && arrivalCity === 'Montréal') flightNumber = 'LX9012';
    else if (departureCity === 'Montréal' && arrivalCity === 'Genève') flightNumber = 'LX9013';

    return {
      flightNumber,
      airline: 'Swiss International Air Lines',
      aircraft: 'Airbus A320',
      departure: {
        airport: departure.code, // Code IATA (ex: GVA, RAK, ATH, YUL)
        city: departure.city,
        country: departure.country,
        terminal: '1',
        gate: isDeparture ? 'A12' : 'B15',
        scheduledTime: this.formatTimeGeminiGenerated(plan.startDate),
        actualTime: this.formatTimeGeminiGenerated(plan.startDate),
        delayMinutes: Math.floor(Math.random() * 10) - 5, // -5 à +5 minutes
        location: { latitude: departure.lat, longitude: departure.lng }
      },
      arrival: {
        airport: arrival.code, // Code IATA (ex: GVA, RAK, ATH, YUL)
        city: arrival.city,
        country: arrival.country,
        terminal: '1',
        gate: isDeparture ? 'B8' : 'A22',
        scheduledTime: this.formatTimeGeminiGenerated(plan.endDate),
        actualTime: this.formatTimeGeminiGenerated(plan.endDate),
        delayMinutes: Math.floor(Math.random() * 10) - 5,
        location: { latitude: arrival.lat, longitude: arrival.lng }
      },
      distance: { 
        kilometers: Math.floor(Math.random() * 3000) + 1000, 
        miles: Math.floor(Math.random() * 1800) + 600 
      },
      duration: { 
        scheduledMinutes: Math.floor((plan.endDate.getTime() - plan.startDate.getTime()) / (1000 * 60)),
        actualMinutes: Math.floor((plan.endDate.getTime() - plan.startDate.getTime()) / (1000 * 60))
      },
      status: 'ON_TIME',
      baggageClaim: isDeparture ? 'B3' : 'A5'
    };
  }

  private generateHotelData(plan: PlanGenerated): any {
    const hotels = {
      'Marrakech': {
        name: 'Riu Tikida Palmeraie',
        address: 'Route de Fès, Palmeraie, 40000 Marrakech, Maroc',
        phone: '+212 5 24 38 90 00',
        email: 'info@riutikida.com',
        website: 'https://www.riu.com/fr/hotels/maroc/marrakech/riu-tikida-palmeraie/',
        stars: 4,
        roomType: 'Chambre Deluxe avec vue jardin',
        roomNumber: '245',
        lat: 31.6500, lng: -7.9500
      },
      'Athènes': {
        name: 'Electra Palace Athens',
        address: '18-20 N Nikodimou Street, Plaka, 10557 Athènes, Grèce',
        phone: '+30 21 0337 0000',
        email: 'info@electrahotels.gr',
        website: 'https://www.electrahotels.gr/athens/electra-palace-athens/',
        stars: 5,
        roomType: 'Chambre Supérieure avec vue mer',
        roomNumber: '312',
        lat: 37.9715, lng: 23.7267
      },
      'Montréal': {
        name: 'Hôtel Bonaventure Montréal',
        address: '900 De La Gauchetière West, Montréal, QC H5A 1E4, Canada',
        phone: '+1 514 878 2332',
        email: 'info@hotelbonaventure.com',
        website: 'https://hotelbonaventure.com/',
        stars: 4,
        roomType: 'Chambre Standard',
        roomNumber: '1523',
        lat: 45.5017, lng: -73.5673
      }
    };

    const city = plan.location.includes('Marrakech') ? 'Marrakech' : 
                 plan.location.includes('Athènes') ? 'Athènes' : 
                 plan.location.includes('Montréal') ? 'Montréal' : 'Marrakech';
    
    const hotel = hotels[city as keyof typeof hotels] || hotels['Marrakech'];

    return {
      name: hotel.name,
      address: hotel.address,
      phone: hotel.phone,
      email: hotel.email,
      website: hotel.website,
      stars: hotel.stars,
      roomType: hotel.roomType,
      roomNumber: hotel.roomNumber,
      checkIn: '15:00',
      checkOut: '11:00',
      amenities: ['Piscine', 'Spa', 'Restaurant', 'Bar', 'WiFi gratuit', 'Climatisation'],
      price: { amount: Math.floor(Math.random() * 200) + 100, currency: 'EUR', perNight: true },
      coordinates: { latitude: hotel.lat, longitude: hotel.lng }
    };
  }

  private generateActivityData(plan: PlanGenerated): any {
    const activities = {
      'Visite historique': {
        type: 'guided_tour',
        company: 'Cultural Tours',
        guide: 'Guide local',
        phone: '+212 6 98 76 54 32',
        meetingPoint: 'Place principale',
        duration: { hours: 8 },
        price: { amount: 45, currency: 'EUR' },
        includes: ['Guide francophone', 'Entrées monuments', 'Déjeuner'],
        itinerary: ['Sites historiques', 'Monuments', 'Museums']
      },
      'Excursion': {
        type: 'day_trip',
        company: 'Adventure Tours',
        guide: 'Guide spécialisé',
        phone: '+212 6 45 67 89 01',
        meetingPoint: 'Hôtel',
        duration: { hours: 9 },
        price: { amount: 65, currency: 'EUR' },
        includes: ['Transport', 'Guide', 'Déjeuner'],
        itinerary: ['Points d\'intérêt', 'Vues panoramiques']
      },
      'Journée détente': {
        type: 'wellness',
        location: 'Hôtel',
        services: ['Massage', 'Spa', 'Piscine', 'Yoga'],
        price: { amount: 35, currency: 'EUR' },
        duration: { hours: 8 }
      }
    };

    let activityType = 'Visite historique';
    if (plan.name.includes('Excursion')) activityType = 'Excursion';
    if (plan.name.includes('détente')) activityType = 'Journée détente';

    const activity = activities[activityType as keyof typeof activities] || activities['Visite historique'];

    return {
      ...activity,
      coordinates: { latitude: 31.6258, longitude: -7.9891 }
    };
  }

  private generateTransportData(plan: PlanGenerated): any {
    return {
      type: 'private_transfer',
      company: 'Transfer Services',
      vehicle: 'Mercedes Classe E',
      driver: 'Chauffeur local',
      phone: '+212 6 12 34 56 78',
      pickupLocation: 'Point de départ',
      dropoffLocation: 'Point d\'arrivée',
      distance: { kilometers: Math.floor(Math.random() * 20) + 5, miles: Math.floor(Math.random() * 12) + 3 },
      duration: { minutes: Math.floor(Math.random() * 60) + 30 },
      price: { amount: Math.floor(Math.random() * 30) + 20, currency: 'EUR' },
      includes: ['WiFi', 'Eau minérale', 'Assistance bagages']
    };
  }

  private generateCarRentalData(plan: PlanGenerated): any {
    return {
      company: 'Hertz',
      location: plan.location,
      vehicle: 'Toyota Corolla',
      licensePlate: 'ABC-123',
      pickupTime: this.formatTimeGeminiGenerated(plan.startDate),
      returnTime: this.formatTimeGeminiGenerated(plan.endDate),
      price: { amount: Math.floor(Math.random() * 50) + 30, currency: 'EUR', perDay: true },
      includes: ['Assurance', 'GPS', 'Kilométrage illimité'],
      coordinates: { latitude: 31.6258, longitude: -7.9891 }
    };
  }

  /**
   * Fonction utilitaire pour parser les dates depuis les chaînes de caractères
   * avec le format "DD/MM/YYYY – HHhMM (UTC+/-X)" ou "DD/MM – HHhMM (UTC+/-X)".
   * Crée un objet Date dont la valeur interne UTC est ajustée par l'offset fourni.
   * @param dateString La chaîne de date à parser.
   * @param yearOverride Année à utiliser si non spécifiée dans la chaîne (pour "DD/MM" format).
   * @returns Un objet Date représentant le temps UTC réel de l'événement.
   */
  private parseDateWithOffset(dateString: string, yearOverride?: number): Date {
    // Regex pour le format complet "DD/MM/YYYY – HHhMM (UTC+/-X)"
    const fullRegex = /(\d{1,2})\/(\d{1,2})\/(\d{4}) – (\d{1,2})h(\d{2}) \(UTC([+-]\d{1,2})\)/;
    // Regex pour le format court "DD/MM – HHhMM (UTC+/-X)"
    const shortRegex = /(\d{1,2})\/(\d{1,2}) – (\d{1,2})h(\d{2}) \(UTC([+-]\d{1,2})\)/;

    let match = dateString.match(fullRegex);
    let year: number;
    let month: number;
    let day: number;
    let hour: number;
    let minute: number;
    let offsetHours: number;

    if (match) {
      [, day, month, year, hour, minute, offsetHours] = match.map(Number);
    } else {
      match = dateString.match(shortRegex);
      if (match) {
        [, day, month, hour, minute, offsetHours] = match.map(Number);
        year = yearOverride || new Date().getFullYear(); // Utilise l'année actuelle si non fournie
      } else {
        throw new Error(`Could not parse date string: ${dateString}`);
      }
    }

    // Le mois est basé sur 0 (janvier = 0)
    month -= 1;

    // Crée un objet Date en UTC avec les composants fournis
    const utcDate = new Date(Date.UTC(year, month, day, hour, minute));

    // Ajuste l'heure UTC par le décalage UTC spécifié dans la chaîne.
    // Si la chaîne dit UTC+2, cela signifie que l'heure locale dans cette zone est 2 heures EN AVANCE sur l'UTC.
    // Donc, pour obtenir l'heure UTC réelle de l'événement, nous soustrayons le décalage.
    utcDate.setUTCHours(utcDate.getUTCHours() - offsetHours);

    return utcDate;
  }

  private loadAndProcessDemoTripsGeminiGenerated(): void {
    const now = new Date(); // Date et heure actuelles, utilisées comme référence "maintenant"

    // --- Définition des données de démonstration à partir des fichiers texte ---
    // Les dates sont formatées pour inclure l'offset UTC afin d'être correctement parsées.
    const demoTrips: TripGenerated[] = [
      // 1. Voyage Passé : Marrakech (basé sur Voyage Passé Démo Marrakech.txt)
      {
        id: 'marrakechGeminiGenerated',
        name: 'Voyage Mémorable à Marrakech',
        description: 'Exploration culturelle et détente au Maroc.',
        image: 'https://placehold.co/400x200/FF5733/FFFFFF?text=Marrakech+Past',
        startDate: new Date(), // Sera mis à jour
        endDate: new Date(),   // Sera mis à jour
        status: 'past',        // Sera mis à jour
        plans: [
          { 
            id: 'pM1', 
            name: 'Vol Aller Genève → Marrakech', 
            type: 'flight', 
            location: 'Genève / Marrakech', 
            timezone: 'Europe/Zurich', 
            startDate: this.parseDateWithOffset('15/04/2024 – 09h00 (UTC+2)'), 
            endDate: this.parseDateWithOffset('15/04/2024 – 11h30 (UTC+1)'),
            details: {
              flight: {
                flightNumber: 'LX1234',
                airline: 'Swiss International Air Lines',
                aircraft: 'Airbus A320',
                departure: {
                  airport: 'GVA',
                  city: 'Genève',
                  country: 'Suisse',
                  terminal: '1',
                  gate: 'A12',
                  scheduledTime: '09:00',
                  actualTime: '09:05',
                  delayMinutes: 5,
                  location: { latitude: 46.2381, longitude: 6.1089 }
                },
                arrival: {
                  airport: 'RAK',
                  city: 'Marrakech',
                  country: 'Maroc',
                  terminal: '1',
                  gate: 'B8',
                  scheduledTime: '11:30',
                  actualTime: '11:25',
                  delayMinutes: -5,
                  location: { latitude: 31.6069, longitude: -7.9608 }
                },
                distance: { kilometers: 2200, miles: 1367 },
                duration: { scheduledMinutes: 150, actualMinutes: 140 },
                status: 'ON_TIME',
                baggageClaim: 'B3'
              }
            }
          },
          { 
            id: 'pM2', 
            name: 'Transfert privé Aéroport → Hôtel', 
            type: 'transport', 
            location: 'Marrakech', 
            timezone: 'Africa/Casablanca', 
            startDate: this.parseDateWithOffset('15/04/2024 – 12h00 (UTC+1)'), 
            endDate: new Date(this.parseDateWithOffset('15/04/2024 – 12h00 (UTC+1)').getTime() + 45 * 60 * 1000),
            details: {
              transport: {
                type: 'private_transfer',
                company: 'Marrakech Transfer Services',
                vehicle: 'Mercedes Classe E',
                driver: 'Ahmed Benali',
                phone: '+212 6 12 34 56 78',
                pickupLocation: 'Aéroport Marrakech - Terminal 1',
                dropoffLocation: 'Hôtel Riu Tikida Palmeraie',
                distance: { kilometers: 12, miles: 7.5 },
                duration: { minutes: 45 },
                price: { amount: 25, currency: 'EUR' },
                includes: ['WiFi', 'Eau minérale', 'Assistance bagages']
              }
            }
          },
          { 
            id: 'pM3', 
            name: 'Hôtel Riu Tikida Palmeraie Marrakech', 
            type: 'hotel', 
            location: 'Marrakech', 
            timezone: 'Africa/Casablanca', 
            startDate: this.parseDateWithOffset('15/04/2024 – 13h00 (UTC+1)'), 
            endDate: this.parseDateWithOffset('22/04/2024 – 11h00 (UTC+1)'),
            details: {
              hotel: {
                name: 'Riu Tikida Palmeraie',
                address: 'Route de Fès, Palmeraie, 40000 Marrakech, Maroc',
                phone: '+212 5 24 38 90 00',
                email: 'info@riutikida.com',
                website: 'https://www.riu.com/fr/hotels/maroc/marrakech/riu-tikida-palmeraie/',
                stars: 4,
                roomType: 'Chambre Deluxe avec vue jardin',
                roomNumber: '245',
                checkIn: '15:00',
                checkOut: '11:00',
                amenities: ['Piscine', 'Spa', 'Restaurant', 'Bar', 'WiFi gratuit', 'Climatisation'],
                price: { amount: 120, currency: 'EUR', perNight: true },
                coordinates: { latitude: 31.6500, longitude: -7.9500 }
              }
            }
          },
          { id: 'pM4', name: 'Visite historique de Marrakech', type: 'activity', location: 'Marrakech', timezone: 'Africa/Casablanca', startDate: this.parseDateWithOffset('16/04/2024 – 09h00 (UTC+1)'), endDate: this.parseDateWithOffset('16/04/2024 – 17h00 (UTC+1)') },
          { id: 'pM5', name: 'Excursion Vallée de l’Ourika', type: 'activity', location: 'Vallée de l’Ourika', timezone: 'Africa/Casablanca', startDate: this.parseDateWithOffset('17/04/2024 – 08h00 (UTC+1)'), endDate: this.parseDateWithOffset('17/04/2024 – 17h30 (UTC+1)') },
          { id: 'pM6', name: 'Journée détente à l’hôtel', type: 'activity', location: 'Marrakech', timezone: 'Africa/Casablanca', startDate: this.parseDateWithOffset('18/04/2024 – 10h00 (UTC+1)'), endDate: this.parseDateWithOffset('18/04/2024 – 18h00 (UTC+1)') },
          { id: 'pM7', name: 'Excursion Désert d’Agafay', type: 'activity', location: 'Désert d’Agafay', timezone: 'Africa/Casablanca', startDate: this.parseDateWithOffset('19/04/2024 – 15h00 (UTC+1)'), endDate: this.parseDateWithOffset('19/04/2024 – 22h30 (UTC+1)') },
          { id: 'pM8', name: 'Visite Jardin Majorelle & musée YSL', type: 'activity', location: 'Marrakech', timezone: 'Africa/Casablanca', startDate: this.parseDateWithOffset('20/04/2024 – 10h00 (UTC+1)'), endDate: this.parseDateWithOffset('20/04/2024 – 13h30 (UTC+1)') },
          { id: 'pM9', name: 'Temps libre & shopping guidé', type: 'activity', location: 'Marrakech', timezone: 'Africa/Casablanca', startDate: this.parseDateWithOffset('21/04/2024 – 10h30 (UTC+1)'), endDate: this.parseDateWithOffset('21/04/2024 – 15h00 (UTC+1)') },
          { id: 'pM10', name: 'Transfert retour Hôtel → Aéroport', type: 'transport', location: 'Marrakech', timezone: 'Africa/Casablanca', startDate: this.parseDateWithOffset('22/04/2024 – 08h00 (UTC+1)'), endDate: new Date(this.parseDateWithOffset('22/04/2024 – 08h00 (UTC+1)').getTime() + 45 * 60 * 1000) }, // +45 min
          { id: 'pM11', name: 'Vol Retour Marrakech → Genève', type: 'flight', location: 'Marrakech / Genève', timezone: 'Africa/Casablanca', startDate: this.parseDateWithOffset('22/04/2024 – 10h30 (UTC+1)'), endDate: this.parseDateWithOffset('22/04/2024 – 13h45 (UTC+2)') },
        ]
      },
      // 2. Voyage en Cours : Athènes (basé sur Voyage En cours Démo Athene.txt)
      {
        id: 'athensGeminiGenerated',
        name: 'Aventure Grecque à Athènes et Santorin',
        description: 'Découverte de l\'histoire et des îles grecques.',
        image: 'https://placehold.co/400x200/33FF57/FFFFFF?text=Athens+Ongoing',
        startDate: new Date(), // Sera mis à jour
        endDate: new Date(),   // Sera mis à jour
        status: 'ongoing',     // Sera mis à jour
        plans: [
          { id: 'pA1', name: 'Vol Aller Genève → Athènes', type: 'flight', location: 'Genève / Athènes', timezone: 'Europe/Zurich', startDate: this.parseDateWithOffset('05/07/2024 – 07h15 (UTC+2)'), endDate: this.parseDateWithOffset('05/07/2024 – 10h45 (UTC+3)') },
          { id: 'pA2', name: 'Location de voiture Athènes Aéroport', type: 'car_rental', location: 'Athènes', timezone: 'Europe/Athens', startDate: this.parseDateWithOffset('05/07/2024 – 11h30 (UTC+3)'), endDate: this.parseDateWithOffset('13/07/2024 – 08h00 (UTC+3)') },
          { id: 'pA3', name: 'Hébergement Electra Palace Athens', type: 'hotel', location: 'Athènes', timezone: 'Europe/Athens', startDate: this.parseDateWithOffset('05/07/2024 – 14h00 (UTC+3)'), endDate: this.parseDateWithOffset('07/07/2024 – 09h00 (UTC+3)') },
          { id: 'pA4', name: 'Visite de l\'Acropole + musée', type: 'activity', location: 'Athènes', timezone: 'Europe/Athens', startDate: this.parseDateWithOffset('06/07/2024 – 09h00 (UTC+3)'), endDate: this.parseDateWithOffset('06/07/2024 – 13h00 (UTC+3)') },
          { id: 'pA5', name: 'Route : Athènes → Patras', type: 'transport', location: 'Athènes / Patras', timezone: 'Europe/Athens', startDate: this.parseDateWithOffset('07/07/2024 – 09h00 (UTC+3)'), endDate: this.parseDateWithOffset('07/07/2024 – 12h00 (UTC+3)') },
          { id: 'pA6', name: 'Traversée bateau : Patras → Santorin', type: 'transport', location: 'Patras / Santorin', timezone: 'Europe/Athens', startDate: this.parseDateWithOffset('07/07/2024 – 14h30 (UTC+3)'), endDate: this.parseDateWithOffset('08/07/2024 – 06h30 (UTC+3)') },
          { id: 'pA7', name: 'Hébergement Hotel Aressana Santorin', type: 'hotel', location: 'Santorin', timezone: 'Europe/Athens', startDate: this.parseDateWithOffset('08/07/2024 – 08h00 (UTC+3)'), endDate: this.parseDateWithOffset('11/07/2024 – 11h00 (UTC+3)') },
          { id: 'pA8', name: 'Croisière au coucher du soleil + volcan', type: 'activity', location: 'Santorin', timezone: 'Europe/Athens', startDate: this.parseDateWithOffset('09/07/2024 – 15h00 (UTC+3)'), endDate: this.parseDateWithOffset('09/07/2024 – 20h00 (UTC+3)') },
          { id: 'pA9', name: 'Vol retour : Santorin → Athènes', type: 'flight', location: 'Santorin / Athènes', timezone: 'Europe/Athens', startDate: this.parseDateWithOffset('11/07/2024 – 12h30 (UTC+3)'), endDate: this.parseDateWithOffset('11/07/2024 – 13h20 (UTC+3)') },
          { id: 'pA10', name: 'Hébergement Coco-Mat Hotel Athens', type: 'hotel', location: 'Athènes', timezone: 'Europe/Athens', startDate: this.parseDateWithOffset('11/07/2024 – 14h00 (UTC+3)'), endDate: this.parseDateWithOffset('13/07/2024 – 08h00 (UTC+3)') },
          { id: 'pA11', name: 'Dîner de fin de voyage – To Thalassino', type: 'activity', location: 'Le Pirée', timezone: 'Europe/Athens', startDate: this.parseDateWithOffset('12/07/2024 – 20h00 (UTC+3)'), endDate: new Date(this.parseDateWithOffset('12/07/2024 – 20h00 (UTC+3)').getTime() + 2 * 60 * 60 * 1000) }, // 2 heures de dîner
          { id: 'pA12', name: 'Vol retour Athènes → Genève', type: 'flight', location: 'Athènes / Genève', timezone: 'Europe/Athens', startDate: this.parseDateWithOffset('13/07/2024 – 10h15 (UTC+3)'), endDate: this.parseDateWithOffset('13/07/2024 – 13h00 (UTC+2)') },
        ]
      },
      // 3. Voyage Futur : Montréal (basé sur Voyage Futur Démo Montreal.txt)
      {
        id: 'montrealGeminiGenerated',
        name: 'Road Trip Québec : Genève – Montréal',
        description: 'Aventure de 15 jours à travers le Québec.',
        image: 'https://placehold.co/400x200/5733FF/FFFFFF?text=Montreal+Future',
        startDate: new Date(), // Sera mis à jour
        endDate: new Date(),   // Sera mis à jour
        status: 'upcoming',    // Sera mis à jour
        plans: [
          { id: 'pMtl1', name: 'Vol Aller Genève → Montréal', type: 'flight', location: 'Genève / Montréal', timezone: 'Europe/Zurich', startDate: this.parseDateWithOffset('10/09/2025 – 10h40 (UTC+2)'), endDate: this.parseDateWithOffset('10/09/2025 – 13h00 (UTC-4)') },
          { id: 'pMtl2', name: 'Location de voiture – Montréal', type: 'car_rental', location: 'Montréal', timezone: 'America/Toronto', startDate: this.parseDateWithOffset('10/09/2025 – 13h30 (UTC-4)'), endDate: this.parseDateWithOffset('25/09/2025 – 10h00 (UTC-4)') },
          { id: 'pMtl3', name: 'Hébergement – Hôtel Bonaventure Montréal', type: 'hotel', location: 'Montréal', timezone: 'America/Toronto', startDate: this.parseDateWithOffset('10/09/2025 – 15h00 (UTC-4)'), endDate: this.parseDateWithOffset('12/09/2025 – 11h00 (UTC-4)') },
          { id: 'pMtl4', name: 'Activité – Vieux-Montréal & Mont Royal', type: 'activity', location: 'Montréal', timezone: 'America/Toronto', startDate: this.parseDateWithOffset('11/09/2025 – 09h00 (UTC-4)'), endDate: this.parseDateWithOffset('11/09/2025 – 12h30 (UTC-4)') },
          { id: 'pMtl5', name: 'Route : Montréal → Québec City', type: 'transport', location: 'Montréal / Québec City', timezone: 'America/Toronto', startDate: this.parseDateWithOffset('12/09/2025 – 11h00 (UTC-4)'), endDate: new Date(this.parseDateWithOffset('12/09/2025 – 11h00 (UTC-4)').getTime() + 3.5 * 60 * 60 * 1000) },
          { id: 'pMtl6', name: 'Hébergement – Auberge Saint-Antoine', type: 'hotel', location: 'Québec City', timezone: 'America/Toronto', startDate: this.parseDateWithOffset('12/09/2025 – 15h00 (UTC-4)'), endDate: this.parseDateWithOffset('15/09/2025 – 10h30 (UTC-4)') },
          { id: 'pMtl7', name: 'Activité – Chute Montmorency + Croisière', type: 'activity', location: 'Québec City', timezone: 'America/Toronto', startDate: this.parseDateWithOffset('13/09/2025 – 09h00 (UTC-4)'), endDate: this.parseDateWithOffset('13/09/2025 – 13h00 (UTC-4)') },
          { id: 'pMtl8', name: 'Vol interne : Québec City → Gaspé', type: 'flight', location: 'Québec City / Gaspé', timezone: 'America/Toronto', startDate: this.parseDateWithOffset('15/09/2025 – 09h30 (UTC-4)'), endDate: this.parseDateWithOffset('15/09/2025 – 10h45 (UTC-4)') },
          { id: 'pMtl9', name: 'Location – Gaspé', type: 'car_rental', location: 'Gaspé', timezone: 'America/Toronto', startDate: this.parseDateWithOffset('15/09/2025 – 11h00 (UTC-4)'), endDate: this.parseDateWithOffset('18/09/2025 – 10h00 (UTC-4)') },
          { id: 'pMtl10', name: 'Hébergement – Hôtel Baker Gaspé', type: 'hotel', location: 'Gaspé', timezone: 'America/Toronto', startDate: this.parseDateWithOffset('15/09/2025 – 13h30 (UTC-4)'), endDate: new Date(this.parseDateWithOffset('15/09/2025 – 13h30 (UTC-4)').getTime() + 3 * 24 * 60 * 60 * 1000) }, // 3 nuits
          { id: 'pMtl11', name: 'Excursion – Parc Forillon + Baleines', type: 'activity', location: 'Cap-des-Rosiers, Forillon', timezone: 'America/Toronto', startDate: this.parseDateWithOffset('16/09/2025 – 08h00 (UTC-4)'), endDate: this.parseDateWithOffset('16/09/2025 – 12h30 (UTC-4)') },
          { id: 'pMtl12', name: 'Route Gaspé → Percé', type: 'transport', location: 'Gaspé / Percé', timezone: 'America/Toronto', startDate: this.parseDateWithOffset('18/09/2025 – 10h00 (UTC-4)'), endDate: new Date(this.parseDateWithOffset('18/09/2025 – 10h00 (UTC-4)').getTime() + 1.5 * 60 * 60 * 1000) },
          { id: 'pMtl13', name: 'Hébergement – Hôtel Riôtel Percé', type: 'hotel', location: 'Percé', timezone: 'America/Toronto', startDate: this.parseDateWithOffset('18/09/2025 – 12h00 (UTC-4)'), endDate: new Date(this.parseDateWithOffset('18/09/2025 – 12h00 (UTC-4)').getTime() + 2 * 24 * 60 * 60 * 1000) }, // 2 nuits
          { id: 'pMtl14', name: 'Excursion – Rocher Percé + Île Bonaventure', type: 'activity', location: 'Percé', timezone: 'America/Toronto', startDate: this.parseDateWithOffset('19/09/2025 – 09h00 (UTC-4)'), endDate: this.parseDateWithOffset('19/09/2025 – 14h00 (UTC-4)') },
          { id: 'pMtl15', name: 'Percé → Rimouski', type: 'transport', location: 'Percé / Rimouski', timezone: 'America/Toronto', startDate: this.parseDateWithOffset('20/09/2025 – 08h00 (UTC-4)'), endDate: new Date(this.parseDateWithOffset('20/09/2025 – 08h00 (UTC-4)').getTime() + 5.5 * 60 * 60 * 1000) },
          { id: 'pMtl16', name: 'Hébergement – Hôtel Rimouski', type: 'hotel', location: 'Rimouski', timezone: 'America/Toronto', startDate: this.parseDateWithOffset('20/09/2025 – 15h00 (UTC-4)'), endDate: new Date(this.parseDateWithOffset('20/09/2025 – 15h00 (UTC-4)').getTime() + 1 * 24 * 60 * 60 * 1000) }, // 1 nuit
          { id: 'pMtl17', name: 'Visite – Sous-marin Onondaga + Phare', type: 'activity', location: 'Pointe-au-Père', timezone: 'America/Toronto', startDate: this.parseDateWithOffset('20/09/2025 – 17h00 (UTC-4)'), endDate: this.parseDateWithOffset('20/09/2025 – 19h00 (UTC-4)') },
          { id: 'pMtl18', name: 'Rimouski → Tadoussac', type: 'transport', location: 'Rimouski / Tadoussac', timezone: 'America/Toronto', startDate: this.parseDateWithOffset('21/09/2025 – 11h00 (UTC-4)'), endDate: new Date(this.parseDateWithOffset('21/09/2025 – 11h00 (UTC-4)').getTime() + 2 * 60 * 60 * 1000) }, // Ferry
          { id: 'pMtl19', name: 'Hébergement – Hôtel Tadoussac', type: 'hotel', location: 'Tadoussac', timezone: 'America/Toronto', startDate: this.parseDateWithOffset('21/09/2025 – 15h00 (UTC-4)'), endDate: new Date(this.parseDateWithOffset('21/09/2025 – 15h00 (UTC-4)').getTime() + 2 * 24 * 60 * 60 * 1000) }, // 2 nuits
          { id: 'pMtl20', name: 'Excursion – Safari baleines Zodiac', type: 'activity', location: 'Tadoussac', timezone: 'America/Toronto', startDate: this.parseDateWithOffset('22/09/2025 – 09h30 (UTC-4)'), endDate: this.parseDateWithOffset('22/09/2025 – 12h00 (UTC-4)') },
          { id: 'pMtl21', name: 'Retour à Montréal', type: 'transport', location: 'Tadoussac / Montréal', timezone: 'America/Toronto', startDate: this.parseDateWithOffset('23/09/2025 – 10h00 (UTC-4)'), endDate: this.parseDateWithOffset('23/09/2025 – 16h30 (UTC-4)') },
          { id: 'pMtl22', name: 'Hébergement – Hôtel Le Germain Montréal', type: 'hotel', location: 'Montréal', timezone: 'America/Toronto', startDate: this.parseDateWithOffset('23/09/2025 – 15h00 (UTC-4)'), endDate: new Date(this.parseDateWithOffset('23/09/2025 – 15h00 (UTC-4)').getTime() + 2 * 24 * 60 * 60 * 1000) }, // 2 nuits
          { id: 'pMtl23', name: 'Retour voiture – Montréal Aéroport', type: 'car_rental', location: 'Montréal', timezone: 'America/Toronto', startDate: this.parseDateWithOffset('25/09/2025 – 10h00 (UTC-4)'), endDate: new Date(this.parseDateWithOffset('25/09/2025 – 10h00 (UTC-4)').getTime() + 30 * 60 * 1000) }, // 30 min pour le retour
          { id: 'pMtl24', name: 'Vol retour – Montréal → Genève', type: 'flight', location: 'Montréal / Genève', timezone: 'America/Toronto', startDate: this.parseDateWithOffset('25/09/2025 – 15h15 (UTC-4)'), endDate: this.parseDateWithOffset('26/09/2025 – 06h30 (UTC+2)') },
        ]
      },
    ];

    // --- Traitement de chaque voyage selon les exigences ---
    demoTrips.forEach(trip => {

      // 1.a. Logique spécifique au voyage passé (Marrakech)
      // Applique un décalage fixe pour s'assurer qu'il est bien passé par rapport à 'now'
      if (trip.id === 'marrakechGeminiGenerated') {
        const pastOffsetMs = -(60 * 24 * 60 * 60 * 1000); // -60 jours en millisecondes
        trip.plans.forEach(plan => {
          plan.startDate = new Date(plan.startDate.getTime() + pastOffsetMs);
          plan.endDate = new Date(plan.endDate.getTime() + pastOffsetMs);
        });
      }

      // 1.b. Logique spécifique au voyage en cours (Athènes)
      if (trip.id === 'athensGeminiGenerated') {
        const firstFlight = trip.plans.find(p => p.type === 'flight' && p.name.includes('Vol Aller Genève → Athènes'));
        if (firstFlight) {
          const flightDurationMs = firstFlight.endDate.getTime() - firstFlight.startDate.getTime();
          // Calcule un nouveau temps de début pour le premier vol
          const newFirstStart = new Date(now.getTime() - flightDurationMs / 3);
          // Calcule le décalage à appliquer à tous les plans
          const offsetMs = newFirstStart.getTime() - firstFlight.startDate.getTime();

          // Applique le même décalage `offsetMs` à toutes les entrées `startDate` et `endDate`
          // de tous les plans du voyage en cours.
          trip.plans.forEach(plan => {
            plan.startDate = new Date(plan.startDate.getTime() + offsetMs);
            plan.endDate = new Date(plan.endDate.getTime() + offsetMs);
          });
        }
      }

      // 1.c. Logique spécifique au voyage futur (Montréal)
      // Applique un décalage fixe de +60 jours pour s'assurer qu'il est bien futur
      if (trip.id === 'montrealGeminiGenerated') {
        const futureOffsetMs = 60 * 24 * 60 * 60 * 1000; // 60 jours en millisecondes
        trip.plans.forEach(plan => {
          plan.startDate = new Date(plan.startDate.getTime() + futureOffsetMs);
          plan.endDate = new Date(plan.endDate.getTime() + futureOffsetMs);
        });
      }

      // Itère sur chaque plan de chaque voyage pour appliquer les transformations
      trip.plans.forEach(plan => {
        // Enrichir le plan avec des détails complets
        this.enrichPlanWithDetails(plan);
        
        const originalPlanDurationMs = plan.endDate.getTime() - plan.startDate.getTime();

        // 3a. Conversion du fuseau horaire (PREMIÈRE FOIS)
        // Ajuste l'objet Date pour que ses getters locaux reflètent le fuseau horaire du plan.
        plan.startDate = this.timezoneConverterServiceGeminiGenerated.convertToLocal(plan.startDate, plan.timezone);
        plan.endDate = this.timezoneConverterServiceGeminiGenerated.convertToLocal(plan.endDate, plan.timezone);

        // 2. Réalisme de l'heure de la journée (06:00–22:00 local)
        // Maintenant, plan.startDate.getHours() retourne l'heure dans le fuseau horaire du plan.
        const planStartHour = plan.startDate.getHours();

        if (planStartHour < 6 || planStartHour > 22) {
          // Si l'heure de début tombe en dehors de 06h00-22h00, ajuste à 10h00
          // Si l'heure est après 22h, on décale au lendemain 10h.
          // Si l'heure est avant 6h, on décale à 10h le même jour.
          if (planStartHour > 22) {
            plan.startDate.setDate(plan.startDate.getDate() + 1); // Passe au jour suivant
          }
          plan.startDate.setHours(10, 0, 0, 0); // Règle à 10:00 AM dans le fuseau horaire du plan.

          // Recalcule la date de fin en conservant la durée originale du plan
          plan.endDate = new Date(plan.startDate.getTime() + originalPlanDurationMs);

          // 3b. Re-conversion du fuseau horaire (SECONDE FOIS - "enrichissement après corrections")
          // Nécessaire car setHours modifie la date en fonction du fuseau horaire du système.
          plan.startDate = this.timezoneConverterServiceGeminiGenerated.convertToLocal(plan.startDate, plan.timezone);
          plan.endDate = this.timezoneConverterServiceGeminiGenerated.convertToLocal(plan.endDate, plan.timezone);
        }
      });

      // 4. Ordre chronologique
      // Trie les plans de chaque voyage par `startDate` ascendante
      trip.plans.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

      // 5. Mise à jour des limites du voyage et du statut
      if (trip.plans.length > 0) {
        // Recalcule et écrase les dates de début et de fin du voyage
        trip.startDate = new Date(Math.min(...trip.plans.map(p => p.startDate.getTime())));
        trip.endDate = new Date(Math.max(...trip.plans.map(p => p.endDate.getTime())));

        // Calcule le statut du voyage ('past', 'ongoing', 'upcoming')
        if (now.getTime() > trip.endDate.getTime()) {
          trip.status = 'past';
        } else if (now.getTime() >= trip.startDate.getTime() && now.getTime() <= trip.endDate.getTime()) {
          trip.status = 'ongoing';
        } else {
          trip.status = 'upcoming';
        }

        // Initialise showDetails et calcule les statuts des plans
        trip.showDetails = false;
        
        // Calcule les statuts des plans individuels
        trip.plans.forEach(plan => {
          const planStart = plan.startDate.getTime();
          const planEnd = plan.endDate.getTime();
          const nowMs = now.getTime();
          
          if (nowMs < planStart) {
            plan.status = 'upcoming';
          } else if (nowMs > planEnd) {
            plan.status = 'past';
          } else {
            plan.status = 'ongoing';
          }
        });
      } else {
        // Gère les voyages sans plans (par exemple, définit le statut par défaut)
        trip.status = 'upcoming'; // Statut par défaut pour les voyages vides
        trip.showDetails = false;
      }
    });

    // 6. Filtrage pour l'affichage
    // Popule les tableaux de voyages filtrés en fonction du statut recalculé
    this.pastTripsGenerated = demoTrips.filter(t => t.status === 'past');
    this.ongoingTripsGenerated = demoTrips.filter(t => t.status === 'ongoing');
    this.upcomingTripsGenerated = demoTrips.filter(t => t.status === 'upcoming');
  }

  /**
   * Gère l'événement de changement de segment pour mettre à jour les voyages affichés.
   * @param event L'événement personnalisé de ion-segment.
   */
  segmentChangedGeminiGenerated(event: any): void {
    this.selectedSegmentGenerated = event.detail.value;
    
    // Détecter et sauvegarder le vol en cours à chaque changement de segment
    console.log('[Trips2] Changement de segment détecté:', this.selectedSegmentGenerated);
    this.detectAndSaveOngoingFlight();
  }

  /**
   * Helper pour formater les dates pour l'affichage.
   * @param date La date à formater.
   * @returns Une chaîne de caractères de date formatée (ex: "Jul 18, 2025").
   */
  formatDateGeminiGenerated(date: Date): string {
    // Utilise toLocaleDateString avec l'option timeZone pour afficher la date dans le fuseau horaire du plan.
    // Note: Le service convertToLocal a déjà ajusté l'objet Date pour que ses getters locaux
    // reflètent le fuseau horaire du plan. Donc, l'option timeZone ici n'est pas strictement nécessaire
    // si convertToLocal est parfait, mais c'est une bonne pratique pour la robustesse.
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  /**
   * Helper pour formater l'heure pour l'affichage.
   * @param date La date à formater.
   * @returns Une chaîne de caractères d'heure formatée (ex: "03:44 PM").
   */
  formatTimeGeminiGenerated(date: Date): string {
    // Utilise toLocaleTimeString avec l'option timeZone pour afficher l'heure dans le fuseau horaire du plan.
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  }

  // Méthodes pour le nouveau template moderne
  refreshData() {
    this.loadTripsWithFallback();
  }

  addNewTrip() {
    console.log('Ajouter un nouveau voyage');
  }

  toggleTripDetails(trip: any) {
    trip.showDetails = !trip.showDetails;
    console.log('Toggle trip details:', {
      tripName: trip.name,
      showDetails: trip.showDetails,
      plansCount: trip.plans?.length
    });
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'ongoing': return 'airplane';
      case 'upcoming': return 'calendar';
      case 'past': return 'time';
      default: return 'help-circle';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'ongoing': return 'En cours';
      case 'upcoming': return 'À venir';
      case 'past': return 'Terminé';
      default: return 'Inconnu';
    }
  }

  getTripDuration(trip: any): string {
    const start = trip.startDate;
    const end = trip.endDate;
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return `${days} jour${days > 1 ? 's' : ''}`;
  }

  getCountdown(startDate: any): string {
    const start = startDate;
    const now = new Date();
    const diff = start.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return `Dans ${days} jour${days > 1 ? 's' : ''}`;
  }

  hasFlights(trip: any): boolean {
    return trip.plans?.some((p: any) => p.type === 'flight') || false;
  }

  getFlightsCount(trip: any): number {
    return trip.plans?.filter((p: any) => p.type === 'flight').length || 0;
  }

  hasHotels(trip: any): boolean {
    return trip.plans?.some((p: any) => p.type === 'hotel') || false;
  }

  getHotelsCount(trip: any): number {
    return trip.plans?.filter((p: any) => p.type === 'hotel').length || 0;
  }

  hasActivities(trip: any): boolean {
    return trip.plans?.some((p: any) => p.type === 'activity') || false;
  }

  getActivitiesCount(trip: any): number {
    return trip.plans?.filter((p: any) => p.type === 'activity').length || 0;
  }

  shareTrip(trip: any, event: Event) {
    event.stopPropagation();
    console.log('Partager le voyage:', trip);
  }

  editTrip(trip: any, event: Event) {
    event.stopPropagation();
    console.log('Éditer le voyage:', trip);
  }

  showTripMenu(trip: any, event: Event) {
    event.stopPropagation();
    console.log('Menu du voyage:', trip);
  }

  addPlanToTrip(trip: any, event?: Event) {
    if (event) event.stopPropagation();
    console.log('Ajouter un plan au voyage:', trip);
  }



  uploadImage(trip: any, event: Event) {
    event.stopPropagation();
    console.log('Uploader une image pour:', trip);
  }

  // Méthodes pour la timeline
  isSameDay(date1: any, date2: any): boolean {
    if (!date1 || !date2) return false;
    const d1 = date1;
    const d2 = date2;
    return d1.toDateString() === d2.toDateString();
  }

  formatPlanDay(date: any): string {
    const d = date;
    return d.toLocaleDateString('fr-FR', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long' 
    });
  }

  getPlanIcon(type: string): string {
    switch (type) {
      case 'flight': return 'airplane';
      case 'hotel': return 'bed';
      case 'car_rental': return 'car';
      case 'activity': return 'walk';
      case 'transport': return 'boat';
      default: return 'time';
    }
  }

  getPlanTypeLabel(type: string): string {
    switch (type) {
      case 'flight': return 'Vol';
      case 'hotel': return 'Hôtel';
      case 'activity': return 'Activité';
      case 'car_rental': return 'Location de voiture';
      case 'transport': return 'Transport';
      default: return 'Plan';
    }
  }

  getPlanLineColor(type: string): string {
    switch (type) {
      case 'flight': return '#4facfe';
      case 'hotel': return '#f093fb';
      case 'activity': return '#43e97b';
      case 'car_rental': return '#667eea';
      case 'transport': return '#f5576c';
      default: return '#6c757d';
    }
  }

  getPlanStatusLabel(status: string): string {
    switch (status) {
      case 'past': return 'Terminé';
      case 'completed': return 'Terminé';
      case 'ongoing': return 'En cours';
      case 'upcoming': return 'À venir';
      default: return 'À venir';
    }
  }

  showPlanMenu(plan: any, event: Event) {
    event.stopPropagation();
    console.log('Menu du plan:', plan);
  }

  getAddPlanSVG(): string {
    return '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 5V19M5 12H19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }

  getTabLabel(segment: 'ongoing' | 'upcoming' | 'past'): string {
    // Détection simple de la langue basée sur la langue du navigateur
    const language = navigator.language || 'fr';
    const isEnglish = language.startsWith('en');
    
    switch (segment) {
      case 'ongoing':
        return isEnglish ? 'Ongoing Trips' : 'Voyages en cours';
      case 'upcoming':
        return isEnglish ? 'Upcoming Trips' : 'Voyages à venir';
      case 'past':
        return isEnglish ? 'Past Trips' : 'Voyages passés';
      default:
        return segment;
    }
  }

  getPageTitle(): string {
    // Détection simple de la langue basée sur la langue du navigateur
    const language = navigator.language || 'fr';
    const isEnglish = language.startsWith('en');
    
    return isEnglish ? 'Smart Travel Assistant' : 'Assistant Voyage Intelligent';
  }

  // Méthodes pour le modal d'image
  openImageModal(trip: any) {
    this.selectedTripForImage = trip;
    this.showImageModal = true;
    this.activeTab = 'upload';
    this.selectedFile = null;
    this.customImageUrl = '';
  }

  closeImageModal() {
    this.showImageModal = false;
    this.selectedTripForImage = null;
    this.selectedFile = null;
    this.customImageUrl = '';
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  uploadSelectedFile() {
    if (this.selectedFile && this.selectedTripForImage) {
      // Simuler l'upload - en réalité, on utiliserait un service
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.selectedTripForImage.image = e.target.result;
        this.closeImageModal();
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  useCustomUrl() {
    if (this.customImageUrl && this.selectedTripForImage) {
      this.selectedTripForImage.image = this.customImageUrl;
      this.closeImageModal();
    }
  }

  changeTripImage(imageUrl: string) {
    if (this.selectedTripForImage) {
      this.selectedTripForImage.image = imageUrl;
      this.closeImageModal();
    }
  }

  onImageError(event: any) {
    console.log('Erreur de chargement d\'image:', event);
  }

  // Méthodes pour afficher les détails enrichis des plans
  getFlightDetails(plan: any): any {
    return plan.details?.flight || null;
  }

  getHotelDetails(plan: any): any {
    return plan.details?.hotel || null;
  }

  getActivityDetails(plan: any): any {
    return plan.details?.activity || null;
  }

  getTransportDetails(plan: any): any {
    return plan.details?.transport || null;
  }

  getCarRentalDetails(plan: any): any {
    return plan.details?.car_rental || null;
  }

  getFlightNumber(plan: any): string {
    return plan.details?.flight?.flightNumber || '';
  }

  getAirline(plan: any): string {
    return plan.details?.flight?.airline || '';
  }

  getAircraft(plan: any): string {
    return plan.details?.flight?.aircraft || '';
  }

  getDepartureAirport(plan: any): string {
    return plan.details?.flight?.departure?.airport || '';
  }

  getArrivalAirport(plan: any): string {
    return plan.details?.flight?.arrival?.airport || '';
  }

  getDepartureGate(plan: any): string {
    return plan.details?.flight?.departure?.gate || '';
  }

  getArrivalGate(plan: any): string {
    return plan.details?.flight?.arrival?.gate || '';
  }

  getBaggageClaim(plan: any): string {
    return plan.details?.flight?.baggageClaim || '';
  }

  getFlightStatus(plan: any): string {
    return plan.details?.flight?.status || '';
  }

  getHotelName(plan: any): string {
    return plan.details?.hotel?.name || '';
  }

  getHotelAddress(plan: any): string {
    return plan.details?.hotel?.address || '';
  }

  getHotelPhone(plan: any): string {
    return plan.details?.hotel?.phone || '';
  }

  getHotelStars(plan: any): number {
    return plan.details?.hotel?.stars || 0;
  }

  getRoomNumber(plan: any): string {
    return plan.details?.hotel?.roomNumber || '';
  }

  getActivityType(plan: any): string {
    return plan.details?.activity?.type || '';
  }

  getActivityCompany(plan: any): string {
    return plan.details?.activity?.company || '';
  }

  getActivityGuide(plan: any): string {
    return plan.details?.activity?.guide || '';
  }

  getActivityPhone(plan: any): string {
    return plan.details?.activity?.phone || '';
  }

  getTransportCompany(plan: any): string {
    return plan.details?.transport?.company || '';
  }

  getTransportVehicle(plan: any): string {
    return plan.details?.transport?.vehicle || '';
  }

  getTransportDriver(plan: any): string {
    return plan.details?.transport?.driver || '';
  }

  getCarRentalCompany(plan: any): string {
    return plan.details?.car_rental?.company || '';
  }

  getCarRentalVehicle(plan: any): string {
    return plan.details?.car_rental?.vehicle || '';
  }

  getCarRentalLicensePlate(plan: any): string {
    return plan.details?.car_rental?.licensePlate || '';
  }

  getPrice(plan: any): string {
    const details = plan.details;
    if (details?.flight) return '';
    if (details?.hotel) return `${details.hotel.price.amount} ${details.hotel.price.currency}`;
    if (details?.activity) return `${details.activity.price.amount} ${details.activity.price.currency}`;
    if (details?.transport) return `${details.transport.price.amount} ${details.transport.price.currency}`;
    if (details?.car_rental) return `${details.car_rental.price.amount} ${details.car_rental.price.currency}`;
    return '';
  }

  getDuration(plan: any): string {
    const details = plan.details;
    if (details?.flight) {
      const minutes = details.flight.duration.scheduledMinutes;
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours}h${mins.toString().padStart(2, '0')}`;
    }
    if (details?.activity) {
      return `${details.activity.duration.hours}h`;
    }
    if (details?.transport) {
      return `${details.transport.duration.minutes}min`;
    }
    return '';
  }

  getDistance(plan: any): string {
    const details = plan.details;
    if (details?.flight) {
      return `${details.flight.distance.kilometers} km`;
    }
    if (details?.transport) {
      return `${details.transport.distance.kilometers} km`;
    }
    return '';
  }

  getAmenities(plan: any): string[] {
    const details = plan.details;
    if (details?.hotel) return details.hotel.amenities || [];
    if (details?.transport) return details.transport.includes || [];
    if (details?.car_rental) return details.car_rental.includes || [];
    return [];
  }

  getItinerary(plan: any): string[] {
    return plan.details?.activity?.itinerary || [];
  }

  getServices(plan: any): string[] {
    return plan.details?.activity?.services || [];
  }

  // Méthodes pour Firestore
  async saveTripsToFirestore() {
    try {
      console.log('[Trips2] Sauvegarde des voyages dans Firestore...');
      
      const allTrips = [...this.pastTripsGenerated, ...this.ongoingTripsGenerated, ...this.upcomingTripsGenerated];
      
      for (const trip of allTrips) {
        await this.trips2FirestoreService.saveTripWithEnrichedPlans(trip);
      }
      
      console.log('[Trips2] Tous les voyages ont été sauvegardés dans Firestore');
      alert('Voyages sauvegardés avec succès dans Firestore !');
      
    } catch (error) {
      console.error('[Trips2] Erreur lors de la sauvegarde dans Firestore:', error);
      alert('Erreur lors de la sauvegarde dans Firestore');
    }
  }

  async loadTripsFromFirestore() {
    try {
      console.log('[Trips2] Chargement des voyages depuis Firestore...');
      
      this.trips2FirestoreService.getTripsWithEnrichedPlans().subscribe({
        next: (trips) => {
          // Répartir les voyages selon leur statut
          this.pastTripsGenerated = trips.filter(t => t.status === 'past');
          this.ongoingTripsGenerated = trips.filter(t => t.status === 'ongoing');
          this.upcomingTripsGenerated = trips.filter(t => t.status === 'upcoming');
          
          console.log('[Trips2] Voyages chargés depuis Firestore:', trips.length);
        },
        error: (error) => {
          console.error('[Trips2] Erreur lors du chargement depuis Firestore:', error);
        }
      });
      
    } catch (error) {
      console.error('[Trips2] Erreur lors du chargement depuis Firestore:', error);
    }
  }

  async clearTripsFromFirestore() {
    try {
      console.log('[Trips2] Suppression des voyages depuis Firestore...');
      
      await this.trips2FirestoreService.clearTrips2Data();
      
      console.log('[Trips2] Voyages supprimés de Firestore');
      alert('Voyages supprimés de Firestore avec succès !');
      
    } catch (error) {
      console.error('[Trips2] Erreur lors de la suppression depuis Firestore:', error);
      alert('Erreur lors de la suppression depuis Firestore');
    }
  }

  // Méthodes pour la base de données locale
  async saveTripsToLocalDB() {
    try {
      console.log('[Trips2] Sauvegarde des voyages dans la DB locale...');
      
      const allTrips = [...this.pastTripsGenerated, ...this.ongoingTripsGenerated, ...this.upcomingTripsGenerated];
      
      for (const trip of allTrips) {
        await this.trips2LocalDBService.saveTripWithPlans(trip);
      }
      
      console.log('[Trips2] Tous les voyages ont été sauvegardés dans la DB locale');
      alert('Voyages sauvegardés avec succès dans la DB locale !');
      
    } catch (error) {
      console.error('[Trips2] Erreur lors de la sauvegarde dans la DB locale:', error);
      alert('Erreur lors de la sauvegarde dans la DB locale');
    }
  }

  async loadTripsFromLocalDB() {
    try {
      console.log('[Trips2] Chargement des voyages depuis la DB locale...');
      
      this.trips2LocalDBService.getTripsWithPlans().subscribe({
        next: (trips) => {
          // Répartir les voyages selon leur statut
          this.pastTripsGenerated = trips.filter(t => t.status === 'past');
          this.ongoingTripsGenerated = trips.filter(t => t.status === 'ongoing');
          this.upcomingTripsGenerated = trips.filter(t => t.status === 'upcoming');
          
          console.log('[Trips2] Voyages chargés depuis la DB locale:', trips.length);
          alert(`${trips.length} voyages chargés depuis la DB locale !`);
        },
        error: (error) => {
          console.error('[Trips2] Erreur lors du chargement depuis la DB locale:', error);
          alert('Erreur lors du chargement depuis la DB locale');
        }
      });
      
    } catch (error) {
      console.error('[Trips2] Erreur lors du chargement depuis la DB locale:', error);
      alert('Erreur lors du chargement depuis la DB locale');
    }
  }

  async clearTripsFromLocalDB() {
    try {
      console.log('[Trips2] Suppression des voyages depuis la DB locale...');
      
      await this.trips2LocalDBService.clearAllData();
      
      console.log('[Trips2] Voyages supprimés de la DB locale');
      alert('Voyages supprimés de la DB locale avec succès !');
      
    } catch (error) {
      console.error('[Trips2] Erreur lors de la suppression depuis la DB locale:', error);
      alert('Erreur lors de la suppression depuis la DB locale');
    }
  }

  async syncLocalDBWithFirestore() {
    try {
      console.log('[Trips2] Synchronisation DB locale avec Firestore...');
      
      // Charger depuis Firestore
      this.trips2FirestoreService.getTripsWithEnrichedPlans().subscribe({
        next: async (firestoreTrips) => {
          // Synchroniser avec la DB locale
          await this.trips2LocalDBService.syncWithFirestore(firestoreTrips);
          
          // Mettre à jour l'affichage
          this.pastTripsGenerated = firestoreTrips.filter(t => t.status === 'past');
          this.ongoingTripsGenerated = firestoreTrips.filter(t => t.status === 'ongoing');
          this.upcomingTripsGenerated = firestoreTrips.filter(t => t.status === 'upcoming');
          
          console.log('[Trips2] Synchronisation terminée');
          alert('Synchronisation terminée avec succès !');
        },
        error: (error) => {
          console.error('[Trips2] Erreur lors de la synchronisation:', error);
          alert('Erreur lors de la synchronisation');
        }
      });
      
    } catch (error) {
      console.error('[Trips2] Erreur lors de la synchronisation:', error);
      alert('Erreur lors de la synchronisation');
    }
  }

  async getLocalDBStats() {
    try {
      const stats = await this.trips2LocalDBService.getDatabaseStats();
      const imageStats = this.trips2ImageService.getImageStats();
      
      const message = `
Statistiques DB locale:
- Voyages: ${stats.trips}
- Plans: ${stats.plans}
- Dernière mise à jour: ${stats.lastUpdate}

Statistiques images:
- Images locales: ${imageStats.localCount}
- Taille totale: ${imageStats.totalSize} KB
      `;
      
      alert(message);
    } catch (error) {
      console.error('[Trips2] Erreur récupération statistiques:', error);
      alert('Erreur lors de la récupération des statistiques');
    }
  }

  /**
   * Navigue vers la page Window avec les informations du vol en cours
   */
  navigateToWindow(flightInfo?: OngoingFlightInfo): void {
    const currentFlight = flightInfo || this.ongoingFlightService.getCurrentFlightInfo();
    
    if (currentFlight) {
      console.log('[Trips2] Navigation vers Window avec vol en cours:', currentFlight);
      
      // Navigation explicite avec état
      this.router.navigate(['/window'], {
        state: { ongoingFlight: currentFlight }
      });
    } else {
      console.warn('[Trips2] Aucun vol en cours disponible pour la navigation vers Window');
      alert('Aucun vol en cours disponible');
    }
  }

  /**
   * Affiche immédiatement les informations du vol en cours détecté
   */
  private displayOngoingFlightInfo(flightInfo: OngoingFlightInfo): void {
    console.log('[Trips2] 🔥 AFFICHAGE AUTOMATIQUE DU VOL EN COURS 🔥');
    console.log('[Trips2] Numéro de vol:', flightInfo.flightNumber);
    console.log('[Trips2] Compagnie:', flightInfo.airline);
    console.log('[Trips2] Départ:', flightInfo.departureIata, '→', flightInfo.arrivalIata);
    console.log('[Trips2] Heure départ:', flightInfo.scheduledDeparture);
    console.log('[Trips2] Heure arrivée:', flightInfo.scheduledArrival);
    
    // Afficher une notification à l'utilisateur
    this.alertController.create({
      header: '🛩️ Vol en cours détecté !',
      message: `Vol ${flightInfo.flightNumber} de ${flightInfo.departureIata} vers ${flightInfo.arrivalIata}\n\nDépart: ${new Date(flightInfo.scheduledDeparture).toLocaleString('fr-FR')}\nArrivée: ${new Date(flightInfo.scheduledArrival).toLocaleString('fr-FR')}`,
      buttons: ['OK']
    }).then(alert => alert.present());
    
    console.log('[Trips2] ✅ Informations du vol affichées automatiquement !');
  }

  /**
   * Ouvre la page Window avec le vol en cours actuel
   */
  openWindow(): void {
    console.log('[Trips2] Ouverture de la page Window...');
    
    const currentFlight = this.ongoingFlightService.getCurrentFlightInfo();
    
    if (currentFlight) {
      console.log('[Trips2] Navigation vers Window avec vol:', currentFlight.flightNumber);
      
      // Afficher une confirmation
      this.alertController.create({
        header: 'Ouvrir Hublot',
        message: `Voulez-vous ouvrir le hublot pour le vol ${currentFlight.flightNumber} ?`,
        buttons: [
          {
            text: 'Annuler',
            role: 'cancel'
          },
          {
            text: 'Ouvrir',
            handler: () => {
              this.navigateToWindow();
            }
          }
        ]
      }).then(alert => alert.present());
    } else {
      console.warn('[Trips2] Aucun vol en cours disponible');
      
      // Afficher un message d'erreur
      this.alertController.create({
        header: 'Aucun vol en cours',
        message: 'Aucun vol en cours n\'est disponible. Veuillez d\'abord sélectionner un voyage en cours.',
        buttons: ['OK']
      }).then(alert => alert.present());
    }
  }

  async exportLocalData() {
    try {
      const jsonData = await this.trips2LocalDBService.exportData();
      
      // Créer un fichier de téléchargement
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `trips2_data_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      console.log('[Trips2] Données exportées avec succès');
      alert('Données exportées avec succès !');
    } catch (error) {
      console.error('[Trips2] Erreur lors de l\'export:', error);
      alert('Erreur lors de l\'export');
    }
  }

  async importLocalData() {
    try {
      // Créer un input file caché
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      
      input.onchange = async (event: any) => {
        const file = event.target.files[0];
        if (file) {
          const text = await file.text();
          await this.trips2LocalDBService.importData(text);
          
          // Recharger les données
          this.loadTripsFromLocalDB();
          
          alert('Données importées avec succès !');
        }
      };
      
      input.click();
    } catch (error) {
      console.error('[Trips2] Erreur lors de l\'import:', error);
      alert('Erreur lors de l\'import');
    }
  }

  /**
   * Affiche le menu principal avec toutes les actions
   */
  async showMainMenu(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Menu Principal - Trips2',
      message: 'Choisissez une action :',
      buttons: [
        {
          text: '👁️ Ouvrir Hublot',
          handler: () => {
            this.openWindow();
          }
        },
        {
          text: '🔍 Détecter Vol en Cours',
          handler: () => {
            this.detectAndSaveOngoingFlight();
            this.alertController.create({
              header: 'Détection Terminée',
              message: 'La détection du vol en cours a été effectuée. Vérifiez la console pour les détails.',
              buttons: ['OK']
            }).then(alert => alert.present());
          }
        },
        {
          text: '☁️ Sauvegarder dans Firestore',
          handler: () => {
            this.saveTripsToFirestore();
          }
        },
        {
          text: '☁️ Charger depuis Firestore',
          handler: () => {
            this.loadTripsFromFirestore();
          }
        },
        {
          text: '💾 Sauvegarder en local',
          handler: () => {
            this.saveTripsToLocalDB();
          }
        },
        {
          text: '📁 Charger depuis local',
          handler: () => {
            this.loadTripsFromLocalDB();
          }
        },
        {
          text: '🔄 Synchroniser DB ↔ Firestore',
          handler: () => {
            this.syncLocalDBWithFirestore();
          }
        },
        {
          text: '📊 Statistiques DB Locale',
          handler: () => {
            this.getLocalDBStats();
          }
        },
        {
          text: '⬇️ Exporter Données',
          handler: () => {
            this.exportLocalData();
          }
        },
        {
          text: '⬆️ Importer Données',
          handler: () => {
            this.importLocalData();
          }
        },
        {
          text: '🗑️ Supprimer Firestore',
          handler: () => {
            this.clearTripsFromFirestore();
          }
        },
        {
          text: '🗑️ Supprimer DB Locale',
          handler: () => {
            this.clearTripsFromLocalDB();
          }
        },
        {
          text: '🔄 Recharger Données',
          handler: () => {
            this.refreshData();
          }
        },
        {
          text: 'Annuler',
          role: 'cancel'
        }
      ]
    });

    await alert.present();
  }

  /**
   * Affiche le menu des actions avancées
   */
  async showAdvancedMenu(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Actions Avancées',
      message: 'Choisissez une action :',
      buttons: [
        {
          text: 'Synchroniser DB ↔ Firestore',
          handler: () => {
            this.syncLocalDBWithFirestore();
          }
        },
        {
          text: 'Statistiques DB Locale',
          handler: () => {
            this.getLocalDBStats();
          }
        },
        {
          text: 'Exporter Données',
          handler: () => {
            this.exportLocalData();
          }
        },
        {
          text: 'Importer Données',
          handler: () => {
            this.importLocalData();
          }
        },
        {
          text: 'Debug DB Locale',
          handler: () => {
            this.debugLocalDB();
          }
        },
        {
          text: 'Supprimer Firestore',
          handler: () => {
            this.clearTripsFromFirestore();
          }
        },
        {
          text: 'Supprimer DB Locale',
          handler: () => {
            this.clearTripsFromLocalDB();
          }
        },
        {
          text: 'Annuler',
          role: 'cancel'
        }
      ]
    });

    await alert.present();
  }

  /**
   * Méthode de debug pour diagnostiquer les problèmes
   */
  async debugLocalDB(): Promise<void> {
    console.log('=== DEBUG Base de Données Locale ===');
    
    // Afficher une alerte pour confirmer que le bouton fonctionne
    const alert = await this.alertController.create({
      header: 'Debug DB Locale',
      message: 'Debug en cours... Vérifiez la console (F12)',
      buttons: ['OK']
    });
    await alert.present();
    
    try {
      // 1. Vérifier si la DB est disponible
      const isAvailable = this.trips2LocalDBService.isLocalDBAvailable();
      console.log('[DEBUG] DB locale disponible:', isAvailable);
      
      if (!isAvailable) {
        console.error('[DEBUG] DB locale non disponible !');
        return;
      }
      
      // 2. Obtenir les statistiques
      const stats = await this.trips2LocalDBService.getDatabaseStats();
      console.log('[DEBUG] Statistiques DB:', stats);
      
      // 3. Charger les voyages
      this.trips2LocalDBService.getTripsWithPlans().subscribe({
        next: (trips) => {
          console.log('[DEBUG] Voyages chargés:', trips);
          console.log('[DEBUG] Nombre de voyages:', trips.length);
          
          trips.forEach((trip, index) => {
            console.log(`[DEBUG] Voyage ${index + 1}:`, {
              id: trip.id,
              name: trip.name,
              status: trip.status,
              plansCount: trip.plans?.length || 0,
              startDate: trip.startDate,
              endDate: trip.endDate
            });
          });
        },
        error: (error) => {
          console.error('[DEBUG] Erreur chargement voyages:', error);
        }
      });
      
      // 4. Vérifier les images
      const imageStats = this.trips2ImageService.getImageStats();
      console.log('[DEBUG] Statistiques images:', imageStats);
      
    } catch (error) {
      console.error('[DEBUG] Erreur lors du debug:', error);
    }
  }
}
