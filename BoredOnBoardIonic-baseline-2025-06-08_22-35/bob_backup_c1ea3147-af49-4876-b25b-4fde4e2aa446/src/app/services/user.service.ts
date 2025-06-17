import { Injectable } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';

@Injectable({ providedIn: 'root' })
export class UserService {
  constructor(
    private auth: Auth,
    private firestore: Firestore
  ) {}

  async getCurrentUser(): Promise<any | null> {
    const user = this.auth.currentUser;
    if (!user) return null;
    const userDoc = await getDoc(doc(this.firestore, `users/${user.uid}`));
    return { ...user, ...(userDoc.data() || {}) };
  }
} 