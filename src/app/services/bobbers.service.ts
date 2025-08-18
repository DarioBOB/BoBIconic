import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, timer } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { 
  BobberProfile, 
  BobberLocation, 
  BobberConnection, 
  BobberChat, 
  ChatMessage, 
  BobberMatch,
  Badge 
} from '../models/bobber.interface';

@Injectable({
  providedIn: 'root'
})
export class BobbersService {
  private demoProfiles: BobberProfile[] = [];
  private demoLocations: BobberLocation[] = [];
  private demoConnections: BobberConnection[] = [];
  private demoChats: BobberChat[] = [];

  // Observables pour la réactivité
  private profilesSubject = new BehaviorSubject<BobberProfile[]>([]);
  private locationsSubject = new BehaviorSubject<BobberLocation[]>([]);
  private connectionsSubject = new BehaviorSubject<BobberConnection[]>([]);
  private chatsSubject = new BehaviorSubject<BobberChat[]>([]);

  constructor() {
    this.initializeDemoData();
    this.startLocationUpdates();
  }

  // Getters pour les observables
  get profiles$(): Observable<BobberProfile[]> {
    return this.profilesSubject.asObservable();
  }

  get locations$(): Observable<BobberLocation[]> {
    return this.locationsSubject.asObservable();
  }

  get connections$(): Observable<BobberConnection[]> {
    return this.connectionsSubject.asObservable();
  }

  get chats$(): Observable<BobberChat[]> {
    return this.chatsSubject.asObservable();
  }

  private initializeDemoData() {
    // Créer des profils de démo
    this.demoProfiles = this.createDemoProfiles();
    this.demoLocations = this.createDemoLocations();
    this.demoConnections = this.createDemoConnections();
    this.demoChats = this.createDemoChats();

    // Publier les données initiales
    this.profilesSubject.next(this.demoProfiles);
    this.locationsSubject.next(this.demoLocations);
    this.connectionsSubject.next(this.demoConnections);
    this.chatsSubject.next(this.demoChats);
  }

  private createDemoProfiles(): BobberProfile[] {
    const interests = [
      'photography', 'food', 'culture', 'nature', 'sports', 
      'music', 'art', 'technology', 'business', 'adventure'
    ];

    const travelStyles: Array<'business' | 'leisure' | 'adventure' | 'family'> = [
      'business', 'leisure', 'adventure', 'family'
    ];

    const seatPreferences: Array<'window' | 'aisle' | 'front' | 'back'> = [
      'window', 'aisle', 'front', 'back'
    ];

    const loyaltyPrograms = [
      { program: 'Flying Blue', number: 'FB123456', status: 'Gold' },
      { program: 'Miles & More', number: 'MM789012', status: 'Silver' },
      { program: 'Hilton Honors', number: 'HH345678', status: 'Diamond' }
    ];

    const badges: Badge[] = [
      {
        id: 'first-flight',
        name: 'Premier Vol',
        description: 'Premier voyage enregistré',
        icon: 'airplane',
        earnedAt: new Date('2024-01-15'),
        category: 'travel'
      },
      {
        id: 'social-butterfly',
        name: 'Papillon Social',
        description: '50 connexions établies',
        icon: 'people',
        earnedAt: new Date('2024-02-20'),
        category: 'social'
      }
    ];

    return [
      {
        id: 'bobber-1',
        displayName: 'Marie Dubois',
        firstName: 'Marie',
        lastName: 'Dubois',
        email: 'marie.dubois@demo.com',
        avatar: 'assets/avatars/avatar-1.jpg',
        bio: 'Passionnée de photographie et de voyages culturels',
        travelStyle: 'leisure',
        preferredSeats: 'window',
        interests: ['photography', 'culture', 'art'],
        totalFlights: 45,
        countriesVisited: 12,
        memberSince: new Date('2023-06-15'),
        badges: [badges[0], badges[1]],
        loyaltyPrograms: [loyaltyPrograms[0]],
        privacyLevel: 'public',
        showLocation: true,
        showFlightInfo: true
      },
      {
        id: 'bobber-2',
        displayName: 'Jean Martin',
        firstName: 'Jean',
        lastName: 'Martin',
        email: 'jean.martin@demo.com',
        avatar: 'assets/avatars/avatar-2.jpg',
        bio: 'Business traveler, toujours en déplacement',
        travelStyle: 'business',
        preferredSeats: 'aisle',
        interests: ['business', 'technology', 'sports'],
        totalFlights: 127,
        countriesVisited: 23,
        memberSince: new Date('2022-03-10'),
        badges: [badges[0]],
        loyaltyPrograms: [loyaltyPrograms[1], loyaltyPrograms[2]],
        privacyLevel: 'friends',
        showLocation: true,
        showFlightInfo: false
      },
      {
        id: 'bobber-3',
        displayName: 'Sophie Chen',
        firstName: 'Sophie',
        lastName: 'Chen',
        email: 'sophie.chen@demo.com',
        avatar: 'assets/avatars/avatar-3.jpg',
        bio: 'Aventurière en quête de nouveaux horizons',
        travelStyle: 'adventure',
        preferredSeats: 'window',
        interests: ['adventure', 'nature', 'photography'],
        totalFlights: 23,
        countriesVisited: 8,
        memberSince: new Date('2024-01-05'),
        badges: [badges[0]],
        loyaltyPrograms: [],
        privacyLevel: 'public',
        showLocation: true,
        showFlightInfo: true
      },
      {
        id: 'bobber-4',
        displayName: 'Pierre Durand',
        firstName: 'Pierre',
        lastName: 'Durand',
        email: 'pierre.durand@demo.com',
        avatar: 'assets/avatars/avatar-4.jpg',
        bio: 'Famille de 4, voyages avec enfants',
        travelStyle: 'family',
        preferredSeats: 'front',
        interests: ['family', 'food', 'culture'],
        totalFlights: 67,
        countriesVisited: 15,
        memberSince: new Date('2021-09-22'),
        badges: [badges[0], badges[1]],
        loyaltyPrograms: [loyaltyPrograms[0]],
        privacyLevel: 'private',
        showLocation: false,
        showFlightInfo: true
      },
      {
        id: 'bobber-5',
        displayName: 'Emma Wilson',
        firstName: 'Emma',
        lastName: 'Wilson',
        email: 'emma.wilson@demo.com',
        avatar: 'assets/avatars/avatar-5.jpg',
        bio: 'Étudiante en échange, découverte du monde',
        travelStyle: 'adventure',
        preferredSeats: 'window',
        interests: ['culture', 'music', 'art'],
        totalFlights: 12,
        countriesVisited: 4,
        memberSince: new Date('2024-02-01'),
        badges: [badges[0]],
        loyaltyPrograms: [],
        privacyLevel: 'public',
        showLocation: true,
        showFlightInfo: true
      }
    ];
  }

  private createDemoLocations(): BobberLocation[] {
    const now = new Date();
    return [
      {
        userId: 'bobber-1',
        currentFlight: {
          flightNumber: 'LX1820',
          departure: 'GVA',
          arrival: 'ATH',
          date: now,
          seat: '12A',
          status: 'in-flight'
        },
        lastSeen: now,
        isOnline: true
      },
      {
        userId: 'bobber-2',
        currentFlight: {
          flightNumber: 'LX1820',
          departure: 'GVA',
          arrival: 'ATH',
          date: now,
          seat: '15C',
          status: 'in-flight'
        },
        lastSeen: now,
        isOnline: true
      },
      {
        userId: 'bobber-3',
        currentAirport: {
          code: 'GVA',
          name: 'Aéroport de Genève',
          city: 'Genève',
          country: 'Suisse'
        },
        lastSeen: new Date(now.getTime() - 300000), // 5 minutes ago
        isOnline: false
      },
      {
        userId: 'bobber-4',
        currentFlight: {
          flightNumber: 'LX1820',
          departure: 'GVA',
          arrival: 'ATH',
          date: now,
          seat: '8F',
          status: 'in-flight'
        },
        lastSeen: now,
        isOnline: true
      },
      {
        userId: 'bobber-5',
        currentAirport: {
          code: 'ATH',
          name: 'Aéroport d\'Athènes',
          city: 'Athènes',
          country: 'Grèce'
        },
        lastSeen: new Date(now.getTime() - 600000), // 10 minutes ago
        isOnline: false
      }
    ];
  }

  private createDemoConnections(): BobberConnection[] {
    const now = new Date();
    return [
      {
        id: 'conn-1',
        userId: 'bobber-1',
        connectedUserId: 'bobber-2',
        status: 'accepted',
        createdAt: new Date(now.getTime() - 86400000), // 1 day ago
        updatedAt: now
      },
      {
        id: 'conn-2',
        userId: 'bobber-1',
        connectedUserId: 'bobber-4',
        status: 'pending',
        createdAt: new Date(now.getTime() - 3600000), // 1 hour ago
        updatedAt: now
      },
      {
        id: 'conn-3',
        userId: 'bobber-2',
        connectedUserId: 'bobber-3',
        status: 'accepted',
        createdAt: new Date(now.getTime() - 172800000), // 2 days ago
        updatedAt: now
      }
    ];
  }

  private createDemoChats(): BobberChat[] {
    const now = new Date();
    const messages: ChatMessage[] = [
      {
        id: 'msg-1',
        senderId: 'bobber-1',
        content: 'Salut ! Tu vas aussi à Athènes ?',
        type: 'text',
        timestamp: new Date(now.getTime() - 1800000), // 30 minutes ago
        readBy: ['bobber-2']
      },
      {
        id: 'msg-2',
        senderId: 'bobber-2',
        content: 'Oui ! Première fois pour moi, tu as des conseils ?',
        type: 'text',
        timestamp: new Date(now.getTime() - 1700000), // 28 minutes ago
        readBy: ['bobber-1']
      },
      {
        id: 'msg-3',
        senderId: 'bobber-1',
        content: 'Absolument ! L\'Acropole est un must, et le quartier de Plaka est super pour manger',
        type: 'text',
        timestamp: new Date(now.getTime() - 1600000), // 27 minutes ago
        readBy: ['bobber-2']
      }
    ];

    return [
      {
        id: 'chat-1',
        type: 'flight',
        participants: ['bobber-1', 'bobber-2'],
        messages: messages,
        metadata: {
          flightNumber: 'LX1820',
          createdAt: new Date(now.getTime() - 1800000),
          lastMessageAt: new Date(now.getTime() - 1600000)
        }
      }
    ];
  }

  private startLocationUpdates() {
    // Simuler des mises à jour de localisation toutes les 30 secondes
    timer(0, 30000).subscribe(() => {
      this.updateDemoLocations();
    });
  }

  private updateDemoLocations() {
    const now = new Date();
    this.demoLocations = this.demoLocations.map(location => ({
      ...location,
      lastSeen: now,
      isOnline: Math.random() > 0.1 // 90% de chance d'être en ligne
    }));
    this.locationsSubject.next(this.demoLocations);
  }

  // Méthodes publiques

  getProfiles(): Observable<BobberProfile[]> {
    return this.profiles$;
  }

  getProfileById(id: string): Observable<BobberProfile | undefined> {
    return this.profiles$.pipe(
      map(profiles => profiles.find(p => p.id === id))
    );
  }

  getBobbersOnSameFlight(flightNumber: string): Observable<BobberMatch[]> {
    return this.profiles$.pipe(
      switchMap(profiles => this.locations$.pipe(
        map(locations => {
          const sameFlightLocations = locations.filter(
            loc => loc.currentFlight?.flightNumber === flightNumber
          );

          return sameFlightLocations.map(location => {
            const profile = profiles.find(p => p.id === location.userId);
            if (!profile) return null;

            return {
              userId: profile.id,
              profile: profile,
              compatibility: Math.floor(Math.random() * 40) + 60, // 60-100%
              commonInterests: this.getCommonInterests(profile),
              sharedFlights: Math.floor(Math.random() * 5) + 1,
              matchReason: 'same-flight' as const
            };
          }).filter(Boolean) as BobberMatch[];
        })
      ))
    );
  }

  getBobbersNearby(airportCode: string): Observable<BobberMatch[]> {
    return this.profiles$.pipe(
      switchMap(profiles => this.locations$.pipe(
        map(locations => {
          const nearbyLocations = locations.filter(
            loc => loc.currentAirport?.code === airportCode
          );

          return nearbyLocations.map(location => {
            const profile = profiles.find(p => p.id === location.userId);
            if (!profile) return null;

            return {
              userId: profile.id,
              profile: profile,
              compatibility: Math.floor(Math.random() * 30) + 40, // 40-70%
              commonInterests: this.getCommonInterests(profile),
              sharedFlights: Math.floor(Math.random() * 3),
              distance: Math.floor(Math.random() * 5) + 1, // 1-5 km
              matchReason: 'nearby' as const
            };
          }).filter(Boolean) as BobberMatch[];
        })
      ))
    );
  }

  getConnections(userId: string): Observable<BobberConnection[]> {
    return this.connections$.pipe(
      map(connections => connections.filter(c => c.userId === userId))
    );
  }

  sendConnectionRequest(fromUserId: string, toUserId: string): Observable<boolean> {
    const newConnection: BobberConnection = {
      id: `conn-${Date.now()}`,
      userId: fromUserId,
      connectedUserId: toUserId,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.demoConnections.push(newConnection);
    this.connectionsSubject.next(this.demoConnections);
    return of(true);
  }

  acceptConnection(connectionId: string): Observable<boolean> {
    const connection = this.demoConnections.find(c => c.id === connectionId);
    if (connection) {
      connection.status = 'accepted';
      connection.updatedAt = new Date();
      this.connectionsSubject.next(this.demoConnections);
    }
    return of(true);
  }

  getChats(userId: string): Observable<BobberChat[]> {
    return this.chats$.pipe(
      map(chats => chats.filter(chat => chat.participants.includes(userId)))
    );
  }

  sendMessage(chatId: string, senderId: string, content: string): Observable<boolean> {
    const chat = this.demoChats.find(c => c.id === chatId);
    if (chat) {
      const newMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        senderId: senderId,
        content: content,
        type: 'text',
        timestamp: new Date(),
        readBy: [senderId]
      };

      chat.messages.push(newMessage);
      chat.metadata.lastMessageAt = new Date();
      this.chatsSubject.next(this.demoChats);
    }
    return of(true);
  }

  private getCommonInterests(profile: BobberProfile): string[] {
    const allInterests = ['photography', 'food', 'culture', 'nature', 'sports', 'music', 'art', 'technology', 'business', 'adventure'];
    const commonCount = Math.floor(Math.random() * 3) + 1; // 1-3 intérêts communs
    const shuffled = allInterests.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, commonCount);
  }
} 