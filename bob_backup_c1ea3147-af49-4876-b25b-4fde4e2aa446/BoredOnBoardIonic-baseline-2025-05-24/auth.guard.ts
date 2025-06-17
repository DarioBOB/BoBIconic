import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Auth, onAuthStateChanged } from '@angular/fire/auth';
import { map, take } from 'rxjs/operators';
import { from } from 'rxjs';

export const authGuard = () => {
  const auth = inject(Auth);
  const router = inject(Router);

  return from(new Promise<boolean>((resolve) => {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        resolve(true);
      } else {
        router.navigate(['/auth/email']);
        resolve(false);
      }
    });
  }));
}; 