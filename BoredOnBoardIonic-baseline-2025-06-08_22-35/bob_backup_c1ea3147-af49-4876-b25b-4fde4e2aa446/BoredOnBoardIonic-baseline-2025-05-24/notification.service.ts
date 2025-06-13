import { Injectable } from '@angular/core';
import { Firestore, collection, query, where, getDocs } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  constructor(
    private firestore: Firestore,
    private auth: Auth
  ) {}

  async getNotifications(): Promise<any[]> {
    const user = this.auth.currentUser;
    if (!user) return [];
    const notificationsRef = collection(this.firestore, 'notifications');
    const q = query(notificationsRef, where('userId', '==', user.uid));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }
} 