import { Routes } from '@angular/router';
import { FlightSearchComponent } from './pages/flight-search/flight-search.component';
import { FlightTestPage } from './pages/flight-test/flight-test.page';
import { adminOnlyGuard } from './guards/admin-only.guard';
import { AuthGuard } from './guards/auth.guard';
import { RedirectIfAuthenticatedGuard } from './guards/redirect-if-authenticated.guard';

export const routes: Routes = [
  { 
    path: '', 
    redirectTo: '/auth/email', 
    pathMatch: 'full' 
  },
  { 
    path: 'auth/email', 
    loadComponent: () => import('./pages/email-auth/email-auth.page').then(m => m.EmailAuthPage),
    canActivate: [RedirectIfAuthenticatedGuard]
  },
  { 
    path: 'landing-tiles', 
    loadComponent: () => import('./pages/landing-tiles/landing-tiles.page').then(m => m.LandingTilesPage),
    canActivate: [AuthGuard]
  },
  { 
    path: 'window', 
    loadComponent: () => import('./pages/through-my-window/window.page').then(m => m.WindowPage),
    canActivate: [AuthGuard]
  },
  { 
    path: 'home', 
    loadComponent: () => import('./pages/home/home.page').then(m => m.HomePage),
    canActivate: [AuthGuard]
  },
  { 
    path: 'trips', 
    loadComponent: () => import('./pages/trips.page').then(m => m.TripsPage),
    canActivate: [AuthGuard]
  },
  { 
    path: 'chat', 
    loadComponent: () => import('./pages/chat.page').then(m => m.ChatPage),
    canActivate: [AuthGuard]
  },
  { 
    path: 'bobbers', 
    loadComponent: () => import('./pages/bobbers.page').then(m => m.BobbersPage),
    canActivate: [AuthGuard]
  },
  { 
    path: 'games', 
    loadComponent: () => import('./pages/games.page').then(m => m.GamesPage),
    canActivate: [AuthGuard]
  },
  { 
    path: 'notifications', 
    loadComponent: () => import('./pages/notifications.page').then(m => m.NotificationsPage),
    canActivate: [AuthGuard]
  },
  { 
    path: 'documents', 
    loadComponent: () => import('./pages/documents.page').then(m => m.DocumentsPage),
    canActivate: [AuthGuard]
  },
  { 
    path: 'support', 
    loadComponent: () => import('./pages/support.page').then(m => m.SupportPage),
    canActivate: [AuthGuard]
  },
  { 
    path: 'preferences', 
    loadComponent: () => import('./pages/preferences.page').then(m => m.PreferencesPage),
    canActivate: [AuthGuard]
  },
  { 
    path: 'search', 
    component: FlightSearchComponent,
    canActivate: [AuthGuard]
  },
  { 
    path: 'flight-test', 
    component: FlightTestPage,
    canActivate: [AuthGuard]
  },
  { 
    path: 'profile', 
    loadComponent: () => import('./pages/profile.page').then(m => m.ProfilePage),
    canActivate: [AuthGuard]
  },
  { 
    path: 'admin', 
    loadComponent: () => import('./pages/admin/admin.page').then(m => m.AdminPage), 
    canActivate: [adminOnlyGuard] 
  },
  { 
    path: 'admin/logs', 
    loadComponent: () => import('./pages/admin/logs.page').then(m => m.LogsPage), 
    canActivate: [adminOnlyGuard] 
  },
];
