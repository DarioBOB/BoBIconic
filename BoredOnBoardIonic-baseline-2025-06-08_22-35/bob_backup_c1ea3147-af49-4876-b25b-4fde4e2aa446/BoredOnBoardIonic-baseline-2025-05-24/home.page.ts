import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterModule, Router } from '@angular/router';
import { Auth, onAuthStateChanged, signOut } from '@angular/fire/auth';
import { TripService, Trip } from '../core/services/trip.service';
import { LanguageService } from '../core/services/language.service';
import { TranslatePipe } from '../core/pipes/translate.pipe';
import { HttpClientModule } from '@angular/common/http';
import { DemoService } from '../core/services/demo.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, RouterModule, TranslatePipe, HttpClientModule]
})
export class HomePage implements OnInit {
  isLoggedIn = false;
  trips: { upcoming: Trip[], ongoing: Trip[], past: Trip[] } = {
    upcoming: [],
    ongoing: [],
    past: []
  };
  currentLang = 'fr';

  constructor(
    private auth: Auth,
    private tripService: TripService,
    public languageService: LanguageService,
    private router: Router,
    private demoService: DemoService
  ) {
    this.languageService.currentLang$.subscribe(lang => {
      this.currentLang = lang;
    });
  }

  ngOnInit() {
    // Forcer la langue depuis le localStorage ou défaut
    const storedLang = localStorage.getItem('preferredLanguage') as 'fr' | 'en';
    this.languageService.setLanguage(storedLang || 'fr');
    onAuthStateChanged(this.auth, async (user) => {
      this.isLoggedIn = !!user;
      if (this.isLoggedIn) {
        this.router.navigate(['/landing']);
      }
    });
  }

  async loadTrips() {
    if (this.isLoggedIn) {
      this.trips = await this.tripService.getTrips();
    }
  }

  isLangActive(lang: string): boolean {
    return this.currentLang === lang;
  }

  async loadDemo() {
    try {
      const success = await this.demoService.activateDemo(this.currentLang as 'fr' | 'en');
      if (success) {
        this.router.navigate(['/landing']);
      } else {
        console.error('Failed to activate demo mode');
      }
    } catch (error) {
      console.error('Error activating demo mode:', error);
    }
  }

  async logout() {
    await signOut(this.auth);
    this.router.navigate(['/auth/email']);
  }
}
