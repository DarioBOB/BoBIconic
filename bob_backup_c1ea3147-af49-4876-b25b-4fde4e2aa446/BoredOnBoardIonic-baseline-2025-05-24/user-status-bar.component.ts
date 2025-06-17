import { Component, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Auth, signOut, onAuthStateChanged, User } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { TranslatePipe } from '../pipes/translate.pipe';
import { HttpClientModule } from '@angular/common/http';
import { UserService } from '../services/user.service';
import { DemoService } from '../services/demo.service';
import { TranslateService } from '../services/translate.service';

@Component({
  selector: 'app-user-status-bar',
  standalone: true,
  template: `
    <div class="user-status-bar">
      <div *ngIf="isDemoMode" class="demo-banner">
        <ion-icon name="information-circle-outline"></ion-icon>
        <span>{{ 'COMMON.DEMO_MODE' | translate }}</span>
      </div>
      <div class="user-info">
        <ion-button fill="clear" class="user-profile" (click)="goToProfile()">
          <ng-container *ngIf="user?.photoURL as avatar; else defaultIcon">
            <img [src]="avatar" alt="Avatar" class="user-avatar" style="width:32px;height:32px;border-radius:50%;object-fit:cover;vertical-align:middle;" />
          </ng-container>
          <ng-template #defaultIcon>
            <ion-icon name="person-circle-outline" slot="start"></ion-icon>
          </ng-template>
        </ion-button>
        <span *ngIf="displayName" class="user-name" style="margin-left:8px; font-weight:500; color:#1976d2;">{{ displayName }}</span>
        <ion-button fill="clear" color="danger" (click)="logout()">
          <ion-icon name="log-out-outline" slot="start"></ion-icon>
          <span>{{ 'COMMON.LOGOUT' | translate }}</span>
        </ion-button>
      </div>
    </div>
  `,
  styleUrls: ['./user-status-bar.component.scss'],
  imports: [CommonModule, IonicModule, TranslatePipe, HttpClientModule]
})
export class UserStatusBarComponent implements OnInit {
  @Output() toggleMenu = new EventEmitter<void>();

  user: User | null = null;
  displayName: string | null = null;
  isDemoMode = false;

  constructor(
    private auth: Auth, 
    private router: Router, 
    private userService: UserService,
    private demoService: DemoService,
    private translateService: TranslateService
  ) {}

  ngOnInit() {
    onAuthStateChanged(this.auth, async (user) => {
      this.user = user;
      if (user) {
        const userData = await this.userService.getCurrentUser();
        const lang = this.translateService['currentLang']?.value || 'fr';
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
        // Vérifier si l'utilisateur est en mode démo
        this.isDemoMode = this.demoService.isDemoMode();
      } else {
        this.displayName = null;
        this.isDemoMode = false;
      }
    });
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