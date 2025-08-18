import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { FlightMapComponent } from '../../shared/components/flight-map/flight-map.component';
import { FlightDataService } from '../../services/flight/flight-data.service';
import { FlightData } from '../../services/flight/models/flight.interface';
import * as L from 'leaflet';

@Component({
  selector: 'app-flight-tracker',
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule, FlightMapComponent],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Suivi de Vol</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div class="search-container">
        <ion-searchbar
          [(ngModel)]="flightNumber"
          placeholder="Numéro de vol (ex: LX1234)"
          (ionChange)="searchFlight()"
          [debounce]="500"
        ></ion-searchbar>
      </div>

      <div class="map-container">
        <app-flight-map
          *ngIf="flightNumber"
          [flightNumber]="flightNumber"
          (mapReady)="onMapReady($event)"
        ></app-flight-map>
      </div>

      <ion-card *ngIf="flightData" class="flight-details">
        <ion-card-header>
          <ion-card-title>{{ flightData.flightNumber }}</ion-card-title>
          <ion-card-subtitle>{{ flightData.airline }}</ion-card-subtitle>
        </ion-card-header>

        <ion-card-content>
          <div class="flight-route">
            <div class="route-point departure">
              <div class="airport">
                <h3>{{ flightData.departure.code }}</h3>
                <p>{{ flightData.departure.name }}</p>
              </div>
              <div class="time">
                <p class="scheduled">{{ flightData.departure.scheduledTime }}</p>
                <p class="delay" *ngIf="flightData.departure.averageDelay > 0">
                  +{{ flightData.departure.averageDelay }}min
                </p>
              </div>
              <div class="details">
                <p>Terminal {{ flightData.departure.terminal }}</p>
                <p>Porte {{ flightData.departure.gate }}</p>
                <p>Bagages: Tapis {{ flightData.departure.baggageClaim }}</p>
              </div>
            </div>

            <div class="route-line">
              <div class="duration">
                {{ flightData.route.averageDuration }}min
              </div>
            </div>

            <div class="route-point arrival">
              <div class="airport">
                <h3>{{ flightData.arrival.code }}</h3>
                <p>{{ flightData.arrival.name }}</p>
              </div>
              <div class="time">
                <p class="scheduled">{{ flightData.arrival.scheduledTime }}</p>
                <p class="delay" *ngIf="flightData.arrival.averageDelay > 0">
                  +{{ flightData.arrival.averageDelay }}min
                </p>
              </div>
              <div class="details">
                <p>Terminal {{ flightData.arrival.terminal }}</p>
                <p>Porte {{ flightData.arrival.gate }}</p>
                <p>Bagages: Tapis {{ flightData.arrival.baggageClaim }}</p>
              </div>
            </div>
          </div>

          <div class="flight-stats">
            <h4>Statistiques</h4>
            <div class="stats-grid">
              <div class="stat-item">
                <span class="label">Ponctualité</span>
                <span class="value">{{ flightData.statistics.onTimePercentage }}%</span>
              </div>
              <div class="stat-item">
                <span class="label">Retard moyen</span>
                <span class="value">{{ flightData.statistics.averageDelay }}min</span>
              </div>
            </div>
            <div class="common-delays" *ngIf="flightData.statistics.mostCommonDelays.length > 0">
              <h5>Retards les plus fréquents</h5>
              <ul>
                <li *ngFor="let delay of flightData.statistics.mostCommonDelays">
                  {{ delay.reason }} ({{ delay.frequency }}%)
                </li>
              </ul>
            </div>
          </div>
        </ion-card-content>
      </ion-card>
    </ion-content>
  `,
  styles: [`
    .search-container {
      padding: 10px;
      background: white;
      position: sticky;
      top: 0;
      z-index: 1000;
    }
    .map-container {
      height: 50vh;
      width: 100%;
    }
    .flight-details {
      margin: 10px;
    }
    .flight-route {
      display: flex;
      align-items: center;
      margin-bottom: 20px;
    }
    .route-point {
      flex: 1;
      padding: 10px;
    }
    .route-line {
      flex: 0 0 100px;
      text-align: center;
      position: relative;
    }
    .route-line::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 0;
      right: 0;
      height: 2px;
      background: #1bb6b1;
    }
    .duration {
      position: relative;
      background: white;
      padding: 0 10px;
      color: #1bb6b1;
      font-weight: bold;
    }
    .airport h3 {
      margin: 0;
      color: #1bb6b1;
      font-size: 1.5em;
    }
    .airport p {
      margin: 0;
      color: #666;
    }
    .time {
      margin: 10px 0;
    }
    .scheduled {
      font-size: 1.2em;
      font-weight: bold;
      margin: 0;
    }
    .delay {
      color: #f44336;
      margin: 0;
    }
    .details {
      font-size: 0.9em;
      color: #666;
    }
    .flight-stats {
      border-top: 1px solid #eee;
      padding-top: 20px;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
      margin: 15px 0;
    }
    .stat-item {
      text-align: center;
    }
    .label {
      display: block;
      font-size: 0.9em;
      color: #666;
    }
    .value {
      display: block;
      font-size: 1.2em;
      font-weight: bold;
      color: #1bb6b1;
    }
    .common-delays {
      margin-top: 15px;
    }
    .common-delays h5 {
      color: #666;
      margin-bottom: 10px;
    }
    .common-delays ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    .common-delays li {
      padding: 5px 0;
      color: #666;
    }
  `]
})
export class FlightTrackerPage implements OnInit {
  flightNumber: string = '';
  flightData?: FlightData;
  private map?: L.Map;
  isLoadingTrack = false;

  constructor(private flightDataService: FlightDataService) {}

  ngOnInit() {}

  async searchFlight() {
    this.isLoadingTrack = true;
    if (this.flightNumber) {
      try {
        this.flightData = await this.flightDataService.getFlightData(this.flightNumber);
      } catch (error) {
        console.error('Error searching flight:', error);
      }
    }
    this.isLoadingTrack = false;
  }

  onMapReady(map: L.Map) {
    this.map = map;
  }
} 