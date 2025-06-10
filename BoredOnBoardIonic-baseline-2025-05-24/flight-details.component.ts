import { Component, Input, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { SafeDatePipe } from '../../pages/trips/trips.page';

@Component({
  selector: 'app-flight-details',
  standalone: true,
  imports: [IonicModule, CommonModule, SafeDatePipe],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <ion-card class="flight-details-card">
      <ion-card-header>
        <ion-item lines="none">
          <ion-icon name="airplane-outline" slot="start"></ion-icon>
          <ion-label>
            <div class="flight-title">Vol {{ flightNumber || flightData?.details?.flight?.flight_number || flightData?.details?.flight_number || '-' }}</div>
            <div class="flight-airports">
              <span>{{ departureIcao || flightData?.details?.flight?.departure?.airport || flightData?.details?.departure?.airport || '-' }}</span>
              <ion-icon name="arrow-forward-outline"></ion-icon>
              <span>{{ arrivalIcao || flightData?.details?.flight?.arrival?.airport || flightData?.details?.arrival?.airport || '-' }}</span>
            </div>
            <div class="flight-airline">{{ airlineIata || flightData?.details?.flight?.airline || flightData?.details?.airline || '-' }}</div>
          </ion-label>
        </ion-item>
      </ion-card-header>
      <ion-card-content>
        <div>Départ : {{ flightData?.startDate | safeDate | date:'short' }}</div>
        <div>Arrivée : {{ flightData?.endDate | safeDate | date:'short' }}</div>
        <div>Avion : {{ getAircraftDisplay() }}</div>
        <div>Statut : {{ flightData?.status || '-' }}</div>
      </ion-card-content>
    </ion-card>
  `,
  styles: [`
    .flight-details-card { margin-bottom: 12px; }
    .flight-title { font-weight: bold; font-size: 1.1em; }
    .flight-airports { color: #1976d2; font-size: 1em; margin: 4px 0; }
    .flight-airline { color: #757575; font-size: 0.95em; }
  `]
})
export class FlightDetailsComponent {
  @Input() flightData: any;
  @Input() flightNumber?: string;
  @Input() departureIcao?: string;
  @Input() arrivalIcao?: string;
  @Input() airlineIata?: string;
  @Input() aircraftIcao?: string;

  getAircraftDisplay(): string {
    const aircraft = this.flightData?.details?.flight?.aircraft || this.flightData?.details?.aircraft || this.aircraftIcao;
    if (!aircraft) return '-';
    if (typeof aircraft === 'string') return aircraft;
    if (typeof aircraft === 'object') {
      const values = [aircraft.type, aircraft.model, aircraft.name, aircraft.registration, aircraft.age];
      const nonEmpty = values.filter(v => v && v !== 'null' && v !== '-');
      if (nonEmpty.length === 0) return 'Non renseigné';
      return nonEmpty.join(' / ');
    }
    return '-';
  }
} 