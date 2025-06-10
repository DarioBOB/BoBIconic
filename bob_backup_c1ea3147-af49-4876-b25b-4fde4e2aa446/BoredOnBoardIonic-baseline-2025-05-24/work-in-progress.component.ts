import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { TranslatePipe } from '../pipes/translate.pipe';
import { UserStatusBarComponent } from './user-status-bar.component';
import { Auth, User, signOut } from '@angular/fire/auth';
import { onAuthStateChanged } from '@angular/fire/auth';
import { Router } from '@angular/router';

interface MenuItem {
  key: string;
  icon: string;
  route: string;
  color: string;
}

@Component({
  selector: 'app-work-in-progress',
  standalone: true,
  template: `
    <ion-menu [contentId]="'main-content'" [swipeGesture]="true">
      <ion-header>
        <ion-toolbar color="primary">
          <ion-title>{{ 'LANDING.TITLE' | translate }}</ion-title>
        </ion-toolbar>
      </ion-header>
      <ion-content>
        <ion-list>
          <ion-item *ngFor="let item of menuItems" (click)="goTo(item.route)">
            <ion-icon [name]="item.icon" slot="start" [style.color]="item.color"></ion-icon>
            <ion-label>{{ 'LANDING.TILES.' + item.key | translate }}</ion-label>
          </ion-item>
          <ion-item-divider></ion-item-divider>
          <ion-item (click)="logout()" color="danger">
            <ion-icon name="log-out-outline" slot="start"></ion-icon>
            <ion-label>{{ 'COMMON.LOGOUT' | translate }}</ion-label>
          </ion-item>
        </ion-list>
      </ion-content>
    </ion-menu>

    <ion-content id="main-content" class="ion-padding">
      <div class="wip-container">
        <ion-icon [name]="icon" class="wip-icon" [style.color]="color"></ion-icon>
        <h1>{{ title | translate }}</h1>
        <p class="wip-message">{{ 'LANDING.TILES.IN_PROGRESS' | translate }}</p>
        <div class="button-container">
          <ion-button (click)="goBack()" color="medium">
            {{ 'COMMON.BACK' | translate }}
          </ion-button>
          <ion-button (click)="logout()" color="danger">
            {{ 'COMMON.LOGOUT' | translate }}
          </ion-button>
        </div>
      </div>
    </ion-content>
  `,
  styles: [`
    .wip-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: calc(100vh - 60px);
      text-align: center;
      padding: 20px;
    }
    .wip-icon {
      font-size: 64px;
      margin-bottom: 24px;
    }
    h1 {
      font-size: 24px;
      font-weight: 600;
      color: #333;
      margin-bottom: 16px;
    }
    .wip-message {
      font-size: 16px;
      color: #666;
      margin-bottom: 32px;
      font-style: italic;
    }
    .button-container {
      display: flex;
      gap: 16px;
    }
    ion-item-divider {
      margin: 8px 0;
    }
  `],
  imports: [CommonModule, IonicModule, TranslatePipe, UserStatusBarComponent]
})
export class WorkInProgressComponent {
  @Input() title: string = '';
  @Input() icon: string = 'construct';
  @Input() color: string = '#00BCD4';
  
  user: User | null = null;
  menuItems: MenuItem[] = [
    { key: 'TRIPS', icon: 'airplane', route: '/trips', color: '#00BCD4' },
    { key: 'WINDOW', icon: 'map', route: '/window', color: '#FF9800' },
    { key: 'CHAT', icon: 'chatbubbles', route: '/chat', color: '#4CAF50' },
    { key: 'BOBBERS', icon: 'people', route: '/bobbers', color: '#9C27B0' },
    { key: 'GAMES', icon: 'game-controller', route: '/games', color: '#F44336' },
    { key: 'NOTIFICATIONS', icon: 'notifications', route: '/notifications', color: '#2196F3' },
    { key: 'DOCUMENTS', icon: 'document', route: '/documents', color: '#795548' },
    { key: 'SUPPORT', icon: 'help-circle', route: '/support', color: '#607D8B' },
    { key: 'PREFERENCES', icon: 'settings', route: '/preferences', color: '#3F51B5' }
  ];

  constructor(
    private auth: Auth,
    private router: Router
  ) {
    onAuthStateChanged(this.auth, (user) => {
      this.user = user;
    });
  }

  toggleMenu() {
    const menu = document.querySelector('ion-menu');
    menu?.toggle();
  }

  goBack() {
    window.history.back();
  }

  goTo(route: string) {
    this.router.navigate([route]);
    const menu = document.querySelector('ion-menu');
    menu?.close();
  }

  async logout() {
    try {
      await signOut(this.auth);
      this.router.navigate(['/auth/email']);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  }
} 