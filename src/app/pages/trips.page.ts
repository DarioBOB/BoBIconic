import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { HttpClient } from '@angular/common/http';
import { TranslateModule } from '@ngx-translate/core';
import { UserService } from '../services/user.service';
import { DateTimeService } from '../services/date-time.service';
import { TimezoneService } from '../services/timezone.service';

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
    this.loadTrips();
  }

  private checkUserRole() {
    this.userService.user$.subscribe((user: any) => {
      this.userRole.isDemo = user?.uid === 'fUBBVpboDeaUjD6w2nz0xKni9mG3';
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

    // Associer les plans aux voyages et trier les plans chronologiquement
    trips.forEach((t: any) => {
      t.plans = plans.filter((p: any) => p.tripId === t.id)
        .sort((a: any, b: any) => this.toDate(a.startDate).getTime() - this.toDate(b.startDate).getTime());
    });

    // Appliquer les dates dynamiques pour le mode démo
    if (this.userRole.isDemo) {
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

    // Voyage passé (Montréal)
    const past = trips.find(t => t.status === 'past');
    if (past) {
      const newStart = new Date(now.getTime() - 37 * DAY);
      const newEnd = new Date(now.getTime() - 30 * DAY);
      const offset = newStart.getTime() - this.toDate(past.startDate).getTime();
      past.startDate = newStart;
      past.endDate = newEnd;
      for (const p of past.plans) {
        p.startDate = new Date(this.toDate(p.startDate).getTime() + offset);
        p.endDate = new Date(this.toDate(p.endDate).getTime() + offset);
        await this.enrichFlightTimes(p);
      }
    }

    // Voyage futur (Marrakech)
    const future = trips.find(t => t.status === 'upcoming');
    if (future) {
      const newStart = new Date(now.getTime() + 60 * DAY);
      const newEnd = new Date(now.getTime() + 67 * DAY);
      const offset = newStart.getTime() - this.toDate(future.startDate).getTime();
      future.startDate = newStart;
      future.endDate = newEnd;
      for (const p of future.plans) {
        p.startDate = new Date(this.toDate(p.startDate).getTime() + offset);
        p.endDate = new Date(this.toDate(p.endDate).getTime() + offset);
        await this.enrichFlightTimes(p);
      }
    }

    // Voyage en cours (Athènes)
    const ongoing = trips.find(t => t.status === 'ongoing');
    if (ongoing) {
      const flights = ongoing.plans.filter((p: any) => p.type === 'flight');
      if (flights.length) {
        const first = flights.reduce((min: any, p: any) => this.toDate(p.startDate) < this.toDate(min.startDate) ? p : min, flights[0]);
        
        const origStart = this.toDate(first.startDate);
        const origEnd = this.toDate(first.endDate);
        const duration = origEnd.getTime() - origStart.getTime();
        const newFlightStart = new Date(now.getTime() - duration / 3);
        const newFlightEnd = new Date(now.getTime() + duration * 2 / 3);
        const offset = newFlightStart.getTime() - origStart.getTime();
        
        ongoing.startDate = new Date(this.toDate(ongoing.startDate).getTime() + offset);
        ongoing.endDate = new Date(this.toDate(ongoing.endDate).getTime() + offset);
        
        for (const p of ongoing.plans) {
          let start = new Date(this.toDate(p.startDate).getTime() + offset);
          let end = new Date(this.toDate(p.endDate).getTime() + offset);
          if (p.id === first.id) {
            start = newFlightStart;
            end = newFlightEnd;
          }
          p.startDate = start;
          p.endDate = end;
          await this.enrichFlightTimes(p);
        }
      }
    }
  }

  private async enrichFlightTimes(plan: any) {
    if (plan.type === 'flight' && plan.details?.flight) {
      const departureDate = this.toDate(plan.startDate);
      const arrivalDate = this.toDate(plan.endDate);
      // Fuseau horaire IANA pour chaque extrémité
      const depTz = await this.timezoneService.getDepartureTimezoneName(plan);
      const arrTz = await this.timezoneService.getArrivalTimezoneName(plan);
      plan.departureTimeAffiche = this.timezoneService.formatDateInTimezone(departureDate, depTz);
      plan.arrivalTimeAffiche = this.timezoneService.formatDateInTimezone(arrivalDate, arrTz);
      // Abréviations dynamiques (si possible)
      let depAbbr = 'UTC';
      let arrAbbr = 'UTC';
      const depCity = plan.details.flight.departure?.city;
      const depIata = plan.details.flight.departure?.airport;
      const arrCity = plan.details.flight.arrival?.city;
      const arrIata = plan.details.flight.arrival?.airport;
      if (depCity || depIata) {
        const abbr = await this.timezoneService.getTimezoneAbbreviationFromCity(depCity, departureDate, depIata);
        depAbbr = abbr.abbr;
      }
      if (arrCity || arrIata) {
        const abbr = await this.timezoneService.getTimezoneAbbreviationFromCity(arrCity, arrivalDate, arrIata);
        arrAbbr = abbr.abbr;
      }
      plan.departureTzAbbr = depAbbr;
      plan.arrivalTzAbbr = arrAbbr;
    }
  }

  private categorizeTrips() {
    this.ongoingTrips = this.trips.filter(t => t.status === 'ongoing');
    this.upcomingTrips = this.trips.filter(t => t.status === 'upcoming');
    this.pastTrips = this.trips.filter(t => t.status === 'past');
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

  formatPlanTZ(date: any): string {
    // TODO: Implémenter la logique de fuseau horaire
    return 'CET';
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
  showCacheStats() {
    console.log('Statistiques du cache');
  }

  resetDemoData() {
    this.loadTrips();
  }

  testDemoService() {
    console.log('Test du service démo');
  }

  testTimezone() {
    console.log('Test des fuseaux horaires');
  }
}