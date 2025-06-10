import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { SharedModule } from '../shared/shared.module';
import { UserStatusBarComponent } from '../components/user-status-bar/user-status-bar.component';
// TODO: Adapter TranslatePipe import
// TODO: Adapter AuthService import

@Component({
  selector: 'app-support',
  standalone: true,
  template: `
    <ion-header>
      <app-user-status-bar title="PAGES.SUPPORT.TITLE"></app-user-status-bar>
    </ion-header>
    <ion-content id="main-content" class="ion-padding support-placeholder">
      <div *ngIf="isLoading" class="spinner-container">
        <ion-spinner name="crescent"></ion-spinner>
        <div>Chargement du support…</div>
      </div>
      <div class="placeholder-container" *ngIf="!isLoading">
        <ion-icon name="help-circle-outline" class="placeholder-icon"></ion-icon>
        <h1>{{ 'PAGES.SUPPORT.TITLE' | translate }}</h1>
        <p>{{ 'LANDING.TILES.IN_PROGRESS' | translate }}</p>
      </div>
    </ion-content>
  `,
  styles: [
    `.support-placeholder .placeholder-container { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 70vh; text-align: center; } .placeholder-icon { font-size: 64px; color: #00BCD4; margin-bottom: 24px; } h1 { color: #00BCD4; font-size: 2rem; margin-bottom: 8px; } p { color: #FF9800; font-size: 1.1rem; font-style: italic; } .spinner-container { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 60vh; font-size: 1.2em; color: #888; }`
  ],
  imports: [SharedModule, UserStatusBarComponent /*, TranslatePipe*/]
})
export class SupportPage {
  isLoading: boolean = false;

  constructor(/* private authService: AuthService */) {}

  async logout() {
    // TODO: Adapter AuthService logout
    // await this.authService.logout();
    window.location.href = '/auth/email';
  }
} 