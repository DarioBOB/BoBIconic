import { Component, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Auth, signOut, onAuthStateChanged, User } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { HttpClientModule } from '@angular/common/http';
import { UserService } from '../../services/user.service';
import { DemoService } from '../../services/demo.service';
import { TranslationService } from '../../services/translation.service';

@Component({
  selector: 'app-user-status-bar',
  standalone: true,
  template: `
    <div class="user-status-bar">
      <div class="user-info">
        <ion-button fill="clear" class="user-profile" (click)="goToProfile()">
          <ng-container *ngIf="user?.photoURL as avatar; else defaultIcon">
            <img [src]="avatar" alt="Avatar" class="user-avatar" style="width:32px;height:32px;border-radius:50%;object-fit:cover;vertical-align:middle;" />
          </ng-container>
          <ng-template #defaultIcon>
            <ion-icon name="person-circle-outline" slot="start"></ion-icon>
          </ng-template>
        </ion-button>
        <span *ngIf="displayName" [ngClass]="isDemoUser ? 'user-name-demo' : 'user-name'">{{ displayName }}</span>
        <ion-button fill="clear" color="danger" (click)="logout()">
          <ion-icon name="log-out-outline" slot="start"></ion-icon>
          <span>{{ 'COMMON.LOGOUT' | translate }}</span>
        </ion-button>
      </div>
    </div>
  `,
  styleUrls: ['./user-status-bar.component.scss'],
  imports: [CommonModule, IonicModule, TranslateModule, HttpClientModule]
})
export class UserStatusBarComponent implements OnInit, OnDestroy {
  @Output() toggleMenu = new EventEmitter<void>();

  user: User | null = null;
  displayName: string | null = null;
  isDemoMode = false;
  isDemoUser = false;
  private demoCheckInterval: any;

  constructor(
    private auth: Auth, 
    private router: Router, 
    private userService: UserService,
    private demoService: DemoService,
    private translationService: TranslationService
  ) {}

  ngOnInit() {
    onAuthStateChanged(this.auth, async (user) => {
      this.user = user;
      this.isDemoUser = !!user && user.uid === 'fUBBVpboDeaUjD6w2nz0xKni9mG3';
      if (user) {
        // Cas spécial user démo
        if (this.isDemoUser) {
          const lang = this.translationService.getCurrentLang() || 'fr';
          this.displayName = lang === 'fr' ? 'Utilisateur DEMO - DONNÉES DE TEST' : 'DEMO USER - TEST DATA';
        } else {
          const userData = await this.userService.getCurrentUser();
          const lang = this.translationService.getCurrentLang() || 'fr';
          let firstName = userData?.firstName;
          let lastName = userData?.lastName;
          if (firstName && typeof firstName === 'object') firstName = firstName[lang] || firstName['fr'] || firstName['en'];
          if (lastName && typeof lastName === 'object') lastName = lastName[lang] || lastName['fr'] || lastName['en'];
          if (firstName && lastName) {
            this.displayName = `${firstName} ${lastName}`;
          } else if (user.displayName) {
            this.displayName = user.displayName;
          } else if (user.email) {
            this.displayName = user.email;
          }
        }
      } else {
        this.displayName = null;
      }
      this.isDemoMode = this.demoService.isDemoMode();
    });
    // Vérifie le flag demo_mode toutes les 2s pour réactivité
    this.demoCheckInterval = setInterval(() => {
      this.isDemoMode = this.demoService.isDemoMode();
    }, 2000);
  }

  ngOnDestroy() {
    if (this.demoCheckInterval) {
      clearInterval(this.demoCheckInterval);
    }
  }

  async logout() {
    try {
      await signOut(this.auth);
      this.demoService.deactivateDemo();
      this.router.navigate(['/auth/email']);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  }

  goToProfile() {
    this.router.navigate(['/profile']);
  }
} 