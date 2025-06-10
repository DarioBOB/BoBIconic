import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { UserStatusBarComponent } from '../../core/components/user-status-bar.component';
import { TranslatePipe } from '../../core/pipes/translate.pipe';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-window',
  standalone: true,
  template: `
    <ion-content id="main-content" class="ion-padding window-placeholder">
      <div class="placeholder-container">
        <ion-icon name="map-outline" class="placeholder-icon"></ion-icon>
        <h1>{{ 'PAGES.WINDOW.TITLE' | translate }}</h1>
        <p>{{ 'LANDING.TILES.IN_PROGRESS' | translate }}</p>
      </div>
    </ion-content>
  `,
  styles: [`
    .window-placeholder .placeholder-container {
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
  imports: [CommonModule, IonicModule, UserStatusBarComponent, TranslatePipe]
})
export class WindowPage {
  constructor(private authService: AuthService) {}

  async logout() {
    await this.authService.logout();
    window.location.href = '/auth/email';
  }
} 