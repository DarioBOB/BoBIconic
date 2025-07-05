import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, AlertController, ToastController } from '@ionic/angular';
import { AdminService } from '../../services/admin.service';
import { Auth } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { FormsModule } from '@angular/forms';
import { DemoService } from '../../services/demo.service';
import { LoggerService, LogLevel } from '../../services/logger.service';
import { Firestore, collection, getDocs, query, orderBy, where } from '@angular/fire/firestore';

interface User {
  id: string;
  email?: string;
  role?: string;
  displayName?: string;
  tripCount?: number;
  trips?: Trip[];
}

interface Trip {
  id: string;
  userId?: string;
  title?: any;
  startDate?: any;
  endDate?: any;
  plans?: Plan[];
  createdByDemo?: boolean;
}

interface Plan {
  id: string;
  tripId?: string;
  title?: any;
  type?: string;
  startDate?: any;
  endDate?: any;
  details?: any;
  [key: string]: any; // Index signature pour les propriétés dynamiques
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule],
  template: `
    <ion-header [translucent]="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/landing-tiles"></ion-back-button>
        </ion-buttons>
        <ion-title>Administration</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content [fullscreen]="true">
      <!-- Onglets de navigation -->
      <ion-segment [(ngModel)]="selectedTab" scrollable="true">
        <ion-segment-button value="dashboard">
          <ion-label>Dashboard</ion-label>
        </ion-segment-button>
        <ion-segment-button value="users">
          <ion-label>Utilisateurs</ion-label>
        </ion-segment-button>
        <ion-segment-button value="trips">
          <ion-label>Voyages</ion-label>
        </ion-segment-button>
        <ion-segment-button value="variables">
          <ion-label>Variables</ion-label>
        </ion-segment-button>
      </ion-segment>

      <!-- Onglet Dashboard -->
      <div *ngIf="selectedTab === 'dashboard'">
        <div class="admin-container">
          <ion-card>
            <ion-card-header>
              <ion-card-title>Panneau d'Administration</ion-card-title>
              <ion-card-subtitle>Gestion de l'application BoBIconic</ion-card-subtitle>
            </ion-card-header>
            <ion-card-content>
              <p>Bienvenue dans le panneau d'administration. Vous avez accès aux fonctionnalités suivantes :</p>
            </ion-card-content>
          </ion-card>

          <ion-grid>
            <ion-row>
              <ion-col size="12" size-md="6">
                <ion-card>
                  <ion-card-header>
                    <ion-card-title>📊 Logs et Monitoring</ion-card-title>
                  </ion-card-header>
                  <ion-card-content>
                    <p>Consultez les logs de l'application, les métriques de performance et les alertes.</p>
                    <ion-button expand="block" (click)="goToLogs()">
                      <ion-icon name="document-text" slot="start"></ion-icon>
                      Voir les Logs
                    </ion-button>
                  </ion-card-content>
                </ion-card>
              </ion-col>

              <ion-col size="12" size-md="6">
                <ion-card>
                  <ion-card-header>
                    <ion-card-title>⚙️ Configuration</ion-card-title>
                  </ion-card-header>
                  <ion-card-content>
                    <p>Gérez la configuration du système de logging et des paramètres d'administration.</p>
                    <ion-button expand="block" (click)="openLogConfig()">
                      <ion-icon name="settings" slot="start"></ion-icon>
                      Configuration Logs
                    </ion-button>
                  </ion-card-content>
                </ion-card>
              </ion-col>
            </ion-row>

            <ion-row>
              <ion-col size="12" size-md="6">
                <ion-card>
                  <ion-card-header>
                    <ion-card-title>📈 Statistiques</ion-card-title>
                  </ion-card-header>
                  <ion-card-content>
                    <div *ngIf="metrics">
                      <ion-list>
                        <ion-item>
                          <ion-label>Total Logs</ion-label>
                          <ion-note slot="end">{{ metrics.total }}</ion-note>
                        </ion-item>
                        <ion-item>
                          <ion-label>Erreurs (24h)</ion-label>
                          <ion-note slot="end">{{ getErrorCount() }}</ion-note>
                        </ion-item>
                        <ion-item>
                          <ion-label>Taux d'Erreur</ion-label>
                          <ion-note slot="end">{{ metrics.performance.errorRate.toFixed(2) }}%</ion-note>
                        </ion-item>
                        <ion-item>
                          <ion-label>Mémoire Utilisée</ion-label>
                          <ion-note slot="end">{{ metrics.performance.memoryUsage.toFixed(1) }} MB</ion-note>
                        </ion-item>
                      </ion-list>
                    </div>
                    <ion-button expand="block" (click)="refreshMetrics()">
                      <ion-icon name="refresh" slot="start"></ion-icon>
                      Actualiser
                    </ion-button>
                  </ion-card-content>
                </ion-card>
              </ion-col>

              <ion-col size="12" size-md="6">
                <ion-card>
                  <ion-card-header>
                    <ion-card-title>🚨 Alertes</ion-card-title>
                  </ion-card-header>
                  <ion-card-content>
                    <div *ngIf="alerts.length > 0">
                      <ion-list>
                        <ion-item *ngFor="let alert of alerts" [color]="getAlertColor(alert.severity)">
                          <ion-icon [name]="getAlertIcon(alert.type)" slot="start"></ion-icon>
                          <ion-label>
                            <h3>{{ alert.type }}</h3>
                            <p>{{ alert.message }}</p>
                          </ion-label>
                        </ion-item>
                      </ion-list>
                    </div>
                    <div *ngIf="alerts.length === 0">
                      <p>Aucune alerte active</p>
                    </div>
                    <ion-button expand="block" (click)="refreshAlerts()">
                      <ion-icon name="warning" slot="start"></ion-icon>
                      Actualiser Alertes
                    </ion-button>
                  </ion-card-content>
                </ion-card>
              </ion-col>
            </ion-row>

            <ion-row>
              <ion-col size="12">
                <ion-card>
                  <ion-card-header>
                    <ion-card-title>🛠️ Actions Système</ion-card-title>
                  </ion-card-header>
                  <ion-card-content>
                    <ion-grid>
                      <ion-row>
                        <ion-col size="6" size-md="3">
                          <ion-button expand="block" fill="outline" (click)="clearLogs()">
                            <ion-icon name="trash" slot="start"></ion-icon>
                            Vider Logs
                          </ion-button>
                        </ion-col>
                        <ion-col size="6" size-md="3">
                          <ion-button expand="block" fill="outline" (click)="exportLogs()">
                            <ion-icon name="download" slot="start"></ion-icon>
                            Exporter
                          </ion-button>
                        </ion-col>
                        <ion-col size="6" size-md="3">
                          <ion-button expand="block" fill="outline" (click)="testLogging()">
                            <ion-icon name="bug" slot="start"></ion-icon>
                            Test Logs
                          </ion-button>
                        </ion-col>
                        <ion-col size="6" size-md="3">
                          <ion-button expand="block" fill="outline" (click)="showSystemInfo()">
                            <ion-icon name="information-circle" slot="start"></ion-icon>
                            Info Système
                          </ion-button>
                        </ion-col>
                      </ion-row>
                    </ion-grid>
                  </ion-card-content>
                </ion-card>
              </ion-col>
            </ion-row>
          </ion-grid>
        </div>
      </div>

      <!-- Onglet Utilisateurs -->
      <div *ngIf="selectedTab === 'users'">
        <div class="admin-container">
          <ion-card>
            <ion-card-header>
              <ion-card-title>👥 Utilisateurs, Voyages & Plans</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <ion-list>
                <div *ngFor="let user of users">
                  <ion-item color="light">
                    <ion-label>
                      <h2>{{ user.displayName || user.email || user.id }} <span style="font-size:0.8em;color:gray">[ID: {{ user.id }}]</span></h2>
                      <p>{{ user.email }}</p>
                      <p><strong>Voyages :</strong> {{ user.trips?.length || 0 }}</p>
                    </ion-label>
                  </ion-item>
                  <div *ngIf="user.trips && user.trips.length > 0" style="margin-left: 24px;">
                    <ion-list>
                      <div *ngFor="let trip of user.trips">
                        <ion-item color="secondary">
                          <ion-label>
                            <h3>{{ getTitle(trip.title) || 'Voyage sans titre' }} <span style="font-size:0.8em;color:gray">[ID: {{ trip.id }}]</span></h3>
                            <p><strong>Période:</strong> {{ formatDate(trip.startDate) }} - {{ formatDate(trip.endDate) }}</p>
                            <p><strong>Plans :</strong> {{ trip.plans?.length || 0 }}</p>
                          </ion-label>
                        </ion-item>
                        <div *ngIf="trip.plans && trip.plans.length > 0" style="margin-left: 24px;">
                          <ion-list>
                            <ion-item *ngFor="let plan of trip.plans" color="tertiary">
                              <ion-label>
                                <h4>{{ getTitle(plan.title) || 'Plan sans titre' }} <span style="font-size:0.8em;color:gray">[ID: {{ plan.id }}]</span></h4>
                                <p><strong>Type:</strong> {{ plan.type }}</p>
                                <p *ngIf="plan.startDate"><strong>Début:</strong> {{ formatDate(plan.startDate) }}</p>
                                <p *ngIf="plan.endDate"><strong>Fin:</strong> {{ formatDate(plan.endDate) }}</p>
                              </ion-label>
                            </ion-item>
                          </ion-list>
                        </div>
                      </div>
                    </ion-list>
                  </div>
                </div>
              </ion-list>
            </ion-card-content>
          </ion-card>
        </div>
      </div>

      <!-- Onglet Voyages -->
      <div *ngIf="selectedTab === 'trips'">
        <div class="admin-container">
          <ion-card>
            <ion-card-header>
              <ion-card-title>✈️ Gestion des Voyages</ion-card-title>
              <ion-card-subtitle>Vue d'ensemble de tous les voyages et plans</ion-card-subtitle>
            </ion-card-header>
            <ion-card-content>
              <ion-button expand="block" (click)="loadTrips()" [disabled]="isLoadingTrips">
                <ion-icon name="refresh" slot="start"></ion-icon>
                {{ isLoadingTrips ? 'Chargement...' : 'Actualiser les Voyages' }}
              </ion-button>
            </ion-card-content>
          </ion-card>

          <div *ngIf="isLoadingTrips" class="loading-container">
            <ion-spinner name="crescent"></ion-spinner>
            <p>Chargement des voyages...</p>
          </div>

          <div *ngIf="!isLoadingTrips && trips.length > 0">
            <ion-card *ngFor="let trip of trips" class="trip-card">
              <ion-card-header>
                <ion-card-title>
                  <ion-icon name="airplane" slot="start"></ion-icon>
                  {{ getTitle(trip.title) || 'Voyage sans titre' }}
                </ion-card-title>
                <ion-card-subtitle>
                  ID: {{ trip.id }} | User: {{ trip.userId || 'N/A' }}
                  <span *ngIf="trip.createdByDemo" class="demo-badge">DEMO</span>
                </ion-card-subtitle>
              </ion-card-header>
              <ion-card-content>
                <div class="trip-info">
                  <p><strong>Période:</strong> {{ formatDate(trip.startDate) }} - {{ formatDate(trip.endDate) }}</p>
                  <p><strong>Plans:</strong> {{ trip.plans?.length || 0 }} éléments</p>
                </div>

                <div *ngIf="trip.plans && trip.plans.length > 0" class="plans-container">
                  <h4>Plans ({{ trip.plans.length }})</h4>
                  <ion-list>
                    <ion-item *ngFor="let plan of trip.plans; let i = index" class="plan-item">
                      <ion-icon [name]="getPlanIcon(plan.type)" slot="start" [color]="getPlanColor(plan.type)"></ion-icon>
                      <ion-label>
                        <h3>{{ i + 1 }}. {{ getTitle(plan.title) || 'Plan sans titre' }}</h3>
                        <p><strong>Type:</strong> {{ plan.type }}</p>
                        <p *ngIf="plan.startDate"><strong>Début:</strong> {{ formatDate(plan.startDate) }}</p>
                        <p *ngIf="plan.endDate"><strong>Fin:</strong> {{ formatDate(plan.endDate) }}</p>
                        <div *ngIf="plan.details" class="plan-details">
                          <p *ngFor="let field of getPlanFields(plan)" class="detail-field">
                            <strong>{{ formatFieldLabel(field) }}:</strong> 
                            <span [class]="isDateField(field) ? 'date-field' : ''">
                              {{ formatObject(getPlanField(plan, field)) }}
                            </span>
                          </p>
                        </div>
                      </ion-label>
                    </ion-item>
                  </ion-list>
                </div>
              </ion-card-content>
            </ion-card>
          </div>

          <div *ngIf="!isLoadingTrips && trips.length === 0" class="empty-state">
            <ion-card>
              <ion-card-content>
                <ion-icon name="airplane-outline" size="large"></ion-icon>
                <h3>Aucun voyage trouvé</h3>
                <p>Cliquez sur "Actualiser les Voyages" pour charger les données depuis Firestore.</p>
              </ion-card-content>
            </ion-card>
          </div>
        </div>
      </div>

      <!-- Onglet Variables -->
      <div *ngIf="selectedTab === 'variables'">
        <div class="admin-container">
          <ion-card>
            <ion-card-header>
              <ion-card-title>🔧 Variables d'Environnement</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <ion-list>
                <ion-item *ngFor="let variable of variables">
                  <ion-label>
                    <h3>{{ variable.name }}</h3>
                    <p>{{ variable.value }}</p>
                  </ion-label>
                  <ion-button slot="end" fill="clear" (click)="saveVariable(variable)">
                    <ion-icon name="save"></ion-icon>
                  </ion-button>
                </ion-item>
              </ion-list>
            </ion-card-content>
          </ion-card>
        </div>
      </div>
    </ion-content>
  `,
  styles: [`
    .admin-container {
      padding: 16px;
    }
    
    ion-card {
      margin-bottom: 16px;
    }
    
    ion-card-title {
      font-size: 1.2em;
      font-weight: bold;
    }
    
    ion-button {
      margin-top: 8px;
    }
    
    ion-list {
      margin-bottom: 16px;
    }
    
    ion-item {
      --padding-start: 16px;
      --padding-end: 16px;
    }
    
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px;
    }

    .trip-card {
      margin-bottom: 20px;
      border-left: 4px solid var(--ion-color-primary);
    }

    .demo-badge {
      background: var(--ion-color-warning);
      color: white;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 0.8em;
      margin-left: 8px;
    }

    .trip-info {
      margin-bottom: 16px;
      padding: 12px;
      background: var(--ion-color-light);
      border-radius: 8px;
    }

    .plans-container {
      margin-top: 16px;
    }

    .plan-item {
      margin-bottom: 8px;
      border-left: 3px solid var(--ion-color-primary);
    }

    .plan-details {
      margin-top: 8px;
      padding: 8px;
      background: var(--ion-color-light-tint);
      border-radius: 4px;
    }

    .detail-field {
      margin: 4px 0;
      font-size: 0.9em;
    }

    .date-field {
      color: var(--ion-color-primary);
      font-weight: 500;
    }

    .empty-state {
      text-align: center;
      padding: 40px;
    }

    .empty-state ion-icon {
      color: var(--ion-color-medium);
      margin-bottom: 16px;
    }
  `]
})
export class AdminPage implements OnInit {
  users: User[] = [];
  currentUserEmail: string | null = null;
  selectedTab: string = 'users';
  variables: any[] = [];
  isReloading = false;
  metrics: any = null;
  alerts: any[] = [];
  trips: Trip[] = [];
  isLoadingTrips = false;

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

  constructor(
    private adminService: AdminService, 
    private auth: Auth, 
    private router: Router, 
    private demoService: DemoService,
    private alertController: AlertController,
    private toastController: ToastController,
    private logger: LoggerService,
    private firestore: Firestore
  ) {}

  ngOnInit() {
    this.loadUsers();
    this.loadVariables();
    this.refreshMetrics();
    this.refreshAlerts();
    this.loadTrips();
    this.currentUserEmail = this.auth.currentUser?.email || null;
    this.logger.info('Admin', 'Page d\'administration chargée');
  }

  async loadUsers() {
    this.users = await this.adminService.getUsersWithTripsAndPlans();
  }

  private toJsDate(val: any): Date | null {
    if (!val) return null;
    if (val.toDate) return val.toDate(); // Firestore Timestamp
    if (val.seconds) return new Date(val.seconds * 1000); // Old Firestore Timestamp
    if (typeof val === 'string' || typeof val === 'number') {
      const date = new Date(val);
      return isNaN(date.getTime()) ? null : date;
    }
    return null;
  }

  formatDate(val: any): string {
    const date = this.toJsDate(val);
    if (!date) return 'Date invalide';
    return date.toLocaleString('fr-FR', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit'
    });
  }

  getSortedTrips(trips: Trip[]): Trip[] {
    if (!trips) return [];
    return [...trips].sort((a, b) => {
      const dateA = this.toJsDate(a.startDate)?.getTime() || 0;
      const dateB = this.toJsDate(b.startDate)?.getTime() || 0;
      return dateA - dateB;
    });
  }

  getSortedPlans(plans: Plan[]): Plan[] {
    if (!plans) return [];
    return [...plans].sort((a, b) => {
      const dateA = this.toJsDate(a.startDate)?.getTime() || 0;
      const dateB = this.toJsDate(b.startDate)?.getTime() || 0;
      return dateA - dateB;
    });
  }

  async reloadDemoTrips() {
    const alert = await this.alertController.create({
      header: 'Confirmation',
      message: 'Voulez-vous vraiment recharger les données de démo ? Toutes les modifications seront perdues.',
      buttons: [
        { text: 'Annuler', role: 'cancel' },
        {
          text: 'Recharger',
          handler: async () => {
            this.isReloading = true;
            const toast = await this.toastController.create({ 
              message: 'Rechargement des données démo...', 
              position: 'bottom'
            });
            await toast.present();
            try {
              await this.demoService.reloadDemoTrips();
              toast.message = 'Données démo rechargées avec succès !';
              toast.color = 'success';
              // Re-fetch data for the admin page
              this.adminService.getUsersWithTripsAndPlans().then(users => {
                this.users = users;
              });
            } catch (error) {
              console.error('Error reloading demo trips:', error);
              toast.message = 'Erreur lors du rechargement.';
              toast.color = 'danger';
            } finally {
              this.isReloading = false;
              setTimeout(() => toast.dismiss(), 2000);
            }
          }
        }
      ]
    });
    await alert.present();
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

  formatObject(obj: any): string {
    if (!obj) return '';
    if (obj.fr) return obj.fr;
    if (obj.en) return obj.en;
    if (obj.seconds) return this.formatDate(obj);
    return JSON.stringify(obj);
  }

  formatFieldLabel(field: string): string {
    return field.charAt(0).toUpperCase() + field.slice(1);
  }

  getPlanIcon(type?: string): string {
    switch (type) {
      case 'flight': return 'airplane';
      case 'hotel': return 'bed';
      case 'car': return 'car';
      case 'car_rental': return 'car';
      case 'ferry': return 'boat';
      case 'activity': return 'walk';
      case 'expense': return 'card';
      case 'document': return 'document';
      default: return 'help-circle';
    }
  }

  getPlanColor(type?: string): string {
    switch (type) {
      case 'flight': return 'primary';
      case 'hotel': return 'secondary';
      case 'car': return 'tertiary';
      case 'car_rental': return 'tertiary';
      case 'ferry': return 'success';
      case 'activity': return 'warning';
      case 'expense': return 'danger';
      case 'document': return 'medium';
      default: return 'dark';
    }
  }

  selectUser(user: User) {
    console.log('[Admin] Utilisateur sélectionné:', user);
    // Ici on pourrait ajouter une logique pour afficher les détails de l'utilisateur
  }

  getTitle(title: any): string {
    if (typeof title === 'object' && title !== null) {
      return title.fr || title.en || 'Titre non disponible';
    }
    return title || 'Titre non disponible';
  }

  getPlanFields(plan: Plan): string[] {
    return Object.keys(plan || {});
  }

  getPlanField(plan: Plan, field: string): any {
    return plan[field] || '';
  }

  isTechnicalField(field: string): boolean {
    return ['id', 'tripId', 'userId', 'createdByDemo', 'createdAt', 'updatedAt'].includes(field);
  }

  isDateField(field: string): boolean {
    const lowerCaseField = field.toLowerCase();
    return lowerCaseField.includes('date') || lowerCaseField.includes('start') || lowerCaseField.includes('end');
  }

  isObject(val: any): boolean {
    return typeof val === 'object' && val !== null && !Array.isArray(val);
  }

  goToLogs() {
    this.logger.info('Admin', 'Navigation vers la page des logs');
    this.router.navigate(['/admin/logs']);
  }

  openLogConfig() {
    this.logger.info('Admin', 'Ouverture de la configuration des logs');
    // TODO: Implémenter la modal de configuration
  }

  refreshMetrics() {
    this.metrics = this.logger.getLogStats();
    this.logger.info('Admin', 'Métriques actualisées', { metrics: this.metrics });
  }

  refreshAlerts() {
    this.logger.alerts$.subscribe(alerts => {
      this.alerts = alerts;
      this.logger.info('Admin', 'Alertes actualisées', { count: alerts.length });
    });
  }

  getErrorCount(): number {
    if (!this.metrics) return 0;
    return this.metrics.byLevel['ERROR'] || 0;
  }

  getAlertColor(severity: string): string {
    switch (severity) {
      case 'high': return 'danger';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'medium';
    }
  }

  getAlertIcon(type: string): string {
    switch (type) {
      case 'error': return 'warning';
      case 'warning': return 'alert-circle';
      case 'info': return 'information-circle';
      default: return 'help-circle';
    }
  }

  clearLogs() {
    this.logger.clearLogs();
    this.refreshMetrics();
    this.logger.info('Admin', 'Logs vidés manuellement');
  }

  exportLogs() {
    const logs = this.logger.getLogs();
    const dataStr = JSON.stringify(logs, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bob-logs-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    this.logger.info('Admin', 'Logs exportés', { count: logs.length });
  }

  testLogging() {
    this.logger.debug('Admin', 'Test de log DEBUG');
    this.logger.info('Admin', 'Test de log INFO');
    this.logger.warn('Admin', 'Test de log WARNING');
    this.logger.error('Admin', 'Test de log ERROR');
    this.refreshMetrics();
  }

  showSystemInfo() {
    const info = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      timestamp: new Date().toISOString()
    };
    console.log('System Info:', info);
    this.logger.info('Admin', 'Informations système affichées', info);
  }

  loadTrips() {
    this.isLoadingTrips = true;
    this.loadAllTripsFromFirestore().finally(() => {
      this.isLoadingTrips = false;
    });
  }

  async loadAllTripsFromFirestore() {
    try {
      const tripsSnapshot = await getDocs(collection(this.firestore, 'trips'));
      const trips: Trip[] = [];
      
      for (const tripDoc of tripsSnapshot.docs) {
        const tripData = tripDoc.data();
        const trip: Trip = { id: tripDoc.id, ...tripData };
        
        // Récupérer les plans du voyage
        const plansSnapshot = await getDocs(query(collection(this.firestore, 'plans'), where('tripId', '==', tripDoc.id)));
        const plans = plansSnapshot.docs.map(planDoc => ({ id: planDoc.id, ...planDoc.data() } as Plan));
        trip.plans = plans;
        trips.push(trip);
      }
      
      this.trips = trips;
      this.logger.info('Admin', 'Voyages chargés depuis Firestore', { count: trips.length });
    } catch (error) {
      console.error('Erreur lors du chargement des voyages:', error);
      this.logger.error('Admin', 'Erreur chargement voyages', { error });
    }
  }
} 