import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router, NavigationStart } from '@angular/router';
import { Auth, signInWithEmailAndPassword, sendPasswordResetEmail } from '@angular/fire/auth';
import { TranslatePipe } from '../../core/pipes/translate.pipe';
import { HttpClientModule } from '@angular/common/http';
import { TranslateService } from '../../core/services/translate.service';
import { environment } from '../../../environments/environment';
import { DemoService } from '../../core/services/demo.service';
import { doc, getDoc } from '@angular/fire/firestore';
import { Firestore } from '@angular/fire/firestore';

@Component({
  selector: 'app-email-auth',
  templateUrl: './email-auth.page.html',
  styleUrls: ['./email-auth.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule, TranslatePipe, HttpClientModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class EmailAuthPage implements OnInit {
  email = '';
  password = '';
  showPassword = false;
  errorMessage = '';
  errorMessageRaw = '';
  isLoading = false;
  selectedLang: 'fr' | 'en' = 'fr';
  environment = environment;
  successMessage = '';

  constructor(
    private auth: Auth,
    private router: Router,
    private translate: TranslateService,
    private demoService: DemoService,
    private firestore: Firestore
  ) {
    this.router.events?.subscribe(event => {
      if (event instanceof NavigationStart && event.url.includes('/auth/email')) {
        this.email = '';
        this.password = '';
        this.errorMessage = '';
      }
    });
  }

  ngOnInit() {
    this.email = '';
    this.password = '';
    this.errorMessage = '';
    // Initialisation de la langue
    const savedLang = localStorage.getItem('lang') as 'fr' | 'en' | null;
    const browserLang = navigator.language.split('-')[0] as 'fr' | 'en';
    this.selectedLang = savedLang || browserLang || 'fr';
    this.translate.use(this.selectedLang);
  }

  onLangChange() {
    this.translate.use(this.selectedLang);
    localStorage.setItem('lang', this.selectedLang);
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

    // Désactiver le mode démo à chaque login classique
    this.demoService.deactivateDemo();

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
          this.router.navigate(['/landing']);
        }
      } else {
        this.router.navigate(['/landing']);
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

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  goToRegister() {
    this.router.navigate(['/auth/register']);
  }

  async loadDemo() {
    try {
      const success = await this.demoService.activateDemo(this.selectedLang);
      if (success) {
        this.router.navigate(['/landing']);
      } else {
        console.error('Failed to activate demo mode');
      }
    } catch (error) {
      console.error('Error activating demo mode:', error);
    }
  }
} 