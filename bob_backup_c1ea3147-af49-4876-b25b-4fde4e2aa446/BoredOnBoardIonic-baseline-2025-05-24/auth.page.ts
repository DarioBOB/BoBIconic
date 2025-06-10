import { Component } from '@angular/core';
import { AuthService } from './auth.service';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButton } from '@ionic/angular/standalone';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-auth',
  template: `
    <ion-header><ion-toolbar><ion-title>Connexion</ion-title></ion-toolbar></ion-header>
    <ion-content class="ion-padding">
      <ion-button expand="block" fill="outline" routerLink="/auth/email">Connexion / Inscription avec email</ion-button>
    </ion-content>
  `,
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonButton, RouterModule],
})
export class AuthPage {
  constructor(private auth: AuthService) {}
} 