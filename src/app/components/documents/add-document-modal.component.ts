import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { DocumentsService, DocumentType, DocumentStatus } from '../../services/documents.service';

@Component({
  selector: 'app-add-document-modal',
  standalone: true,
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Ajouter un Document</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="cancel()">Annuler</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <form [formGroup]="documentForm" (ngSubmit)="onSubmit()">
        <!-- Type de document -->
        <ion-item>
          <ion-label position="stacked">Type de Document *</ion-label>
          <ion-select formControlName="type" placeholder="Sélectionner un type">
            <ion-select-option value="voucher">🎫 Voucher</ion-select-option>
            <ion-select-option value="ticket">✈️ Billet</ion-select-option>
            <ion-select-option value="insurance">🛡️ Assurance</ion-select-option>
            <ion-select-option value="reservation">📅 Réservation</ion-select-option>
            <ion-select-option value="passport">📖 Passeport</ion-select-option>
            <ion-select-option value="visa">🛂 Visa</ion-select-option>
            <ion-select-option value="hotel">🏨 Hôtel</ion-select-option>
            <ion-select-option value="car_rental">🚗 Location de voiture</ion-select-option>
            <ion-select-option value="activity">🎯 Activité</ion-select-option>
            <ion-select-option value="other">📄 Autre</ion-select-option>
          </ion-select>
        </ion-item>

        <!-- Titre -->
        <ion-item>
          <ion-label position="stacked">Titre *</ion-label>
          <ion-input formControlName="title" placeholder="Ex: Billet d'avion Paris-Rome"></ion-input>
        </ion-item>

        <!-- Description -->
        <ion-item>
          <ion-label position="stacked">Description</ion-label>
          <ion-textarea 
            formControlName="description" 
            placeholder="Description détaillée du document"
            rows="3">
          </ion-textarea>
        </ion-item>

        <!-- Fichier -->
        <ion-item>
          <ion-label position="stacked">Fichier *</ion-label>
          <ion-button fill="outline" (click)="selectFile()">
            <ion-icon name="cloud-upload" slot="start"></ion-icon>
            Sélectionner un fichier
          </ion-button>
          <div *ngIf="selectedFile" class="file-info">
            <ion-icon name="document" color="primary"></ion-icon>
            <span>{{ selectedFile.name }}</span>
            <span class="file-size">({{ formatFileSize(selectedFile.size) }})</span>
          </div>
        </ion-item>

        <!-- Voyage associé -->
        <ion-item>
          <ion-label position="stacked">Voyage associé</ion-label>
          <ion-select formControlName="tripId" placeholder="Sélectionner un voyage (optionnel)">
            <ion-select-option value="trip-1">Voyage Athènes</ion-select-option>
            <ion-select-option value="trip-2">Voyage Rome</ion-select-option>
            <ion-select-option value="trip-3">Voyage Londres</ion-select-option>
          </ion-select>
        </ion-item>

        <!-- Statut -->
        <ion-item>
          <ion-label position="stacked">Statut</ion-label>
          <ion-select formControlName="status" placeholder="Statut du document">
            <ion-select-option value="valid">✅ Valide</ion-select-option>
            <ion-select-option value="pending">⏳ En attente</ion-select-option>
            <ion-select-option value="expired">❌ Expiré</ion-select-option>
            <ion-select-option value="cancelled">🚫 Annulé</ion-select-option>
          </ion-select>
        </ion-item>

        <!-- Tags -->
        <ion-item>
          <ion-label position="stacked">Tags</ion-label>
          <ion-input 
            formControlName="tagsInput" 
            placeholder="Tags séparés par des virgules"
            (ionBlur)="updateTags()">
          </ion-input>
        </ion-item>

        <!-- Métadonnées -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>Métadonnées (optionnel)</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <ion-item>
              <ion-label position="stacked">Émetteur</ion-label>
              <ion-input formControlName="issuer" placeholder="Ex: Air France"></ion-input>
            </ion-item>

            <ion-item>
              <ion-label position="stacked">Référence</ion-label>
              <ion-input formControlName="reference" placeholder="Numéro de référence"></ion-input>
            </ion-item>

            <ion-item>
              <ion-label position="stacked">Montant</ion-label>
              <ion-input 
                type="number" 
                formControlName="amount" 
                placeholder="0.00">
              </ion-input>
            </ion-item>

            <ion-item>
              <ion-label position="stacked">Devise</ion-label>
              <ion-select formControlName="currency" placeholder="Devise">
                <ion-select-option value="EUR">EUR</ion-select-option>
                <ion-select-option value="USD">USD</ion-select-option>
                <ion-select-option value="GBP">GBP</ion-select-option>
                <ion-select-option value="JPY">JPY</ion-select-option>
              </ion-select>
            </ion-item>

            <ion-item>
              <ion-label position="stacked">Date d'émission</ion-label>
              <ion-input 
                type="date" 
                formControlName="issueDate">
              </ion-input>
            </ion-item>

            <ion-item>
              <ion-label position="stacked">Date d'expiration</ion-label>
              <ion-input 
                type="date" 
                formControlName="expiryDate">
              </ion-input>
            </ion-item>
          </ion-card-content>
        </ion-card>

        <!-- Boutons d'action -->
        <div class="action-buttons">
          <ion-button 
            expand="block" 
            type="submit" 
            [disabled]="!documentForm.valid || !selectedFile"
            class="submit-btn">
            <ion-icon name="save" slot="start"></ion-icon>
            Ajouter le Document
          </ion-button>
        </div>
      </form>
    </ion-content>
  `,
  styleUrls: ['./add-document-modal.component.scss'],
  imports: [CommonModule, IonicModule, FormsModule]
})
export class AddDocumentModalComponent {
  @Input() isOpen: boolean = false;

  documentForm: any;
  selectedFile: File | null = null;
  tags: string[] = [];

  constructor(private documentsService: DocumentsService) {
    this.initializeForm();
  }

  private initializeForm() {
    this.documentForm = {
      type: DocumentType.OTHER,
      title: '',
      description: '',
      tripId: '',
      status: DocumentStatus.VALID,
      tagsInput: '',
      issuer: '',
      reference: '',
      amount: null,
      currency: 'EUR',
      issueDate: '',
      expiryDate: ''
    };
  }

  selectFile() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.jpg,.jpeg,.png,.doc,.docx';
    
    input.onchange = (event: any) => {
      const file = event.target.files[0];
      if (file) {
        this.selectedFile = file;
        // Mettre à jour le nom du fichier dans le formulaire
        this.documentForm.title = this.documentForm.title || file.name.replace(/\.[^/.]+$/, "");
      }
    };
    
    input.click();
  }

  updateTags() {
    const tagsInput = this.documentForm.tagsInput;
    if (tagsInput) {
      this.tags = tagsInput.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag.length > 0);
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  async onSubmit() {
    if (!this.documentForm.valid || !this.selectedFile) {
      return;
    }

    try {
      const documentData = {
        type: this.documentForm.type,
        title: this.documentForm.title,
        description: this.documentForm.description,
        fileName: this.selectedFile.name,
        fileUrl: URL.createObjectURL(this.selectedFile), // Simulation
        fileSize: this.selectedFile.size,
        tripId: this.documentForm.tripId || undefined,
        tripName: this.getTripName(this.documentForm.tripId),
        status: this.documentForm.status,
        tags: this.tags,
        isFavorite: false,
        metadata: {
          issuer: this.documentForm.issuer || undefined,
          reference: this.documentForm.reference || undefined,
          amount: this.documentForm.amount || undefined,
          currency: this.documentForm.currency || undefined,
          issueDate: this.documentForm.issueDate ? new Date(this.documentForm.issueDate) : undefined,
          expiryDate: this.documentForm.expiryDate ? new Date(this.documentForm.expiryDate) : undefined
        }
      };

      await this.documentsService.addDocument(documentData);
      console.log('Document ajouté avec succès');
      this.cancel();
    } catch (error) {
      console.error('Erreur lors de l\'ajout du document:', error);
    }
  }

  private getTripName(tripId: string): string | undefined {
    const tripNames: { [key: string]: string } = {
      'trip-1': 'Voyage Athènes',
      'trip-2': 'Voyage Rome',
      'trip-3': 'Voyage Londres'
    };
    return tripNames[tripId];
  }

  cancel() {
    this.isOpen = false;
    this.selectedFile = null;
    this.tags = [];
    this.initializeForm();
  }
} 