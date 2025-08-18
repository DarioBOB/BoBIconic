import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { SupportService, SupportTicket, TicketStatus } from '../../services/support.service';

@Component({
  selector: 'app-ticket-detail-modal',
  standalone: true,
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button (click)="close()">
            <ion-icon name="close"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title>Détails du Ticket</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="closeTicket()" *ngIf="ticket?.status !== 'closed'">
            <ion-icon name="close-circle"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding" *ngIf="ticket">
      <!-- En-tête du ticket -->
      <div class="ticket-header">
        <div class="ticket-title">
          <h1>{{ ticket.title }}</h1>
          <div class="ticket-meta">
            <span class="ticket-id">#{{ ticket.id }}</span>
            <span class="ticket-date">Créé le {{ supportService.formatDate(ticket.createdAt) }}</span>
            <span class="ticket-updated" *ngIf="ticket.updatedAt !== ticket.createdAt">
              Mis à jour le {{ supportService.formatDate(ticket.updatedAt) }}
            </span>
          </div>
        </div>
        
        <div class="ticket-badges">
          <ion-badge [color]="supportService.getCategoryColor(ticket.category)" class="category-badge">
            {{ supportService.getCategoryLabel(ticket.category) }}
          </ion-badge>
          <ion-badge [color]="supportService.getPriorityColor(ticket.priority)" class="priority-badge">
            {{ supportService.getPriorityLabel(ticket.priority) }}
          </ion-badge>
          <ion-badge [color]="supportService.getStatusColor(ticket.status)" class="status-badge">
            {{ supportService.getStatusLabel(ticket.status) }}
          </ion-badge>
        </div>
      </div>

      <!-- Informations utilisateur -->
      <ion-card class="user-info-card">
        <ion-card-header>
          <ion-card-title>👤 Informations utilisateur</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <div class="user-details">
            <div class="user-item">
              <strong>Nom :</strong> {{ ticket.userName }}
            </div>
            <div class="user-item">
              <strong>Email :</strong> {{ ticket.userEmail }}
            </div>
            <div class="user-item" *ngIf="ticket.assignedTo">
              <strong>Assigné à :</strong> {{ ticket.assignedToName }}
            </div>
          </div>
        </ion-card-content>
      </ion-card>

      <!-- Description -->
      <ion-card class="description-card">
        <ion-card-header>
          <ion-card-title>📝 Description</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <div class="description-text">
            {{ ticket.description }}
          </div>
        </ion-card-content>
      </ion-card>

      <!-- Résolution -->
      <ion-card class="resolution-card" *ngIf="ticket.resolution">
        <ion-card-header>
          <ion-card-title>✅ Résolution</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <div class="resolution-text">
            {{ ticket.resolution }}
          </div>
          <div class="resolution-date" *ngIf="ticket.resolvedAt">
            Résolu le {{ supportService.formatDate(ticket.resolvedAt) }}
          </div>
        </ion-card-content>
      </ion-card>

      <!-- Pièces jointes -->
      <ion-card class="attachments-card" *ngIf="ticket.attachments.length > 0">
        <ion-card-header>
          <ion-card-title>📎 Pièces jointes ({{ ticket.attachments.length }})</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <div class="attachments-list">
            <div *ngFor="let attachment of ticket.attachments" class="attachment-item">
              <div class="attachment-info">
                <ion-icon name="document" color="primary"></ion-icon>
                <div class="attachment-details">
                  <span class="attachment-name">{{ attachment.fileName }}</span>
                  <span class="attachment-size">{{ supportService.formatFileSize(attachment.fileSize) }}</span>
                </div>
              </div>
              <ion-button fill="clear" size="small" (click)="downloadAttachment(attachment)">
                <ion-icon name="download" color="primary"></ion-icon>
              </ion-button>
            </div>
          </div>
        </ion-card-content>
      </ion-card>

      <!-- Tags -->
      <ion-card class="tags-card" *ngIf="ticket.tags.length > 0">
        <ion-card-header>
          <ion-card-title>🏷️ Tags</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <div class="tags-list">
            <ion-chip *ngFor="let tag of ticket.tags" color="primary">
              <ion-label>{{ tag }}</ion-label>
            </ion-chip>
          </div>
        </ion-card-content>
      </ion-card>

      <!-- Informations système -->
      <ion-card class="system-info-card" *ngIf="ticket.browserInfo || ticket.appInfo">
        <ion-card-header>
          <ion-card-title>🔧 Informations système</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <div class="system-details" *ngIf="ticket.browserInfo">
            <h4>Navigateur</h4>
            <div class="system-item">
              <strong>User Agent :</strong> {{ ticket.browserInfo.userAgent }}
            </div>
            <div class="system-item">
              <strong>Plateforme :</strong> {{ ticket.browserInfo.platform }}
            </div>
            <div class="system-item">
              <strong>Langue :</strong> {{ ticket.browserInfo.language }}
            </div>
            <div class="system-item">
              <strong>Résolution :</strong> {{ ticket.browserInfo.screenResolution }}
            </div>
          </div>
          
          <div class="system-details" *ngIf="ticket.appInfo">
            <h4>Application</h4>
            <div class="system-item">
              <strong>Version :</strong> {{ ticket.appInfo.version }}
            </div>
            <div class="system-item">
              <strong>Build :</strong> {{ ticket.appInfo.build }}
            </div>
            <div class="system-item">
              <strong>Plateforme :</strong> {{ ticket.appInfo.platform }}
            </div>
          </div>
        </ion-card-content>
      </ion-card>

      <!-- Actions -->
      <div class="action-buttons">
        <ion-button expand="block" fill="outline" (click)="reopenTicket()" *ngIf="ticket.status === 'closed'">
          <ion-icon name="refresh" slot="start"></ion-icon>
          Réouvrir le Ticket
        </ion-button>
        <ion-button expand="block" fill="outline" (click)="addResolution()" *ngIf="ticket.status !== 'closed'">
          <ion-icon name="checkmark" slot="start"></ion-icon>
          Ajouter une Résolution
        </ion-button>
        <ion-button expand="block" fill="outline" (click)="replyToTicket()">
          <ion-icon name="chatbubble" slot="start"></ion-icon>
          Répondre
        </ion-button>
      </div>
    </ion-content>
  `,
  styleUrls: ['./ticket-detail-modal.component.scss'],
  imports: [CommonModule, IonicModule]
})
export class TicketDetailModalComponent {
  @Input() ticket: SupportTicket | null = null;
  @Output() ticketUpdated = new EventEmitter<SupportTicket>();
  @Output() modalClosed = new EventEmitter<void>();

  constructor(public supportService: SupportService) {}

  close() {
    this.modalClosed.emit();
  }

  async closeTicket() {
    if (!this.ticket) return;
    
    try {
      const updatedTicket = await this.supportService.closeTicket(this.ticket.id, 'Ticket fermé par l\'utilisateur');
      this.ticketUpdated.emit(updatedTicket);
      console.log('Ticket fermé avec succès');
    } catch (error) {
      console.error('Erreur lors de la fermeture du ticket:', error);
    }
  }

  async reopenTicket() {
    if (!this.ticket) return;
    
    try {
      const updatedTicket = await this.supportService.reopenTicket(this.ticket.id);
      this.ticketUpdated.emit(updatedTicket);
      console.log('Ticket réouvert avec succès');
    } catch (error) {
      console.error('Erreur lors de la réouverture du ticket:', error);
    }
  }

  addResolution() {
    console.log('Ajouter une résolution');
    // TODO: Implémenter la modal d'ajout de résolution
  }

  replyToTicket() {
    console.log('Répondre au ticket');
    // TODO: Implémenter la modal de réponse
  }

  downloadAttachment(attachment: any) {
    console.log('Télécharger:', attachment.fileName);
    // TODO: Implémenter le téléchargement
    const link = document.createElement('a');
    link.href = attachment.fileUrl;
    link.download = attachment.fileName;
    link.click();
  }
} 