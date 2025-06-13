import { Component, OnInit, OnDestroy } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { RouterModule } from '@angular/router';
import { WindowService, FlightData, DynamicData } from '../../services/window.service';
import { Subscription } from 'rxjs';
// import { WindowTextDataPage } from './window-text-data.page';
// import { WindowMapPage } from './window-map.page';
// import { WindowHublotPage } from './window-hublot.page';
import { FormsModule } from '@angular/forms';
import { FlightSearchBarComponent } from './flight-search-bar.component';

@Component({
  selector: 'app-window-tabs',
  templateUrl: './window-tabs.page.html',
  styleUrls: ['./window-tabs.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    TranslateModule,
    FormsModule,
    RouterModule,
    FlightSearchBarComponent
  ]
})
export class WindowTabsPage implements OnInit, OnDestroy {
  // Progression du vol (0-100)
  progress = 0;
  
  // Données du vol
  flightData: FlightData = {
    flightNumber: '',
    airline: '',
    departure: '',
    arrival: '',
    departureTime: '',
    duration: '',
    status: '',
    aircraftType: ''
  };
  dynamicData: DynamicData = {
    altitude: 0,
    speed: 0,
    position: null,
    weather: '',
    estimatedTimeRemaining: ''
  };
  callsign: string = '';

  private subscriptions: Subscription[] = [];

  constructor(private windowService: WindowService) {}

  ngOnInit() {
    this.subscriptions.push(
      this.windowService.callsign$.subscribe(cs => {
        this.callsign = cs;
      }),
      this.windowService.progress$.subscribe(progress => {
        this.progress = progress;
      }),
      this.windowService.flightData$.subscribe(data => {
        this.flightData = data;
      }),
      this.windowService.dynamicData$.subscribe(data => {
        this.dynamicData = data;
      })
    );
    // Recherche automatique si callsign déjà présent
    const savedCallsign = this.windowService.getCallsign();
    if (savedCallsign) {
      this.windowService.searchFlight(savedCallsign);
    }
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  onCallsignChange(cs: string) {
    this.windowService.searchFlight(cs);
  }

  searchFlight(cs: string) {
    this.windowService.searchFlight(cs);
  }

  // Mise à jour de la progression
  onProgressChange(event: any) {
    this.windowService.updateProgress(event.detail.value);
  }

  // Formatage de la progression pour l'affichage
  formatProgress(value: number): string {
    return `${value}%`;
  }
} 