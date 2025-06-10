import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { TranslateService } from './core/services/translate.service';
import { UserStatusBarComponent } from './core/components/user-status-bar.component';
import { CommonModule } from '@angular/common';
import {
  IonRouterOutlet,
  IonToolbar,
  IonContent,
  IonList,
  IonItem,
  IonIcon,
  IonLabel,
  IonMenuToggle,
  IonButtons,
  IonMenuButton,
  IonTitle,
  IonButton,
  IonApp,
  IonMenu,
  IonHeader
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    IonRouterOutlet,
    IonToolbar,
    IonContent,
    IonList,
    IonItem,
    IonIcon,
    IonLabel,
    IonMenuToggle,
    IonButtons,
    IonMenuButton,
    IonTitle,
    IonButton,
    IonApp,
    IonMenu,
    IonHeader,
    UserStatusBarComponent,
    CommonModule,
    RouterModule
  ]
})
export class AppComponent {
  isLandingPage = false;

  constructor(
    private auth: Auth,
    private translateService: TranslateService
  ) {
    // Initialisation de la langue utilisateur
    const savedLang = localStorage.getItem('lang') as 'fr' | 'en' | null;
    const browserLang = navigator.language.split('-')[0] as 'fr' | 'en';
    const lang = savedLang || browserLang || 'fr';
    this.translateService.use(lang);

    // Vérifier si nous sommes sur la page de tuiles
    const currentPath = window.location.pathname;
    this.isLandingPage = currentPath === '/landing';
  }
} 