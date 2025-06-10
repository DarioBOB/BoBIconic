import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { AdminService } from '../../core/services/admin.service';
import { Auth } from '@angular/fire/auth';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Administration - BoB</ion-title>
        <ion-buttons slot="end">
          <ion-button *ngIf="currentUserEmail" disabled>
            <ion-icon name="person-circle-outline" slot="start"></ion-icon>
            {{ currentUserEmail }}
          </ion-button>
          <ion-button color="danger" (click)="logout()">
            <ion-icon name="log-out-outline" slot="start"></ion-icon>
            Déconnexion
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <div *ngFor="let user of users" class="user-block">
        <h2 class="user-title">👤 {{ user.email || user.id }}</h2>
        <div *ngFor="let trip of user.trips" class="trip-block">
          <h3 class="trip-title">🧳 {{ getTitle(trip.title) }} <span class="trip-id">({{ trip.id }})</span></h3>
          <div class="trip-dates">
            <span *ngIf="trip.startDate">Début : {{ formatDate(trip.startDate) }}</span>
            <span *ngIf="trip.endDate"> | Fin : {{ formatDate(trip.endDate) }}</span>
          </div>
          <div *ngIf="trip.plans.length > 0" class="plans-list">
            <div *ngFor="let plan of trip.plans" class="plan-block">
              <div class="plan-header">
                <b>{{ getPlanIcon(plan.type) }} {{ plan.type | titlecase }}</b>
                <span *ngIf="plan.title">: {{ getTitle(plan.title) }}</span>
              </div>
              <div class="plan-details">
                <ng-container *ngFor="let field of getPlanFields(plan)">
                  <div *ngIf="plan[field] && !isTechnicalField(field)">
                    <b>{{ formatFieldLabel(field) }} :</b>
                    <span *ngIf="isDateField(field)">{{ formatDate(plan[field]) }}</span>
                    <span *ngIf="!isDateField(field) && !isObject(plan[field])">{{ plan[field] }}</span>
                    <span *ngIf="isObject(plan[field])">{{ formatObject(plan[field]) }}</span>
                  </div>
                </ng-container>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ion-content>
  `,
  styles: [`
    .user-block { margin-bottom: 40px; border-bottom: 2px solid #eee; padding-bottom: 24px; }
    .user-title { color: #1976d2; margin-bottom: 16px; }
    .trip-block { margin-bottom: 24px; padding-left: 16px; }
    .trip-title { color: #333; margin-bottom: 4px; }
    .trip-id { color: #888; font-size: 0.9em; }
    .trip-dates { color: #666; margin-bottom: 8px; }
    .plans-list { margin-left: 16px; }
    .plan-block { background: #f8f9fa; border-radius: 8px; margin-bottom: 12px; padding: 10px 14px; box-shadow: 0 1px 2px #0001; }
    .plan-header { font-size: 1.1em; margin-bottom: 4px; }
    .plan-details { font-size: 0.98em; color: #222; }
    b { color: #1976d2; }
  `]
})
export class AdminPage implements OnInit {
  users: any[] = [];
  currentUserEmail: string | null = null;

  constructor(private adminService: AdminService, private auth: Auth, private router: Router) {}

  async ngOnInit() {
    this.users = await this.adminService.getAllUsersWithTripsAndPlans();
    this.currentUserEmail = this.auth.currentUser?.email || null;
  }

  async logout() {
    await this.auth.signOut();
    this.router.navigate(['/auth']);
  }

  formatDate(val: any): string {
    if (!val) return '';
    if (val instanceof Date) return val.toLocaleString();
    if (val.seconds) return new Date(val.seconds * 1000).toLocaleString();
    if (typeof val === 'string') return new Date(val).toLocaleString();
    return val;
  }

  getPlanFields(plan: any): string[] {
    return Object.keys(plan).filter(k => !['id', 'type', 'title', 'tripId', 'createdAt', 'updatedAt', 'status', 'metadata', 'userId', 'createdByDemo'].includes(k));
  }

  isTechnicalField(field: string): boolean {
    return ['id', 'type', 'title', 'tripId', 'createdAt', 'updatedAt', 'status', 'metadata', 'userId', 'createdByDemo'].includes(field);
  }

  isDateField(field: string): boolean {
    return field.toLowerCase().includes('date') || field.toLowerCase().includes('time');
  }

  isObject(val: any): boolean {
    return typeof val === 'object' && val !== null && !(val instanceof Date);
  }

  formatObject(obj: any): string {
    if (!obj) return '';
    if (typeof obj === 'object') {
      return Object.entries(obj).map(([k, v]) => `${k}: ${v}`).join(', ');
    }
    return obj;
  }

  formatFieldLabel(field: string): string {
    switch (field) {
      case 'details': return 'Détails';
      case 'company': return 'Compagnie';
      case 'flightNumber': return 'Numéro de vol';
      case 'hotelName': return 'Hôtel';
      case 'pickup': return 'Départ';
      case 'dropoff': return 'Arrivée';
      default: return field.charAt(0).toUpperCase() + field.slice(1);
    }
  }

  getPlanIcon(type: string): string {
    switch ((type || '').toLowerCase()) {
      case 'flight': return '✈️';
      case 'hotel': return '🏨';
      case 'car_rental': return '🚗';
      case 'activity': return '🎟️';
      case 'transfer': return '🚕';
      default: return '📄';
    }
  }

  getTitle(title: any): string {
    if (!title) return '';
    if (typeof title === 'string') return title;
    if (typeof title === 'object') {
      return title['fr'] || title['en'] || JSON.stringify(title);
    }
    return String(title);
  }
} 