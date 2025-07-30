import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { SharedModule } from '../shared/shared.module';
import { UserStatusBarComponent } from '../components/user-status-bar/user-status-bar.component';
import { DocumentsService, TravelDocument, DocumentType, DocumentStatus, DocumentCategory } from '../services/documents.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-documents',
  standalone: true,
  template: `
    <ion-header>
      <app-user-status-bar title="Wallet de Voyage"></app-user-status-bar>
    </ion-header>
    
    <ion-content [fullscreen]="true" class="documents-container">
      <!-- En-tête avec statistiques -->
      <div class="wallet-header">
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon">📄</div>
            <div class="stat-content">
              <h3>Total Documents</h3>
              <p>{{ documents.length }}</p>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">✅</div>
            <div class="stat-content">
              <h3>Valides</h3>
              <p>{{ getValidDocumentsCount() }}</p>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">⭐</div>
            <div class="stat-content">
              <h3>Favoris</h3>
              <p>{{ getFavoriteDocumentsCount() }}</p>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">⚠️</div>
            <div class="stat-content">
              <h3>Expirés</h3>
              <p>{{ getExpiredDocumentsCount() }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Barre de recherche et filtres -->
      <div class="search-section">
        <ion-searchbar 
          [(ngModel)]="searchTerm" 
          placeholder="Rechercher un document..."
          (ionInput)="filterDocuments()"
          class="search-bar">
        </ion-searchbar>
        
        <div class="filter-chips">
          <ion-chip 
            *ngFor="let category of documentCategories" 
            [class.active]="selectedCategory === category.type"
            (click)="selectCategory(category.type)"
            [style.--ion-color-primary]="category.color">
            <ion-icon [name]="category.icon"></ion-icon>
            <ion-label>{{ category.name }} ({{ category.count }})</ion-label>
          </ion-chip>
        </div>
      </div>

      <!-- Boutons d'action -->
      <div class="action-buttons">
        <ion-button expand="block" (click)="addDocument()" class="add-btn">
          <ion-icon name="add" slot="start"></ion-icon>
          Ajouter un Document
        </ion-button>
        <ion-button expand="block" fill="outline" (click)="importDocuments()" class="import-btn">
          <ion-icon name="cloud-upload" slot="start"></ion-icon>
          Importer en Lot
        </ion-button>
      </div>

      <!-- Liste des documents -->
      <div class="documents-list" *ngIf="filteredDocuments.length > 0">
        <div 
          *ngFor="let doc of filteredDocuments; trackBy: trackByDocument" 
          class="document-card"
          [class.favorite]="doc.isFavorite"
          (click)="viewDocument(doc)">
          
          <div class="document-icon" [style.background-color]="documentsService.getCategoryColor(doc.type)">
            <span class="icon">{{ documentsService.getCategoryIcon(doc.type) }}</span>
          </div>
          
          <div class="document-info">
            <h3 class="document-title">{{ doc.title }}</h3>
            <p class="document-description">{{ doc.description }}</p>
            <div class="document-meta">
              <span class="file-name">{{ doc.fileName }}</span>
              <span class="file-size">{{ documentsService.formatFileSize(doc.fileSize) }}</span>
              <span class="upload-date">{{ documentsService.formatDate(doc.uploadDate) }}</span>
            </div>
            <div class="document-tags" *ngIf="doc.tags.length > 0">
              <ion-chip *ngFor="let tag of doc.tags" size="small">
                <ion-label>{{ tag }}</ion-label>
              </ion-chip>
            </div>
          </div>
          
          <div class="document-actions">
            <ion-button 
              fill="clear" 
              size="small" 
              (click)="toggleFavorite(doc, $event)"
              class="favorite-btn">
              <ion-icon 
                [name]="doc.isFavorite ? 'star' : 'star-outline'"
                [color]="doc.isFavorite ? 'warning' : 'medium'">
              </ion-icon>
            </ion-button>
            <ion-button 
              fill="clear" 
              size="small" 
              (click)="downloadDocument(doc, $event)"
              class="download-btn">
              <ion-icon name="download" color="primary"></ion-icon>
            </ion-button>
            <ion-button 
              fill="clear" 
              size="small" 
              (click)="shareDocument(doc, $event)"
              class="share-btn">
              <ion-icon name="share" color="secondary"></ion-icon>
            </ion-button>
          </div>
          
          <div class="document-status" [class]="doc.status">
            <ion-badge [color]="documentsService.getStatusColor(doc.status)">
              {{ documentsService.getStatusText(doc.status) }}
            </ion-badge>
          </div>
        </div>
      </div>

      <!-- État vide -->
      <div class="empty-state" *ngIf="filteredDocuments.length === 0 && !isLoading">
        <div class="empty-icon">📁</div>
        <h2>Aucun document trouvé</h2>
        <p *ngIf="searchTerm || selectedCategory">
          Aucun document ne correspond à vos critères de recherche.
        </p>
        <p *ngIf="!searchTerm && !selectedCategory">
          Commencez par ajouter vos premiers documents de voyage !
        </p>
        <ion-button (click)="addDocument()" fill="outline">
          <ion-icon name="add" slot="start"></ion-icon>
          Ajouter un Document
        </ion-button>
      </div>

      <!-- Loading -->
      <div class="loading-state" *ngIf="isLoading">
        <ion-spinner name="crescent"></ion-spinner>
        <p>Chargement des documents...</p>
      </div>
    </ion-content>
  `,
  styleUrls: ['./documents.page.scss'],
  imports: [SharedModule, UserStatusBarComponent, CommonModule, IonicModule]
})
export class DocumentsPage implements OnInit, OnDestroy {
  documents: TravelDocument[] = [];
  filteredDocuments: TravelDocument[] = [];
  documentCategories: DocumentCategory[] = [];
  searchTerm: string = '';
  selectedCategory: DocumentType | null = null;
  isLoading: boolean = true;

  private subscriptions: Subscription[] = [];

  constructor(public documentsService: DocumentsService) {}

  ngOnInit() {
    this.subscribeToData();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private subscribeToData() {
    // Souscription aux documents
    const documentsSub = this.documentsService.documents$.subscribe(documents => {
      this.documents = documents;
      this.filterDocuments();
    });

    // Souscription aux catégories
    const categoriesSub = this.documentsService.categories$.subscribe(categories => {
      this.documentCategories = categories;
    });

    // Souscription à l'état de chargement
    const loadingSub = this.documentsService.loading$.subscribe(loading => {
      this.isLoading = loading;
    });

    this.subscriptions.push(documentsSub, categoriesSub, loadingSub);
  }

  filterDocuments() {
    this.filteredDocuments = this.documentsService.filterDocuments({
      searchTerm: this.searchTerm,
      category: this.selectedCategory || undefined
    });
  }

  selectCategory(category: DocumentType) {
    this.selectedCategory = this.selectedCategory === category ? null : category;
    this.filterDocuments();
  }

  getValidDocumentsCount(): number {
    return this.documents.filter(doc => doc.status === DocumentStatus.VALID).length;
  }

  getFavoriteDocumentsCount(): number {
    return this.documents.filter(doc => doc.isFavorite).length;
  }

  getExpiredDocumentsCount(): number {
    return this.documents.filter(doc => doc.status === DocumentStatus.EXPIRED).length;
  }

  trackByDocument(index: number, doc: TravelDocument): string {
    return doc.id;
  }

  // Actions sur les documents
  addDocument() {
    console.log('Ajouter un document');
    // TODO: Implémenter la modal d'ajout
  }

  importDocuments() {
    console.log('Importer des documents');
    // TODO: Implémenter l'import en lot
  }

  viewDocument(doc: TravelDocument) {
    console.log('Voir document:', doc);
    // TODO: Implémenter la vue détaillée
  }

  async toggleFavorite(doc: TravelDocument, event: Event) {
    event.stopPropagation();
    try {
      await this.documentsService.toggleFavorite(doc.id);
      console.log('Statut favori mis à jour pour:', doc.title);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du favori:', error);
    }
  }

  downloadDocument(doc: TravelDocument, event: Event) {
    event.stopPropagation();
    console.log('Télécharger:', doc.fileName);
    // TODO: Implémenter le téléchargement
  }

  shareDocument(doc: TravelDocument, event: Event) {
    event.stopPropagation();
    console.log('Partager:', doc.fileName);
    // TODO: Implémenter le partage
  }
} 