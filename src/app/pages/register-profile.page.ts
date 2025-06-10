import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { Auth, createUserWithEmailAndPassword, updateProfile, sendEmailVerification } from '@angular/fire/auth';
import { Firestore, doc, setDoc } from '@angular/fire/firestore';
import { SharedModule } from '../../shared/shared.module';
import { TranslationService } from '../../services/translation.service';

@Component({
  selector: 'app-register-profile',
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule, SharedModule],
  template: `
    <ion-content class="register-content">
      <div *ngIf="isLoading" class="spinner-container">
        <ion-spinner name="crescent"></ion-spinner>
        <div>Création du profil…</div>
      </div>
      <form *ngIf="!isLoading" (ngSubmit)="onSubmit()" #registerForm="ngForm" class="register-form" autocomplete="on">
        <div class="register-logo-block">
          <img src="assets/bob/logo/bob-logo-circle.png" alt="BoB Logo" class="register-logo" />
          <h1 class="register-title">{{ 'AUTH.REGISTER_TITLE' | translate }}</h1>
          <div class="bob-baseline">
            {{ 'HOME.BASELINE' | translate }}
            <a href="https://www.sunshine-adventures.net" target="_blank" rel="noopener">www.sunshine-adventures.net</a>
          </div>
        </div>
        <ion-item lines="none">
          <ion-label>{{ 'AUTH.PREFERRED_LANG' | translate }}</ion-label>
          <ion-select [(ngModel)]="preferredLang" name="preferredLang" interface="popover" (ionChange)="onPreferredLangChange()">
            <ion-select-option value="fr">Français</ion-select-option>
            <ion-select-option value="en">English</ion-select-option>
          </ion-select>
        </ion-item>
        <ion-list lines="none">
          <ion-item>
            <ion-label position="floating">{{ 'AUTH.EMAIL' | translate }}</ion-label>
            <ion-input type="email" [(ngModel)]="email" name="email" required autocomplete="email"></ion-input>
          </ion-item>
          <ion-text color="danger" *ngIf="emailError">{{ emailError | translate }}</ion-text>
          <ion-item>
            <ion-label position="floating">{{ 'AUTH.PASSWORD' | translate }}</ion-label>
            <ion-input [type]="showPassword ? 'text' : 'password'" [(ngModel)]="password" name="password" required autocomplete="new-password"></ion-input>
            <ion-button fill="clear" slot="end" type="button" (click)="togglePasswordVisibility()">
              <ion-icon [name]="showPassword ? 'eye-off' : 'eye'"></ion-icon>
            </ion-button>
          </ion-item>
          <ion-text color="danger" *ngIf="passwordError">{{ passwordError | translate }}</ion-text>
          <ion-item>
            <ion-label position="floating">{{ 'AUTH.CONFIRM_PASSWORD' | translate }}</ion-label>
            <ion-input [type]="showConfirmPassword ? 'text' : 'password'" [(ngModel)]="confirmPassword" name="confirmPassword" required autocomplete="new-password"></ion-input>
            <ion-button fill="clear" slot="end" type="button" (click)="toggleConfirmPasswordVisibility()">
              <ion-icon [name]="showConfirmPassword ? 'eye-off' : 'eye'"></ion-icon>
            </ion-button>
          </ion-item>
          <ion-text color="danger" *ngIf="confirmPasswordError">{{ confirmPasswordError | translate }}</ion-text>
          <ion-item>
            <ion-label position="floating">{{ 'AUTH.FIRSTNAME' | translate }}</ion-label>
            <ion-input [(ngModel)]="firstName" name="firstName" required></ion-input>
          </ion-item>
          <ion-item>
            <ion-label position="floating">{{ 'AUTH.LASTNAME' | translate }}</ion-label>
            <ion-input [(ngModel)]="lastName" name="lastName" required></ion-input>
          </ion-item>
        </ion-list>
        <ion-button expand="block" type="submit" [disabled]="!isFormValid() || isLoading" class="register-btn">
          <ion-spinner *ngIf="isLoading" name="crescent"></ion-spinner>
          <span *ngIf="!isLoading">{{ 'AUTH.REGISTER' | translate }}</span>
        </ion-button>
        <ion-text color="danger" *ngIf="error">{{ error | translate }}</ion-text>
        <ion-text color="success" *ngIf="successMessage">{{ successMessage | translate }}</ion-text>
      </form>
      <div *ngIf="awaitingVerification && !isLoading" class="email-verification-container">
        <h2>{{ 'AUTH.VERIFY_EMAIL_TITLE' | translate }}</h2>
        <p>{{ 'AUTH.VERIFY_EMAIL_MSG' | translate }} <b>{{ email }}</b></p>
        <ion-button expand="block" (click)="resendVerification()" [disabled]="isLoading">
          {{ 'AUTH.RESEND_VERIFICATION' | translate }}
        </ion-button>
        <ion-text color="success" *ngIf="verificationSent">{{ 'AUTH.VERIFY_EMAIL_SENT' | translate }}</ion-text>
        <ion-text color="success" *ngIf="verificationSuccess">{{ 'AUTH.VERIFY_EMAIL_SUCCESS' | translate }}</ion-text>
      </div>
    </ion-content>
  `,
  styles: [`
    .register-content {
      --background: none;
      background: url('/assets/bob/background/login_background.jpg') center center/cover no-repeat !important;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .register-form {
      max-width: 400px;
      width: 100%;
      margin: 0 auto;
      padding: 32px 24px 24px 24px;
      background: rgba(255,255,255,0.98);
      border-radius: 18px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.10);
      display: flex;
      flex-direction: column;
      gap: 16px;
      position: relative;
    }
    .register-logo-block {
      text-align: center;
      margin-bottom: 10px;
    }
    .register-logo {
      height: 70px;
      margin-bottom: 8px;
    }
    .register-title {
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
    .spinner-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 60vh;
      font-size: 1.2em;
      color: #888;
    }
    @media (max-width: 500px) {
      .register-form {
        padding: 16px 4px;
        max-width: 98vw;
      }
      .register-title {
        font-size: 1.1rem;
      }
    }
  `]
})
export class RegisterProfilePage implements OnInit, OnDestroy {
  email = '';
  password = '';
  confirmPassword = '';
  firstName = '';
  lastName = '';
  preferredLang: 'fr' | 'en' = 'fr';
  error = '';
  emailError = '';
  passwordError = '';
  confirmPasswordError = '';
  successMessage = '';
  isLoading = false;
  showPassword = false;
  showConfirmPassword = false;
  verificationSent = false;
  awaitingVerification = false;
  verificationSuccess = false;
  private verificationInterval: any;

  constructor(
    private auth: Auth,
    private firestore: Firestore,
    private router: Router,
    private translationService: TranslationService
  ) {}

  ngOnInit() {
    // ... logique d'initiation si besoin ...
  }

  ngOnDestroy() {
    if (this.verificationInterval) {
      clearInterval(this.verificationInterval);
    }
  }

  onPreferredLangChange() {
    this.translationService.setLanguage(this.preferredLang);
    localStorage.setItem('lang', this.preferredLang);
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  validateEmailField() {
    if (!this.email) {
      this.emailError = 'AUTH.ERRORS.EMPTY_FIELDS';
    } else if (!this.isValidEmail(this.email)) {
      this.emailError = 'AUTH.ERRORS.INVALID_EMAIL';
    } else {
      this.emailError = '';
    }
  }

  validatePasswordField() {
    if (!this.password) {
      this.passwordError = 'AUTH.ERRORS.EMPTY_FIELDS';
    } else if (!this.isPasswordValid(this.password)) {
      this.passwordError = 'AUTH.ERRORS.PASSWORD_RULES';
    } else {
      this.passwordError = '';
    }
  }

  validateConfirmPasswordField() {
    if (this.password !== this.confirmPassword) {
      this.confirmPasswordError = 'AUTH.ERRORS.PASSWORD_MISMATCH';
    } else {
      this.confirmPasswordError = '';
    }
  }

  isFormValid(): boolean {
    return (
      !!this.email &&
      !!this.password &&
      !!this.confirmPassword &&
      !!this.firstName &&
      !!this.lastName &&
      !Boolean(this.emailError) &&
      !Boolean(this.passwordError) &&
      !Boolean(this.confirmPasswordError) &&
      this.isValidEmail(this.email) &&
      this.isPasswordValid(this.password) &&
      this.password === this.confirmPassword
    );
  }

  isValidEmail(email: string): boolean {
    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
  }

  isPasswordValid(password: string): boolean {
    // Minimum 8 caractères, une majuscule, une minuscule, un chiffre, un caractère spécial
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/.test(password);
  }

  async onSubmit() {
    this.error = '';
    this.successMessage = '';
    this.validateEmailField();
    this.validatePasswordField();
    this.validateConfirmPasswordField();
    if (!this.isFormValid()) {
      this.error = 'AUTH.ERRORS.EMPTY_FIELDS';
      return;
    }
    this.isLoading = true;
    try {
      const cred = await createUserWithEmailAndPassword(this.auth, this.email, this.password);
      await updateProfile(cred.user, { displayName: `${this.firstName} ${this.lastName}` });
      await setDoc(doc(this.firestore, `users/${cred.user.uid}`), {
        uid: cred.user.uid,
        email: this.email,
        firstName: this.firstName,
        lastName: this.lastName,
        preferredLang: this.preferredLang,
        createdAt: new Date(),
        lastLogin: new Date()
      });
      this.translationService.setLanguage(this.preferredLang);
      localStorage.setItem('lang', this.preferredLang);
      await sendEmailVerification(cred.user);
      this.verificationSent = true;
      this.awaitingVerification = true;
      this.startVerificationPolling();
    } catch (e: any) {
      if (e.code === 'auth/email-already-in-use') {
        this.error = 'AUTH.ERRORS.EMAIL_IN_USE';
      } else if (e.code === 'auth/invalid-email') {
        this.error = 'AUTH.ERRORS.INVALID_EMAIL';
      } else if (e.code === 'auth/weak-password') {
        this.error = 'AUTH.ERRORS.WEAK_PASSWORD';
      } else if (e.code === 'auth/configuration-not-found') {
        this.error = 'AUTH.ERRORS.CONFIG_NOT_FOUND';
      } else if (e.code === 'auth/api-key-not-valid') {
        this.error = 'AUTH.ERRORS.API_KEY_NOT_VALID';
      } else {
        this.error = 'AUTH.ERRORS.UNKNOWN';
      }
    } finally {
      this.isLoading = false;
    }
  }

  async resendVerification() {
    if (this.auth.currentUser) {
      await sendEmailVerification(this.auth.currentUser);
      this.verificationSent = true;
    }
  }

  startVerificationPolling() {
    this.verificationInterval = setInterval(async () => {
      await this.auth.currentUser?.reload();
      if (this.auth.currentUser?.emailVerified) {
        this.verificationSuccess = true;
        clearInterval(this.verificationInterval);
        setTimeout(() => {
          this.router.navigate(['/landing-tiles']);
        }, 2000);
      }
    }, 2000);
  }
} 