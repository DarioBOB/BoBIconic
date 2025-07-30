import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { Auth, createUserWithEmailAndPassword } from '@angular/fire/auth';
import { Firestore, doc, setDoc } from '@angular/fire/firestore';
import { SharedModule } from '../../shared/shared.module';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule, SharedModule],
  template: `
    <ion-content class="register-content">
      <form (ngSubmit)="register()" #registerForm="ngForm" class="register-form" autocomplete="on">
        <div class="register-logo-block">
          <img src="assets/bob/logo/bob-logo-circle.png" alt="BoB Logo" class="register-logo" />
          <h1 class="register-title">{{ 'AUTH.REGISTER_TITLE' | translate }}</h1>
        </div>

        <ion-list lines="none">
          <ion-item>
            <ion-icon name="person-outline" slot="start"></ion-icon>
            <ion-label position="floating">{{ 'AUTH.FIRSTNAME' | translate }}</ion-label>
            <ion-input type="text" [(ngModel)]="firstname" name="firstname" required></ion-input>
          </ion-item>
          <ion-item>
            <ion-icon name="person-outline" slot="start"></ion-icon>
            <ion-label position="floating">{{ 'AUTH.LASTNAME' | translate }}</ion-label>
            <ion-input type="text" [(ngModel)]="lastname" name="lastname" required></ion-input>
          </ion-item>
          <ion-item>
            <ion-icon name="mail-outline" slot="start"></ion-icon>
            <ion-label position="floating">{{ 'AUTH.EMAIL' | translate }}</ion-label>
            <ion-input type="email" [(ngModel)]="email" name="email" required autocomplete="email"></ion-input>
          </ion-item>
          <ion-item>
            <ion-icon name="lock-closed-outline" slot="start"></ion-icon>
            <ion-label position="floating">{{ 'AUTH.PASSWORD' | translate }}</ion-label>
            <ion-input [type]="showPassword ? 'text' : 'password'" [(ngModel)]="password" name="password" required autocomplete="new-password"></ion-input>
            <ion-button fill="clear" slot="end" type="button" (click)="togglePasswordVisibility()">
              <ion-icon [name]="showPassword ? 'eye-off' : 'eye'"></ion-icon>
            </ion-button>
          </ion-item>
          <ion-item>
            <ion-icon name="lock-closed-outline" slot="start"></ion-icon>
            <ion-label position="floating">{{ 'AUTH.CONFIRM_PASSWORD' | translate }}</ion-label>
            <ion-input [type]="showPassword ? 'text' : 'password'" [(ngModel)]="confirmPassword" name="confirmPassword" required autocomplete="new-password"></ion-input>
          </ion-item>
        </ion-list>

        <ion-text color="medium" class="ion-padding">
          <p>{{ 'AUTH.PASSWORD_REQUIREMENTS' | translate }}</p>
        </ion-text>

        <ion-button expand="block" type="submit" [disabled]="!registerForm.form.valid || isLoading" class="register-btn">
          <ion-spinner *ngIf="isLoading" name="crescent"></ion-spinner>
          <span *ngIf="!isLoading">{{ 'AUTH.REGISTER' | translate }}</span>
        </ion-button>

        <ion-button expand="block" fill="outline" type="button" (click)="goToLogin()" [disabled]="isLoading">
          {{ 'AUTH.LOGIN' | translate }}
        </ion-button>

        <ion-text color="danger" *ngIf="errorMessage">
          <p class="ion-text-center">{{ errorMessage | translate }}</p>
        </ion-text>
      </form>
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
      max-width: 380px;
      width: 100%;
      margin: 0 auto;
      padding: 32px 24px 24px 24px;
      background: rgba(255,255,255,0.98);
      border-radius: 18px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.10);
      display: flex;
      flex-direction: column;
      gap: 16px;
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
    ion-list, ion-item {
      background: transparent !important;
    }
    ion-item {
      --background: transparent;
      --border-color: #1bb6b1;
      margin-bottom: 10px;
      border-radius: 8px;
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
    ion-text[color="danger"] {
      margin-top: 12px;
      display: block;
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
export class RegisterPage implements OnInit {
  firstname = '';
  lastname = '';
  email = '';
  password = '';
  confirmPassword = '';
  showPassword = false;
  errorMessage = '';
  isLoading = false;

  constructor(
    private auth: Auth,
    private firestore: Firestore,
    private router: Router
  ) {}

  ngOnInit() {}

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  async register() {
    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'AUTH.ERRORS.PASSWORD_MISMATCH';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    try {
      const userCredential = await createUserWithEmailAndPassword(this.auth, this.email, this.password);
      const user = userCredential.user;

      // Créer le profil utilisateur dans Firestore
      const userRef = doc(this.firestore, `users/${user.uid}`);
      await setDoc(userRef, {
        firstname: this.firstname,
        lastname: this.lastname,
        email: this.email,
        role: 'user',
        createdByDemo: false,
        createdAt: new Date(),
        lastLogin: new Date()
      });

      // Rediriger vers la page d'accueil
      this.router.navigate(['/landing-tiles']);
    } catch (error: any) {
      console.error('Registration error:', error);
      switch (error.code) {
        case 'auth/email-already-in-use':
          this.errorMessage = 'AUTH.ERRORS.EMAIL_IN_USE';
          break;
        case 'auth/invalid-email':
          this.errorMessage = 'AUTH.ERRORS.INVALID_EMAIL';
          break;
        case 'auth/operation-not-allowed':
          this.errorMessage = 'AUTH.ERRORS.OPERATION_NOT_ALLOWED';
          break;
        case 'auth/weak-password':
          this.errorMessage = 'AUTH.ERRORS.WEAK_PASSWORD';
          break;
        default:
          this.errorMessage = 'AUTH.ERRORS.UNKNOWN';
      }
    } finally {
      this.isLoading = false;
    }
  }

  goToLogin() {
    this.router.navigate(['/auth/email']);
  }
} 