import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { UserStatusBarComponent } from '../components/user-status-bar/user-status-bar.component';
import { SharedModule } from '../shared/shared.module';
import { TranslationService } from '../services/translation.service';
import { UserHeaderComponent } from '../components/user-header/user-header.component';
// TODO: Adapter TranslatePipe import
// TODO: Adapter User, Firestore imports
// TODO: Adapter onAuthStateChanged import

@Component({
  selector: 'app-profile',
  standalone: true,
  template: `
    <ion-content class="ion-padding">
      <div *ngIf="isLoading" class="spinner-container">
        <ion-spinner name="crescent"></ion-spinner>
        <div>Chargement du profil…</div>
      </div>
      <div class="profile-container" *ngIf="!isLoading">
        <div class="profile-header">
          <ion-avatar class="profile-avatar">
            <ion-icon name="person-circle-outline"></ion-icon>
          </ion-avatar>
          <h1>{{ user?.displayName || user?.email }}</h1>
          <p class="user-email">{{ user?.email }}</p>
        </div>

        <ion-list class="profile-settings">
          <ion-item>
            <ion-icon name="language-outline" slot="start" color="primary"></ion-icon>
            <ion-label>{{ 'PROFILE.LANGUAGE' | translate }}</ion-label>
            <ion-select [(ngModel)]="selectedLanguage" (ionChange)="changeLanguage()">
              <ion-select-option value="fr">Français</ion-select-option>
              <ion-select-option value="en">English</ion-select-option>
            </ion-select>
          </ion-item>

          <ion-item>
            <ion-icon name="notifications-outline" slot="start" color="primary"></ion-icon>
            <ion-label>{{ 'PROFILE.NOTIFICATIONS' | translate }}</ion-label>
            <ion-toggle [(ngModel)]="notificationsEnabled"></ion-toggle>
          </ion-item>

          <ion-item>
            <ion-icon name="mail-outline" slot="start" color="primary"></ion-icon>
            <ion-label>{{ 'PROFILE.EMAIL_NOTIFICATIONS' | translate }}</ion-label>
            <ion-toggle [(ngModel)]="emailNotificationsEnabled"></ion-toggle>
          </ion-item>
        </ion-list>

        <div class="profile-actions">
          <ion-button expand="block" color="primary" (click)="saveSettings()">
            {{ 'PROFILE.SAVE' | translate }}
          </ion-button>
        </div>
      </div>
    </ion-content>
  `,
  styles: [`
    .profile-container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .profile-header {
      text-align: center;
      margin-bottom: 32px;
      .profile-avatar {
        width: 96px;
        height: 96px;
        margin: 0 auto 16px;
        background: #e0f7fa;
        display: flex;
        align-items: center;
        justify-content: center;
        ion-icon {
          font-size: 64px;
          color: #00BCD4;
        }
      }
      h1 {
        font-size: 24px;
        font-weight: 600;
        color: #333;
        margin-bottom: 8px;
      }
      .user-email {
        font-size: 16px;
        color: #666;
      }
    }
    .profile-settings {
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      margin-bottom: 24px;
      ion-item {
        --padding-start: 16px;
        --padding-end: 16px;
        --min-height: 56px;
        ion-icon {
          font-size: 24px;
          margin-right: 16px;
        }
      }
    }
    .profile-actions {
      padding: 0 16px;
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
  imports: [SharedModule, UserStatusBarComponent, UserHeaderComponent]
})
export class ProfilePage implements OnInit {
  user: any = null; // TODO: Adapter User type
  selectedLanguage: string = 'fr';
  notificationsEnabled: boolean = true;
  emailNotificationsEnabled: boolean = true;
  isLoading: boolean = false; // Ajout pour le spinner

  constructor(private translationService: TranslationService) {}

  ngOnInit() {
    this.selectedLanguage = this.translationService.getCurrentLang();
    // TODO: Adapter onAuthStateChanged
  }

  async loadUserSettings() {
    // TODO: Adapter Firestore getDoc
  }

  async saveSettings() {
    // TODO: Implémenter la sauvegarde Firestore
    console.log('Settings saved');
  }

  changeLanguage() {
    this.translationService.setLanguage(this.selectedLanguage);
  }

  toggleMenu() {
    const menu = document.querySelector('ion-menu');
    menu?.toggle();
  }
} 