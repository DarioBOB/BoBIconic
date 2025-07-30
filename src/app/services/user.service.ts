import { Injectable, inject } from '@angular/core';
import { Auth, User, user } from '@angular/fire/auth';
import { Firestore, doc, docData } from '@angular/fire/firestore';
import { BehaviorSubject, Subscription, switchMap, of } from 'rxjs';
import { map } from 'rxjs/operators';

// Type pour les données utilisateur étendues
interface UserData extends User {
  firstName?: string | { [key: string]: string };
  lastName?: string | { [key: string]: string };
  role?: string;
  [key: string]: any;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private auth = inject(Auth);
  private firestore = inject(Firestore);

  private userSubject = new BehaviorSubject<User | null>(null);
  user$ = this.userSubject.asObservable();

  private roleSubject = new BehaviorSubject<string | null>(null);
  role$ = this.roleSubject.asObservable();

  private userSubscription: Subscription;

  constructor() {
    // Utiliser l'observable user() d'AngularFire qui est déjà dans le contexte d'injection
    this.userSubscription = user(this.auth).pipe(
      switchMap((firebaseUser) => {
        this.userSubject.next(firebaseUser);
        
        if (firebaseUser) {
          // Utiliser docData() qui retourne un observable au lieu de getDoc()
          return docData(doc(this.firestore, `users/${firebaseUser.uid}`));
        } else {
          this.roleSubject.next(null);
          return of(null);
        }
      })
    ).subscribe((userData) => {
      if (userData) {
        this.roleSubject.next(userData['role'] || null);
      }
    });
  }

  // Méthode utilitaire synchrone
  getCurrentUserSync(): User | null {
    return this.userSubject.value;
  }

  // Méthode utilitaire synchrone pour le rôle
  getCurrentRoleSync(): string | null {
    return this.roleSubject.value;
  }

  // Méthode utilitaire pour savoir si l'utilisateur est admin
  isAdminSync(): boolean {
    return this.getCurrentRoleSync() === 'admin';
  }

  // Méthode utilitaire pour savoir si l'utilisateur est demo
  isDemoSync(): boolean {
    return this.getCurrentRoleSync() === 'demo';
  }

  // Observable pour obtenir les données utilisateur complètes
  userData$ = this.user$.pipe(
    switchMap((user) => {
      if (user) {
        return docData(doc(this.firestore, `users/${user.uid}`)).pipe(
          map((userData) => ({ ...user, ...(userData || {}) } as UserData))
        );
      }
      return of(null);
    })
  );
} 