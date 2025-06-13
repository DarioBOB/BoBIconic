import { Component, Input, OnInit } from '@angular/core';
import { FlightEnrichmentService } from '../../../../core/services/flight-enrichment.service';
import { FlightData } from '../../../../core/models/flight.interface';

@Component({
  selector: 'app-flight-details',
  template: `
    <ion-card *ngIf="flightData">
      <ion-card-header>
        <ion-card-title>
          <ion-skeleton-text *ngIf="isLoading" [animated]="true" style="width: 60%"></ion-skeleton-text>
          <ng-container *ngIf="!isLoading">
            {{ flightData.airline?.name || flightData.airline?.message || 'Compagnie inconnue' }} {{ flightData.flightNumber }}
          </ng-container>
        </ion-card-title>
        <ion-card-subtitle>
          <ion-skeleton-text *ngIf="isLoading" [animated]="true" style="width: 80%"></ion-skeleton-text>
          <ng-container *ngIf="!isLoading">
            {{ flightData.departureAirport?.name || flightData.departureAirport?.message || 'Départ inconnu' }} → {{ flightData.arrivalAirport?.name || flightData.arrivalAirport?.message || 'Arrivée inconnue' }}
          </ng-container>
        </ion-card-subtitle>
      </ion-card-header>

      <ion-card-content>
        <!-- Informations de base -->
        <ion-list>
          <ion-item>
            <ion-label>
              <h2>Départ</h2>
              <ion-skeleton-text *ngIf="isLoading" [animated]="true" style="width: 40%"></ion-skeleton-text>
              <ng-container *ngIf="!isLoading">
                <p>{{ flightData.departureTime | date:'short' }}</p>
                <p>{{ flightData.departureAirport?.city }}, {{ flightData.departureAirport?.country }}</p>
              </ng-container>
            </ion-label>
          </ion-item>

          <ion-item>
            <ion-label>
              <h2>Arrivée</h2>
              <ion-skeleton-text *ngIf="isLoading" [animated]="true" style="width: 40%"></ion-skeleton-text>
              <ng-container *ngIf="!isLoading">
                <p>{{ flightData.arrivalTime | date:'short' }}</p>
                <p>{{ flightData.arrivalAirport?.city }}, {{ flightData.arrivalAirport?.country }}</p>
              </ng-container>
            </ion-label>
          </ion-item>

          <ion-item>
            <ion-label>
              <h2>Avion</h2>
              <ion-skeleton-text *ngIf="isLoading" [animated]="true" style="width: 50%"></ion-skeleton-text>
              <ng-container *ngIf="!isLoading">
                <p>{{ flightData.aircraft?.name || flightData.aircraft?.message || 'Non spécifié' }}</p>
                <p>{{ flightData.aircraft?.manufacturer }} - {{ flightData.aircraft?.type }}</p>
              </ng-container>
            </ion-label>
          </ion-item>
        </ion-list>

        <!-- Détails de l'aéroport de départ -->
        <ion-accordion-group>
          <ion-accordion value="departure">
            <ion-item slot="header">
              <ion-label>Détails de l'aéroport de départ</ion-label>
            </ion-item>
            <ion-list slot="content">
              <ion-item>
                <ion-label>
                  <h3>Terminal</h3>
                  <ion-skeleton-text *ngIf="isLoading" [animated]="true" style="width: 30%"></ion-skeleton-text>
                  <p *ngIf="!isLoading">{{ flightData.departureAirport?.terminal || 'Non spécifié' }}</p>
                </ion-label>
              </ion-item>
              <ion-item>
                <ion-label>
                  <h3>Porte d'embarquement</h3>
                  <ion-skeleton-text *ngIf="isLoading" [animated]="true" style="width: 30%"></ion-skeleton-text>
                  <p *ngIf="!isLoading">{{ flightData.departureAirport?.gate || 'Non spécifié' }}</p>
                </ion-label>
              </ion-item>
              <ion-item>
                <ion-label>
                  <h3>Services disponibles</h3>
                  <ion-skeleton-text *ngIf="isLoading" [animated]="true" style="width: 70%"></ion-skeleton-text>
                  <p *ngIf="!isLoading">{{ flightData.departureAirport?.services || 'Non spécifié' }}</p>
                </ion-label>
              </ion-item>
            </ion-list>
          </ion-accordion>

          <!-- Détails de l'aéroport d'arrivée -->
          <ion-accordion value="arrival">
            <ion-item slot="header">
              <ion-label>Détails de l'aéroport d'arrivée</ion-label>
            </ion-item>
            <ion-list slot="content">
              <ion-item>
                <ion-label>
                  <h3>Terminal</h3>
                  <ion-skeleton-text *ngIf="isLoading" [animated]="true" style="width: 30%"></ion-skeleton-text>
                  <p *ngIf="!isLoading">{{ flightData.arrivalAirport?.terminal || 'Non spécifié' }}</p>
                </ion-label>
              </ion-item>
              <ion-item>
                <ion-label>
                  <h3>Porte d'arrivée</h3>
                  <ion-skeleton-text *ngIf="isLoading" [animated]="true" style="width: 30%"></ion-skeleton-text>
                  <p *ngIf="!isLoading">{{ flightData.arrivalAirport?.gate || 'Non spécifié' }}</p>
                </ion-label>
              </ion-item>
              <ion-item>
                <ion-label>
                  <h3>Services disponibles</h3>
                  <ion-skeleton-text *ngIf="isLoading" [animated]="true" style="width: 70%"></ion-skeleton-text>
                  <p *ngIf="!isLoading">{{ flightData.arrivalAirport?.services || 'Non spécifié' }}</p>
                </ion-label>
              </ion-item>
            </ion-list>
          </ion-accordion>

          <!-- Détails de l'avion -->
          <ion-accordion value="aircraft">
            <ion-item slot="header">
              <ion-label>Détails de l'avion</ion-label>
            </ion-item>
            <ion-list slot="content">
              <ion-item>
                <ion-label>
                  <h3>Configuration</h3>
                  <ion-skeleton-text *ngIf="isLoading" [animated]="true" style="width: 40%"></ion-skeleton-text>
                  <p *ngIf="!isLoading">{{ flightData.aircraft?.configuration || 'Non spécifié' }}</p>
                </ion-label>
              </ion-item>
              <ion-item>
                <ion-label>
                  <h3>Capacité</h3>
                  <ion-skeleton-text *ngIf="isLoading" [animated]="true" style="width: 30%"></ion-skeleton-text>
                  <p *ngIf="!isLoading">{{ flightData.aircraft?.seats || 'Non spécifié' }} sièges</p>
                </ion-label>
              </ion-item>
              <ion-item>
                <ion-label>
                  <h3>Vitesse de croisière</h3>
                  <ion-skeleton-text *ngIf="isLoading" [animated]="true" style="width: 30%"></ion-skeleton-text>
                  <p *ngIf="!isLoading">{{ flightData.aircraft?.speed || 'Non spécifié' }} km/h</p>
                </ion-label>
              </ion-item>
              <ion-item>
                <ion-label>
                  <h3>Autonomie</h3>
                  <ion-skeleton-text *ngIf="isLoading" [animated]="true" style="width: 30%"></ion-skeleton-text>
                  <p *ngIf="!isLoading">{{ flightData.aircraft?.range || 'Non spécifié' }} km</p>
                </ion-label>
              </ion-item>
            </ion-list>
          </ion-accordion>
        </ion-accordion-group>

        <!-- Message d'erreur -->
        <ion-item *ngIf="error" color="danger">
          <ion-label>
            <h2>Erreur</h2>
            <p>{{ error }}</p>
          </ion-label>
        </ion-item>
      </ion-card-content>
    </ion-card>
  `,
  styles: [`
    ion-card {
      margin: 16px;
    }
    ion-accordion-group {
      margin-top: 16px;
    }
    ion-skeleton-text {
      margin: 8px 0;
    }
  `]
})
export class FlightDetailsComponent implements OnInit {
  @Input() flightData!: FlightData;
  @Input() flightNumber!: string;
  @Input() departureIcao!: string;
  @Input() arrivalIcao!: string;
  @Input() airlineIata!: string;
  @Input() aircraftIcao!: string;
  isLoading = true;
  error: string | null = null;

  constructor(private flightEnrichmentService: FlightEnrichmentService) {}

  async ngOnInit() {
    if (this.flightNumber && this.departureIcao && this.arrivalIcao) {
      await this.loadFlightData();
    }
  }

  private async loadFlightData() {
    this.isLoading = true;
    this.error = null;

    try {
      const [departureAirport, arrivalAirport, airline, aircraft] = await Promise.all([
        this.flightEnrichmentService.getAirportDetails(this.departureIcao),
        this.flightEnrichmentService.getAirportDetails(this.arrivalIcao),
        this.flightEnrichmentService.getAirlineDetails(this.airlineIata),
        this.flightEnrichmentService.getAircraftDetails(this.aircraftIcao)
      ]);

      if (departureAirport && arrivalAirport && airline && aircraft) {
        this.flightData = {
          ...this.flightData,
          departureAirport,
          arrivalAirport,
          airline,
          aircraft
        };
      } else {
        this.error = 'Impossible de charger toutes les informations du vol';
      }
    } catch (error) {
      console.error('Error loading flight data:', error);
      this.error = 'Une erreur est survenue lors du chargement des données';
    } finally {
      this.isLoading = false;
    }
  }
} 