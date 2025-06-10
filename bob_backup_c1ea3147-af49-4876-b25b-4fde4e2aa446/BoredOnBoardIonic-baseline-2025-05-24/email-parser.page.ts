import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { TranslatePipe } from '../../core/pipes/translate.pipe';
import { EmailParserService } from '../../core/services/email-parser.service';

@Component({
  selector: 'app-email-parser',
  standalone: true,
  template: `
    <ion-content class="ion-padding">
      <ion-card>
        <ion-card-header>
          <ion-card-title>{{ 'EMAIL.PARSER.TITLE' | translate }}</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <div *ngIf="loading" class="loading-spinner">
            <ion-spinner name="crescent"></ion-spinner>
            <p>{{ 'EMAIL.PARSER.LOADING' | translate }}</p>
          </div>

          <div *ngIf="error" class="error-message">
            <ion-icon name="alert-circle" color="danger"></ion-icon>
            <p>{{ error }}</p>
          </div>

          <div *ngIf="success" class="success-message">
            <ion-icon name="checkmark-circle" color="success"></ion-icon>
            <p>{{ 'EMAIL.PARSER.SUCCESS' | translate }}</p>
          </div>

          <ion-button 
            expand="block" 
            (click)="parseEmails()"
            [disabled]="loading">
            {{ 'EMAIL.PARSER.PARSE_BUTTON' | translate }}
          </ion-button>
        </ion-card-content>
      </ion-card>
    </ion-content>
  `,
  styles: [`
    .loading-spinner {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .error-message, .success-message {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px;
      margin: 10px 0;
      border-radius: 4px;
    }
    .error-message {
      background-color: var(--ion-color-danger-tint);
      color: var(--ion-color-danger);
    }
    .success-message {
      background-color: var(--ion-color-success-tint);
      color: var(--ion-color-success);
    }
  `],
  imports: [CommonModule, IonicModule, TranslatePipe]
})
export class EmailParserPage {
  loading = false;
  error: string | null = null;
  success = false;

  constructor(private emailParserService: EmailParserService) {}

  async parseEmails() {
    this.loading = true;
    this.error = null;
    this.success = false;

    try {
      await this.emailParserService.parseUnreadEmails();
      this.success = true;
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'Une erreur est survenue';
    } finally {
      this.loading = false;
    }
  }

  toggleMenu() {
    const menu = document.querySelector('ion-menu');
    menu?.toggle();
  }
} 