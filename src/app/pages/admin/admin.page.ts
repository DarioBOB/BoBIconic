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
      --padding-start: 0;
    }
    
    ion-note {
      font-weight: bold;
    }
  `]
})
export class AdminPage implements OnInit {
  users: any[] = [];
  currentUserEmail: string | null = null;
  selectedTab: string = 'users';
  variables: any[] = [];
  isReloading = false;
  metrics: any = null;
  alerts: any[] = [];

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
    private logger: LoggerService
  ) {}

  ngOnInit() {
    this.selectedTab = 'users';
    this.loadVariables();
    this.adminService.getAllUsersWithTripsAndPlans().then(users => {
      this.users = users;
    });
    this.currentUserEmail = this.auth.currentUser?.email || null;
    this.logger.info('Admin', 'Page d\'administration chargée');
    this.refreshMetrics();
    this.refreshAlerts();
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

  getSortedTrips(trips: any[]): any[] {
    if (!trips) return [];
    return [...trips].sort((a, b) => {
      const dateA = this.toJsDate(a.startDate)?.getTime() || 0;
      const dateB = this.toJsDate(b.startDate)?.getTime() || 0;
      return dateA - dateB;
    });
  }

  getSortedPlans(plans: any[]): any[] {
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
              this.adminService.getAllUsersWithTripsAndPlans().then(users => {
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

  getPlanIcon(type: string): string {
    const iconMap: { [key: string]: string } = {
      flight: 'airplane-outline',
      hotel: 'bed-outline',
      activity: 'walk-outline',
      car: 'car-sport-outline',
      train: 'train-outline'
    };
    return iconMap[type?.toLowerCase()] || 'document-text-outline';
  }

  getTitle(title: any): string {
    if (typeof title === 'object' && title !== null) {
      return title.fr || title.en || 'Titre non disponible';
    }
    return title || 'Titre non disponible';
  }

  getPlanFields(plan: any): string[] {
    return Object.keys(plan || {});
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
      default: return 'primary';
    }
  }

  getAlertIcon(type: string): string {
    switch (type) {
      case 'error_spike': return 'warning';
      case 'performance_degradation': return 'speedometer';
      case 'memory_leak': return 'hardware-chip';
      default: return 'alert-circle';
    }
  }

  clearLogs() {
    this.logger.info('Admin', 'Demande de vidage des logs');
    this.logger.clearLogs();
    this.refreshMetrics();
  }

  exportLogs() {
    this.logger.info('Admin', 'Export des logs demandé');
    const jsonData = this.logger.exportLogsAsJSON();
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bob-logs-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  testLogging() {
    this.logger.info('Admin', 'Test de logging - message d\'information');
    this.logger.warn('Admin', 'Test de logging - avertissement');
    this.logger.error('Admin', 'Test de logging - erreur simulée');
    this.logger.debug('Admin', 'Test de logging - message de debug');
    this.logger.performance('Admin', 'test_operation', Date.now() - 100);
    this.refreshMetrics();
  }

  showSystemInfo() {
    this.logger.info('Admin', 'Affichage des informations système');
    const systemInfo = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      memory: 'memory' in performance ? (performance as any).memory : 'Non disponible',
      timestamp: new Date().toISOString()
    };
    this.logger.info('Admin', 'Informations système', systemInfo);
  }
} 