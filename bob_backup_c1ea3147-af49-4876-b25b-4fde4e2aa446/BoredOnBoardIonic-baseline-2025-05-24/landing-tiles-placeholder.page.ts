import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { TranslatePipe } from '../core/pipes/translate.pipe';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-landing-tiles-placeholder',
  standalone: true,
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ pageTitle }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <div style="text-align:center; margin-top: 30vh;">
        <h1>{{ pageTitle }}</h1>
        <p style="font-size:1.2rem; color:#00b4d8;">{{ 'LANDING.TILES.IN_PROGRESS' | translate }}</p>
        <ion-button expand="block" (click)="goBack()">Retour</ion-button>
      </div>
    </ion-content>
  `,
  imports: [CommonModule, IonicModule, TranslatePipe, HttpClientModule]
})
export class LandingTilesPlaceholderPage {
  pageTitle = '';

  constructor(private router: Router) {
    const state = this.router.getCurrentNavigation()?.extras.state as any;
    if (state && state.wip && this.router.url) {
      const key = this.router.url.replace('/', '').toUpperCase();
      this.pageTitle = 'LANDING.TILES.' + key;
    }
  }

  goBack() {
    this.router.navigate(['/landing']);
  }
} 