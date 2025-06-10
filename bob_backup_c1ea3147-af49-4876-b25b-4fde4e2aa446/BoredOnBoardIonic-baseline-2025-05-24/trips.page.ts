import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA, Pipe, PipeTransform } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { UserStatusBarComponent } from '../../core/components/user-status-bar.component';
import { TranslatePipe } from '../../core/pipes/translate.pipe';
import { AuthService } from '../../auth/auth.service';
import { TripService, Trip } from '../../core/services/trip.service';
import { collection, getDocs, query, where } from '@angular/fire/firestore';
import { FormsModule } from '@angular/forms';
import { FlightDetailsComponent } from '../../core/components/flight-details.component';
import { PlanCardComponent } from '../../core/shared/components/plan-card.component';

@Pipe({ name: 'safeDate', standalone: true })
export class SafeDatePipe implements PipeTransform {
  transform(value: any): Date | string {
    if (!value) return '-';
    if (value instanceof Date && !isNaN(value.getTime())) return value;
    if (typeof value === 'string') {
      const d = new Date(value);
      if (!isNaN(d.getTime())) return d;
    }
    if (value && typeof value.toDate === 'function') {
      const d = value.toDate();
      if (d instanceof Date && !isNaN(d.getTime())) return d;
    }
    if (typeof value === 'number') {
      const d = new Date(value);
      if (!isNaN(d.getTime())) return d;
    }
    return '-';
  }
}

@Component({
  selector: 'app-trips',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <ion-content id="main-content" class="ion-padding trips-content">
      <div class="trips-header">
        <h1>Mes Voyages</h1>
        <div class="trips-subtitle">Organisez vos trajets à venir</div>
      </div>
      <ion-segment [(ngModel)]="selectedTab" class="trips-segment">
        <ion-segment-button value="ongoing">
          {{ 'TRIPS.ONGOING' | translate }} ({{ trips.ongoing.length }})
        </ion-segment-button>
        <ion-segment-button value="upcoming">
          {{ 'TRIPS.UPCOMING' | translate }} ({{ trips.upcoming.length }})
        </ion-segment-button>
        <ion-segment-button value="past">
          {{ 'TRIPS.PAST' | translate }} ({{ trips.past.length }})
        </ion-segment-button>
      </ion-segment>
      <div *ngIf="loading" class="loading-spinner-modern">
        <ion-spinner name="dots"></ion-spinner>
        <p>{{ 'TRIPS.LOADING' | translate }}</p>
      </div>
      <ng-container *ngIf="!loading">
        <div *ngIf="errorFirestore" class="placeholder-container error">
          <ion-icon name="alert-circle-outline" class="placeholder-icon error"></ion-icon>
          <h1>{{ 'PAGES.TRIPS.TITLE' | translate }}</h1>
          <p class="error-text">{{ 'TRIPS.ERROR_FIRESTORE' | translate }}</p>
        </div>
        <ng-container *ngIf="!errorFirestore">
          <ng-container [ngSwitch]="selectedTab">
            <ng-container *ngSwitchCase="'ongoing'">
              <ng-container *ngIf="trips.ongoing.length > 0; else noOngoing">
                <div *ngFor="let trip of trips.ongoing" class="trip-card-timeline success">
                  <div class="trip-timeline-content">
                    <div class="trip-timeline-header">
                      <ion-icon name="airplane-outline" class="trip-icon"></ion-icon>
                      <span class="trip-title">{{ getTitle(trip.title) }}</span>
                      <ion-badge color="success">{{ 'TRIPS.ONGOING' | translate }}</ion-badge>
                    </div>
                    <div class="trip-timeline-dates">
                      <ion-icon name="calendar-outline" class="trip-date-icon"></ion-icon>
                      <span>
                        <ng-container *ngIf="getTripDateRange(trip).start | safeDate as start">
                          <ng-container *ngIf="start !== '-'">{{ start | date:getDateFormat() }}</ng-container>
                          <ng-container *ngIf="start === '-'">-</ng-container>
                        </ng-container>
                        -
                        <ng-container *ngIf="getTripDateRange(trip).end | safeDate as end">
                          <ng-container *ngIf="end !== '-'">{{ end | date:getDateFormat() }}</ng-container>
                          <ng-container *ngIf="end === '-'">-</ng-container>
                        </ng-container>
                      </span>
                    </div>
                    <div class="trip-timeline-actions">
                      <ion-button fill="clear" size="small" color="primary" (click)="onTripClick(trip)">
                        <ion-icon [name]="selectedTripId === trip.id ? 'chevron-up-outline' : 'chevron-down-outline'"></ion-icon>
                        {{ 'TRIPS.SHOW_ITINERARY' | translate }}
                      </ion-button>
                    </div>
                    <div *ngIf="selectedTripId === trip.id" class="plans-list-premium">
                      <div *ngIf="loadingPlans" class="loading-plans">
                        <ion-spinner name="dots"></ion-spinner>
                        <p>Chargement des étapes…</p>
                      </div>
                      <div *ngIf="!loadingPlans">
                        <div *ngIf="plans.length === 0" class="plans-placeholder">Aucune étape pour ce voyage</div>
                        <app-plan-card *ngFor="let plan of plans" [plan]="plan" [dateFormat]="getDateFormat()"></app-plan-card>
                      </div>
                    </div>
                  </div>
                </div>
              </ng-container>
              <ng-template #noOngoing>
                <div class="placeholder-container">
                  <ion-icon name="airplane-outline" class="placeholder-icon"></ion-icon>
                  <h1>{{ 'PAGES.TRIPS.TITLE' | translate }}</h1>
                  <p>{{ 'TRIPS.NO_TRIPS' | translate }}</p>
                </div>
              </ng-template>
            </ng-container>
            <ng-container *ngSwitchCase="'upcoming'">
              <ng-container *ngIf="trips.upcoming.length > 0; else noUpcoming">
                <div *ngFor="let trip of trips.upcoming" class="trip-card-timeline primary">
                  <div class="trip-timeline-content">
                    <div class="trip-timeline-header">
                      <ion-icon name="airplane-outline" class="trip-icon"></ion-icon>
                      <span class="trip-title">{{ getTitle(trip.title) }}</span>
                      <ion-badge color="primary">{{ 'TRIPS.UPCOMING' | translate }}</ion-badge>
                    </div>
                    <div class="trip-timeline-dates">
                      <ion-icon name="calendar-outline" class="trip-date-icon"></ion-icon>
                      <span>
                        <ng-container *ngIf="getTripDateRange(trip).start | safeDate as start">
                          <ng-container *ngIf="start !== '-'">{{ start | date:getDateFormat() }}</ng-container>
                          <ng-container *ngIf="start === '-'">-</ng-container>
                        </ng-container>
                        -
                        <ng-container *ngIf="getTripDateRange(trip).end | safeDate as end">
                          <ng-container *ngIf="end !== '-'">{{ end | date:getDateFormat() }}</ng-container>
                          <ng-container *ngIf="end === '-'">-</ng-container>
                        </ng-container>
                      </span>
                    </div>
                    <div class="trip-timeline-actions">
                      <ion-button fill="clear" size="small" color="primary" (click)="onTripClick(trip)">
                        <ion-icon [name]="selectedTripId === trip.id ? 'chevron-up-outline' : 'chevron-down-outline'"></ion-icon>
                        {{ 'TRIPS.SHOW_ITINERARY' | translate }}
                      </ion-button>
                    </div>
                    <div *ngIf="selectedTripId === trip.id" class="plans-list-premium">
                      <div *ngIf="loadingPlans" class="loading-plans">
                        <ion-spinner name="dots"></ion-spinner>
                        <p>Chargement des étapes…</p>
                      </div>
                      <div *ngIf="!loadingPlans">
                        <div *ngIf="plans.length === 0" class="plans-placeholder">Aucune étape pour ce voyage</div>
                        <app-plan-card *ngFor="let plan of plans" [plan]="plan" [dateFormat]="getDateFormat()"></app-plan-card>
                      </div>
                    </div>
                  </div>
                </div>
              </ng-container>
              <ng-template #noUpcoming>
                <div class="placeholder-container">
                  <ion-icon name="calendar-outline" class="placeholder-icon"></ion-icon>
                  <h1>{{ 'PAGES.TRIPS.TITLE' | translate }}</h1>
                  <p>{{ 'TRIPS.NO_TRIPS' | translate }}</p>
                </div>
              </ng-template>
            </ng-container>
            <ng-container *ngSwitchCase="'past'">
              <ng-container *ngIf="trips.past.length > 0; else noPast">
                <div *ngFor="let trip of trips.past" class="trip-card-timeline medium">
                  <div class="trip-timeline-content">
                    <div class="trip-timeline-header">
                      <ion-icon name="airplane-outline" class="trip-icon"></ion-icon>
                      <span class="trip-title">{{ getTitle(trip.title) }}</span>
                      <ion-badge color="medium">{{ 'TRIPS.PAST' | translate }}</ion-badge>
                    </div>
                    <div class="trip-timeline-dates">
                      <ion-icon name="calendar-outline" class="trip-date-icon"></ion-icon>
                      <span>
                        <ng-container *ngIf="getTripDateRange(trip).start | safeDate as start">
                          <ng-container *ngIf="start !== '-'">{{ start | date:getDateFormat() }}</ng-container>
                          <ng-container *ngIf="start === '-'">-</ng-container>
                        </ng-container>
                        -
                        <ng-container *ngIf="getTripDateRange(trip).end | safeDate as end">
                          <ng-container *ngIf="end !== '-'">{{ end | date:getDateFormat() }}</ng-container>
                          <ng-container *ngIf="end === '-'">-</ng-container>
                        </ng-container>
                      </span>
                    </div>
                    <div class="trip-timeline-actions">
                      <ion-button fill="clear" size="small" color="primary" (click)="onTripClick(trip)">
                        <ion-icon [name]="selectedTripId === trip.id ? 'chevron-up-outline' : 'chevron-down-outline'"></ion-icon>
                        {{ 'TRIPS.SHOW_ITINERARY' | translate }}
                      </ion-button>
                    </div>
                    <div *ngIf="selectedTripId === trip.id" class="plans-list-premium">
                      <div *ngIf="loadingPlans" class="loading-plans">
                        <ion-spinner name="dots"></ion-spinner>
                        <p>Chargement des étapes…</p>
                      </div>
                      <div *ngIf="!loadingPlans">
                        <div *ngIf="plans.length === 0" class="plans-placeholder">Aucune étape pour ce voyage</div>
                        <app-plan-card *ngFor="let plan of plans" [plan]="plan" [dateFormat]="getDateFormat()"></app-plan-card>
                      </div>
                    </div>
                  </div>
                </div>
              </ng-container>
              <ng-template #noPast>
                <div class="placeholder-container">
                  <ion-icon name="time-outline" class="placeholder-icon"></ion-icon>
                  <h1>{{ 'PAGES.TRIPS.TITLE' | translate }}</h1>
                  <p>{{ 'TRIPS.NO_TRIPS' | translate }}</p>
                </div>
              </ng-template>
            </ng-container>
          </ng-container>
        </ng-container>
      </ng-container>
    </ion-content>
    <ng-template #defaultPlanDisplay let-plan let-i="index">
      <ion-card class="plan-card">
        <ion-card-header>
          <ion-item lines="none" class="plan-header-item">
            <ion-icon [name]="getPlanIcon(plan?.type)" slot="start" class="plan-icon"></ion-icon>
            <ion-label>
              <div class="plan-title">{{ getTitle(plan?.title) }}</div>
              <div class="plan-dates">
                <ng-container *ngIf="plan?.startDate | safeDate as start">
                  <ng-container *ngIf="start !== '-'">{{ start | date:getDateFormat() }}</ng-container>
                  <ng-container *ngIf="start === '-'">-</ng-container>
                </ng-container>
                -
                <ng-container *ngIf="plan?.endDate | safeDate as end">
                  <ng-container *ngIf="end !== '-'">{{ end | date:getDateFormat() }}</ng-container>
                  <ng-container *ngIf="end === '-'">-</ng-container>
                </ng-container>
              </div>
              <div class="plan-type">Type : {{ ('TRIPS.' + (plan?.type || 'unknown')) | translate }}</div>
            </ion-label>
          </ion-item>
        </ion-card-header>
      </ion-card>
    </ng-template>
    <ng-template #nonFlightPlanDisplay let-plan let-i="index">
      <ng-container *ngTemplateOutlet="defaultPlanDisplay; context: { $implicit: plan, index: i }"></ng-container>
    </ng-template>
  `,
  styleUrls: ['./trips.page.scss'],
  imports: [
    CommonModule,
    IonicModule,
    FormsModule,
    UserStatusBarComponent,
    TranslatePipe,
    FlightDetailsComponent,
    SafeDatePipe,
    PlanCardComponent
  ]
})
export class TripsPage implements OnInit {
  trips: { upcoming: Trip[]; ongoing: Trip[]; past: Trip[] } = { upcoming: [], ongoing: [], past: [] };
  loading = true;
  loadingPlans = false;
  errorFirestore = false;
  public userId: string | null = null;
  selectedTripId: string | null = null;
  plans: any[] = [];
  selectedTab: string = 'ongoing';

  constructor(private authService: AuthService, private tripService: TripService) {}

  async ngOnInit() {
    this.userId = this.authService.currentUser?.uid || null;
    this.loading = true;
    this.errorFirestore = false;
    try {
      const allTrips = await this.tripService.getTrips();
      const now = new Date();
      this.trips = { upcoming: [], ongoing: [], past: [] };
      for (const trip of [...allTrips.upcoming, ...allTrips.ongoing, ...allTrips.past]) {
        let start: Date;
        let end: Date;
        if (trip.startDate instanceof Date) {
          start = trip.startDate;
        } else if (trip.startDate && typeof (trip.startDate as any).toDate === 'function') {
          start = (trip.startDate as any).toDate();
        } else {
          start = new Date(trip.startDate);
        }
        if (trip.endDate instanceof Date) {
          end = trip.endDate;
        } else if (trip.endDate && typeof (trip.endDate as any).toDate === 'function') {
          end = (trip.endDate as any).toDate();
        } else {
          end = new Date(trip.endDate);
        }
        let cat = '';
        if (start <= now && end >= now) {
          this.trips.ongoing.push(trip);
          cat = 'ongoing';
        } else if (start > now) {
          this.trips.upcoming.push(trip);
          cat = 'upcoming';
        } else if (end < now) {
          this.trips.past.push(trip);
          cat = 'past';
        } else {
          cat = 'ignored';
        }
        console.log(`[TRIP DEBUG]`, {id: trip.id, title: trip.title, start, end, cat});
      }
    } catch (e) {
      this.errorFirestore = true;
      this.trips = { upcoming: [], ongoing: [], past: [] };
    }
    this.loading = false;
  }

  toggleMenu() {
    const menu = document.querySelector('ion-menu');
    menu?.toggle();
  }

  async logout() {
    await this.authService.logout();
    window.location.href = '/auth/email';
  }

  async onTripClick(trip: Trip) {
    if (this.selectedTripId === trip.id) {
      this.selectedTripId = null;
      this.plans = [];
      return;
    }
    this.selectedTripId = trip.id;
    this.loadingPlans = true;
    try {
      let plans = await this.tripService.getPlansForTrip(trip.id);
      console.log('[DEBUG] Plans avant filtrage:', plans);
      plans.forEach((plan, idx) => {
        console.log(`[DEBUG] Plan #${idx} details:`, plan.details);
      });
      // Filtrer les plans invalides (type inconnu, titre manquant)
      plans = plans.filter(plan => {
        const isValid = plan && plan.type && plan.type !== 'unknown' && plan.type !== '-' && plan.title && plan.title !== '-';
        if (!isValid) {
          console.log('[DEBUG] Plan invalide:', plan);
        }
        return isValid;
      });
      console.log('[DEBUG] Plans après filtrage:', plans);
      this.plans = plans;
    } catch (error) {
      console.error('Erreur lors de la récupération des plans:', error);
      this.plans = [];
    } finally {
      this.loadingPlans = false;
    }
  }

  getPlanIcon(type: string): string {
    switch (type) {
      case 'flight': return 'airplane-outline';
      case 'car_rental': return 'car-outline';
      case 'hotel': return 'home-outline';
      case 'train': return 'train-outline';
      case 'ferry': return 'boat-outline';
      case 'restaurant': return 'restaurant-outline';
      case 'activity': return 'star-outline';
      case 'meeting': return 'calendar-outline';
      default: return 'help-circle-outline';
    }
  }

  getTripDateRange(trip: Trip): { start: Date | string, end: Date | string } {
    // Si les dates du trip sont invalides, on les calcule à partir des plans
    let start = trip.startDate instanceof Date ? trip.startDate : (trip.startDate && typeof (trip.startDate as any).toDate === 'function' ? (trip.startDate as any).toDate() : new Date(trip.startDate));
    let end = trip.endDate instanceof Date ? trip.endDate : (trip.endDate && typeof (trip.endDate as any).toDate === 'function' ? (trip.endDate as any).toDate() : new Date(trip.endDate));
    if ((!start || isNaN((start as Date).getTime()) || !end || isNaN((end as Date).getTime())) && this.selectedTripId === trip.id && this.plans.length > 0) {
      // On prend la date la plus tôt et la plus tardive parmi les plans
      const sortedPlans = [...this.plans].sort((a, b) => {
        const da = a.startDate && typeof a.startDate.toDate === 'function' ? a.startDate.toDate() : new Date(a.startDate);
        const db = b.startDate && typeof b.startDate.toDate === 'function' ? b.startDate.toDate() : new Date(b.startDate);
        return da.getTime() - db.getTime();
      });
      const firstPlan = sortedPlans[0];
      const lastPlan = sortedPlans[sortedPlans.length - 1];
      start = firstPlan.startDate && typeof firstPlan.startDate.toDate === 'function' ? firstPlan.startDate.toDate() : new Date(firstPlan.startDate);
      end = lastPlan.endDate && typeof lastPlan.endDate.toDate === 'function' ? lastPlan.endDate.toDate() : new Date(lastPlan.endDate);
    }
    return { start, end };
  }

  getDateFormat(): string {
    // On suppose que la langue est stockée dans localStorage ou accessible via TranslateService
    const lang = localStorage.getItem('lang') || 'en';
    return lang === 'fr' ? "EEEE d MMMM y HH'h'mm" : 'short';
  }

  objectKeys(obj: any): string[] {
    return obj ? Object.keys(obj) : [];
  }

  // Ajout de la méthode utilitaire pour gérer les titres multilingues
  getTitle(title: any): string {
    if (!title) return '';
    if (typeof title === 'string') return title;
    if (typeof title === 'object') {
      const lang = localStorage.getItem('lang') || 'fr';
      return title[lang] || title['fr'] || title['en'] || JSON.stringify(title);
    }
    return String(title);
  }

  // Ajout de la fonction utilitaire pour la couleur du type de plan
  getPlanColor(type: string): string {
    switch ((type || '').toLowerCase()) {
      case 'flight': return 'linear-gradient(135deg, #ff9800 60%, #2196f3 100%)';
      case 'car_rental': return 'linear-gradient(135deg, #ffa726 60%, #66bb6a 100%)';
      case 'hotel': return 'linear-gradient(135deg, #66bb6a 60%, #29b6f6 100%)';
      case 'activity': return 'linear-gradient(135deg, #29b6f6 60%, #ab47bc 100%)';
      default: return 'linear-gradient(135deg, #bdbdbd 60%, #90caf9 100%)';
    }
  }
} 