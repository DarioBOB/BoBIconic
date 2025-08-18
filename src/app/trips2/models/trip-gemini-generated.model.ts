// src/app/trips2/models/trip-gemini-generated.model.ts

/**
 * Interface pour représenter un plan individuel au sein d'un voyage.
 * Chaque propriété est clairement définie pour la structure des données.
 */
export interface PlanGenerated {
  id: string; // Identifiant unique du plan
  name: string; // Nom du plan (ex: "Vol vers Paris", "Hôtel à Rome")
  // Ajout de 'car_rental' aux types autorisés
  type: 'flight' | 'hotel' | 'activity' | 'transport' | 'car_rental'; // Type de plan prédéfini
  location: string; // Lieu où se déroule le plan
  timezone: string; // Fuseau horaire du lieu (ex: 'America/New_York', 'Europe/Paris')
  startDate: Date; // Date et heure de début du plan
  endDate: Date; // Date et heure de fin du plan
  status?: 'past' | 'ongoing' | 'upcoming'; // Statut du plan (optionnel)
  details?: {
    flight?: {
      flightNumber: string;
      airline: string;
      aircraft: string;
      departure: {
        airport: string;
        city: string;
        country: string;
        terminal: string;
        gate: string;
        scheduledTime: string;
        actualTime?: string;
        delayMinutes?: number;
        location: { latitude: number; longitude: number };
      };
      arrival: {
        airport: string;
        city: string;
        country: string;
        terminal: string;
        gate: string;
        scheduledTime: string;
        actualTime?: string;
        delayMinutes?: number;
        location: { latitude: number; longitude: number };
      };
      distance: { kilometers: number; miles: number };
      duration: { scheduledMinutes: number; actualMinutes?: number };
      status: string;
      baggageClaim?: string;
    };
    hotel?: {
      name: string;
      address: string;
      phone: string;
      email: string;
      website: string;
      stars: number;
      roomType: string;
      roomNumber: string;
      checkIn: string;
      checkOut: string;
      amenities: string[];
      price: { amount: number; currency: string; perNight?: boolean };
      coordinates: { latitude: number; longitude: number };
    };
    activity?: {
      type: string;
      company?: string;
      guide?: string;
      phone?: string;
      meetingPoint?: string;
      duration: { hours: number };
      price: { amount: number; currency: string };
      includes?: string[];
      itinerary?: string[];
      services?: string[];
      coordinates: { latitude: number; longitude: number };
    };
    transport?: {
      type: string;
      company: string;
      vehicle: string;
      driver: string;
      phone: string;
      pickupLocation: string;
      dropoffLocation: string;
      distance: { kilometers: number; miles: number };
      duration: { minutes: number };
      price: { amount: number; currency: string };
      includes: string[];
    };
    car_rental?: {
      company: string;
      location: string;
      vehicle: string;
      licensePlate: string;
      pickupTime: string;
      returnTime: string;
      price: { amount: number; currency: string; perDay?: boolean };
      includes: string[];
      coordinates: { latitude: number; longitude: number };
    };
  };
}

/**
 * Interface pour représenter un voyage complet.
 * Inclut les informations générales du voyage et une liste de plans.
 */
export interface TripGenerated {
  id: string; // Identifiant unique du voyage
  name: string; // Nom du voyage
  description: string; // Courte description du voyage
  image: string; // URL d'une image représentative du voyage (placeholder)
  startDate: Date; // Date et heure de début calculée du voyage (min des plans)
  endDate: Date; // Date et heure de fin calculée du voyage (max des plans)
  status: 'past' | 'ongoing' | 'upcoming'; // Statut du voyage (passé, en cours, à venir)
  plans: PlanGenerated[]; // Liste des plans associés à ce voyage
  showDetails?: boolean; // Propriété pour afficher/masquer les détails du voyage
}
