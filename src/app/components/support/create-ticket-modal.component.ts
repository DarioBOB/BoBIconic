import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { SupportService, TicketCategory, TicketPriority } from '../../services/support.service';

@Component({
  selector: 'app-create-ticket-modal',
  standalone: true,
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Nouveau Ticket de Support</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="cancel()">Annuler</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <form [formGroup]="ticketForm" (ngSubmit)="onSubmit()">
        <!-- Catégorie -->
        <ion-item>
          <ion-label position="stacked">Catégorie *</ion-label>
          <ion-select formControlName="category" placeholder="Sélectionner une catégorie">
            <ion-select-option value="bug">🐛 Bug</ion-select-option>
            <ion-select-option value="feature_request">💡 Demande de fonctionnalité</ion-select-option>
            <ion-select-option value="general_inquiry">❓ Question générale</ion-select-option>
            <ion-select-option value="technical_issue">🔧 Problème technique</ion-select-option>
            <ion-select-option value="account_issue">👤 Problème de compte</ion-select-option>
            <ion-select-option value="billing_issue">💳 Problème de facturation</ion-select-option>
            <ion-select-option value="other">📄 Autre</ion-select-option>
          </ion-select>
        </ion-item>

        <!-- Priorité -->
        <ion-item>
          <ion-label position="stacked">Priorité *</ion-label>
          <ion-select formControlName="priority" placeholder="Sélectionner une priorité">
            <ion-select-option value="low">🟢 Faible</ion-select-option>
            <ion-select-option value="medium">🟡 Moyenne</ion-select-option>
            <ion-select-option value="high">🔴 Élevée</ion-select-option>
            <ion-select-option value="urgent">🚨 Urgente</ion-select-option>
          </ion-select>
        </ion-item>

        <!-- Titre -->
        <ion-item>
          <ion-label position="stacked">Titre *</ion-label>
          <ion-input 
            formControlName="title" 
            placeholder="Ex: Problème de connexion à l'application"
            maxlength="100">
          </ion-input>
        </ion-item>

        <!-- Description -->
        <ion-item>
          <ion-label position="stacked">Description détaillée *</ion-label>
          <ion-textarea 
            formControlName="description" 
            placeholder="Décrivez votre problème ou demande en détail..."
            rows="6"
            maxlength="2000">
          </ion-textarea>
        </ion-item>

        <!-- Étapes pour reproduire (pour les bugs) -->
        <ion-item *ngIf="ticketForm.get('category')?.value === 'bug'">
          <ion-label position="stacked">Étapes pour reproduire le problème</ion-label>
          <ion-textarea 
            formControlName="stepsToReproduce" 
            placeholder="1. Ouvrir l'application&#10;2. Aller dans la section...&#10;3. Cliquer sur...&#10;4. Le problème se produit..."
            rows="4">
          </ion-textarea>
        </ion-item>

        <!-- Comportement attendu (pour les bugs) -->
        <ion-item *ngIf="ticketForm.get('category')?.value === 'bug'">
          <ion-label position="stacked">Comportement attendu</ion-label>
          <ion-textarea 
            formControlName="expectedBehavior" 
            placeholder="Décrivez ce qui devrait se passer normalement..."
            rows="3">
          </ion-textarea>
        </ion-item>

        <!-- Pièces jointes -->
        <ion-item>
          <ion-label position="stacked">Pièces jointes</ion-label>
          <ion-button fill="outline" (click)="selectFiles()">
            <ion-icon name="attach" slot="start"></ion-icon>
            Ajouter des fichiers
          </ion-button>
          <div *ngIf="selectedFiles.length > 0" class="files-info">
            <div *ngFor="let file of selectedFiles" class="file-item">
              <ion-icon name="document" color="primary"></ion-icon>
              <span>{{ file.name }}</span>
              <span class="file-size">({{ formatFileSize(file.size) }})</span>
              <ion-button fill="clear" size="small" (click)="removeFile(file)">
                <ion-icon name="close" color="danger"></ion-icon>
              </ion-button>
            </div>
          </div>
        </ion-item>

        <!-- Tags -->
        <ion-item>
          <ion-label position="stacked">Tags</ion-label>
          <ion-input 
            formControlName="tagsInput" 
            placeholder="Tags séparés par des virgules (ex: connexion, erreur, mobile)"
            (ionBlur)="updateTags()">
          </ion-input>
        </ion-item>

        <!-- Informations système -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>Informations système (automatiques)</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <div class="system-info">
              <div class="info-item">
                <strong>Navigateur :</strong> {{ browserInfo.userAgent }}
              </div>
              <div class="info-item">
                <strong>Plateforme :</strong> {{ browserInfo.platform }}
              </div>
              <div class="info-item">
                <strong>Langue :</strong> {{ browserInfo.language }}
              </div>
              <div class="info-item">
                <strong>Résolution :</strong> {{ browserInfo.screenResolution }}
              </div>
              <div class="info-item">
                <strong>Version App :</strong> {{ appInfo.version }}
              </div>
              <div class="info-item">
                <strong>Build :</strong> {{ appInfo.build }}
              </div>
            </div>
          </ion-card-content>
        </ion-card>

        <!-- Boutons d'action -->
        <div class="action-buttons">
          <ion-button 
            expand="block" 
            type="submit" 
            [disabled]="!ticketForm.valid || isSubmitting"
            class="submit-btn">
            <ion-icon name="send" slot="start"></ion-icon>
            {{ isSubmitting ? 'Envoi en cours...' : 'Créer le Ticket' }}
          </ion-button>
        </div>
      </form>
    </ion-content>
  `,
  styleUrls: ['./create-ticket-modal.component.scss'],
  imports: [CommonModule, IonicModule, FormsModule]
})
export class CreateTicketModalComponent {
  @Input() isOpen: boolean = false;
  @Output() ticketCreated = new EventEmitter<any>();

  ticketForm: any;
  selectedFiles: File[] = [];
  tags: string[] = [];
  isSubmitting: boolean = false;
  browserInfo: any;
  appInfo: any;

  constructor(private supportService: SupportService) {
    this.initializeForm();
    this.collectSystemInfo();
  }

  private initializeForm() {
    this.ticketForm = {
      category: TicketCategory.BUG,
      priority: TicketPriority.MEDIUM,
      title: '',
      description: '',
      stepsToReproduce: '',
      expectedBehavior: '',
      tagsInput: ''
    };
  }

  private collectSystemInfo() {
    this.browserInfo = this.supportService.collectBrowserInfo();
    this.appInfo = this.supportService.collectAppInfo();
  }

  selectFiles() {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = '.jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.txt,.mp4,.mov,.avi';
    
    input.onchange = (event: any) => {
      const files = Array.from(event.target.files);
      files.forEach((file: File) => {
        if (file.size <= 10 * 1024 * 1024) { // 10MB max
          this.selectedFiles.push(file);
        } else {
          console.warn(`Fichier ${file.name} trop volumineux (max 10MB)`);
        }
      });
    };
    
    input.click();
  }

  removeFile(file: File) {
    const index = this.selectedFiles.indexOf(file);
    if (index > -1) {
      this.selectedFiles.splice(index, 1);
    }
  }

  updateTags() {
    const tagsInput = this.ticketForm.tagsInput;
    if (tagsInput) {
      this.tags = tagsInput.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag.length > 0);
    }
  }

  formatFileSize(bytes: number): string {
    return this.supportService.formatFileSize(bytes);
  }

  async onSubmit() {
    if (!this.ticketForm.valid) {
      return;
    }

    this.isSubmitting = true;

    try {
      // Simuler l'upload des fichiers
      const attachments = await this.uploadFiles();

      const ticketData = {
        title: this.ticketForm.title,
        description: this.buildDescription(),
        category: this.ticketForm.category,
        priority: this.ticketForm.priority,
        userId: 'current-user-id', // À récupérer depuis le service d'auth
        userName: 'Utilisateur Actuel', // À récupérer depuis le service d'auth
        userEmail: 'user@example.com', // À récupérer depuis le service d'auth
        attachments: attachments,
        tags: this.tags,
        browserInfo: this.browserInfo,
        appInfo: this.appInfo
      };

      const newTicket = await this.supportService.createTicket(ticketData);
      console.log('Ticket créé avec succès:', newTicket);
      
      this.ticketCreated.emit(newTicket);
      this.cancel();
    } catch (error) {
      console.error('Erreur lors de la création du ticket:', error);
    } finally {
      this.isSubmitting = false;
    }
  }

  private buildDescription(): string {
    let description = this.ticketForm.description;

    if (this.ticketForm.category === TicketCategory.BUG) {
      if (this.ticketForm.stepsToReproduce) {
        description += '\n\n**Étapes pour reproduire :**\n' + this.ticketForm.stepsToReproduce;
      }
      if (this.ticketForm.expectedBehavior) {
        description += '\n\n**Comportement attendu :**\n' + this.ticketForm.expectedBehavior;
      }
    }

    return description;
  }

  private async uploadFiles(): Promise<any[]> {
    // Simulation d'upload - dans un vrai projet, cela serait géré par un service d'upload
    return this.selectedFiles.map((file, index) => ({
      id: `att-${Date.now()}-${index}`,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      fileUrl: URL.createObjectURL(file), // Simulation
      uploadedAt: new Date()
    }));
  }

  cancel() {
    this.isOpen = false;
    this.selectedFiles = [];
    this.tags = [];
    this.isSubmitting = false;
    this.initializeForm();
  }
} 