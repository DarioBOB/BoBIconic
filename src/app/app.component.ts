import { Component, OnInit, OnDestroy } from '@angular/core';
import { IonApp, IonRouterOutlet, IonHeader, IonToolbar, IonButtons, IonMenuButton, IonButton, IonIcon, IonTitle, IonContent } from '@ionic/angular/standalone';
import { UserStatusBarComponent } from './components/user-status-bar/user-status-bar.component';
import { Router, NavigationEnd } from '@angular/router';
import { TranslationService } from './services/translation.service';
import { TranslateModule } from '@ngx-translate/core';
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

  constructor(private router: Router, private translationService: TranslationService, private auth: Auth, private userService: UserService) {
    // Initialisation de la langue au démarrage
    const savedLang = localStorage.getItem('lang') as 'fr' | 'en' | null;
    const browserLang = navigator.language.split('-')[0] as 'fr' | 'en';
    const lang = savedLang || browserLang || 'fr';
    this.translationService.setLanguage(lang);
  }

  ngOnInit() {
    this.userSubscription = user(this.auth).subscribe(async (firebaseUser) => {
      this.user = firebaseUser;
      if (firebaseUser) {
        const userData = await this.userService.getCurrentUser();
        this.isAdmin = userData?.role === 'admin';
      } else {
        this.isAdmin = false;
      }
      console.log('[AppComponent] user:', firebaseUser, 'isAdmin:', this.isAdmin);
    });
    // Détecte la page d'auth
    this.routerSubscription = this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.isAuthPage =
          event.urlAfterRedirects.startsWith('/auth/email') ||
          event.urlAfterRedirects.startsWith('/auth/register');
      }
    });
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
}
