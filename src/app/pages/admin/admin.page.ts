import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { AdminService } from '../../services/admin.service';
import { Auth } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule],
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
      <ion-segment [(ngModel)]="selectedTab">
        <ion-segment-button value="users">Utilisateurs & Plans</ion-segment-button>
        <ion-segment-button value="variables">Variables</ion-segment-button>
      </ion-segment>
      <div [ngSwitch]="selectedTab">
        <div *ngSwitchCase="'users'">
          <div *ngFor="let user of users" class="user-block">
            <h2 class="user-title">👤 {{ user.email || user.id }}</h2>
            <div *ngFor="let trip of user.trips" class="trip-block">
              <h3 class="trip-title">🧳 {{ getTitle(trip.title || trip.name) }} <span class="trip-id">({{ trip.id }})</span></h3>
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
        </div>
        <div *ngSwitchCase="'variables'">
          <h2>Variables de configuration</h2>
          <ion-list>
            <ion-item *ngFor="let variable of variables">
              <ion-label class="ion-text-wrap">
                <b>{{ variable.key }}</b><br>
                <span style="font-size:0.95em;color:#666">{{ variable.description }}</span><br>
                <span style="font-size:0.9em;color:#888">Utilisation : {{ variable.usage }}</span>
              </ion-label>
              <ion-input [(ngModel)]="variable.value" (ionBlur)="saveVariable(variable)"></ion-input>
            </ion-item>
          </ion-list>
          <ion-button expand="block" color="success" (click)="saveAllVariables()">Sauvegarder toutes les modifications</ion-button>
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
    .variables-list { margin-top: 24px; }
  `]
})
export class AdminPage implements OnInit {
  users: any[] = [];
  currentUserEmail: string | null = null;
  selectedTab: string = 'users';
  variables: any[] = [];

  // Descriptions et usages des variables (à compléter pour chaque variable)
  variableMeta = {
    openskyProxyBaseUrl: {
      description: "URL du proxy local pour l'API OpenSky (contourne CORS et gère l'authentification)",
      usage: "Utilisé dans tous les services de vol pour requêter OpenSky via le backend Node."
    },
    openskyMaxDays: {
      description: "Nombre de jours maximum pour la recherche de vols GVA→ATH.",
      usage: "Limite la fenêtre de recherche dans OpenSkyService."
    },
    openskyDefaultSearchDuration: {
      description: "Durée par défaut (en secondes) pour la recherche d'un vol si la borne inférieure n'est pas précisée.",
      usage: "Utilisé dans OpenSkyService pour corriger les bornes de recherche."
    },
    demoEmail: {
      description: "Email utilisé pour l'utilisateur démo.",
      usage: "Utilisé dans DemoService pour la connexion démo."
    },
    demoPassword: {
      description: "Mot de passe de l'utilisateur démo.",
      usage: "Utilisé dans DemoService pour la connexion démo."
    },
    demoUserId: {
      description: "ID Firestore de l'utilisateur démo.",
      usage: "Utilisé dans DemoService pour la gestion des données démo."
    },
    demoDurationMin: {
      description: "Durée du vol démo Genève-Athènes (en minutes).",
      usage: "Utilisé dans DemoService pour générer le vol démo."
    },
    demoGvaAirport: {
      description: "Objet aéroport de Genève pour la démo.",
      usage: "Utilisé dans DemoService pour les plans et trips démo."
    },
    demoAthAirport: {
      description: "Objet aéroport d'Athènes pour la démo.",
      usage: "Utilisé dans DemoService pour les plans et trips démo."
    },
    flightawareApiUrl: {
      description: "URL de l'API FlightAware.",
      usage: "Utilisé dans FlightAwareService pour récupérer les données de vol."
    },
    flightawareCacheDuration: {
      description: "Durée du cache local pour les données FlightAware (en ms).",
      usage: "Utilisé dans FlightAwareService pour éviter les appels redondants."
    },
    planeAssetPath: {
      description: "Chemin de base des images d'avion pour l'affichage sur la carte.",
      usage: "Utilisé dans FlightMapService et FlightMapComponent pour les icônes d'avion."
    },
    defaultMapCenter: {
      description: "Coordonnées [lat, lon] du centre par défaut de la carte.",
      usage: "Utilisé dans FlightMapService pour initialiser la carte."
    },
    defaultMapZoom: {
      description: "Niveau de zoom par défaut de la carte.",
      usage: "Utilisé dans FlightMapService pour initialiser la carte."
    },
    defaultLang: {
      description: "Langue par défaut de l'application.",
      usage: "Utilisé dans TranslationService et TranslateService."
    }
  };

  constructor(private adminService: AdminService, private auth: Auth, private router: Router) {}

  ngOnInit() {
    this.selectedTab = 'users';
    this.loadVariables();
    this.adminService.getAllUsersWithTripsAndPlans().then(users => {
      this.users = users;
    });
    this.currentUserEmail = this.auth.currentUser?.email || null;
  }

  loadVariables() {
    this.variables = Object.keys(this.variableMeta).map(key => ({
      key,
      value: (environment as any)[key],
      description: (this.variableMeta as any)[key].description,
      usage: (this.variableMeta as any)[key].usage
    }));
  }

  saveVariable(variable: any) {
    (environment as any)[variable.key] = variable.value;
  }

  saveAllVariables() {
    this.variables.forEach(v => (environment as any)[v.key] = v.value);
    alert('Variables sauvegardées (en mémoire, non persistant). Implémente un backend pour la persistance réelle.');
  }

  async logout() {
    await this.auth.signOut();
    this.router.navigate(['/auth/email']);
  }

  formatDate(val: any): string {
    if (!val) return '';
    if (val instanceof Date) return val.toLocaleString();
    if (val.seconds) return new Date(val.seconds * 1000).toLocaleString();
    if (typeof val === 'string') return new Date(val).toLocaleString();
    return val;
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
  getPlanFields(plan: any): string[] {
    return Object.keys(plan || {});
  }
  isTechnicalField(field: string): boolean {
    return ['id', 'tripId', 'userId', 'createdAt', 'updatedAt'].includes(field);
  }
  isDateField(field: string): boolean {
    return ['date', 'startDate', 'endDate'].includes(field);
  }
  isObject(val: any): boolean {
    return typeof val === 'object' && val !== null && !Array.isArray(val);
  }
} 