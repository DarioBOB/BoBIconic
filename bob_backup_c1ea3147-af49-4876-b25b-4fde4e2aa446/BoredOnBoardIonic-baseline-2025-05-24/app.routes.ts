import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'landing',
    pathMatch: 'full'
  },
  {
    path: 'landing',
    loadComponent: () => import('./landing/landing-tiles.page').then(m => m.LandingTilesPage),
    canActivate: [authGuard]
  },
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth.routes').then(m => m.AUTH_ROUTES)
  },
  {
    path: 'trips',
    loadComponent: () => import('./pages/trips/trips.page').then(m => m.TripsPage),
    canActivate: [authGuard]
  },
  {
    path: 'window',
    loadComponent: () => import('./pages/window/window.page').then(m => m.WindowPage),
    canActivate: [authGuard]
  },
  {
    path: 'chat',
    loadComponent: () => import('./pages/chat/chat.page').then(m => m.ChatPage),
    canActivate: [authGuard]
  },
  {
    path: 'bobbers',
    loadComponent: () => import('./pages/bobbers/bobbers.page').then(m => m.BobbersPage),
    canActivate: [authGuard]
  },
  {
    path: 'games',
    loadComponent: () => import('./pages/games/games.page').then(m => m.GamesPage),
    canActivate: [authGuard]
  },
  {
    path: 'notifications',
    loadComponent: () => import('./pages/notifications/notifications.page').then(m => m.NotificationsPage),
    canActivate: [authGuard]
  },
  {
    path: 'documents',
    loadComponent: () => import('./pages/documents/documents.page').then(m => m.DocumentsPage),
    canActivate: [authGuard]
  },
  {
    path: 'support',
    loadComponent: () => import('./pages/support/support.page').then(m => m.SupportPage),
    canActivate: [authGuard]
  },
  {
    path: 'preferences',
    loadComponent: () => import('./pages/preferences/preferences.page').then(m => m.PreferencesPage),
    canActivate: [authGuard]
  },
  {
    path: 'profile',
    loadComponent: () => import('./pages/profile/profile.page').then(m => m.ProfilePage),
    canActivate: [authGuard]
  },
  {
    path: 'email-parser',
    loadComponent: () => import('./pages/email-parser/email-parser.page').then(m => m.EmailParserPage),
    canActivate: [authGuard]
  },
  {
    path: 'admin',
    loadComponent: () => import('./pages/admin/admin.page').then(m => m.AdminPage),
    canActivate: [authGuard]
  },
  {
    path: 'serpentin-timeline',
    loadComponent: () => import('./pages/serpentin-timeline/serpentin-timeline.page').then(m => m.SerpentinTimelinePage)
  }
];
