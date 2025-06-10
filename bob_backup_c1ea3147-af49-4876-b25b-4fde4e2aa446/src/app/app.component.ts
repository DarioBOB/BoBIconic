import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet, IonHeader, IonToolbar, IonButtons, IonMenuButton, IonButton, IonIcon, IonTitle, IonContent, IonMenu, IonList, IonMenuToggle, IonItem, IonLabel } from '@ionic/angular/standalone';
import { UserStatusBarComponent } from './components/user-status-bar/user-status-bar.component';
import { Router } from '@angular/router';
import { TranslationService } from './services/translation.service';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: 'app.component.html',
  imports: [
    IonApp,
    IonRouterOutlet,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonMenuButton,
    IonButton,
    IonIcon,
    IonTitle,
    IonContent,
    IonMenu,
    IonList,
    IonMenuToggle,
    IonItem,
    IonLabel,
    UserStatusBarComponent,
    TranslateModule
  ],
})
export class AppComponent {
  constructor(private router: Router, private translationService: TranslationService) {
    // Initialisation de la langue au démarrage
    const savedLang = localStorage.getItem('lang') as 'fr' | 'en' | null;
    const browserLang = navigator.language.split('-')[0] as 'fr' | 'en';
    const lang = savedLang || browserLang || 'fr';
    this.translationService.setLanguage(lang);
  }

  goHome() {
    this.router.navigate(['/landing-tiles']);
  }
}
