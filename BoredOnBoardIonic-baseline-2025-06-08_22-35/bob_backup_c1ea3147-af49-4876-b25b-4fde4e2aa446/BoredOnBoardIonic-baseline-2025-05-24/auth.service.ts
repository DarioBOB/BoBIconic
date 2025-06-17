import { Injectable, inject } from '@angular/core';
import { Auth, signInWithEmailAndPassword, signOut, User, onAuthStateChanged, GoogleAuthProvider, FacebookAuthProvider, signInWithPopup, UserCredential } from '@angular/fire/auth';
import { Firestore, doc, setDoc, getDoc } from '@angular/fire/firestore';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth = inject(Auth);
  private firestore = inject(Firestore);
  private userSubject = new BehaviorSubject<User | null>(null);
  user$ = this.userSubject.asObservable();

  constructor() {
    onAuthStateChanged(this.auth, (user) => {
      this.userSubject.next(user);
      if (user) this.ensureUserProfile(user);
    });
  }

  async loginWithEmail(email: string, password: string): Promise<UserCredential> {
    return signInWithEmailAndPassword(this.auth, email, password);
  }

  async loginWithGoogle(): Promise<UserCredential> {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(this.auth, provider);
  }

  async loginWithFacebook(): Promise<UserCredential> {
    const provider = new FacebookAuthProvider();
    return signInWithPopup(this.auth, provider);
  }

  async logout() {
    await signOut(this.auth);
  }

  private async ensureUserProfile(user: User) {
    const userRef = doc(this.firestore, `users/${user.uid}`);
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoUrl: user.photoURL,
        provider: user.providerId,
        createdAt: new Date(),
        lastLogin: new Date()
      });
    } else {
      await setDoc(userRef, { lastLogin: new Date() }, { merge: true });
    }
  }

  get currentUser() {
    return this.auth.currentUser;
  }
} 