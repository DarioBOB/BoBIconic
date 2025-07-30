import { Component, Output, EventEmitter, OnInit, OnDestroy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { UserService } from '../../services/user.service';
import { DemoService } from '../../services/demo.service';
import { TranslationService } from '../../services/translation.service';
import { Subscription } from 'rxjs';
import type { User } from '@angular/fire/auth';
import { signOut } from '@angular/fire/auth';

@Component({
  selector: 'app-user-status-bar',
  standalone: true,
  template: `
    <div class="user-status-bar">
      <div class="user-info">
        <ion-button fill="clear" class="user-profile" (click)="goToProfile()">
          <ng-container *ngIf="currentUser?.photoURL as avatar; else defaultIcon">
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
  imports: [CommonModule, IonicModule, TranslateModule]
})
export class UserStatusBarComponent implements OnInit, OnDestroy {
  @Input() user: User | null = null;
  @Output() toggleMenu = new EventEmitter<void>();

  currentUser: User | null = null;
  displayName: string | null = null;
  isDemoMode = false;
  isDemoUser = false;
  private userSubscription: Subscription | null = null;
  private userDataSubscription: Subscription | null = null;
  private demoCheckInterval: any;

  constructor(
    private router: Router, 
    public userService: UserService,
    private demoService: DemoService,
    private translationService: TranslationService
  ) {}

  ngOnInit() {
    // S'abonner à l'observable user$ du service
    this.userSubscription = this.userService.user$.subscribe((firebaseUser) => {
      const effectiveUser = this.user || firebaseUser;
      this.currentUser = effectiveUser;
      this.isDemoUser = !!this.currentUser && this.userService.isDemoSync();
      console.log('[UserStatusBar] user:', this.currentUser);
      
      if (this.currentUser) {
        if (this.isDemoUser) {
          const lang = this.translationService.getCurrentLang() || 'fr';
          this.displayName = lang === 'fr' ? 'Utilisateur DEMO - DONNÉES DE TEST' : 'DEMO USER - TEST DATA';
        } else {
          // Utiliser l'observable userData$ au lieu de getCurrentUser() async
          this.userDataSubscription = this.userService.userData$.subscribe((userData) => {
            if (userData) {
              const lang = this.translationService.getCurrentLang() || 'fr';
              let firstName = userData.firstName;
              let lastName = userData.lastName;
              if (firstName && typeof firstName === 'object') firstName = firstName[lang] || firstName['fr'] || firstName['en'];
              if (lastName && typeof lastName === 'object') lastName = lastName[lang] || lastName['fr'] || lastName['en'];
              if (firstName && lastName) {
                this.displayName = `${firstName} ${lastName}`;
              } else if (this.currentUser?.displayName) {
                this.displayName = this.currentUser.displayName;
              } else if (this.currentUser?.email) {
                this.displayName = this.currentUser.email;
              } else {
                this.displayName = 'Utilisateur connecté';
              }
            }
          });
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
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
    if (this.userDataSubscription) {
      this.userDataSubscription.unsubscribe();
    }
    if (this.demoCheckInterval) {
      clearInterval(this.demoCheckInterval);
    }
  }

  async logout() {
    try {
      await signOut(this.userService['auth']);
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