import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { SharedModule } from '../shared/shared.module';
import { UserStatusBarComponent } from '../components/user-status-bar/user-status-bar.component';
// TODO: Adapter TranslatePipe import
// TODO: Adapter AuthService import

@Component({
  selector: 'app-bobbers',
  standalone: true,
  template: `
    <ion-header>
      <app-user-status-bar title="PAGES.BOBBERS.TITLE"></app-user-status-bar>
    </ion-header>
    <ion-content id="main-content" class="ion-padding bobbers-placeholder">
      <div class="placeholder-container">
        <ion-icon name="people" class="placeholder-icon"></ion-icon>
        <h1>{{ 'PAGES.BOBBERS.TITLE' | translate }}</h1>
        <p>{{ 'LANDING.TILES.IN_PROGRESS' | translate }}</p>
      </div>
    </ion-content>
  `,
  styles: [
    `.bobbers-placeholder .placeholder-container { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 70vh; text-align: center; } .placeholder-icon { font-size: 64px; color: #00BCD4; margin-bottom: 24px; } h1 { color: #00BCD4; font-size: 2rem; margin-bottom: 8px; } p { color: #FF9800; font-size: 1.1rem; font-style: italic; }`
  ],
  imports: [SharedModule, UserStatusBarComponent /*, TranslatePipe*/]
})
export class BobbersPage {
  constructor(/* private authService: AuthService */) {}

  toggleMenu() {
    const menu = document.querySelector('ion-menu');
    menu?.toggle();
  }

  async logout() {
    // TODO: Adapter AuthService logout
    // await this.authService.logout();
    window.location.href = '/auth/email';
  }
} 