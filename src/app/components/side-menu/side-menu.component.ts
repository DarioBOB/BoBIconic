import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Router, RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Auth, signOut } from '@angular/fire/auth';

interface MenuItem {
  key: string;
  icon: string;
  route: string;
  color: string;
}

@Component({
  selector: 'app-side-menu',
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
          <ion-menu-toggle auto-hide="true" *ngFor="let item of menuItems">
            <ion-item [routerLink]="item.route" routerDirection="root">
              <ion-icon [name]="item.icon" slot="start" [style.color]="item.color"></ion-icon>
              <ion-label>{{ 'LANDING.TILES.' + item.key | translate }}</ion-label>
            </ion-item>
          </ion-menu-toggle>
          <ion-item-divider></ion-item-divider>
          <ion-item (click)="logout()" color="danger">
            <ion-icon name="log-out-outline" slot="start"></ion-icon>
            <ion-label>{{ 'COMMON.LOGOUT' | translate }}</ion-label>
          </ion-item>
        </ion-list>
      </ion-content>
    </ion-menu>
  `,
  imports: [CommonModule, IonicModule, TranslateModule, RouterModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class SideMenuComponent {
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

  constructor(private router: Router, private auth: Auth) {}

  async logout() {
    try {
      await signOut(this.auth);
      this.router.navigate(['/auth/email']);
      const menu = document.querySelector('ion-menu');
      (menu as any)?.close();
    } catch (error) {
      console.error('Error during logout:', error);
    }
  }
} 