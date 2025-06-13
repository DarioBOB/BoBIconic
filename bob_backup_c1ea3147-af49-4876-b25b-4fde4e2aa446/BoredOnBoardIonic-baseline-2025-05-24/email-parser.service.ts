import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface EmailConfig {
  host: string;
  user: string;
  password: string;
  port: number;
}

interface TripSegment {
  flight_number: string;
  departure_airport: string;
  arrival_airport: string;
  departure_date: Date;
  arrival_date: Date;
  airline: string;
  booking_ref?: string;
}

interface ParsedTrip {
  air_segments: TripSegment[];
  booking_ref: string;
  source: string;
  parsed_at: Date;
  user_id: string;
}

@Injectable({
  providedIn: 'root'
})
export class EmailParserService {
  private readonly EMAIL_CONFIG: EmailConfig = {
    host: 'imap.zoho.com',
    user: 'bobplans@sunshine-adventures.net',
    password: environment.zohoPassword, // À stocker dans les variables d'environnement
    port: 993
  };

  constructor(
    private firestore: Firestore,
    private auth: Auth,
    private http: HttpClient
  ) {}

  async parseUnreadEmails(): Promise<void> {
    try {
      // 1. Connexion à l'API de parsing (backend sécurisé)
      const response = await this.http.post<{success: boolean, trips: ParsedTrip[]}>(
        `${environment.apiUrl}/parse-emails`,
        { config: this.EMAIL_CONFIG }
      ).toPromise();

      if (response?.success && response.trips.length > 0) {
        // 2. Stockage dans Firestore
        const userId = this.auth.currentUser?.uid;
        if (!userId) throw new Error('User not authenticated');

        for (const trip of response.trips) {
          await addDoc(collection(this.firestore, 'trips'), {
            ...trip,
            user_id: userId,
            parsed_at: new Date()
          });
        }
      }
    } catch (error) {
      console.error('Error parsing emails:', error);
      throw error;
    }
  }

  // Méthode pour parser un email spécifique (utile pour les tests)
  async parseSpecificEmail(emailId: string): Promise<void> {
    try {
      const response = await this.http.post<{success: boolean, trip: ParsedTrip}>(
        `${environment.apiUrl}/parse-email`,
        { 
          config: this.EMAIL_CONFIG,
          emailId 
        }
      ).toPromise();

      if (response?.success && response.trip) {
        const userId = this.auth.currentUser?.uid;
        if (!userId) throw new Error('User not authenticated');

        await addDoc(collection(this.firestore, 'trips'), {
          ...response.trip,
          user_id: userId,
          parsed_at: new Date()
        });
      }
    } catch (error) {
      console.error('Error parsing specific email:', error);
      throw error;
    }
  }
} 