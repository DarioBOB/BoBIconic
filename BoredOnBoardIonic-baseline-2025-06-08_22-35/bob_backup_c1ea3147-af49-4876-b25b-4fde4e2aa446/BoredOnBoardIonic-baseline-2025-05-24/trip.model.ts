export interface Location {
  city: string;
  country: string;
  airport_code: string;
  terminal?: string;
  gate?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface FlightSegment {
  flight_number: string;
  airline: {
    name: string;
    code: string;
    logo_url?: string;
  };
  aircraft: {
    type: string;
    registration?: string;
    manufacturer?: string;
    model?: string;
  };
  departure: {
    location: Location;
    scheduled_time: Date;
    actual_time?: Date;
    status?: 'ON_TIME' | 'DELAYED' | 'CANCELLED' | 'DIVERTED';
    delay_minutes?: number;
  };
  arrival: {
    location: Location;
    scheduled_time: Date;
    actual_time?: Date;
    status?: 'ON_TIME' | 'DELAYED' | 'CANCELLED' | 'DIVERTED';
    delay_minutes?: number;
  };
  duration: {
    scheduled_minutes: number;
    actual_minutes?: number;
  };
  distance: {
    kilometers: number;
    miles: number;
  };
  booking_class?: string;
  seat?: {
    number: string;
    type?: 'WINDOW' | 'AISLE' | 'MIDDLE';
    row: number;
    letter: string;
  };
  meal?: string;
  baggage_allowance?: {
    carry_on: number;
    checked: number;
  };
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
}

export interface HotelStay {
  name: string;
  chain?: string;
  location: Location;
  check_in: {
    scheduled_time: Date;
    actual_time?: Date;
  };
  check_out: {
    scheduled_time: Date;
    actual_time?: Date;
  };
  room: {
    type: string;
    number?: string;
    floor?: number;
    view?: string;
  };
  amenities?: string[];
  booking_reference?: string;
  confirmation_number?: string;
  status: 'CONFIRMED' | 'CHECKED_IN' | 'CHECKED_OUT' | 'CANCELLED';
}

export interface CarRental {
  company: {
    name: string;
    code: string;
  };
  location: Location;
  vehicle: {
    type: string;
    make: string;
    model: string;
    year?: number;
    license_plate?: string;
  };
  pickup: {
    scheduled_time: Date;
    actual_time?: Date;
  };
  dropoff: {
    scheduled_time: Date;
    actual_time?: Date;
  };
  booking_reference?: string;
  confirmation_number?: string;
  status: 'CONFIRMED' | 'PICKED_UP' | 'RETURNED' | 'CANCELLED';
}

export interface Trip {
  id?: string;
  user_id: string;
  title: string;
  description?: string;
  type: 'BUSINESS' | 'LEISURE' | 'MIXED';
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  dates: {
    start: Date;
    end: Date;
  };
  segments: {
    flights: FlightSegment[];
    hotels: HotelStay[];
    car_rentals: CarRental[];
  };
  booking: {
    references: string[];
    confirmation_numbers: string[];
    total_cost?: {
      amount: number;
      currency: string;
    };
    payment_status?: 'PENDING' | 'PAID' | 'REFUNDED' | 'PARTIALLY_REFUNDED';
  };
  documents: {
    type: 'BOARDING_PASS' | 'HOTEL_CONFIRMATION' | 'CAR_RENTAL_CONFIRMATION' | 'OTHER';
    url: string;
    name: string;
    added_at: Date;
  }[];
  notes?: string;
  tags?: string[];
  created_at: Date;
  updated_at: Date;
  source: {
    type: 'EMAIL' | 'MANUAL' | 'API';
    provider?: string;
    reference?: string;
  };
  metadata: {
    weather?: {
      temperature: number;
      conditions: string;
      forecast_url?: string;
    };
    timezone?: string;
    currency?: string;
    language?: string;
    emergency_contacts?: {
      name: string;
      phone: string;
      relationship: string;
    }[];
  };
} 