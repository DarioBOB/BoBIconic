import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { WindowService } from '../../services/window.service';

interface FlightInfo {
  flightNumber: string;
  airline: string;
  aircraft: string;
  departure: {
    airport: string;
    scheduledTime: string;
    actualTime?: string;
  };
  arrival: {
    airport: string;
    scheduledTime: string;
    actualTime?: string;
  };
  status: string;
  altitude?: number;
  speed?: number;
  weather?: string;
  timeRemaining?: string;
  duration?: string;
}

@Component({
  selector: 'app-window',
  templateUrl: './window.page.html',
  styleUrls: ['./window.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    FormsModule,
    TranslateModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class WindowPage implements OnInit {
  callsign: string = '';
  loading: boolean = false;
  error: string = '';
  flightInfo: FlightInfo | null = null;

  constructor(
    private translate: TranslateService,
    private windowService: WindowService
  ) {}

  ngOnInit() {
    // Récupérer le dernier callsign utilisé
    this.callsign = this.windowService.getCallsign();
    if (this.callsign) {
      this.searchFlight();
    }
  }

  async searchFlight() {
    if (!this.callsign) {
      this.error = 'WINDOW.SEARCH.ERRORS.EMPTY_CALLSIGN';
      return;
    }

    this.loading = true;
    this.error = '';
    this.flightInfo = null;

    try {
      await this.windowService.searchFlight(this.callsign);
      
      // S'abonner aux mises à jour des données de vol
      this.windowService.flightData$.subscribe(data => {
        if (data.flightNumber) {
          this.flightInfo = {
            flightNumber: data.flightNumber,
            airline: data.airline,
            aircraft: data.aircraftType,
            departure: {
              airport: data.departure,
              scheduledTime: data.departureTime
            },
            arrival: {
              airport: data.arrival,
              scheduledTime: ''
            },
            status: data.status,
            duration: data.duration
          };
        }
      });

      // S'abonner aux données dynamiques
      this.windowService.dynamicData$.subscribe(data => {
        if (this.flightInfo) {
          this.flightInfo.altitude = data.altitude;
          this.flightInfo.speed = data.speed;
          this.flightInfo.weather = data.weather;
          this.flightInfo.timeRemaining = data.estimatedTimeRemaining;
        }
      });

    } catch (error) {
      this.error = 'WINDOW.SEARCH.ERRORS.API_ERROR';
    } finally {
      this.loading = false;
    }
  }
} 