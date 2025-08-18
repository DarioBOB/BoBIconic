import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { Auth, user } from '@angular/fire/auth';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { firstValueFrom } from 'rxjs';

export const AuthGuard: CanActivateFn = async (route, state) => {
  const auth = inject(Auth);
  const router = inject(Router);
  const firestore = inject(Firestore);

  const currentUser = await firstValueFrom(user(auth));
  if (!currentUser) {
    router.navigate(['/auth/email']);
    return false;
  }

  // Vérifier les rôles si spécifiés dans la route
  const requiredRoles = route.data['roles'] as string[] | undefined;
  if (requiredRoles) {
    const userRef = doc(firestore, `users/${currentUser.uid}`);
    const userDoc = await getDoc(userRef);
    const userData = userDoc.data();
    const userRole = userData?.['role'];

    if (!userRole || !requiredRoles.includes(userRole)) {
      router.navigate(['/landing-tiles']);
      return false;
    }
  }

  return true;
}; 