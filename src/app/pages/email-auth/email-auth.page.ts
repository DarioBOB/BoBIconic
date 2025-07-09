import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router, NavigationStart } from '@angular/router';
import { Auth, signInWithEmailAndPassword, sendPasswordResetEmail } from '@angular/fire/auth';
import { SharedModule } from '../../shared/shared.module';
import { TranslationService } from '../../services/translation.service';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { DemoService } from '../../services/demo.service';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-email-auth',
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule, SharedModule, TranslateModule],
  template: `
    <ion-content [fullscreen]="true" class="login-content">
      <form (ngSubmit)="login()" #loginForm="ngForm" class="login-form" autocomplete="on">
        <div class="login-logo-block">
          <img src="assets/bob-logo-main.png" alt="BoB Logo" class="login-logo" />
          <h1 class="login-title">{{ 'AUTH.LOGIN_TITLE' | translate }}</h1>
          <div class="bob-baseline">
            {{ 'HOME.BASELINE' | translate }}<br />
            <a href="https://www.sunshine-adventures.net" target="_blank" rel="noopener">www.sunshine-adventures.net</a>
          </div>
        </div>
        <ion-item lines="none">
          <ion-label>{{ 'AUTH.PREFERRED_LANG' | translate }}</ion-label>
          <ion-select [(ngModel)]="selectedLang" name="selectedLang" interface="popover" (ionChange)="onLangChange()">
            <ion-select-option value="fr">Français</ion-select-option>
            <ion-select-option value="en">English</ion-select-option>
          </ion-select>
        </ion-item>
        <ion-list lines="none">
          <ion-item>
            <!-- SVG enveloppe -->
            <span slot="start" style="display:flex;align-items:center;">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1bb6b1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="22,6 12,13 2,6"/></svg>
            </span>
            <ion-label position="floating">{{ 'AUTH.EMAIL' | translate }}</ion-label>
            <ion-input type="email" [(ngModel)]="email" name="email" required autocomplete="email"></ion-input>
          </ion-item>
          <ion-item class="password-flex-item">
            <span slot="start" class="icon-lock" style="display:flex;align-items:center;">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1bb6b1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            </span>
            <ion-label position="stacked">{{ 'AUTH.PASSWORD' | translate }}</ion-label>
            <div class="password-input-group">
              <input
                [type]="showPassword ? 'text' : 'password'"
                [(ngModel)]="password"
                name="password"
                required
                autocomplete="current-password"
                class="password-native-input"
                placeholder=" "
              />
              <button type="button" (click)="togglePasswordVisibility()" aria-label="Afficher/Masquer le mot de passe" class="eye-toggle-btn">
                <ng-container *ngIf="!showPassword">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1bb6b1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                </ng-container>
                <ng-container *ngIf="showPassword">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1bb6b1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a21.77 21.77 0 0 1 5.06-6.06M1 1l22 22"></path><path d="M9.53 9.53A3.5 3.5 0 0 0 12 15.5c1.38 0 2.63-.56 3.54-1.47M14.47 14.47A3.5 3.5 0 0 1 12 8.5c-1.38 0-2.63.56-3.54 1.47"></path></svg>
                </ng-container>
              </button>
            </div>
          </ion-item>
        </ion-list>
        <ion-button expand="block" type="submit" [disabled]="!loginForm.form.valid || isLoading" class="login-btn">
          <ion-spinner *ngIf="isLoading" name="crescent"></ion-spinner>
          <span *ngIf="!isLoading">{{ 'AUTH.LOGIN' | translate }}</span>
        </ion-button>
        <ion-button expand="block" fill="clear" (click)="resetPassword()" [disabled]="isLoading">
          {{ 'AUTH.FORGOT_PASSWORD' | translate }}
        </ion-button>
        <ion-button expand="block" fill="outline" type="button" (click)="goToRegister()" [disabled]="isLoading">
          {{ 'AUTH.REGISTER' | translate }}
        </ion-button>
        <ion-button expand="block" color="secondary" (click)="loadDemo()" [disabled]="isLoading">
          {{ 'HOME.TEST_APP' | translate }}
        </ion-button>
        <ion-text color="danger" *ngIf="errorMessage">
          <p class="ion-text-center">{{ errorMessage | translate }}</p>
          <p class="ion-text-center" *ngIf="errorMessageRaw">{{ errorMessageRaw }}</p>
        </ion-text>
        <ion-text color="success" *ngIf="successMessage">
          <p class="ion-text-center">{{ successMessage | translate }}</p>
        </ion-text>
      </form>
    </ion-content>
  `,
  styles: [`
    .login-content {
      --background: none;
      background: url('/assets/login_background.jpg') center center/cover no-repeat !important;
      min-height: 100vh;
      overflow-y: auto;
    }
    .login-form {
      max-width: 380px;
      width: 100%;
      margin: 40px auto 40px auto;
      padding: 32px 24px 24px 24px;
      background: rgba(255,255,255,0.98);
      border-radius: 18px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.10);
      display: flex;
      flex-direction: column;
      gap: 16px;
      position: relative;
    }
    .login-logo-block {
      text-align: center;
      margin-bottom: 10px;
    }
    .login-logo {
      height: 70px;
      margin-bottom: 8px;
    }
    .login-title {
      font-size: 1.5rem;
      font-weight: 700;
      margin: 0 0 8px 0;
      color: #1bb6b1;
      letter-spacing: 0.5px;
    }
    .bob-baseline {
      font-size: 1rem;
      color: #444;
      margin-bottom: 10px;
      margin-top: 8px;
    }
    .bob-baseline a {
      color: #1bb6b1;
      text-decoration: underline;
    }
    ion-list, ion-item {
      background: transparent !important;
    }
    ion-item {
      --background: transparent;
      --border-color: #1bb6b1;
      margin-bottom: 10px;
      border-radius: 8px;
      align-items: center;
    }
    ion-icon {
      font-size: 1.2em;
      color: #1bb6b1;
      margin-right: 6px;
    }
    ion-button {
      --background: #1bb6b1;
      --background-hover: #159e9a;
      --background-activated: #159e9a;
      --color: #fff;
      --border-radius: 8px;
      margin-bottom: 8px;
      font-weight: 600;
      font-size: 1.05em;
    }
    ion-button[fill="outline"] {
      --background: #fff;
      --color: #1bb6b1;
      --border-color: #1bb6b1;
    }
    ion-button[fill="clear"] {
      --color: #ff9800;
    }
    ion-text[color="danger"] {
      margin-top: 12px;
      display: block;
    }
    @media (max-width: 500px) {
      .login-content {
        padding-top: 8px;
        padding-bottom: 8px;
      }
      .login-form {
        padding: 12px 2px;
        max-width: 98vw;
        margin: 16px auto 16px auto;
      }
      .login-title {
        font-size: 1.1rem;
      }
    }
    .password-flex-item .password-input-group {
      display: flex;
      align-items: center;
      width: 100%;
      background: transparent;
      position: relative;
    }
    .password-native-input {
      flex: 1 1 auto;
      min-width: 0;
      box-sizing: border-box;
      background: #eaf3fb;
      border: none;
      border-radius: 6px;
      padding: 10px 40px 10px 10px;
      font-size: 1.1em;
      outline: none;
    }
    .password-flex-item .eye-toggle-btn {
      background: transparent;
      border: none;
      box-shadow: none;
      outline: none;
      cursor: pointer;
      position: absolute;
      right: 8px;
      top: 50%;
      transform: translateY(-50%);
      display: flex;
      align-items: center;
      justify-content: center;
      height: 32px;
      width: 32px;
      z-index: 2;
    }
    .password-flex-item .eye-toggle-btn svg {
      display: block;
      height: 22px;
      width: 22px;
    }
    .password-flex-item ion-label {
      z-index: 3;
      background: transparent;
      position: relative;
      margin-bottom: 2px;
    }
  `]
})
export class EmailAuthPage implements OnInit {
  email = '';
  password = '';
  showPassword = false;
  errorMessage = '';
  errorMessageRaw = '';
  successMessage = '';
  isLoading = false;
  selectedLang: 'fr' | 'en' = 'fr';

  constructor(
    private auth: Auth,
    private router: Router,
    private translationService: TranslationService,
    private firestore: Firestore,
    private demoService: DemoService
  ) {
    this.router.events?.subscribe(event => {
      if (event instanceof NavigationStart && event.url.includes('/auth/email')) {
        this.email = '';
        this.password = '';
        this.errorMessage = '';
        this.errorMessageRaw = '';
      }
    });
  }

  ngOnInit() {
    this.email = '';
    this.password = '';
    this.errorMessage = '';
    this.errorMessageRaw = '';
    // Initialisation de la langue
    const savedLang = localStorage.getItem('lang') as 'fr' | 'en' | null;
    const browserLang = navigator.language.split('-')[0] as 'fr' | 'en';
    this.selectedLang = savedLang || browserLang || 'fr';
    this.translationService.setLanguage(this.selectedLang);
  }

  onLangChange() {
    this.translationService.setLanguage(this.selectedLang);
    localStorage.setItem('lang', this.selectedLang);
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  async login() {
    if (!this.email || !this.password) {
      this.errorMessage = 'AUTH.ERRORS.EMPTY_FIELDS';
      this.errorMessageRaw = '';
      return;
    }
    this.isLoading = true;
    this.errorMessage = '';
    this.errorMessageRaw = '';

    try {
      await signInWithEmailAndPassword(this.auth, this.email, this.password);
      // Charger le profil Firestore pour vérifier le rôle
      const user = this.auth.currentUser;
      if (user) {
        const userRef = doc(this.firestore, `users/${user.uid}`);
        const snap = await getDoc(userRef);
        const data = snap.exists() ? snap.data() : null;
        if (data && data['role'] === 'admin') {
          this.router.navigate(['/admin']);
        } else {
          this.router.navigate(['/landing-tiles']);
        }
      } else {
        this.router.navigate(['/landing-tiles']);
      }
    } catch (error: any) {
      console.error('[AUTH ERROR]', error);
      switch (error.code) {
        case 'auth/invalid-email':
          this.errorMessage = 'AUTH.ERRORS.INVALID_EMAIL';
          break;
        case 'auth/user-disabled':
          this.errorMessage = 'AUTH.ERRORS.USER_DISABLED';
          break;
        case 'auth/user-not-found':
        case 'auth/invalid-credential':
          this.errorMessage = 'AUTH.ERRORS.USER_NOT_FOUND_BOB';
          break;
        case 'auth/wrong-password':
          this.errorMessage = 'AUTH.ERRORS.INVALID_CREDENTIALS';
          break;
        case 'auth/api-key-not-valid':
          this.errorMessage = 'AUTH.ERRORS.API_KEY_NOT_VALID';
          this.errorMessageRaw = error.message;
          break;
        default:
          this.errorMessage = 'AUTH.ERRORS.UNKNOWN';
          this.errorMessageRaw = error.message || JSON.stringify(error);
      }
    } finally {
      this.isLoading = false;
    }
  }

  async resetPassword() {
    if (!this.email) {
      this.errorMessage = 'AUTH.ERRORS.EMAIL_REQUIRED';
      this.successMessage = '';
      return;
    }
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';
    try {
      await sendPasswordResetEmail(this.auth, this.email);
      this.successMessage = 'AUTH.RESET_EMAIL_SENT';
    } catch (error: any) {
      console.error('[RESET ERROR]', error);
      switch (error.code) {
        case 'auth/invalid-email':
          this.errorMessage = 'AUTH.ERRORS.INVALID_EMAIL';
          break;
        case 'auth/user-not-found':
        case 'auth/invalid-credential':
          this.errorMessage = 'AUTH.ERRORS.USER_NOT_FOUND_BOB';
          break;
        default:
          this.errorMessage = 'AUTH.ERRORS.UNKNOWN';
      }
    } finally {
      this.isLoading = false;
    }
  }

  goToRegister() {
    this.router.navigate(['/auth/register']);
  }

  async loadDemo() {
    console.log('[AUTH] Démarrage de l\'activation du mode démo...');
    this.isLoading = true;
    this.errorMessage = '';
    this.errorMessageRaw = '';
    this.successMessage = '';
    
    try {
      console.log('[AUTH] Tentative de connexion avec les identifiants démo...');
      
      // Utilise DemoService pour activer le mode démo avec la langue sélectionnée
      const ok = await this.demoService.activateDemo(this.selectedLang);
      
      if (ok) {
        console.log('[AUTH] Mode démo activé avec succès, navigation vers landing-tiles...');
        localStorage.setItem('demo_mode', 'true');
        this.successMessage = 'AUTH.DEMO_ACTIVATED';
        
        // Naviguer proprement au lieu de reload
        setTimeout(() => {
          this.router.navigate(['/landing-tiles']);
        }, 1000);
      } else {
        console.error('[AUTH] Échec de l\'activation du mode démo');
        this.errorMessage = 'AUTH.ERRORS.DEMO_ACTIVATION_FAILED';
      }
    } catch (error: any) {
      console.error('[AUTH] Erreur lors de l\'activation du mode démo:', error);
      this.errorMessage = 'AUTH.ERRORS.DEMO_ACTIVATION_FAILED';
      this.errorMessageRaw = error.message || JSON.stringify(error);
    } finally {
      this.isLoading = false;
    }
  }
} 