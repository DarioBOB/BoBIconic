import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { SharedModule } from '../shared/shared.module';
import { UserStatusBarComponent } from '../components/user-status-bar/user-status-bar.component';
import { Router } from '@angular/router';
// TODO: Adapter Router import
// TODO: Adapter TranslatePipe import
// TODO: Adapter Auth, User, Firestore imports

interface Tile {
  key: string;
  icon: string;
  route: string;
  color: string;
}

@Component({
  selector: 'app-landing-tiles',
  standalone: true,
  template: `
    <ion-content id="main-content" class="ion-padding landing-content">
      <div *ngIf="isLoading" class="spinner-container">
        <ion-spinner name="crescent"></ion-spinner>
        <div>Chargement des tuiles…</div>
      </div>
      <div class="tiles-grid" *ngIf="!isLoading">
        <div *ngFor="let tile of tiles" 
             class="tile" 
             (click)="goTo(tile.route)"
             [style.background-color]="tile.color + '15'">
          <ion-icon [name]="tile.icon" class="tile-icon" [style.color]="tile.color"></ion-icon>
          <div class="tile-label">{{ 'LANDING.TILES.' + tile.key | translate }}</div>
          <div class="tile-status">{{ 'LANDING.TILES.IN_PROGRESS' | translate }}</div>
        </div>
      </div>
    </ion-content>
  `,
  styles: [`
    .tiles-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 16px;
      padding: 16px;
    }
    .tile {
      aspect-ratio: 1;
      border-radius: 12px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: transform 0.2s;
      &:hover {
        transform: scale(1.05);
      }
    }
    .tile-icon {
      font-size: 32px;
      margin-bottom: 8px;
    }
    .tile-label {
      font-size: 16px;
      font-weight: 500;
      text-align: center;
      margin-bottom: 4px;
    }
    .tile-status {
      font-size: 12px;
      color: #FF9800;
      font-style: italic;
    }
    .spinner-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 60vh;
      font-size: 1.2em;
      color: #888;
    }
  `],
  imports: [SharedModule, UserStatusBarComponent]
})
export class LandingTilesPage implements OnInit {
  tiles: Tile[] = [
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
  userLangLabel = '';
  user: any = null; // TODO: Adapter User type
  isLoading: boolean = false; // Ajout pour le spinner

  constructor(private router: Router) {}

  async ngOnInit() {
    // Exemple d'utilisation du spinner :
    // this.isLoading = true;
    // await this.loadTiles();
    // this.isLoading = false;
    // TODO: Adapter onAuthStateChanged et récupération Firestore
  }

  goTo(route: string) {
    this.router.navigate([route]);
  }

  toggleMenu() {
    const menu = document.querySelector('ion-menu');
    menu?.toggle();
  }
} 