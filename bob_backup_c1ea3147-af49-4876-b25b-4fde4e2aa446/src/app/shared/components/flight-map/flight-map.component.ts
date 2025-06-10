import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlightMapService } from '../../../services/flight/flight-map.service';
import { FlightDataService } from '../../../services/flight/flight-data.service';
import { FlightData } from '../../../services/flight/models/flight.interface';
import * as L from 'leaflet';

@Component({
  selector: 'app-flight-map',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flight-map-container">
      <div #mapContainer class="map"></div>
      <div class="flight-info" *ngIf="flightData">
        <div class="flight-header">
          <h3>{{ flightData.flightNumber }}</h3>
          <span class="airline">{{ flightData.airline }}</span>
        </div>
        <div class="stats">
          <div class="stat-item">
            <span class="label">Ponctualité</span>
            <span class="value">{{ flightData.statistics.onTimePercentage }}%</span>
          </div>
          <div class="stat-item">
            <span class="label">Retard moyen</span>
            <span class="value">{{ flightData.statistics.averageDelay }}min</span>
          </div>
        </div>
        <div class="airports">
          <div class="airport departure">
            <span class="code">{{ flightData.departure.code }}</span>
            <span class="time">{{ flightData.departure.scheduledTime }}</span>
          </div>
          <div class="airport arrival">
            <span class="code">{{ flightData.arrival.code }}</span>
            <span class="time">{{ flightData.arrival.scheduledTime }}</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .flight-map-container {
      position: relative;
      height: 100%;
      width: 100%;
    }
    .map {
      height: 100%;
      width: 100%;
    }
    .flight-info {
      position: absolute;
      top: 10px;
      right: 10px;
      background: white;
      padding: 15px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      min-width: 200px;
    }
    .flight-header {
      margin-bottom: 10px;
    }
    .flight-header h3 {
      margin: 0;
      color: #1bb6b1;
      font-size: 1.2em;
    }
    .airline {
      color: #666;
      font-size: 0.9em;
    }
    .stats {
      display: flex;
      gap: 15px;
      margin-bottom: 10px;
    }
    .stat-item {
      display: flex;
      flex-direction: column;
    }
    .label {
      font-size: 0.8em;
      color: #666;
    }
    .value {
      font-weight: bold;
      color: #333;
    }
    .airports {
      display: flex;
      justify-content: space-between;
      border-top: 1px solid #eee;
      padding-top: 10px;
    }
    .airport {
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .code {
      font-weight: bold;
      color: #1bb6b1;
    }
    .time {
      font-size: 0.9em;
      color: #666;
    }
    :host ::ng-deep {
      .airport-marker {
        background: white;
        border-radius: 50%;
        padding: 5px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      }
      .airport-icon {
        font-weight: bold;
        color: #1bb6b1;
      }
      .airport-icon.departure {
        color: #4CAF50;
      }
      .airport-icon.arrival {
        color: #F44336;
      }
    }
  `]
})
export class FlightMapComponent implements OnInit, OnDestroy {
  @Input() flightNumber!: string;
  @Output() mapReady = new EventEmitter<L.Map>();

  @ViewChild('mapContainer') mapContainer!: ElementRef;

  private map?: L.Map;
  flightData?: FlightData;

  constructor(
    private flightMapService: FlightMapService,
    private flightDataService: FlightDataService
  ) {}

  ngOnInit() {
    this.initializeMap();
  }

  private async initializeMap() {
    if (!this.mapContainer) return;

    // Créer la carte
    this.map = this.flightMapService.createMap(this.mapContainer.nativeElement);
    this.mapReady.emit(this.map);

    // Charger les données du vol
    if (this.flightNumber) {
      try {
        this.flightData = await this.flightDataService.getFlightData(this.flightNumber);
        this.flightMapService.displayFlight(this.flightData);
      } catch (error) {
        console.error('Error loading flight data:', error);
      }
    }
  }

  ngOnDestroy() {
    this.flightMapService.destroy();
  }
} 