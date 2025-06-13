import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Auth, User } from '@angular/fire/auth';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { UserStatusBarComponent } from '../../components/user-status-bar/user-status-bar.component';
import { onAuthStateChanged } from '@angular/fire/auth';

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
      <div class="tiles-grid">
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
  styleUrls: ['./landing-tiles.page.scss'],
  imports: [CommonModule, IonicModule, TranslateModule, UserStatusBarComponent]
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
  user: User | null = null;

  constructor(private router: Router, private auth: Auth, private firestore: Firestore) {}

  async ngOnInit() {
    onAuthStateChanged(this.auth, (user) => {
      this.user = user;
    });
    // Récupérer la langue préférée de l'utilisateur depuis Firestore
    const user = this.auth.currentUser;
    if (user) {
      const userDoc = await getDoc(doc(this.firestore, `users/${user.uid}`));
      const data = userDoc.data() as any;
      if (data && data.preferredLang) {
        this.userLangLabel = data.preferredLang === 'fr' ? 'Français' : 'English';
      }
    }
  }

  goTo(route: string) {
    this.router.navigate([route], { state: { wip: true } });
  }

  toggleMenu() {
    const menu = document.querySelector('ion-menu');
    menu?.toggle();
  }
} 