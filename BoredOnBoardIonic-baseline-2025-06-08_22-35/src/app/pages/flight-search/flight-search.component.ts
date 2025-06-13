import { Component, OnInit } from '@angular/core';
import { FlightService } from '../../services/flight/flight.service';
import { OpenSkyService } from '../../services/flight/opensky.service';
import { FlightData } from '../../services/flight/models/flight.interface';
import { Router } from '@angular/router';

@Component({
  selector: 'app-flight-search',
  templateUrl: './flight-search.component.html',
  styleUrls: ['./flight-search.component.scss']
})
export class FlightSearchComponent implements OnInit {
  flightNumber: string = '';
  date: string = '';
  loading: boolean = false;
  error: string = '';
  flightData: FlightData | null = null;

  constructor(
    private flightService: FlightService,
    private openSkyService: OpenSkyService,
    private router: Router
  ) {}

  ngOnInit() {
    // Initialiser avec la date d'aujourd'hui
    this.date = new Date().toISOString().split('T')[0];
  }

  async searchFlight() {
    if (!this.flightNumber || !this.date) {
      this.error = 'Veuillez remplir tous les champs';
      return;
    }

    this.loading = true;
    this.error = '';
    this.flightData = null;

    try {
      // Initialiser les données de vol
      await this.openSkyService.initializeFlightData(this.flightNumber, this.date);

      // Récupérer les données du vol
      const data = await this.flightService.getFlightData(this.flightNumber, this.date).toPromise();
      
      if (data) {
        this.flightData = data;
        // Naviguer vers la page de détails du vol
        this.router.navigate(['/flight-details', this.flightNumber], {
          state: { flightData: data }
        });
      } else {
        this.error = 'Vol non trouvé';
      }
    } catch (error) {
      console.error('Erreur lors de la recherche du vol:', error);
      this.error = 'Une erreur est survenue lors de la recherche du vol';
    } finally {
      this.loading = false;
    }
  }
} 