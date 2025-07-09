import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { Auth, user } from '@angular/fire/auth';

export const RedirectIfAuthenticatedGuard: CanActivateFn = async () => {
  const auth = inject(Auth);
  const router = inject(Router);

  return new Promise<boolean>((resolve) => {
    user(auth).subscribe((user) => {
      if (user) {
        router.navigate(['/landing-tiles']);
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
}; 