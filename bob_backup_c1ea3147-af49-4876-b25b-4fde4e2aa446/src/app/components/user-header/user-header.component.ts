import { Component, Input, Output, EventEmitter } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Auth, User } from '@angular/fire/auth';

@Component({
  selector: 'app-user-header',
  standalone: true,
  imports: [IonicModule, CommonModule],
  template: `
    <ion-toolbar class="user-header-toolbar">
      <ion-buttons slot="start">
        <ion-button (click)="toggleMenu.emit()" aria-label="Menu">
          <span style="display:flex;align-items:center;">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#1976d2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg>
          </span>
        </ion-button>
        <ion-button (click)="goHome()" color="primary" aria-label="Accueil">
          <span style="display:flex;align-items:center;">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#1976d2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9.5L12 4l9 5.5V20a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9.5z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          </span>
        </ion-button>
      </ion-buttons>
      <ion-title>{{ title }}</ion-title>
      <ion-buttons slot="end">
        <ion-button (click)="goProfile()" aria-label="Profil">
          <div class="avatar-circle">
            <span>{{ initials }}</span>
          </div>
          <span class="user-name">{{ displayName }}</span>
        </ion-button>
        <ion-button color="danger" (click)="logout()" aria-label="Déconnexion">
          <span style="display:flex;align-items:center;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#d32f2f" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          </span>
          Déconnexion
        </ion-button>
      </ion-buttons>
    </ion-toolbar>
  `,
  styles: [`
    :host ::ng-deep ion-toolbar.user-header-toolbar {
      --background: #e3f0ff !important;
      background: #e3f0ff !important;
      color: #1976d2 !important;
      box-shadow: none !important;
    }
    .user-header-toolbar {
      min-height: 56px;
    }
    ion-icon[name="home-outline"] {
      color: #1976d2 !important;
      font-size: 28px !important;
      opacity: 1 !important;
      background: #fff3 !important;
      border-radius: 50%;
      border: 1px solid #1976d2;
      box-sizing: content-box;
      padding: 2px;
      display: inline-block !important;
      z-index: 10;
    }
    .avatar-circle {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: #fff;
      color: #1976d2;
      font-weight: bold;
      font-size: 1.1em;
      margin-right: 8px;
      box-shadow: 0 1px 4px #0002;
    }
    .user-name {
      font-weight: 500;
      color: #1976d2;
      margin-right: 8px;
      text-transform: capitalize;
      font-size: 1em;
    }
    @media (max-width: 600px) {
      .user-name { display: none; }
      .avatar-circle { margin-right: 0; }
    }
  `]
})
export class UserHeaderComponent {
  @Input() title: string = '';
  @Input() user: User | null = null;
  @Output() toggleMenu = new EventEmitter<void>();

  constructor(private router: Router, private auth: Auth) {}

  get displayName(): string | null {
    if (!this.user) return null;
    if (this.user.displayName) return this.user.displayName;
    if (this.user.email) return this.user.email.split('@')[0].replace('.', ' ').toUpperCase();
    return null;
  }

  get initials(): string {
    if (!this.user) return '';
    if (this.user.displayName) {
      return this.user.displayName.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    if (this.user.email) {
      return this.user.email[0].toUpperCase();
    }
    return '';
  }

  goHome() {
    this.router.navigate(['/landing-tiles']);
  }

  goProfile() {
    this.router.navigate(['/profile']);
  }

  async logout() {
    await this.auth.signOut();
    this.router.navigate(['/auth']);
  }
} 