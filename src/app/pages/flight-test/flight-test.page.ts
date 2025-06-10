import { Component, OnInit } from '@angular/core';
import { FlightDataService } from '../../services/flight/flight-data.service';
import { FlightData } from '../../services/flight/models/flight.interface';

@Component({
  selector: 'app-flight-test',
  templateUrl: './flight-test.page.html',
  styleUrls: ['./flight-test.page.scss']
})
export class FlightTestPage implements OnInit {
  flightData: FlightData | null = null;
  loading = true;
  error: string | null = null;
  dataSources = {
    aviationstack: 'Aviationstack API',
    opensky: 'OpenSky Network API',
    static: 'Données statiques'
  };

  constructor(private flightDataService: FlightDataService) {}

  ngOnInit() {
    this.loadFlightData();
  }

  private loadFlightData() {
    this.loading = true;
    this.error = null;

    this.flightDataService.getFlightData('LX1234').subscribe({
      next: (data) => {
        this.flightData = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Erreur lors du chargement des données: ' + err.message;
        this.loading = false;
      }
    });
  }

  refreshData() {
    this.loadFlightData();
  }
} 