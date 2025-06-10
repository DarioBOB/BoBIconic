import { Injectable } from '@angular/core';
import { Auth, signInWithEmailAndPassword, UserCredential } from '@angular/fire/auth';
import { TranslateService } from '../services/translate.service';

const DEMO_EMAIL = 'guestuser@demo.com';
const DEMO_PASSWORD = 'DemoPassword123!'; // À stocker dans un env sécurisé en prod

@Injectable({ providedIn: 'root' })
export class DemoService {
  private isDemo = false;
  private lang: 'fr' | 'en' = 'fr';

  constructor(
    private auth: Auth,
    private translate: TranslateService
  ) {}

  async activateDemo(lang: 'fr' | 'en' = 'fr') {
    this.isDemo = true;
    this.lang = lang;
    try {
      await signInWithEmailAndPassword(this.auth, DEMO_EMAIL, DEMO_PASSWORD);
      this.translate.use(lang);
      return true;
    } catch (error) {
      this.isDemo = false;
      console.error('[DemoService] Error activating demo mode:', error);
      return false;
    }
  }

  deactivateDemo() {
    this.isDemo = false;
  }

  isDemoMode(): boolean {
    return this.isDemo;
  }

  getLang(): 'fr' | 'en' {
    return this.lang;
  }

  setLang(lang: 'fr' | 'en') {
    this.lang = lang;
    this.translate.use(lang);
  }
} 