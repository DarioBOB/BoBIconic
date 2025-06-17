import { Component, CUSTOM_ELEMENTS_SCHEMA, OnDestroy } from '@angular/core';
import { Auth, createUserWithEmailAndPassword, updateProfile, User, sendEmailVerification } from '@angular/fire/auth';
import { Firestore, doc, setDoc } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonInput, IonItem, IonLabel, IonText, IonSelect, IonSelectOption } from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../core/pipes/translate.pipe';
import { isPasswordValid, doPasswordsMatch } from '../core/shared/password.utils';
import { HttpClientModule } from '@angular/common/http';
import { TranslateService } from '../core/services/translate.service';

@Component({
  selector: 'app-register-profile',
  template: `
    <ion-header><ion-toolbar><ion-title>{{ 'AUTH.REGISTER_TITLE' | translate }}</ion-title></ion-toolbar></ion-header>
    <ion-content class="ion-padding">
      <div style="text-align:center; margin-bottom: 8px;">
        <ion-text color="warning"><b>MODE TEST</b></ion-text>
      </div>
      <ng-container *ngIf="!awaitingVerification; else awaitingEmail">
        <form (ngSubmit)="onSubmit()" #registerForm="ngForm">
          <div style="text-align:center; margin-bottom: 16px;">
            <img src="assets/bob/logo/bob-logo-circle.png" alt="BoB Logo" style="height:70px; margin-bottom:8px;" />
            <div class="bob-baseline">
              {{ 'HOME.BASELINE' | translate }}
              <a href="https://www.sunshine-adventures.net" target="_blank" rel="noopener">www.sunshine-adventures.net</a>
            </div>
          </div>
          <ion-item>
            <ion-label>{{ 'AUTH.PREFERRED_LANG' | translate }}</ion-label>
            <ion-select [(ngModel)]="preferredLang" name="preferredLang" interface="popover" (ionChange)="onPreferredLangChange()">
              <ion-select-option value="fr">Français</ion-select-option>
              <ion-select-option value="en">English</ion-select-option>
            </ion-select>
          </ion-item>
          <ion-item>
            <ion-label position="floating">{{ 'AUTH.EMAIL' | translate }}</ion-label>
            <ion-input type="email" [(ngModel)]="email" name="email" required (ionBlur)="validateEmailField()" (ngModelChange)="validateEmailField()"></ion-input>
          </ion-item>
          <ion-text color="danger" *ngIf="emailError">{{ emailError | translate }}</ion-text>
          <ion-item>
            <ion-label position="floating">{{ 'AUTH.PASSWORD' | translate }}</ion-label>
            <ion-input [type]="showPassword ? 'text' : 'password'" [(ngModel)]="password" name="password" required (ionBlur)="validatePasswordField()" (ngModelChange)="validatePasswordField(); validateConfirmPasswordField()"></ion-input>
            <ion-button fill="clear" slot="end" type="button" (click)="togglePasswordVisibility()">
              <ion-icon [name]="showPassword ? 'eye-off' : 'eye'"></ion-icon>
            </ion-button>
          </ion-item>
          <ion-text color="danger" *ngIf="passwordError">{{ passwordError | translate }}</ion-text>
          <ion-item>
            <ion-label position="floating">{{ 'AUTH.CONFIRM_PASSWORD' | translate }}</ion-label>
            <ion-input [type]="showConfirmPassword ? 'text' : 'password'" [(ngModel)]="confirmPassword" name="confirmPassword" required (ionBlur)="validateConfirmPasswordField()" (ngModelChange)="validateConfirmPasswordField()"></ion-input>
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
          <ion-text color="danger" *ngIf="error">{{ error | translate }}</ion-text>
          <ion-text color="medium" *ngIf="errorRaw">
            <p class="ion-text-center" style="font-size: 0.9em;">{{ errorRaw }}</p>
            <p class="ion-text-center" style="font-size: 0.9em; color: orange;" *ngIf="errorRaw.includes('api-key-not-valid')">
              (Mode test : pour créer un compte, configurez une vraie clé API Firebase dans environment.ts)
            </p>
          </ion-text>
          <ion-button expand="block" type="submit" [disabled]="!isFormValid() || isLoading">{{ 'AUTH.REGISTER' | translate }}</ion-button>
        </form>
      </ng-container>
      <ng-template #awaitingEmail>
        <div class="email-verification-container">
          <h2>{{ 'AUTH.VERIFY_EMAIL_TITLE' | translate }}</h2>
          <p>{{ 'AUTH.VERIFY_EMAIL_MSG' | translate }} <b>{{ email }}</b></p>
          <ion-button expand="block" (click)="resendVerification()" [disabled]="isLoading">
            {{ 'AUTH.RESEND_VERIFICATION' | translate }}
          </ion-button>
          <ion-text color="success" *ngIf="verificationSent">{{ 'AUTH.VERIFY_EMAIL_SENT' | translate }}</ion-text>
          <ion-text color="success" *ngIf="verificationSuccess">{{ 'AUTH.VERIFY_EMAIL_SUCCESS' | translate }}</ion-text>
        </div>
      </ng-template>
    </ion-content>
  `,
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonInput, IonItem, IonLabel, IonText, IonSelect, IonSelectOption, FormsModule, CommonModule, TranslatePipe, HttpClientModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  styleUrls: ['./register-profile.page.scss']
})
export class RegisterProfilePage implements OnDestroy {
  email: string = '';
  password: string = '';
  confirmPassword: string = '';
  firstName: string = '';
  lastName: string = '';
  preferredLang: 'fr' | 'en' = 'fr';
  error: string = '';
  errorRaw: string = '';
  isLoading: boolean = false;
  showPassword: boolean = false;
  showConfirmPassword: boolean = false;
  emailError: string = '';
  passwordError: string = '';
  confirmPasswordError: string = '';
  verificationSent: boolean = false;
  awaitingVerification: boolean = false;
  private verificationInterval: any;
  verificationSuccess: boolean = false;

  constructor(private auth: Auth, private firestore: Firestore, private router: Router, private translate: TranslateService) {}

  ngOnInit() {
    if (this.awaitingVerification) {
      this.startVerificationPolling();
    }
  }

  ngOnDestroy() {
    if (this.verificationInterval) {
      clearInterval(this.verificationInterval);
    }
  }

  startVerificationPolling() {
    this.verificationInterval = setInterval(async () => {
      await this.auth.currentUser?.reload();
      if (this.auth.currentUser?.emailVerified) {
        this.verificationSuccess = true;
        clearInterval(this.verificationInterval);
        setTimeout(() => {
          this.router.navigate(['/auth/email'], { queryParams: { verified: '1' } });
        }, 1500);
      }
    }, 3000);
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
    } else if (!isPasswordValid(this.password)) {
      this.passwordError = 'AUTH.ERRORS.PASSWORD_RULES';
    } else {
      this.passwordError = '';
    }
  }

  validateConfirmPasswordField() {
    if (!doPasswordsMatch(this.password, this.confirmPassword)) {
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
      isPasswordValid(this.password) &&
      doPasswordsMatch(this.password, this.confirmPassword)
    );
  }

  async onSubmit() {
    this.error = '';
    this.errorRaw = '';
    this.validateEmailField();
    this.validatePasswordField();
    this.validateConfirmPasswordField();
    if (!this.isFormValid()) {
      this.error = 'AUTH.ERRORS.EMPTY_FIELDS';
      this.errorRaw = '';
      return;
    }
    this.isLoading = true;
    try {
      console.log('[REGISTER] Starting user creation...');
      const cred = await createUserWithEmailAndPassword(this.auth, this.email, this.password);
      console.log('[REGISTER] User created successfully:', cred.user.uid);
      
      console.log('[REGISTER] Updating profile...');
      await updateProfile(cred.user, { displayName: `${this.firstName} ${this.lastName}` });
      console.log('[REGISTER] Profile updated successfully');
      
      console.log('[REGISTER] Saving user data to Firestore...');
      await setDoc(doc(this.firestore, `users/${cred.user.uid}`), {
        uid: cred.user.uid,
        email: this.email,
        firstName: this.firstName,
        lastName: this.lastName,
        preferredLang: this.preferredLang,
        createdAt: new Date(),
        lastLogin: new Date()
      });
      console.log('[REGISTER] User data saved to Firestore');
      
      this.translate.use(this.preferredLang);
      localStorage.setItem('lang', this.preferredLang);
      
      console.log('[REGISTER] Sending verification email...');
      await sendEmailVerification(cred.user);
      console.log('[REGISTER] Verification email sent');
      
      this.verificationSent = true;
      this.awaitingVerification = true;
      this.startVerificationPolling();
    } catch (e: any) {
      console.error('[REGISTER ERROR]', e);
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
        this.errorRaw = e.message;
      } else {
        this.error = 'AUTH.ERRORS.UNKNOWN';
        this.errorRaw = e.message || JSON.stringify(e);
      }
    } finally {
      this.isLoading = false;
    }
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }
  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  isValidEmail(email: string): boolean {
    // Regex stricte pour email
    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
  }

  validateEmail(email: string): boolean {
    return this.isValidEmail(email);
  }

  async resendVerification() {
    if (this.auth.currentUser) {
      await sendEmailVerification(this.auth.currentUser);
      this.verificationSent = true;
    }
  }

  onPreferredLangChange() {
    this.translate.use(this.preferredLang);
    localStorage.setItem('lang', this.preferredLang);
  }
} 