import { Injectable } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { Auth, user } from '@angular/fire/auth';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { firstValueFrom } from 'rxjs';

export const adminOnlyGuard: CanActivateFn = async (route, state) => {
  const auth = inject(Auth);
  const firestore = inject(Firestore);
  const router = inject(Router);
  const currentUser = await firstValueFrom(user(auth));
  if (!currentUser) {
    router.navigate(['/auth']);
    return false;
  }
  const userDocRef = doc(firestore, `users/${currentUser.uid}`);
  const userSnap = await getDoc(userDocRef);
  const userData = userSnap.data();
  if (userData && userData['role'] === 'admin') {
    return true;
  }
  router.navigate(['/auth']);
  return false;
}; 