export interface BobberProfile {
  id: string;
  displayName: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
  bio?: string;
  
  // Informations de voyage
  travelStyle: 'business' | 'leisure' | 'adventure' | 'family';
  preferredSeats: 'window' | 'aisle' | 'front' | 'back';
  interests: string[];
  
  // Statistiques
  totalFlights: number;
  countriesVisited: number;
  memberSince: Date;
  
  // Badges et récompenses
  badges: Badge[];
  loyaltyPrograms: LoyaltyProgram[];
  
  // Paramètres de confidentialité
  privacyLevel: 'public' | 'friends' | 'private';
  showLocation: boolean;
  showFlightInfo: boolean;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt: Date;
  category: 'travel' | 'social' | 'achievement';
}

export interface LoyaltyProgram {
  program: string;
  number: string;
  status: string;
  expiry?: Date;
}

export interface BobberLocation {
  userId: string;
  currentFlight?: {
    flightNumber: string;
    departure: string;
    arrival: string;
    date: Date;
    seat?: string;
    status: 'boarding' | 'in-flight' | 'landed';
  };
  currentAirport?: {
    code: string;
    name: string;
    city: string;
    country: string;
  };
  lastSeen: Date;
  isOnline: boolean;
}

export interface BobberConnection {
  id: string;
  userId: string;
  connectedUserId: string;
  status: 'pending' | 'accepted' | 'blocked';
  createdAt: Date;
  updatedAt: Date;
}

export interface BobberChat {
  id: string;
  type: 'flight' | 'destination' | 'private';
  participants: string[];
  messages: ChatMessage[];
  metadata: {
    flightNumber?: string;
    destination?: string;
    createdAt: Date;
    lastMessageAt: Date;
  };
}

export interface ChatMessage {
  id: string;
  senderId: string;
  content: string;
  type: 'text' | 'image' | 'location';
  timestamp: Date;
  readBy: string[];
}

export interface BobberMatch {
  userId: string;
  profile: BobberProfile;
  compatibility: number; // 0-100
  commonInterests: string[];
  sharedFlights: number;
  distance?: number; // en km
  matchReason: 'same-flight' | 'same-destination' | 'common-interests' | 'nearby';
} 