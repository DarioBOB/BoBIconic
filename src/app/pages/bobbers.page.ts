import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, combineLatest } from 'rxjs';
import { BobberCardComponent } from '../components/bobbers/bobber-card.component';
import { BobbersNearbyComponent } from '../components/bobbers/bobbers-nearby.component';
import { BobberChatComponent } from '../components/bobbers/bobber-chat.component';
import { BobberChatListComponent } from '../components/bobbers/bobber-chat-list.component';
import { BobbersService } from '../services/bobbers.service';
import { BobberMatch, BobberProfile, BobberChat, ChatMessage } from '../models/bobber.interface';

@Component({
  selector: 'app-bobbers',
  templateUrl: './bobbers.page.html',
  styleUrls: ['./bobbers.page.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    IonicModule, 
    FormsModule, 
    BobbersNearbyComponent, 
    BobberCardComponent,
    BobberChatComponent,
    BobberChatListComponent
  ]
})
export class BobbersPage implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Onglets
  selectedTab: string = 'nearby';
  
  // Données
  myProfile?: BobberProfile;
  myConnections: BobberMatch[] = [];
  recommendedBobbers: BobberMatch[] = [];
  myChats: BobberChat[] = [];
  participants: Map<string, BobberProfile> = new Map();
  
  // Chat
  selectedChat?: BobberChat;
  selectedChatParticipant?: BobberProfile;
  showChatView: boolean = false;
  
  // État
  loading: boolean = true;
  showProfileModal: boolean = false;

  constructor(private bobbersService: BobbersService) {}

  ngOnInit() {
    this.loadMyData();
    this.setupSubscriptions();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadMyData() {
    this.loading = true;

    // Simuler le profil de l'utilisateur connecté
    this.bobbersService.getProfiles()
      .pipe(takeUntil(this.destroy$))
      .subscribe(profiles => {
        // Prendre le premier profil comme "moi"
        this.myProfile = profiles[0];
        
        // Créer la map des participants
        profiles.forEach(profile => {
          this.participants.set(profile.id, profile);
        });

        // Simuler des connexions
        this.myConnections = profiles.slice(1, 3).map(profile => ({
          userId: profile.id,
          profile: profile,
          compatibility: Math.floor(Math.random() * 30) + 70, // 70-100%
          commonInterests: this.getCommonInterests(profile),
          sharedFlights: Math.floor(Math.random() * 10) + 1,
          matchReason: 'same-flight' as const
        }));

        // Simuler des recommandations
        this.recommendedBobbers = profiles.slice(2, 5).map(profile => ({
          userId: profile.id,
          profile: profile,
          compatibility: Math.floor(Math.random() * 40) + 50, // 50-90%
          commonInterests: this.getCommonInterests(profile),
          sharedFlights: Math.floor(Math.random() * 5),
          matchReason: 'common-interests' as const
        }));

        // Charger les chats
        this.loadChats();

        this.loading = false;
      });
  }

  private loadChats() {
    if (!this.myProfile) return;

    this.bobbersService.getChats(this.myProfile.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe(chats => {
        this.myChats = chats;
        
        // Ajouter des chats de démo si aucun n'existe
        if (chats.length === 0) {
          this.createDemoChats();
        }
      });
  }

  private createDemoChats() {
    if (!this.myProfile) return;

    const demoChats: BobberChat[] = [
      {
        id: 'chat-1',
        type: 'flight',
        participants: [this.myProfile.id, 'bobber-2'],
        messages: [
          {
            id: 'msg-1',
            senderId: 'bobber-2',
            content: 'Salut ! Tu vas aussi à Athènes ?',
            type: 'text',
            timestamp: new Date(Date.now() - 1800000), // 30 minutes ago
            readBy: [this.myProfile.id, 'bobber-2']
          },
          {
            id: 'msg-2',
            senderId: this.myProfile.id,
            content: 'Oui ! Première fois pour moi, tu as des conseils ?',
            type: 'text',
            timestamp: new Date(Date.now() - 1700000), // 28 minutes ago
            readBy: [this.myProfile.id, 'bobber-2']
          },
          {
            id: 'msg-3',
            senderId: 'bobber-2',
            content: 'Absolument ! L\'Acropole est un must, et le quartier de Plaka est super pour manger',
            type: 'text',
            timestamp: new Date(Date.now() - 1600000), // 27 minutes ago
            readBy: [this.myProfile.id, 'bobber-2']
          },
          {
            id: 'msg-4',
            senderId: this.myProfile.id,
            content: 'Merci pour les conseils ! Tu as déjà visité l\'Acropole ?',
            type: 'text',
            timestamp: new Date(Date.now() - 900000), // 15 minutes ago
            readBy: [this.myProfile.id]
          }
        ],
        metadata: {
          flightNumber: 'LX1820',
          createdAt: new Date(Date.now() - 1800000),
          lastMessageAt: new Date(Date.now() - 900000)
        }
      },
      {
        id: 'chat-2',
        type: 'destination',
        participants: [this.myProfile.id, 'bobber-4'],
        messages: [
          {
            id: 'msg-5',
            senderId: 'bobber-4',
            content: 'Salut ! Je vois qu\'on va tous les deux à Athènes',
            type: 'text',
            timestamp: new Date(Date.now() - 3600000), // 1 hour ago
            readBy: [this.myProfile.id, 'bobber-4']
          },
          {
            id: 'msg-6',
            senderId: this.myProfile.id,
            content: 'Oui ! Tu voyages avec ta famille ?',
            type: 'text',
            timestamp: new Date(Date.now() - 3500000), // 58 minutes ago
            readBy: [this.myProfile.id, 'bobber-4']
          }
        ],
        metadata: {
          destination: 'Athènes',
          createdAt: new Date(Date.now() - 3600000),
          lastMessageAt: new Date(Date.now() - 3500000)
        }
      }
    ];

    this.myChats = demoChats;
  }

  private setupSubscriptions() {
    // Écouter les changements de connexions
    this.bobbersService.connections$
      .pipe(takeUntil(this.destroy$))
      .subscribe(connections => {
        // Mettre à jour les connexions si nécessaire
      });

    // Écouter les nouveaux messages
    this.bobbersService.chats$
      .pipe(takeUntil(this.destroy$))
      .subscribe(chats => {
        this.myChats = chats.filter(chat => 
          chat.participants.includes(this.myProfile?.id || '')
        );
      });
  }

  private getCommonInterests(profile: BobberProfile): string[] {
    if (!this.myProfile) return [];
    
    const common = this.myProfile.interests.filter(interest => 
      profile.interests.includes(interest)
    );
    return common.slice(0, 3); // Max 3 intérêts communs
  }

  onTabChange(event: any) {
    this.selectedTab = event.detail.value;
    this.showChatView = false; // Fermer la vue chat si on change d'onglet
  }

  onViewProfile(userId: string) {
    console.log('Voir profil:', userId);
    // Navigation vers le profil détaillé
  }

  onSendMessage(userId: string) {
    console.log('Envoyer message à:', userId);
    // Créer ou ouvrir un chat avec cet utilisateur
    this.openChatWithUser(userId);
  }

  onConnect(userId: string) {
    if (!this.myProfile) return;
    
    this.bobbersService.sendConnectionRequest(this.myProfile.id, userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe(success => {
        if (success) {
          console.log('Demande de connexion envoyée');
          // Afficher une notification
        }
      });
  }

  onShare(profile: BobberProfile) {
    console.log('Partager profil:', profile);
    // Implémenter le partage
  }

  // Méthodes pour le chat
  onChatSelect(chat: BobberChat) {
    this.selectedChat = chat;
    const otherId = chat.participants.find(id => id !== this.myProfile?.id);
    if (otherId) {
      this.selectedChatParticipant = this.participants.get(otherId);
    }
    this.showChatView = true;
  }

  onSendMessageToChat(event: {chatId: string, content: string}) {
    if (!this.myProfile) return;

    this.bobbersService.sendMessage(event.chatId, this.myProfile.id, event.content)
      .pipe(takeUntil(this.destroy$))
      .subscribe(success => {
        if (success) {
          console.log('Message envoyé');
          // Le message sera automatiquement ajouté via l'observable
        }
      });
  }

  onNewChat() {
    console.log('Nouveau chat');
    // Ouvrir la liste des Bobbers pour créer un nouveau chat
    this.selectedTab = 'nearby';
  }

  onDiscoverBobbers() {
    this.selectedTab = 'nearby';
  }

  onQuickCall(event: {chat: BobberChat, participantId: string}) {
    console.log('Appel rapide vers:', event.participantId);
    // Implémenter l'appel
  }

  onMoreOptions(event: {chat: BobberChat, participantId: string}) {
    console.log('Options pour le chat:', event.chat.id);
    // Afficher le menu d'options
  }

  onBackToChatList() {
    this.showChatView = false;
    this.selectedChat = undefined;
    this.selectedChatParticipant = undefined;
  }

  private openChatWithUser(userId: string) {
    // Chercher un chat existant ou en créer un nouveau
    let existingChat = this.myChats.find(chat => 
      chat.participants.includes(userId) && chat.participants.includes(this.myProfile?.id || '')
    );

    if (!existingChat) {
      // Créer un nouveau chat
      existingChat = {
        id: `chat-${Date.now()}`,
        type: 'private',
        participants: [this.myProfile?.id || '', userId],
        messages: [],
        metadata: {
          createdAt: new Date(),
          lastMessageAt: new Date()
        }
      };
      this.myChats.unshift(existingChat);
    }

    this.onChatSelect(existingChat);
  }

  editProfile() {
    this.showProfileModal = true;
  }

  closeProfileModal() {
    this.showProfileModal = false;
  }

  getTabIcon(tab: string): string {
    const icons = {
      'nearby': 'location',
      'connections': 'people',
      'recommendations': 'heart',
      'chats': 'chatbubbles',
      'profile': 'person'
    };
    return icons[tab as keyof typeof icons] || 'help';
  }

  getTabLabel(tab: string): string {
    const labels = {
      'nearby': 'À proximité',
      'connections': 'Connexions',
      'recommendations': 'Recommandés',
      'chats': 'Messages',
      'profile': 'Profil'
    };
    return labels[tab as keyof typeof labels] || tab;
  }
}
