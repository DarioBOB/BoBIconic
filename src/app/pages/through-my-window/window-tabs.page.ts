import { Component, OnInit, OnDestroy } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { RouterModule } from '@angular/router';
import { WindowService, FlightData, DynamicData } from '../../services/window.service';
import { Subscription } from 'rxjs';
import { WindowMapTestPage } from './window-map-test.page';
import { WindowTextDataPage } from './window-text-data.page';
import { WindowMapPage } from './window-map.page';
import { WindowHublotPage } from './window-hublot.page';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-window-tabs',
  templateUrl: './window-tabs.page.html',
  styleUrls: ['./window-tabs.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    TranslateModule,
    RouterModule,
    FormsModule,
    WindowMapTestPage,
    WindowTextDataPage,
    WindowMapPage,
    WindowHublotPage
  ]
})
export class WindowTabsPage implements OnInit, OnDestroy {
  // Progression du vol (0-100)
  progress = 0;
  
  // Données du vol
  flightData: FlightData;
  dynamicData: DynamicData;

  private subscriptions: Subscription[] = [];

  selectedTab = 'flightData';

  constructor(private windowService: WindowService) {
    this.flightData = this.windowService.flightData.value;
    this.dynamicData = this.windowService.dynamicData.value;
  }

  ngOnInit() {
    // S'abonner aux observables du service
    this.subscriptions.push(
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
  }

  ngOnDestroy() {
    // Nettoyer les abonnements
    this.subscriptions.forEach(sub => sub.unsubscribe());
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