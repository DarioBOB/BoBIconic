import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { IonApp, IonRouterOutlet, IonHeader, IonToolbar, IonButtons, IonMenuButton, IonButton, IonIcon, IonTitle, IonContent } from '@ionic/angular/standalone';
import { UserStatusBarComponent } from './components/user-status-bar/user-status-bar.component';
import { Router, NavigationEnd } from '@angular/router';
import { TranslationService } from './services/translation.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Auth, User, user } from '@angular/fire/auth';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { SideMenuComponent } from './components/side-menu/side-menu.component';
import { UserService } from './services/user.service';

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
    UserStatusBarComponent,
    TranslateModule,
    CommonModule,
    SideMenuComponent
  ],
})
export class AppComponent implements OnInit, OnDestroy {
  user: User | null = null;
  isAuthPage = false;
  isAdmin = false;
  private userSubscription: Subscription | null = null;
  private routerSubscription: Subscription | null = null;
  currentDateTime = new Date();
  currentLang = 'fr-FR';

  constructor(private router: Router, private translationService: TranslationService, public userService: UserService, private translate: TranslateService) {
    this.currentLang = this.getCurrentLang();
    // Initialisation de la langue au démarrage
    const savedLang = localStorage.getItem('lang') as 'fr' | 'en' | null;
    const browserLang = navigator.language.split('-')[0] as 'fr' | 'en';
    const lang = savedLang || browserLang || 'fr';
    this.translationService.setLanguage(lang);
  }

  ngOnInit() {
    // S'abonner à l'observable user$ du service
    this.userSubscription = this.userService.user$.subscribe(user => {
      this.user = user;
    });
    this.routerSubscription = this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.isAuthPage =
          event.urlAfterRedirects.startsWith('/auth/email') ||
          event.urlAfterRedirects.startsWith('/auth/register');
      }
    });
    setInterval(() => this.currentDateTime = new Date(), 1000);
  }

  get isAdminUser(): boolean {
    return this.userService.isAdminSync();
  }

  ngOnDestroy() {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  goHome() {
    this.router.navigate(['/landing-tiles']);
  }

  getCurrentLang(): string {
    // Essaie de récupérer la langue de l'utilisateur, sinon 'fr-FR' par défaut
    return this.translate.currentLang || this.translate.getDefaultLang() || 'fr-FR';
  }
}
