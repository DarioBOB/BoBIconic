import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { BobberChat, BobberProfile } from '../../models/bobber.interface';

@Component({
  selector: 'app-bobber-chat-list',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <div class="chat-list-container">
      <!-- En-tête -->
      <div class="chat-list-header">
        <h2>Messages</h2>
        <ion-button fill="clear" size="small" (click)="onNewChat()">
          <ion-icon name="add"></ion-icon>
        </ion-button>
      </div>

      <!-- Liste des conversations -->
      <div class="chat-list">
        <div *ngIf="chats.length === 0" class="empty-chat-list">
          <ion-icon name="chatbubbles-outline" size="large"></ion-icon>
          <h3>Aucune conversation</h3>
          <p>Connectez-vous avec des Bobbers pour commencer à échanger !</p>
          <ion-button fill="outline" (click)="onDiscoverBobbers()">
            Découvrir des Bobbers
          </ion-button>
        </div>

        <div *ngFor="let chat of chats; trackBy: trackByChatId" 
             class="chat-item"
             [class.active]="selectedChatId === chat.id"
             (click)="onChatSelect(chat)">
          
          <!-- Avatar -->
          <div class="chat-avatar">
            <ion-avatar>
              <img [src]="getOtherParticipantAvatar(chat)" 
                   [alt]="getOtherParticipantName(chat)">
            </ion-avatar>
            <div class="online-indicator" 
                 [class.online]="isOtherParticipantOnline(chat)">
            </div>
          </div>

          <!-- Informations du chat -->
          <div class="chat-info">
            <div class="chat-header">
              <h4>{{ getOtherParticipantName(chat) }}</h4>
              <span class="chat-time">
                {{ getLastMessageTime(chat) }}
              </span>
            </div>
            
            <div class="chat-preview">
              <p class="last-message" [class.unread]="hasUnreadMessages(chat)">
                {{ getLastMessagePreview(chat) }}
              </p>
              <div class="chat-badges">
                <ion-badge *ngIf="hasUnreadMessages(chat)" color="primary" class="unread-badge">
                  {{ getUnreadCount(chat) }}
                </ion-badge>
                <ion-badge *ngIf="chat.metadata.flightNumber" color="secondary" class="flight-badge">
                  {{ chat.metadata.flightNumber }}
                </ion-badge>
              </div>
            </div>
          </div>

          <!-- Actions rapides -->
          <div class="chat-actions">
            <ion-button fill="clear" size="small" (click)="onQuickCall(chat, $event)">
              <ion-icon name="call"></ion-icon>
            </ion-button>
            <ion-button fill="clear" size="small" (click)="onMoreOptions(chat, $event)">
              <ion-icon name="ellipsis-vertical"></ion-icon>
            </ion-button>
          </div>
        </div>
      </div>

      <!-- Filtres -->
      <div class="chat-filters">
        <ion-segment [value]="activeFilter" (ionChange)="onFilterChange($event)" color="primary">
          <ion-segment-button value="all">
            <ion-label>Tous</ion-label>
          </ion-segment-button>
          <ion-segment-button value="unread">
            <ion-label>Non lus</ion-label>
          </ion-segment-button>
          <ion-segment-button value="flight">
            <ion-label>Vols</ion-label>
          </ion-segment-button>
        </ion-segment>
      </div>
    </div>
  `,
  styles: [`
    .chat-list-container {
      height: 100%;
      display: flex;
      flex-direction: column;
      background: var(--ion-color-light);
    }

    .chat-list-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
      background: white;
      border-bottom: 1px solid var(--ion-color-light-shade);
    }

    .chat-list-header h2 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 600;
      color: var(--ion-color-dark);
    }

    .chat-list {
      flex: 1;
      overflow-y: auto;
    }

    .empty-chat-list {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      padding: 40px 20px;
      text-align: center;
      color: var(--ion-color-medium);
    }

    .empty-chat-list ion-icon {
      font-size: 4rem;
      margin-bottom: 16px;
      opacity: 0.5;
    }

    .empty-chat-list h3 {
      margin: 0 0 8px 0;
      font-size: 1.2rem;
      color: var(--ion-color-dark);
    }

    .empty-chat-list p {
      margin: 0 0 20px 0;
      font-size: 0.9rem;
      line-height: 1.4;
    }

    .chat-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      background: white;
      border-bottom: 1px solid var(--ion-color-light-shade);
      cursor: pointer;
      transition: background-color 0.2s ease;
    }

    .chat-item:hover {
      background: var(--ion-color-light);
    }

    .chat-item.active {
      background: rgba(var(--ion-color-primary-rgb), 0.1);
      border-left: 4px solid var(--ion-color-primary);
    }

    .chat-avatar {
      position: relative;
      flex-shrink: 0;
    }

    .chat-avatar ion-avatar {
      width: 50px;
      height: 50px;
    }

    .online-indicator {
      position: absolute;
      bottom: 2px;
      right: 2px;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      border: 2px solid white;
      background: var(--ion-color-medium);
    }

    .online-indicator.online {
      background: var(--ion-color-success);
    }

    .chat-info {
      flex: 1;
      min-width: 0;
    }

    .chat-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 4px;
    }

    .chat-header h4 {
      margin: 0;
      font-size: 1rem;
      font-weight: 600;
      color: var(--ion-color-dark);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .chat-time {
      font-size: 0.8rem;
      color: var(--ion-color-medium);
      flex-shrink: 0;
    }

    .chat-preview {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .last-message {
      margin: 0;
      font-size: 0.9rem;
      color: var(--ion-color-medium);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 200px;
    }

    .last-message.unread {
      color: var(--ion-color-dark);
      font-weight: 500;
    }

    .chat-badges {
      display: flex;
      gap: 4px;
      flex-shrink: 0;
    }

    .unread-badge {
      font-size: 0.7rem;
      min-width: 18px;
      height: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .flight-badge {
      font-size: 0.7rem;
      background: var(--ion-color-secondary);
    }

    .chat-actions {
      display: flex;
      gap: 4px;
      opacity: 0;
      transition: opacity 0.2s ease;
    }

    .chat-item:hover .chat-actions {
      opacity: 1;
    }

    .chat-filters {
      padding: 12px 16px;
      background: white;
      border-top: 1px solid var(--ion-color-light-shade);
    }

    ion-segment {
      --background: var(--ion-color-light);
      border-radius: 8px;
    }

    ion-segment-button {
      --indicator-color: var(--ion-color-primary);
      --color: var(--ion-color-medium);
      --color-checked: var(--ion-color-primary);
      font-size: 0.8rem;
    }

    @media (max-width: 480px) {
      .chat-list-header {
        padding: 12px;
      }

      .chat-item {
        padding: 10px 12px;
        gap: 10px;
      }

      .chat-avatar ion-avatar {
        width: 45px;
        height: 45px;
      }

      .last-message {
        max-width: 150px;
      }

      .chat-filters {
        padding: 8px 12px;
      }
    }
  `]
})
export class BobberChatListComponent implements OnInit {
  @Input() chats: BobberChat[] = [];
  @Input() currentUserId!: string;
  @Input() participants: Map<string, BobberProfile> = new Map();
  @Input() selectedChatId?: string;

  @Output() chatSelect = new EventEmitter<BobberChat>();
  @Output() newChat = new EventEmitter<void>();
  @Output() discoverBobbers = new EventEmitter<void>();
  @Output() quickCall = new EventEmitter<{chat: BobberChat, participantId: string}>();
  @Output() moreOptions = new EventEmitter<{chat: BobberChat, participantId: string}>();

  activeFilter: string = 'all';
  filteredChats: BobberChat[] = [];

  ngOnInit() {
    this.applyFilter();
  }

  trackByChatId(index: number, chat: BobberChat): string {
    return chat.id;
  }

  getOtherParticipantName(chat: BobberChat): string {
    const otherId = chat.participants.find(id => id !== this.currentUserId);
    const participant = this.participants.get(otherId || '');
    return participant?.displayName || 'Bobber';
  }

  getOtherParticipantAvatar(chat: BobberChat): string {
    const otherId = chat.participants.find(id => id !== this.currentUserId);
    const participant = this.participants.get(otherId || '');
    return participant?.avatar || 'assets/avatars/default-avatar.jpg';
  }

  isOtherParticipantOnline(chat: BobberChat): boolean {
    // Simulation - en vrai, on vérifierait le statut en ligne
    return Math.random() > 0.4;
  }

  getLastMessageTime(chat: BobberChat): string {
    if (chat.messages.length === 0) return '';
    
    const lastMessage = chat.messages[chat.messages.length - 1];
    const now = new Date();
    const messageTime = new Date(lastMessage.timestamp);
    const diffHours = (now.getTime() - messageTime.getTime()) / (1000 * 60 * 60);

    if (diffHours < 1) {
      return messageTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    } else if (diffHours < 24) {
      return Math.floor(diffHours) + 'h';
    } else {
      return messageTime.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
    }
  }

  getLastMessagePreview(chat: BobberChat): string {
    if (chat.messages.length === 0) return 'Aucun message';
    
    const lastMessage = chat.messages[chat.messages.length - 1];
    
    switch (lastMessage.type) {
      case 'text':
        return lastMessage.content.length > 50 
          ? lastMessage.content.substring(0, 50) + '...' 
          : lastMessage.content;
      case 'image':
        return '📷 Image';
      case 'location':
        return '📍 Localisation';
      default:
        return 'Message';
    }
  }

  hasUnreadMessages(chat: BobberChat): boolean {
    return chat.messages.some(message => 
      message.senderId !== this.currentUserId && 
      !message.readBy.includes(this.currentUserId)
    );
  }

  getUnreadCount(chat: BobberChat): number {
    return chat.messages.filter(message => 
      message.senderId !== this.currentUserId && 
      !message.readBy.includes(this.currentUserId)
    ).length;
  }

  onChatSelect(chat: BobberChat) {
    this.selectedChatId = chat.id;
    this.chatSelect.emit(chat);
  }

  onNewChat() {
    this.newChat.emit();
  }

  onDiscoverBobbers() {
    this.discoverBobbers.emit();
  }

  onQuickCall(chat: BobberChat, event: Event) {
    event.stopPropagation();
    const otherId = chat.participants.find(id => id !== this.currentUserId);
    if (otherId) {
      this.quickCall.emit({ chat, participantId: otherId });
    }
  }

  onMoreOptions(chat: BobberChat, event: Event) {
    event.stopPropagation();
    const otherId = chat.participants.find(id => id !== this.currentUserId);
    if (otherId) {
      this.moreOptions.emit({ chat, participantId: otherId });
    }
  }

  onFilterChange(event: any) {
    this.activeFilter = event.detail.value;
    this.applyFilter();
  }

  private applyFilter() {
    switch (this.activeFilter) {
      case 'unread':
        this.filteredChats = this.chats.filter(chat => this.hasUnreadMessages(chat));
        break;
      case 'flight':
        this.filteredChats = this.chats.filter(chat => chat.metadata.flightNumber);
        break;
      default:
        this.filteredChats = this.chats;
    }
  }
} 