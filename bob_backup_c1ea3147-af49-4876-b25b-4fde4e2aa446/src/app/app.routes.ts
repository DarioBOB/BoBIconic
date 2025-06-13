import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { RedirectIfAuthenticatedGuard } from './guards/redirect-if-authenticated.guard';
import { adminOnlyGuard } from './guards/admin-only.guard';
import { WindowMapTestComponent } from './pages/window-map-test.component';

export const routes: Routes = [
  {
    path: 'auth/email',
    loadComponent: () => import('./pages/email-auth/email-auth.page').then((m) => m.EmailAuthPage),
    canActivate: [RedirectIfAuthenticatedGuard]
  },
  {
    path: 'auth/register',
    loadComponent: () => import('./pages/register/register.page').then((m) => m.RegisterPage),
    canActivate: [RedirectIfAuthenticatedGuard]
  },
  {
    path: 'admin',
    loadComponent: () => import('./pages/admin/admin.page').then((m) => m.AdminPage),
    canActivate: [adminOnlyGuard]
  },
  {
    path: 'landing-tiles',
    loadComponent: () => import('./pages/landing-tiles/landing-tiles.page').then((m) => m.LandingTilesPage),
    canActivate: [AuthGuard]
  },
  {
    path: 'home',
    loadComponent: () => import('./pages/home/home.page').then((m) => m.HomePage),
    canActivate: [AuthGuard]
  },
  {
    path: 'profile',
    loadComponent: () => import('./pages/profile.page').then((m) => m.ProfilePage),
    canActivate: [AuthGuard]
  },
  {
    path: 'trips',
    loadComponent: () => import('./pages/trips.page').then((m) => m.TripsPage),
    canActivate: [AuthGuard]
  },
  {
    path: 'window',
    loadComponent: () => import('./pages/window.page').then((m) => m.WindowPage),
    canActivate: [AuthGuard]
  },
  {
    path: 'test-map',
    component: WindowMapTestComponent
  },
  {
    path: '',
    redirectTo: 'auth/email',
    pathMatch: 'full',
  },
];
