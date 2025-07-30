import { Component, Input, Output, EventEmitter, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { BobberChat, ChatMessage, BobberProfile } from '../../models/bobber.interface';

@Component({
  selector: 'app-bobber-chat',
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule],
  template: `
    <div class="chat-container">
      <!-- En-tête du chat -->
      <div class="chat-header">
        <div class="chat-info">
          <ion-avatar class="chat-avatar">
            <img [src]="getOtherParticipantAvatar()" [alt]="getOtherParticipantName()">
          </ion-avatar>
          <div class="chat-details">
            <h3>{{ getOtherParticipantName() }}</h3>
            <p class="chat-status">
              <ion-icon name="radio-button-on" [class.online]="isOtherParticipantOnline()"></ion-icon>
              {{ isOtherParticipantOnline() ? 'En ligne' : 'Hors ligne' }}
            </p>
            <p class="chat-context" *ngIf="chat.metadata.flightNumber">
              Vol {{ chat.metadata.flightNumber }}
            </p>
          </div>
        </div>
        
        <div class="chat-actions">
          <ion-button fill="clear" size="small" (click)="onViewProfile()">
            <ion-icon name="person"></ion-icon>
          </ion-button>
          <ion-button fill="clear" size="small" (click)="onCall()">
            <ion-icon name="call"></ion-icon>
          </ion-button>
          <ion-button fill="clear" size="small" (click)="onMore()">
            <ion-icon name="ellipsis-vertical"></ion-icon>
          </ion-button>
        </div>
      </div>

      <!-- Zone des messages -->
      <div class="messages-container" #messagesContainer>
        <div *ngIf="chat.messages.length === 0" class="empty-chat">
          <ion-icon name="chatbubbles-outline" size="large"></ion-icon>
          <h3>Aucun message</h3>
          <p>Commencez la conversation avec {{ getOtherParticipantName() }} !</p>
        </div>

        <div class="messages-list" *ngIf="chat.messages.length > 0">
          <div *ngFor="let message of chat.messages; trackBy: trackByMessageId" 
               class="message-item"
               [class.own-message]="isOwnMessage(message)"
               [class.other-message]="!isOwnMessage(message)">
            
            <!-- Avatar pour les messages des autres -->
            <ion-avatar *ngIf="!isOwnMessage(message)" class="message-avatar">
              <img [src]="getOtherParticipantAvatar()" [alt]="getOtherParticipantName()">
            </ion-avatar>

            <div class="message-content">
              <!-- En-tête du message -->
              <div class="message-header">
                <span class="message-sender" *ngIf="!isOwnMessage(message)">
                  {{ getOtherParticipantName() }}
                </span>
                <span class="message-time">
                  {{ message.timestamp | date:'HH:mm' }}
                </span>
                <ion-icon *ngIf="isOwnMessage(message)" 
                         [name]="isMessageRead(message) ? 'checkmark-done' : 'checkmark'"
                         [class.read]="isMessageRead(message)">
                </ion-icon>
              </div>

              <!-- Contenu du message -->
              <div class="message-bubble">
                <div *ngIf="message.type === 'text'" class="message-text">
                  {{ message.content }}
                </div>
                
                <div *ngIf="message.type === 'image'" class="message-image">
                  <img [src]="message.content" alt="Image partagée" (click)="onImageClick(message.content)">
                </div>
                
                <div *ngIf="message.type === 'location'" class="message-location">
                  <ion-icon name="location"></ion-icon>
                  <span>Localisation partagée</span>
                  <ion-button fill="clear" size="small" (click)="onLocationClick(message.content)">
                    Voir sur la carte
                  </ion-button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Zone de saisie -->
      <div class="input-container">
        <div class="input-actions">
          <ion-button fill="clear" size="small" (click)="onAttachFile()">
            <ion-icon name="attach"></ion-icon>
          </ion-button>
          <ion-button fill="clear" size="small" (click)="onLocationShare()">
            <ion-icon name="location"></ion-icon>
          </ion-button>
          <ion-button fill="clear" size="small" (click)="onEmojiPicker()">
            <ion-icon name="happy"></ion-icon>
          </ion-button>
        </div>

        <div class="input-field">
          <ion-textarea
            [(ngModel)]="newMessage"
            placeholder="Tapez votre message..."
            rows="1"
            autoGrow="true"
            maxlength="500"
            (keydown.enter)="onEnterPress($event)"
            (ionInput)="onInputChange($event)">
          </ion-textarea>
        </div>

        <div class="send-button">
          <ion-button 
            fill="solid" 
            color="primary" 
            [disabled]="!newMessage.trim()"
            (click)="sendMessage()">
            <ion-icon name="send"></ion-icon>
          </ion-button>
        </div>
      </div>

      <!-- Indicateur de frappe -->
      <div *ngIf="isTyping" class="typing-indicator">
        <span>{{ getOtherParticipantName() }} est en train d'écrire...</span>
        <div class="typing-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .chat-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: var(--ion-color-light);
    }

    .chat-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      background: white;
      border-bottom: 1px solid var(--ion-color-light-shade);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .chat-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .chat-avatar {
      width: 40px;
      height: 40px;
    }

    .chat-details h3 {
      margin: 0 0 4px 0;
      font-size: 1rem;
      font-weight: 600;
      color: var(--ion-color-dark);
    }

    .chat-status {
      display: flex;
      align-items: center;
      gap: 4px;
      margin: 0 0 2px 0;
      font-size: 0.8rem;
      color: var(--ion-color-medium);
    }

    .chat-status ion-icon.online {
      color: var(--ion-color-success);
    }

    .chat-context {
      margin: 0;
      font-size: 0.8rem;
      color: var(--ion-color-primary);
      font-weight: 500;
    }

    .chat-actions {
      display: flex;
      gap: 4px;
    }

    .messages-container {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      background: var(--ion-color-light);
    }

    .empty-chat {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: var(--ion-color-medium);
      text-align: center;
    }

    .empty-chat ion-icon {
      font-size: 4rem;
      margin-bottom: 16px;
      opacity: 0.5;
    }

    .empty-chat h3 {
      margin: 0 0 8px 0;
      font-size: 1.2rem;
      color: var(--ion-color-dark);
    }

    .empty-chat p {
      margin: 0;
      font-size: 0.9rem;
    }

    .messages-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .message-item {
      display: flex;
      gap: 8px;
      max-width: 80%;
    }

    .message-item.own-message {
      align-self: flex-end;
      flex-direction: row-reverse;
    }

    .message-item.other-message {
      align-self: flex-start;
    }

    .message-avatar {
      width: 32px;
      height: 32px;
      flex-shrink: 0;
    }

    .message-content {
      flex: 1;
      min-width: 0;
    }

    .message-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 4px;
      font-size: 0.8rem;
    }

    .message-sender {
      font-weight: 600;
      color: var(--ion-color-dark);
    }

    .message-time {
      color: var(--ion-color-medium);
    }

    .message-header ion-icon {
      font-size: 0.7rem;
      color: var(--ion-color-medium);
    }

    .message-header ion-icon.read {
      color: var(--ion-color-primary);
    }

    .message-bubble {
      background: white;
      border-radius: 16px;
      padding: 12px 16px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      word-wrap: break-word;
    }

    .own-message .message-bubble {
      background: var(--ion-color-primary);
      color: white;
    }

    .message-text {
      line-height: 1.4;
    }

    .message-image img {
      max-width: 200px;
      max-height: 200px;
      border-radius: 8px;
      cursor: pointer;
    }

    .message-location {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .message-location ion-icon {
      color: var(--ion-color-primary);
    }

    .input-container {
      display: flex;
      align-items: flex-end;
      gap: 8px;
      padding: 12px 16px;
      background: white;
      border-top: 1px solid var(--ion-color-light-shade);
    }

    .input-actions {
      display: flex;
      gap: 4px;
    }

    .input-field {
      flex: 1;
    }

    .input-field ion-textarea {
      --padding-start: 12px;
      --padding-end: 12px;
      --padding-top: 8px;
      --padding-bottom: 8px;
      border-radius: 20px;
      background: var(--ion-color-light);
      max-height: 100px;
    }

    .send-button ion-button {
      --padding-start: 12px;
      --padding-end: 12px;
      --border-radius: 50%;
      width: 40px;
      height: 40px;
    }

    .typing-indicator {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      background: rgba(255, 255, 255, 0.9);
      font-size: 0.8rem;
      color: var(--ion-color-medium);
    }

    .typing-dots {
      display: flex;
      gap: 2px;
    }

    .typing-dots span {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--ion-color-medium);
      animation: typing 1.4s infinite ease-in-out;
    }

    .typing-dots span:nth-child(1) { animation-delay: -0.32s; }
    .typing-dots span:nth-child(2) { animation-delay: -0.16s; }

    @keyframes typing {
      0%, 80%, 100% {
        transform: scale(0.8);
        opacity: 0.5;
      }
      40% {
        transform: scale(1);
        opacity: 1;
      }
    }

    @media (max-width: 480px) {
      .chat-header {
        padding: 8px 12px;
      }

      .messages-container {
        padding: 12px;
      }

      .input-container {
        padding: 8px 12px;
      }

      .message-item {
        max-width: 90%;
      }
    }
  `]
})
export class BobberChatComponent implements OnInit, AfterViewInit {
  @Input() chat!: BobberChat;
  @Input() currentUserId!: string;
  @Input() otherParticipant!: BobberProfile;

  @Output() sendMessageEvent = new EventEmitter<{chatId: string, content: string}>();
  @Output() viewProfileEvent = new EventEmitter<string>();
  @Output() callEvent = new EventEmitter<string>();

  @ViewChild('messagesContainer') messagesContainer!: ElementRef;

  newMessage: string = '';
  isTyping: boolean = false;

  constructor() {}

  ngOnInit() {
    // Simuler l'indicateur de frappe
    this.simulateTyping();
  }

  ngAfterViewInit() {
    this.scrollToBottom();
  }

  getOtherParticipantName(): string {
    return this.otherParticipant?.displayName || 'Bobber';
  }

  getOtherParticipantAvatar(): string {
    return this.otherParticipant?.avatar || 'assets/avatars/default-avatar.jpg';
  }

  isOtherParticipantOnline(): boolean {
    // Simulation - en vrai, on vérifierait le statut en ligne
    return Math.random() > 0.3;
  }

  isOwnMessage(message: ChatMessage): boolean {
    return message.senderId === this.currentUserId;
  }

  isMessageRead(message: ChatMessage): boolean {
    return message.readBy.length > 1; // Plus que l'expéditeur
  }

  trackByMessageId(index: number, message: ChatMessage): string {
    return message.id;
  }

  onEnterPress(event: any) {
    if (event.shiftKey) {
      return; // Permettre les sauts de ligne avec Shift+Enter
    }
    event.preventDefault();
    this.sendMessage();
  }

  onInputChange(event: any) {
    // Simuler l'indicateur de frappe
    this.isTyping = true;
    setTimeout(() => {
      this.isTyping = false;
    }, 2000);
  }

  sendMessage() {
    if (!this.newMessage.trim()) return;

    this.sendMessageEvent.emit({
      chatId: this.chat.id,
      content: this.newMessage.trim()
    });

    this.newMessage = '';
    this.scrollToBottom();
  }

  onViewProfile() {
    this.viewProfileEvent.emit(this.otherParticipant.id);
  }

  onCall() {
    this.callEvent.emit(this.otherParticipant.id);
  }

  onMore() {
    // Menu d'options supplémentaires
    console.log('Menu d\'options');
  }

  onAttachFile() {
    // Attacher un fichier
    console.log('Attacher un fichier');
  }

  onLocationShare() {
    // Partager la localisation
    console.log('Partager la localisation');
  }

  onEmojiPicker() {
    // Sélecteur d'emojis
    console.log('Sélecteur d\'emojis');
  }

  onImageClick(imageUrl: string) {
    // Ouvrir l'image en plein écran
    console.log('Ouvrir image:', imageUrl);
  }

  onLocationClick(locationData: string) {
    // Ouvrir la localisation sur la carte
    console.log('Ouvrir localisation:', locationData);
  }

  private scrollToBottom() {
    setTimeout(() => {
      if (this.messagesContainer) {
        this.messagesContainer.nativeElement.scrollTop = 
          this.messagesContainer.nativeElement.scrollHeight;
      }
    }, 100);
  }

  private simulateTyping() {
    // Simuler l'indicateur de frappe de l'autre participant
    setInterval(() => {
      if (Math.random() > 0.8) { // 20% de chance
        this.isTyping = true;
        setTimeout(() => {
          this.isTyping = false;
        }, 3000);
      }
    }, 10000); // Vérifier toutes les 10 secondes
  }
} 