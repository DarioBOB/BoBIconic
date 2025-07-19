import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { HttpClient } from '@angular/common/http';
import { TranslateModule } from '@ngx-translate/core';
import { UserService } from '../services/user.service';
import { DateTimeService } from '../services/date-time.service';
import { TimezoneService } from '../services/timezone.service';
import moment from 'moment-timezone';

@Component({
  selector: 'app-trips',
  templateUrl: './trips.page.html',
  styleUrls: ['./trips.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, TranslateModule]
})
export class TripsPage implements OnInit {
  // Données des voyages
  trips: any[] = [];
  ongoingTrips: any[] = [];
  upcomingTrips: any[] = [];
  pastTrips: any[] = [];
  
  // États de l'interface
  isLoading: boolean = true;
  error: string | null = null;
  selectedSegment: 'ongoing' | 'upcoming' | 'past' = 'ongoing';
  
  // Rôle utilisateur
  userRole: any = { isDemo: false };

  constructor(
    private http: HttpClient,
    private userService: UserService,
    private dateTime: DateTimeService,
    private timezoneService: TimezoneService
  ) {}

  ngOnInit() {
    this.checkUserRole();
    // this.loadTrips(); // <-- À retirer
  }

  private checkUserRole() {
    this.userService.user$.subscribe((user: any) => {
      this.userRole.isDemo = user?.uid === 'fUBBVpboDeaUjD6w2nz0xKni9mG3';
      
      // TEMPORAIRE : Forcer le mode démo pour tester
      if (!this.userRole.isDemo) {
        console.log('[DEBUG] Forçage temporaire du mode démo pour test');
            this.userRole.isDemo = true;
      }
      
      this.loadTrips(); // <-- Charger les trips ici, une fois le rôle connu !
    });
  }

  private loadTrips() {
    this.isLoading = true;
    this.error = null;
    
    this.http.get('assets/Firebase Export.txt', { responseType: 'text' }).subscribe({
      next: text => {
        this.processExport(text);
      },
      error: err => {
        this.error = `Erreur de chargement du fichier: ${err.message}`;
        console.error('Erreur chargement export', err);
      },
      complete: () => this.isLoading = false
    });
  }

  private async processExport(text: string) {
    // FORCER LE MODE DÉMO POUR TOUJOURS APPLIQUER LA LOGIQUE DE RECALAGE
    this.userRole.isDemo = true;
    
    const sections: any = {};
    // Nettoyer le texte et extraire les sections
    const cleanText = text.replace(/^[\s\S]*?(^### )/m, '$1');
    const blocks = cleanText.split(/^\s*### /gm).filter(Boolean);
    
    for (const block of blocks) {
      const lines = block.split(/\r?\n/);
      const sectionName = lines[0].trim();
      const jsonText = lines.slice(1).join('\n').trim();
      if (!sectionName || !jsonText) continue;
      
      try {
        sections[sectionName] = JSON.parse(jsonText);
      } catch (e) {
        this.error = `Erreur de parsing JSON dans la section ${sectionName}: ${e}`;
        console.error(`Erreur parsing section ${sectionName}:`, e);
        return;
      }
    }

    const DEMO_UID = 'fUBBVpboDeaUjD6w2nz0xKni9mG3';
    const trips = (sections.trips || []).filter((t: any) => t.userId === DEMO_UID);
    const plans = (sections.plans || []).filter((p: any) => p.userId === DEMO_UID);

    console.log(`[DEBUG] Voyages trouvés pour l'utilisateur démo: ${trips.length}`);
    trips.forEach((trip: any, index: number) => {
      console.log(`[DEBUG] Voyage ${index + 1}: ${trip.title?.fr || trip.title} - Status: ${trip.status}`);
    });

    // Associer les plans aux voyages et trier les plans chronologiquement
    trips.forEach((t: any) => {
      t.plans = plans.filter((p: any) => p.tripId === t.id)
        .map((p: any) => ({
          ...p,
          icon: this.getIconNameForPlan(p.type),
          startDate: this.toDate(p.startDate),
          endDate: this.toDate(p.endDate)
        }))
        .sort((a: any, b: any) => a.startDate.getTime() - b.startDate.getTime());
      t.showDetails = true; // force l'ouverture pour tous
    });

    // LOGIQUE DÉMO SELON LES EXIGENCES STRICTES
    if (this.userRole.isDemo) {
      console.log('[DEMO] Application de la logique démo selon les exigences strictes');
      const now = new Date();
      const DAY = 24 * 60 * 60 * 1000;

      // TRAITER CHAQUE VOYAGE
      for (const trip of trips) {
        console.log(`[DEMO] Traitement du voyage: ${trip.title?.fr || trip.title}`);
        
        if (trip.plans.length === 0) {
          console.log(`[DEMO] Voyage sans plans, ignoré`);
          continue;
        }

        // 1. CALCULER LA DURÉE TOTALE DU VOYAGE
        const tripStart = new Date(Math.min(...trip.plans.map((p: any) => p.startDate.getTime())));
        const tripEnd = new Date(Math.max(...trip.plans.map((p: any) => p.endDate.getTime())));
        const tripDur = tripEnd.getTime() - tripStart.getTime();
        
        console.log(`[DEMO] Durée totale du voyage: ${Math.round(tripDur / DAY)} jours`);

        // 2. DÉTERMINER LE TYPE DE RECALAGE SELON LE STATUS ACTUEL
        let offsetMs = 0;
        
        if (trip.status === 'ongoing') {
          // VOYAGE EN COURS : positionner le premier vol à 1/3 de la durée totale
          const newFirstStart = new Date(now.getTime() - tripDur / 3);
          offsetMs = newFirstStart.getTime() - tripStart.getTime();
          console.log(`[DEMO] Voyage en cours - Offset: ${Math.round(offsetMs / (60 * 60 * 1000))}h`);
          
          // CORRECTION : S'assurer que certains plans sont dans le passé pour avoir une variété de statuts
          console.log(`[DEMO] Heure actuelle: ${now.toISOString()}`);
          console.log(`[DEMO] Premier plan après recalage: ${new Date(tripStart.getTime() + offsetMs).toISOString()}`);
          
        } else if (trip.status === 'past') {
          // VOYAGE PASSÉ : décaler de -30 jours
          offsetMs = -30 * DAY;
          console.log(`[DEMO] Voyage passé - Offset: -30 jours`);
          
        } else if (trip.status === 'upcoming') {
          // VOYAGE FUTUR : décaler de +60 jours
          offsetMs = 60 * DAY;
          console.log(`[DEMO] Voyage futur - Offset: +60 jours`);
        }

        // 3. APPLIQUER L'OFFSET À TOUTES LES DATES DU VOYAGE
        trip.plans.forEach((plan: any) => {
          const originalStart = new Date(plan.startDate);
          const originalEnd = new Date(plan.endDate);
          
          plan.startDate = new Date(originalStart.getTime() + offsetMs);
          plan.endDate = new Date(originalEnd.getTime() + offsetMs);
          
          console.log(`[DEMO] Plan "${plan.title?.fr}" recalé: ${originalStart.toISOString()} → ${plan.startDate.toISOString()}`);
        });

        // 4. CORRECTION DES HEURES RÉALISTES (06:00-22:00)
        trip.plans.forEach((plan: any) => {
          const planDate = new Date(plan.startDate);
          const hour = planDate.getHours();
          
          // Si l'heure sort de la plage 06:00-22:00, forcer à 10:00
          if (hour < 6 || hour >= 22) {
            const originalStart = new Date(plan.startDate);
            const originalEnd = new Date(plan.endDate);
            const duration = originalEnd.getTime() - originalStart.getTime();
            
            // Forcer l'heure de début à 10:00 locale
            planDate.setHours(10, 0, 0, 0);
            plan.startDate = planDate;
            plan.endDate = new Date(planDate.getTime() + duration);
            
            console.log(`[DEMO] Heure corrigée pour "${plan.title?.fr}": ${hour}h → 10h00`);
          }
        });

        // 5. ENRICHIR LES PLANS AVEC LES FUSEAUX HORAIRES
        for (const plan of trip.plans) {
          await this.enrichPlanLocalTime(plan, trip, trip.plans);
        }

        // 6. TRI CHRONOLOGIQUE FINAL
        trip.plans.sort((a: any, b: any) => a.startDate.getTime() - b.startDate.getTime());
        
        // 7. RECALCULER LE STATUT DYNAMIQUE
        const newTripStart = new Date(Math.min(...trip.plans.map((p: any) => p.startDate.getTime())));
        const newTripEnd = new Date(Math.max(...trip.plans.map((p: any) => p.endDate.getTime())));
        
        // D'abord calculer les statuts des plans individuels
        let hasOngoingPlans = false;
        let hasPastPlans = false;
        let hasUpcomingPlans = false;
        
        trip.plans.forEach((plan: any) => {
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
          if (now > newTripEnd) {
            trip.status = 'past';
          } else if (now < newTripStart) {
            trip.status = 'upcoming';
          } else {
            trip.status = 'ongoing';
          }
        }
        
        console.log(`[DEMO] Nouveau statut: ${trip.status} (${newTripStart.toISOString()} → ${newTripEnd.toISOString()})`);
        console.log(`[DEMO] Voyage "${trip.title?.fr || trip.title}" - Plans avec statuts:`);
        trip.plans.forEach((plan: any) => {
          console.log(`[DEMO]   - "${plan.title?.fr}" → ${plan.status}`);
        });
        
        // 8. AJOUTER LES PROPRIÉTÉS DE FORMATAGE SIMPLES COMME DANS TRIPS2
        trip.plans.forEach((plan: any) => {
          console.log(`[DEBUG] Plan "${plan.title?.fr}": ${new Date(plan.startDate.getTime()).toISOString()} vs now: ${new Date(now.getTime()).toISOString()}`);
          console.log(`[DEBUG] Plan "${plan.title?.fr}" → ${plan.status}`);
          
          // Ajouter les propriétés de formatage simples comme dans trips2
          plan.formattedStartDate = this.formatDateSimple(plan.startDate);
          plan.formattedStartTime = this.formatTimeSimple(plan.startDate);
          plan.formattedEndDate = this.formatDateSimple(plan.endDate);
          plan.formattedEndTime = this.formatTimeSimple(plan.endDate);
        });
      }
    }

    // Appliquer le recalage dynamique pour les voyages non-démo
    if (!this.userRole.isDemo) {
      await this.applyDynamicDates(trips);
    }

      this.trips = trips;
    this.categorizeTrips();
  }

  private toDate(value: any): Date {
    if (!value) return new Date();
    if (typeof value === 'string' || typeof value === 'number') return new Date(value);
    if (value instanceof Date) return value;
    if (value._seconds !== undefined && value._nanoseconds !== undefined) {
      return new Date(value._seconds * 1000 + Math.floor(value._nanoseconds / 1e6));
    }
    if (value.seconds !== undefined && value.nanoseconds !== undefined) {
      return new Date(value.seconds * 1000 + Math.floor(value.nanoseconds / 1e6));
    }
    if (value.toDate) return value.toDate();
    return new Date(value);
  }

  private async applyDynamicDates(trips: any[]) {
    const now = new Date();
    const DAY = 24 * 60 * 60 * 1000;

    // Pour les voyages démo, la logique a déjà été appliquée dans processExport
    // Cette méthode ne traite que les voyages non-démo ou pour corriger les timezones
    
    // Voyage passé (Montréal) - seulement si pas déjà traité
    const past = trips.find(t => t.status === 'past');
    if (past && !this.userRole.isDemo) {
      const newStart = new Date(now.getTime() - 37 * DAY);
      const newEnd = new Date(now.getTime() - 30 * DAY);
      const offset = newStart.getTime() - this.toDate(past.startDate).getTime();
      past.startDate = newStart;
      past.endDate = newEnd;
      for (const p of past.plans) {
        p.startDate = new Date(this.toDate(p.startDate).getTime() + offset);
        p.endDate = new Date(this.toDate(p.endDate).getTime() + offset);
        await this.enrichPlanLocalTime(p, past, past.plans);
      }
    }

    // Voyage futur (Marrakech) - seulement si pas déjà traité
    const future = trips.find(t => t.status === 'upcoming');
    if (future && !this.userRole.isDemo) {
      const newStart = new Date(now.getTime() + 60 * DAY);
      const newEnd = new Date(now.getTime() + 67 * DAY);
      const offset = newStart.getTime() - this.toDate(future.startDate).getTime();
      future.startDate = newStart;
      future.endDate = newEnd;
      for (const p of future.plans) {
        p.startDate = new Date(this.toDate(p.startDate).getTime() + offset);
        p.endDate = new Date(this.toDate(p.endDate).getTime() + offset);
        await this.enrichPlanLocalTime(p, future, future.plans);
      }
    }

    // Voyage en cours (Athènes) - seulement si pas déjà traité
    const ongoing = trips.find(t => t.status === 'ongoing');
    if (ongoing && !this.userRole.isDemo) {
      const flights = ongoing.plans.filter((p: any) => p.type === 'flight');
      if (flights.length) {
        const first = flights.reduce((min: any, p: any) => this.toDate(p.startDate) < this.toDate(min.startDate) ? p : min, flights[0]);
        const nowUtc = moment.utc();
        const depTz = 'Europe/Zurich';
        const arrTz = 'Europe/Athens';
        const origStart = moment.tz(this.toDate(first.startDate), depTz);
        const origEnd = moment.tz(this.toDate(first.endDate), arrTz);
        const duration = origEnd.valueOf() - origStart.valueOf();
        const nowAthens = nowUtc.clone().tz(arrTz);
        const newFlightStart = nowAthens.clone().subtract(duration/3, 'ms');
        const newFlightEnd = newFlightStart.clone().add(duration, 'ms');
        const offset = newFlightStart.valueOf() - origStart.valueOf();
        ongoing.startDate = new Date(this.toDate(ongoing.startDate).getTime() + offset);
        ongoing.endDate = new Date(this.toDate(ongoing.endDate).getTime() + offset);
        for (const p of ongoing.plans) {
          // Détecter le fuseau d'origine du plan
          let planTz = arrTz;
          if (p.type === 'flight' && p.details?.flight?.departure?.airport === 'GVA') planTz = depTz;
          else if (p.type === 'flight' && p.details?.flight?.arrival?.airport === 'ATH') planTz = arrTz;
          else if (p.type === 'hotel') planTz = arrTz;
          else if (p.type === 'car_rental') planTz = arrTz;
          else if (p.type === 'activity') planTz = arrTz;
          // Convertir la date d'origine en UTC à partir du fuseau
          const origPlanStart = moment.tz(this.toDate(p.startDate), planTz);
          const origPlanEnd = moment.tz(this.toDate(p.endDate), planTz);
          const newPlanStart = new Date(origPlanStart.valueOf() + offset);
          const newPlanEnd = new Date(origPlanEnd.valueOf() + offset);
          p.startDate = newPlanStart;
          p.endDate = newPlanEnd;
          await this.enrichPlanLocalTime(p, ongoing, ongoing.plans);
        }
        // Force le statut "En cours" pour le premier vol recalé
        first.status = 'ongoing';
      }
    }
    // Pour chaque voyage, appliquer la cohérence stricte (sauf Athènes qui a déjà été corrigé)
    for (const trip of trips) {
      // Ignorer le voyage Athènes car il a déjà été corrigé par la logique principale
      if (trip.title?.fr?.includes('Athènes') || trip.title?.en?.includes('Athens')) {
        console.log(`[DYNAMIC] Voyage Athènes ignoré - déjà corrigé`);
        continue;
      }
      
      const flights = trip.plans.filter((p: any) => p.type === 'flight');
      if (flights.length) {
        const firstFlight = flights.reduce((min: any, p: any) => this.toDate(p.startDate) < this.toDate(min.startDate) ? p : min, flights[0]);
        const arrival = moment(this.toDate(firstFlight.endDate));
        const arrivalCity = firstFlight.details?.flight?.arrival?.city?.toLowerCase() || firstFlight.details?.flight?.arrival?.airport?.toLowerCase() || '';
        for (const p of trip.plans) {
          if (p.type !== 'flight') {
            // On tente de récupérer la ville du plan
            let planCity = '';
            if (p.details?.hotel?.address) planCity = p.details.hotel.address.toLowerCase();
            else if (p.details?.activity?.location) planCity = p.details.activity.location.toLowerCase();
            else if (p.location) planCity = p.location.toLowerCase();
            else if (p.city) planCity = p.city.toLowerCase();
            // On vérifie que le plan est bien dans la même ville que l'arrivée du vol
            if (planCity && arrivalCity && (planCity.includes(arrivalCity) || arrivalCity.includes(planCity))) {
              const planStart = moment(this.toDate(p.startDate));
              if (planStart.isBefore(arrival)) {
                // Décale le plan juste après l'arrivée du vol (+10 min)
                const newStart = arrival.clone().add(10, 'minutes');
                const duration = moment(this.toDate(p.endDate)).diff(moment(this.toDate(p.startDate)));
                p.startDate = newStart.toDate();
                p.endDate = newStart.clone().add(duration, 'ms').toDate();
              }
            }
          }
        }
        // Re-trier tous les plans après forçage
        trip.plans.sort((a: any, b: any) => a.startDate.getTime() - b.startDate.getTime());
      }
    }
  }

  private async enrichFlightTimes(plan: any) {
    if (plan.type === 'flight' && plan.details?.flight) {
      const departureDate = this.toDate(plan.startDate);
      const arrivalDate = this.toDate(plan.endDate);
      // Fuseaux horaires IANA fixes pour Genève, Athènes, Montréal, Santorin
      let depTz = plan.details.flight.departure?.airport?.includes('Genève') || plan.details.flight.departure?.airport === 'GVA' ? 'Europe/Zurich' : undefined;
      let arrTz = plan.details.flight.arrival?.airport?.includes('Athènes') || plan.details.flight.arrival?.airport === 'ATH' ? 'Europe/Athens' : undefined;
      if (plan.details.flight.arrival?.airport?.includes('Montréal') || plan.details.flight.arrival?.airport === 'YUL') arrTz = 'America/Toronto';
      if (plan.details.flight.departure?.airport?.includes('Montréal') || plan.details.flight.departure?.airport === 'YUL') depTz = 'America/Toronto';
      // Ajout du mapping pour Santorin (JTR)
      if (plan.details.flight.departure?.airport?.includes('Santorin') || plan.details.flight.departure?.airport === 'JTR') depTz = 'Europe/Athens';
      if (plan.details.flight.arrival?.airport?.includes('Santorin') || plan.details.flight.arrival?.airport === 'JTR') arrTz = 'Europe/Athens';
      if (!depTz) depTz = await this.timezoneService.getDepartureTimezoneName(plan);
      if (!arrTz) arrTz = await this.timezoneService.getArrivalTimezoneName(plan);
      // Formatage exact dans le bon fuseau
      plan.departureTimeAffiche = moment(departureDate).tz(depTz).format('HH:mm');
      plan.arrivalTimeAffiche = moment(arrivalDate).tz(arrTz).format('HH:mm');
      // Abréviations dynamiques
      plan.departureTzAbbr = moment(departureDate).tz(depTz).format('z');
      plan.arrivalTzAbbr = moment(arrivalDate).tz(arrTz).format('z');
      // Décalage horaire à l'arrivée
      const depOffset = moment(departureDate).tz(depTz).utcOffset();
      const arrOffset = moment(arrivalDate).tz(arrTz).utcOffset();
      const diffH = (arrOffset - depOffset) / 60;
      if (diffH !== 0) {
        plan.arrivalTzDiff = (diffH > 0 ? `+${diffH}` : `${diffH}`) + 'h par rapport au départ';
      } else {
        plan.arrivalTzDiff = '';
      }
    }
  }

  private async enrichPlanLocalTime(plan: any, trip?: any, plansList?: any[]) {
    if (plan.type === 'flight' && plan.details?.flight) {
      await this.enrichFlightTimes(plan);
      return;
    }
    let city = '';
    let iata = '';
    if (plan.details?.hotel?.address) {
      city = plan.details.hotel.address;
    } else if (plan.details?.activity?.location) {
      city = plan.details.activity.location;
    } else if (plan.location) {
      city = plan.location;
    } else if (plan.city) {
      city = plan.city;
    }
    if (plan.details?.hotel?.iata) {
      iata = plan.details.hotel.iata;
    } else if (plan.iata) {
      iata = plan.iata;
    }
    let prevFlight = null;
    if (plansList && Array.isArray(plansList)) {
      const idx = plansList.findIndex(p => p.id === plan.id);
      if (idx > 0) {
        for (let j = idx - 1; j >= 0; j--) {
          const p = plansList[j];
          if (p.type === 'flight' && p.details?.flight) {
            prevFlight = p;
            break;
          }
        }
      }
    }
    if (prevFlight) {
      const arrDate = this.toDate(prevFlight.endDate);
      const arrCity = prevFlight.details.flight.arrival?.city || prevFlight.details.flight.arrival?.airport || '';
      const planCity = city || '';
      if (planCity && arrCity && (planCity.toLowerCase().includes(arrCity.toLowerCase()) || arrCity.toLowerCase().includes(planCity.toLowerCase()))) {
        const planStart = this.toDate(plan.startDate);
        if (planStart < arrDate) {
          const newStart = new Date(arrDate.getTime() + 10 * 60 * 1000);
          plan.startDate = newStart;
        }
        city = arrCity;
        iata = prevFlight.details.flight.arrival?.airport || iata;
      }
    }
    let timezone = '';
    try {
      timezone = await this.timezoneService.getTimezone(city, iata);
    } catch (e) {
      timezone = '';
    }
    // Si le fuseau n'est pas trouvé ou est UTC, on prend le fuseau du vol précédent si possible
    if (!timezone || timezone.toUpperCase() === 'UTC') {
      if (prevFlight && prevFlight.details?.flight?.arrival?.airport) {
        // Mapping rapide pour les cas connus
        const arrIata = prevFlight.details.flight.arrival.airport.toUpperCase();
        if (arrIata === 'ATH') timezone = 'Europe/Athens';
        else if (arrIata === 'GVA') timezone = 'Europe/Zurich';
        else if (arrIata === 'YUL') timezone = 'America/Montreal';
        else if (arrIata === 'RAK') timezone = 'Africa/Casablanca';
        else if (arrIata === 'JTR') timezone = 'Europe/Athens'; // Santorin
        else timezone = 'Europe/Athens'; // fallback par défaut
      } else {
        timezone = 'Europe/Athens'; // fallback par défaut si aucun vol précédent
      }
    }
    const date = this.toDate(plan.startDate);
    let localTimeAffiche = '';
    let localTzAbbr = '';
    try {
      const m = moment.tz(date, timezone);
      localTimeAffiche = m.format('HH:mm');
      localTzAbbr = m.format('z');
    } catch (e) {
      localTimeAffiche = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: timezone });
      localTzAbbr = timezone;
    }
    plan.localTimeAffiche = localTimeAffiche;
    plan.localTzAbbr = localTzAbbr;
  }

  private categorizeTrips() {
    this.ongoingTrips = this.trips.filter(t => t.status === 'ongoing');
    this.upcomingTrips = this.trips.filter(t => t.status === 'upcoming');
    this.pastTrips = this.trips.filter(t => t.status === 'past');
    
    console.log(`[CATEGORIZE] Voyages catégorisés:`);
    console.log(`[CATEGORIZE] - En cours: ${this.ongoingTrips.length}`);
    console.log(`[CATEGORIZE] - À venir: ${this.upcomingTrips.length}`);
    console.log(`[CATEGORIZE] - Passés: ${this.pastTrips.length}`);
    console.log(`[CATEGORIZE] - Total: ${this.trips.length}`);
  }

  // Méthodes pour le template
  refreshData() {
    this.loadTrips();
  }

  addNewTrip() {
    // TODO: Implémenter l'ajout de voyage
    console.log('Ajouter un nouveau voyage');
  }

  toggleTripDetails(trip: any) {
    trip.showDetails = !trip.showDetails;
    console.log('Toggle trip details:', {
      tripTitle: trip.title?.fr || trip.title,
      showDetails: trip.showDetails,
      plansCount: trip.plans?.length,
      plans: trip.plans
    });
  }

  getTitle(title: any): string {
    if (typeof title === 'string') return title;
    if (title?.fr) return title.fr;
    if (title?.en) return title.en;
    return 'Sans titre';
  }

  getTripCoverImage(trip: any): string {
    // Affiche une image spécifique si disponible, sinon une image par défaut
    if (trip.coverUrl) return trip.coverUrl;
    if (trip.image) return trip.image;
    if (trip.images && trip.images.length) return trip.images[0];
    return 'assets/images/default-trip.jpg';
  }

  getMainFlightStatus(trip: any): string {
    return trip.status || 'upcoming';
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

  getTripLocation(trip: any): string {
    return this.getTitle(trip.title);
  }

  getTripStartDate(trip: any): Date {
    return this.toDate(trip.startDate);
  }

  getTripEndDate(trip: any): Date {
    return this.toDate(trip.endDate);
  }

  getTripDuration(trip: any): string {
    const start = this.getTripStartDate(trip);
    const end = this.getTripEndDate(trip);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return `${days} jour${days > 1 ? 's' : ''}`;
  }

  getCountdown(startDate: any): string {
    const start = this.toDate(startDate);
    const now = new Date();
    const diff = start.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return `Dans ${days} jour${days > 1 ? 's' : ''}`;
  }

  getPlansCount(trip: any): number {
    return trip.plans?.length || 0;
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
    const d1 = this.toDate(date1);
    const d2 = this.toDate(date2);
    return d1.toDateString() === d2.toDateString();
  }

  formatPlanDay(date: any): string {
    const d = this.toDate(date);
    return d.toLocaleDateString('fr-FR', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long' 
    });
  }

  formatPlanTime(date: any): string {
    const d = this.toDate(date);
    return d.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  }

  formatPlanTZ(date: any, plan?: any): string {
    // Si on a un plan avec des données de fuseau horaire enrichies, les utiliser
    if (plan && plan.localTzAbbr) {
      return plan.localTzAbbr;
    }
    
    // Pour les vols, déterminer le fuseau horaire basé sur l'aéroport de départ
    if (plan && plan.type === 'flight') {
      const departureAirport = plan.details?.flight?.departure?.airport;
      
      // Déterminer le fuseau horaire basé sur l'aéroport
      if (departureAirport?.includes('GVA') || departureAirport?.includes('Genève')) {
        return 'CEST'; // Genève
      } else if (departureAirport?.includes('JTR') || departureAirport?.includes('Santorini')) {
        return 'EEST'; // Santorin
      } else if (departureAirport?.includes('ATH') || departureAirport?.includes('Athènes')) {
        return 'EEST'; // Athènes
      }
    }
    
    // Pour les autres plans en Grèce, utiliser EEST
    if (plan && (plan.title?.fr?.includes('Athènes') || plan.title?.fr?.includes('Santorin'))) {
      return 'EEST';
    }
    
    // Fallback basé sur la saison
    const d = this.toDate(date);
    const month = d.getUTCMonth() + 1; // 1-12
    if (month >= 4 && month <= 10) {
      return 'EEST'; // Eastern European Summer Time
    } else {
      return 'EET'; // Eastern European Time
    }
  }

  getPlanTypeLabel(type: string): string {
    switch (type) {
      case 'flight': return 'Vol';
      case 'hotel': return 'Hôtel';
      case 'activity': return 'Activité';
      case 'car_rental': return 'Location de voiture';
      default: return 'Plan';
    }
  }

  getPlanLineColor(type: string): string {
    switch (type) {
      case 'flight': return '#007bff';
      case 'hotel': return '#28a745';
      case 'activity': return '#ffc107';
      case 'car_rental': return '#6f42c1';
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

  getFlightNumber(plan: any): string {
    return plan.details?.flight?.flight_number || '';
  }

  getDepartureAirport(plan: any): string {
    return plan.details?.flight?.departure?.airport || '';
  }

  getArrivalAirport(plan: any): string {
    return plan.details?.flight?.arrival?.airport || '';
  }

  showPlanMenu(plan: any, event: Event) {
    event.stopPropagation();
    console.log('Menu du plan:', plan);
  }

  getAddPlanSVG(): string {
    return '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 5V19M5 12H19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }

  // Méthodes pour le mode démo
  resetDemoData() {
    this.loadTrips();
  }

  private getIconNameForPlan(type: string): string {
    switch (type) {
      case 'flight':
        return 'airplane';
      case 'hotel':
        return 'bed';
      case 'car_rental':
        return 'car';
      case 'activity':
        return 'walk';
      case 'ferry':
        return 'boat';
      default:
        return 'time';
    }
  }

  // Méthodes de formatage simples inspirées de trips2
  private formatDateSimple(date: Date): string {
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  private formatTimeSimple(date: Date): string {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  }
} 