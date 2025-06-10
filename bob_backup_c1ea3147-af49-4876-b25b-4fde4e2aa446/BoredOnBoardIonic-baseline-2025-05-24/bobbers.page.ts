import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { TranslatePipe } from '../../core/pipes/translate.pipe';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-bobbers',
  standalone: true,
  template: `
    <ion-menu [contentId]="'main-content'">
      <ion-header>
        <ion-toolbar color="primary">
          <ion-title>{{ 'LANDING.TITLE' | translate }}</ion-title>
        </ion-toolbar>
      </ion-header>
      <ion-content>
        <ion-list>
          <ion-item routerLink="/trips"><ion-icon name="airplane" slot="start"></ion-icon>{{ 'LANDING.TILES.TRIPS' | translate }}</ion-item>
          <ion-item routerLink="/window"><ion-icon name="map" slot="start"></ion-icon>{{ 'LANDING.TILES.WINDOW' | translate }}</ion-item>
          <ion-item routerLink="/chat"><ion-icon name="chatbubbles" slot="start"></ion-icon>{{ 'LANDING.TILES.CHAT' | translate }}</ion-item>
          <ion-item routerLink="/bobbers"><ion-icon name="people" slot="start"></ion-icon>{{ 'LANDING.TILES.BOBBERS' | translate }}</ion-item>
          <ion-item routerLink="/games"><ion-icon name="game-controller" slot="start"></ion-icon>{{ 'LANDING.TILES.GAMES' | translate }}</ion-item>
          <ion-item routerLink="/notifications"><ion-icon name="notifications" slot="start"></ion-icon>{{ 'LANDING.TILES.NOTIFICATIONS' | translate }}</ion-item>
          <ion-item routerLink="/documents"><ion-icon name="document" slot="start"></ion-icon>{{ 'LANDING.TILES.DOCUMENTS' | translate }}</ion-item>
          <ion-item routerLink="/support"><ion-icon name="help-circle" slot="start"></ion-icon>{{ 'LANDING.TILES.SUPPORT' | translate }}</ion-item>
          <ion-item routerLink="/preferences"><ion-icon name="settings" slot="start"></ion-icon>{{ 'LANDING.TILES.PREFERENCES' | translate }}</ion-item>
          <ion-item (click)="logout()" color="danger"><ion-icon name="log-out-outline" slot="start"></ion-icon>{{ 'COMMON.LOGOUT' | translate }}</ion-item>
        </ion-list>
      </ion-content>
    </ion-menu>
    <ion-content id="main-content" class="ion-padding bobbers-placeholder">
      <div class="placeholder-container">
        <ion-icon name="people" class="placeholder-icon"></ion-icon>
        <h1>{{ 'PAGES.BOBBERS.TITLE' | translate }}</h1>
        <p>{{ 'LANDING.TILES.IN_PROGRESS' | translate }}</p>
      </div>
    </ion-content>
  `,
  styles: [`
    .bobbers-placeholder .placeholder-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 70vh;
      text-align: center;
    }
    .placeholder-icon {
      font-size: 64px;
      color: #00BCD4;
      margin-bottom: 24px;
    }
    h1 {
      color: #00BCD4;
      font-size: 2rem;
      margin-bottom: 8px;
    }
    p {
      color: #FF9800;
      font-size: 1.1rem;
      font-style: italic;
    }
  `],
  imports: [CommonModule, IonicModule, TranslatePipe]
})
export class BobbersPage {
  constructor(private authService: AuthService) {}

  toggleMenu() {
    const menu = document.querySelector('ion-menu');
    menu?.toggle();
  }

  async logout() {
    await this.authService.logout();
    window.location.href = '/auth/email';
  }
} 