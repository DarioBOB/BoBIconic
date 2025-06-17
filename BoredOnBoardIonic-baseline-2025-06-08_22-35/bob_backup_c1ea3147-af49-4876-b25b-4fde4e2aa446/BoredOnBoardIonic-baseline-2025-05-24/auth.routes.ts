import { Routes } from '@angular/router';

export const AUTH_ROUTES: Routes = [
  {
    path: 'email',
    loadComponent: () => import('./email-auth/email-auth.page').then(m => m.EmailAuthPage)
  },
  {
    path: 'register',
    loadComponent: () => import('./register-profile.page').then(m => m.RegisterProfilePage)
  },
  {
    path: 'reset-password-confirmation',
    loadComponent: () => import('./reset-password-confirmation/reset-password-confirmation.page').then(m => m.ResetPasswordConfirmationPage)
  }
]; 