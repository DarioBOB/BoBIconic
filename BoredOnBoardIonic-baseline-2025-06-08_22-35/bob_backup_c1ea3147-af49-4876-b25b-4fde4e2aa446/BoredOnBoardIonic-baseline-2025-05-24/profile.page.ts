import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../core/pipes/translate.pipe';
import { UserStatusBarComponent } from '../../core/components/user-status-bar.component';
import { Auth, User } from '@angular/fire/auth';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { onAuthStateChanged } from '@angular/fire/auth';

@Component({
  selector: 'app-profile',
  standalone: true,
  template: `
    <ion-content class="ion-padding">
      <div class="profile-container">
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
  `],
  imports: [CommonModule, IonicModule, FormsModule, TranslatePipe, UserStatusBarComponent]
})
export class ProfilePage implements OnInit {
  user: User | null = null;
  selectedLanguage: string = 'fr';
  notificationsEnabled: boolean = true;
  emailNotificationsEnabled: boolean = true;

  constructor(
    private auth: Auth,
    private firestore: Firestore
  ) {}

  ngOnInit() {
    onAuthStateChanged(this.auth, (user) => {
      this.user = user;
      if (user) {
        this.loadUserSettings();
      }
    });
  }

  async loadUserSettings() {
    if (!this.user) return;
    
    const userDoc = await getDoc(doc(this.firestore, `users/${this.user.uid}`));
    const data = userDoc.data();
    
    if (data) {
      this.selectedLanguage = data['preferredLang'] || 'fr';
      this.notificationsEnabled = data['notificationsEnabled'] ?? true;
      this.emailNotificationsEnabled = data['emailNotificationsEnabled'] ?? true;
    }
  }

  async saveSettings() {
    if (!this.user) return;

    try {
      // Sauvegarder les paramètres dans Firestore
      // TODO: Implémenter la sauvegarde
      console.log('Settings saved');
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  }

  changeLanguage() {
    // TODO: Implémenter le changement de langue
    console.log('Language changed to:', this.selectedLanguage);
  }

  toggleMenu() {
    const menu = document.querySelector('ion-menu');
    menu?.toggle();
  }
} 