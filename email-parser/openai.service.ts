import OpenAI from 'openai';
import { EmailData } from './imap.service.js';

export interface ParsedBooking {
  booking_type: 'flight' | 'hotel' | 'car_rental' | 'activity' | 'restaurant' | 'other';
  provider: string;
  reference_number?: string;
  location?: string;
  checkin_date?: string;
  checkout_date?: string;
  departure_date?: string;
  arrival_date?: string;
  name?: string;
  price?: number;
  currency?: string;
  address?: string;
  contact_info?: {
    phone?: string;
    email?: string;
  };
  flight_details?: {
    flight_number?: string;
    departure_airport?: string;
    arrival_airport?: string;
    departure_time?: string;
    arrival_time?: string;
  };
  hotel_details?: {
    room_type?: string;
    guests?: number;
    amenities?: string[];
  };
  car_details?: {
    car_type?: string;
    pickup_location?: string;
    dropoff_location?: string;
    pickup_time?: string;
    dropoff_time?: string;
  };
  activity_details?: {
    activity_type?: string;
    duration?: string;
    participants?: number;
  };
  tags?: string[];
  confidence: number;
  raw_email_id: string;
  parsed_at: string;
}

export class OpenAIService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  public async parseEmail(email: EmailData): Promise<ParsedBooking | null> {
    try {
      const prompt = this.buildPrompt(email);
      
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `Tu es un expert en extraction de données de réservation de voyage. 
            Analyse l'email fourni et extrait toutes les informations pertinentes de réservation.
            Retourne UNIQUEMENT un objet JSON valide, sans texte supplémentaire.
            
            Types de réservation supportés:
            - flight: vols (EasyJet, Air France, etc.)
            - hotel: hôtels (Booking.com, Hotels.com, etc.)
            - car_rental: location de voiture (RentalCar, Europcar, etc.)
            - activity: activités/visites (GetYourGuide, Viator, etc.)
            - restaurant: restaurants
            - other: autres types
            
            Structure JSON attendue:
            {
              "booking_type": "hotel|flight|car_rental|activity|restaurant|other",
              "provider": "nom du fournisseur",
              "reference_number": "numéro de référence",
              "location": "ville/pays",
              "checkin_date": "YYYY-MM-DD",
              "checkout_date": "YYYY-MM-DD",
              "departure_date": "YYYY-MM-DD",
              "arrival_date": "YYYY-MM-DD",
              "name": "nom de l'hôtel/compagnie",
              "price": 123.45,
              "currency": "EUR|USD|GBP",
              "address": "adresse complète",
              "contact_info": {
                "phone": "numéro de téléphone",
                "email": "email"
              },
              "flight_details": {
                "flight_number": "numéro de vol",
                "departure_airport": "code aéroport départ",
                "arrival_airport": "code aéroport arrivée",
                "departure_time": "HH:MM",
                "arrival_time": "HH:MM"
              },
              "hotel_details": {
                "room_type": "type de chambre",
                "guests": 2,
                "amenities": ["wifi", "parking"]
              },
              "car_details": {
                "car_type": "type de voiture",
                "pickup_location": "lieu de retrait",
                "dropoff_location": "lieu de retour",
                "pickup_time": "HH:MM",
                "dropoff_time": "HH:MM"
              },
              "activity_details": {
                "activity_type": "type d'activité",
                "duration": "durée",
                "participants": 2
              },
              "tags": ["tag1", "tag2"],
              "confidence": 0.95,
              "raw_email_id": "id_email",
              "parsed_at": "2024-01-01T12:00:00Z"
            }`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 2000
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from OpenAI');
      }

      // Nettoyer la réponse pour extraire le JSON
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsedData = JSON.parse(jsonMatch[0]);
      
      // Ajouter les métadonnées
      parsedData.raw_email_id = email.id;
      parsedData.parsed_at = new Date().toISOString();

      return parsedData as ParsedBooking;

    } catch (error) {
      console.error('Error parsing email with OpenAI:', error);
      return null;
    }
  }

  private buildPrompt(email: EmailData): string {
    return `Extrait les données de réservation de cet email de voyage:

Sujet: ${email.subject}
De: ${email.from}
Date: ${email.date.toISOString()}

Contenu texte:
${email.text}

Contenu HTML (si disponible):
${email.html}

Extrait toutes les informations de réservation et retourne un JSON structuré.`;
  }

  public async parseMultipleEmails(emails: EmailData[]): Promise<ParsedBooking[]> {
    const results: ParsedBooking[] = [];
    
    for (const email of emails) {
      try {
        const parsed = await this.parseEmail(email);
        if (parsed) {
          results.push(parsed);
        }
      } catch (error) {
        console.error(`Error parsing email ${email.id}:`, error);
      }
    }
    
    return results;
  }
} 