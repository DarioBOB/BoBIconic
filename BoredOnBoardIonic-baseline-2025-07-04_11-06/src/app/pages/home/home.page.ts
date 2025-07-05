import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { SharedModule } from '../../shared/shared.module';
import { TranslateModule } from '@ngx-translate/core';
import { DemoService } from '../../services/demo.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, IonicModule, SharedModule, TranslateModule],
  template: `
    <ion-content class="ion-padding">
      <ion-card>
        <ion-card-header>
          <ion-card-title>{{ 'HOME.WELCOME' | translate }}</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <p>{{ 'HOME.BASELINE' | translate }}</p>
          <ion-button expand="block" (click)="goToLanding()">
            {{ 'HOME.GO_TO_APP' | translate }}
          </ion-button>
          <ion-button expand="block" color="secondary" (click)="loadDemo()" [disabled]="isLoading">
            <ion-spinner *ngIf="isLoading" name="crescent"></ion-spinner>
            <span *ngIf="!isLoading">{{ 'HOME.TEST_APP' | translate }}</span>
          </ion-button>
          <ion-text color="danger" *ngIf="errorMessage">
            <p class="ion-text-center">{{ errorMessage | translate }}</p>
          </ion-text>
        </ion-card-content>
      </ion-card>
    </ion-content>
  `,
  styles: [`
    ion-card {
      max-width: 600px;
      margin: 20px auto;
    }
    ion-card-title {
      font-size: 1.5em;
      font-weight: 600;
      color: var(--ion-color-primary);
    }
  `]
})
export class HomePage implements OnInit {
  errorMessage = '';
  isLoading = false;

  constructor(
    private auth: Auth,
    private router: Router,
    private demoService: DemoService
  ) {}

  ngOnInit() {}

  async logout() {
    try {
      await this.auth.signOut();
      this.router.navigate(['/auth/email']);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }

  goToLanding() {
    this.router.navigate(['/landing-tiles']);
  }

  async loadDemo() {
    this.isLoading = true;
    this.errorMessage = '';
    try {
      const lang = localStorage.getItem('lang') || 'fr';
      const ok = await this.demoService.activateDemo(lang);
      if (ok) {
        localStorage.setItem('demo_mode', 'true');
        window.location.reload();
      } else {
        this.errorMessage = 'AUTH.ERRORS.DEMO_ACTIVATION_FAILED';
      }
    } catch (error: any) {
      this.errorMessage = 'AUTH.ERRORS.DEMO_ACTIVATION_FAILED';
    } finally {
      this.isLoading = false;
    }
  }
} 