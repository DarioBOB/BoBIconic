import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

// Interfaces pour les documents de voyage
export interface TravelDocument {
  id: string;
  type: DocumentType;
  title: string;
  description: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  uploadDate: Date;
  tripId?: string;
  tripName?: string;
  status: DocumentStatus;
  tags: string[];
  isFavorite: boolean;
  metadata?: {
    issueDate?: Date;
    expiryDate?: Date;
    issuer?: string;
    reference?: string;
    amount?: number;
    currency?: string;
  };
}

export enum DocumentType {
  VOUCHER = 'voucher',
  RESERVATION = 'reservation',
  INSURANCE = 'insurance',
  TICKET = 'ticket',
  PASSPORT = 'passport',
  VISA = 'visa',
  HOTEL = 'hotel',
  CAR_RENTAL = 'car_rental',
  ACTIVITY = 'activity',
  OTHER = 'other'
}

export enum DocumentStatus {
  VALID = 'valid',
  EXPIRED = 'expired',
  PENDING = 'pending',
  CANCELLED = 'cancelled'
}

export interface DocumentCategory {
  type: DocumentType;
  name: string;
  icon: string;
  color: string;
  count: number;
}

export interface DocumentFilter {
  searchTerm?: string;
  category?: DocumentType;
  status?: DocumentStatus;
  tripId?: string;
  isFavorite?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class DocumentsService {
  private documentsSubject = new BehaviorSubject<TravelDocument[]>([]);
  private categoriesSubject = new BehaviorSubject<DocumentCategory[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);

  public documents$ = this.documentsSubject.asObservable();
  public categories$ = this.categoriesSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();

  constructor() {
    this.initializeCategories();
    this.loadDocuments();
  }

  // Initialisation des catégories
  private initializeCategories() {
    const categories: DocumentCategory[] = [
      { type: DocumentType.VOUCHER, name: 'Vouchers', icon: 'card', color: '#4CAF50', count: 0 },
      { type: DocumentType.TICKET, name: 'Billets', icon: 'airplane', color: '#2196F3', count: 0 },
      { type: DocumentType.INSURANCE, name: 'Assurances', icon: 'shield-checkmark', color: '#FF9800', count: 0 },
      { type: DocumentType.RESERVATION, name: 'Réservations', icon: 'calendar', color: '#9C27B0', count: 0 },
      { type: DocumentType.PASSPORT, name: 'Identité', icon: 'person', color: '#607D8B', count: 0 },
      { type: DocumentType.VISA, name: 'Visas', icon: 'passport', color: '#E91E63', count: 0 },
      { type: DocumentType.HOTEL, name: 'Hôtels', icon: 'bed', color: '#795548', count: 0 },
      { type: DocumentType.CAR_RENTAL, name: 'Location', icon: 'car', color: '#FF5722', count: 0 },
      { type: DocumentType.ACTIVITY, name: 'Activités', icon: 'bicycle', color: '#00BCD4', count: 0 },
      { type: DocumentType.OTHER, name: 'Autres', icon: 'document', color: '#757575', count: 0 }
    ];
    this.categoriesSubject.next(categories);
  }

  // Chargement des documents
  private loadDocuments() {
    this.loadingSubject.next(true);
    
    // Simulation d'un appel API
    setTimeout(() => {
      const documents = this.generateSampleDocuments();
      this.documentsSubject.next(documents);
      this.updateCategoryCounts();
      this.loadingSubject.next(false);
    }, 1000);
  }

  // Génération de documents de démonstration
  private generateSampleDocuments(): TravelDocument[] {
    return [
      {
        id: '1',
        type: DocumentType.VOUCHER,
        title: 'Voucher Hôtel Athènes',
        description: 'Réservation hôtel 4 étoiles au centre d\'Athènes',
        fileName: 'voucher_hotel_athenes.pdf',
        fileUrl: '/assets/documents/voucher_hotel_athenes.pdf',
        fileSize: 245760,
        uploadDate: new Date('2024-01-15'),
        tripId: 'trip-1',
        tripName: 'Voyage Athènes',
        status: DocumentStatus.VALID,
        tags: ['hôtel', 'athènes', 'grèce'],
        isFavorite: true,
        metadata: {
          issueDate: new Date('2024-01-10'),
          expiryDate: new Date('2024-02-15'),
          issuer: 'Booking.com',
          reference: 'BK123456789',
          amount: 450,
          currency: 'EUR'
        }
      },
      {
        id: '2',
        type: DocumentType.TICKET,
        title: 'Billet d\'avion Paris-Athènes',
        description: 'Vol aller-retour Air France',
        fileName: 'billet_paris_athenes.pdf',
        fileUrl: '/assets/documents/billet_paris_athenes.pdf',
        fileSize: 512000,
        uploadDate: new Date('2024-01-12'),
        tripId: 'trip-1',
        tripName: 'Voyage Athènes',
        status: DocumentStatus.VALID,
        tags: ['avion', 'air france', 'paris'],
        isFavorite: false,
        metadata: {
          issueDate: new Date('2024-01-08'),
          expiryDate: new Date('2024-02-20'),
          issuer: 'Air France',
          reference: 'AF789456123',
          amount: 320,
          currency: 'EUR'
        }
      },
      {
        id: '3',
        type: DocumentType.INSURANCE,
        title: 'Assurance Voyage Européenne',
        description: 'Couverture complète pour l\'Europe',
        fileName: 'assurance_voyage.pdf',
        fileUrl: '/assets/documents/assurance_voyage.pdf',
        fileSize: 1024000,
        uploadDate: new Date('2024-01-10'),
        tripId: 'trip-1',
        tripName: 'Voyage Athènes',
        status: DocumentStatus.VALID,
        tags: ['assurance', 'europe', 'santé'],
        isFavorite: true,
        metadata: {
          issueDate: new Date('2024-01-05'),
          expiryDate: new Date('2024-12-31'),
          issuer: 'Allianz',
          reference: 'AL987654321',
          amount: 89,
          currency: 'EUR'
        }
      },
      {
        id: '4',
        type: DocumentType.PASSPORT,
        title: 'Passeport Français',
        description: 'Passeport biométrique en cours de validité',
        fileName: 'passeport.pdf',
        fileUrl: '/assets/documents/passeport.pdf',
        fileSize: 2048000,
        uploadDate: new Date('2024-01-05'),
        status: DocumentStatus.VALID,
        tags: ['identité', 'passeport', 'biométrique'],
        isFavorite: true,
        metadata: {
          issueDate: new Date('2022-06-15'),
          expiryDate: new Date('2032-06-15'),
          issuer: 'Préfecture de Police'
        }
      },
      {
        id: '5',
        type: DocumentType.RESERVATION,
        title: 'Réservation Restaurant Athènes',
        description: 'Dîner au restaurant traditionnel grec',
        fileName: 'reservation_restaurant.pdf',
        fileUrl: '/assets/documents/reservation_restaurant.pdf',
        fileSize: 153600,
        uploadDate: new Date('2024-01-14'),
        tripId: 'trip-1',
        tripName: 'Voyage Athènes',
        status: DocumentStatus.VALID,
        tags: ['restaurant', 'dîner', 'traditionnel'],
        isFavorite: false,
        metadata: {
          issueDate: new Date('2024-01-14'),
          expiryDate: new Date('2024-02-15'),
          issuer: 'Restaurant Athéna',
          reference: 'RES456789',
          amount: 85,
          currency: 'EUR'
        }
      },
      {
        id: '6',
        type: DocumentType.CAR_RENTAL,
        title: 'Location Voiture Athènes',
        description: 'Location voiture pour 3 jours',
        fileName: 'location_voiture.pdf',
        fileUrl: '/assets/documents/location_voiture.pdf',
        fileSize: 307200,
        uploadDate: new Date('2024-01-13'),
        tripId: 'trip-1',
        tripName: 'Voyage Athènes',
        status: DocumentStatus.VALID,
        tags: ['voiture', 'location', 'transport'],
        isFavorite: false,
        metadata: {
          issueDate: new Date('2024-01-13'),
          expiryDate: new Date('2024-02-15'),
          issuer: 'Hertz',
          reference: 'HZ789123',
          amount: 120,
          currency: 'EUR'
        }
      },
      {
        id: '7',
        type: DocumentType.ACTIVITY,
        title: 'Visite Acropole',
        description: 'Billet d\'entrée pour l\'Acropole d\'Athènes',
        fileName: 'billet_acropole.pdf',
        fileUrl: '/assets/documents/billet_acropole.pdf',
        fileSize: 102400,
        uploadDate: new Date('2024-01-16'),
        tripId: 'trip-1',
        tripName: 'Voyage Athènes',
        status: DocumentStatus.VALID,
        tags: ['visite', 'acropole', 'culture'],
        isFavorite: true,
        metadata: {
          issueDate: new Date('2024-01-16'),
          expiryDate: new Date('2024-02-15'),
          issuer: 'Ministère de la Culture Grec',
          reference: 'ACR456789',
          amount: 20,
          currency: 'EUR'
        }
      }
    ];
  }

  // Mise à jour des compteurs de catégories
  private updateCategoryCounts() {
    const documents = this.documentsSubject.value;
    const categories = this.categoriesSubject.value.map(category => ({
      ...category,
      count: documents.filter(doc => doc.type === category.type).length
    }));
    this.categoriesSubject.next(categories);
  }

  // Méthodes publiques

  // Obtenir tous les documents
  getDocuments(): Observable<TravelDocument[]> {
    return this.documents$;
  }

  // Obtenir les catégories
  getCategories(): Observable<DocumentCategory[]> {
    return this.categories$;
  }

  // Obtenir l'état de chargement
  getLoadingState(): Observable<boolean> {
    return this.loading$;
  }

  // Filtrer les documents
  filterDocuments(filter: DocumentFilter): TravelDocument[] {
    const documents = this.documentsSubject.value;
    
    return documents.filter(doc => {
      // Filtre par terme de recherche
      if (filter.searchTerm) {
        const searchLower = filter.searchTerm.toLowerCase();
        const matchesSearch = 
          doc.title.toLowerCase().includes(searchLower) ||
          doc.description.toLowerCase().includes(searchLower) ||
          doc.tags.some(tag => tag.toLowerCase().includes(searchLower));
        if (!matchesSearch) return false;
      }

      // Filtre par catégorie
      if (filter.category && doc.type !== filter.category) {
        return false;
      }

      // Filtre par statut
      if (filter.status && doc.status !== filter.status) {
        return false;
      }

      // Filtre par voyage
      if (filter.tripId && doc.tripId !== filter.tripId) {
        return false;
      }

      // Filtre par favoris
      if (filter.isFavorite !== undefined && doc.isFavorite !== filter.isFavorite) {
        return false;
      }

      // Filtre par date
      if (filter.dateFrom && doc.uploadDate < filter.dateFrom) {
        return false;
      }
      if (filter.dateTo && doc.uploadDate > filter.dateTo) {
        return false;
      }

      return true;
    });
  }

  // Obtenir un document par ID
  getDocumentById(id: string): TravelDocument | undefined {
    return this.documentsSubject.value.find(doc => doc.id === id);
  }

  // Ajouter un document
  addDocument(document: Omit<TravelDocument, 'id' | 'uploadDate'>): Promise<TravelDocument> {
    return new Promise((resolve) => {
      const newDocument: TravelDocument = {
        ...document,
        id: this.generateId(),
        uploadDate: new Date()
      };

      const currentDocuments = this.documentsSubject.value;
      const updatedDocuments = [...currentDocuments, newDocument];
      
      this.documentsSubject.next(updatedDocuments);
      this.updateCategoryCounts();
      
      resolve(newDocument);
    });
  }

  // Mettre à jour un document
  updateDocument(id: string, updates: Partial<TravelDocument>): Promise<TravelDocument> {
    return new Promise((resolve, reject) => {
      const currentDocuments = this.documentsSubject.value;
      const documentIndex = currentDocuments.findIndex(doc => doc.id === id);
      
      if (documentIndex === -1) {
        reject(new Error('Document non trouvé'));
        return;
      }

      const updatedDocument = { ...currentDocuments[documentIndex], ...updates };
      const updatedDocuments = [...currentDocuments];
      updatedDocuments[documentIndex] = updatedDocument;
      
      this.documentsSubject.next(updatedDocuments);
      this.updateCategoryCounts();
      
      resolve(updatedDocument);
    });
  }

  // Supprimer un document
  deleteDocument(id: string): Promise<void> {
    return new Promise((resolve) => {
      const currentDocuments = this.documentsSubject.value;
      const updatedDocuments = currentDocuments.filter(doc => doc.id !== id);
      
      this.documentsSubject.next(updatedDocuments);
      this.updateCategoryCounts();
      
      resolve();
    });
  }

  // Basculer le statut favori
  toggleFavorite(id: string): Promise<TravelDocument> {
    const document = this.getDocumentById(id);
    if (!document) {
      return Promise.reject(new Error('Document non trouvé'));
    }
    
    return this.updateDocument(id, { isFavorite: !document.isFavorite });
  }

  // Obtenir les statistiques
  getStatistics() {
    const documents = this.documentsSubject.value;
    
    return {
      total: documents.length,
      valid: documents.filter(doc => doc.status === DocumentStatus.VALID).length,
      expired: documents.filter(doc => doc.status === DocumentStatus.EXPIRED).length,
      pending: documents.filter(doc => doc.status === DocumentStatus.PENDING).length,
      cancelled: documents.filter(doc => doc.status === DocumentStatus.CANCELLED).length,
      favorites: documents.filter(doc => doc.isFavorite).length,
      totalSize: documents.reduce((sum, doc) => sum + doc.fileSize, 0)
    };
  }

  // Obtenir les documents par voyage
  getDocumentsByTrip(tripId: string): TravelDocument[] {
    return this.documentsSubject.value.filter(doc => doc.tripId === tripId);
  }

  // Obtenir les documents favoris
  getFavoriteDocuments(): TravelDocument[] {
    return this.documentsSubject.value.filter(doc => doc.isFavorite);
  }

  // Obtenir les documents expirés
  getExpiredDocuments(): TravelDocument[] {
    return this.documentsSubject.value.filter(doc => doc.status === DocumentStatus.EXPIRED);
  }

  // Obtenir les documents expirant bientôt (dans les 30 jours)
  getExpiringSoonDocuments(): TravelDocument[] {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    
    return this.documentsSubject.value.filter(doc => {
      if (!doc.metadata?.expiryDate) return false;
      return doc.metadata.expiryDate <= thirtyDaysFromNow && doc.status === DocumentStatus.VALID;
    });
  }

  // Générer un ID unique
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Méthodes utilitaires
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  getCategoryColor(type: DocumentType): string {
    const categories = this.categoriesSubject.value;
    const category = categories.find(cat => cat.type === type);
    return category?.color || '#757575';
  }

  getCategoryIcon(type: DocumentType): string {
    const icons: { [key in DocumentType]: string } = {
      [DocumentType.VOUCHER]: '🎫',
      [DocumentType.TICKET]: '✈️',
      [DocumentType.INSURANCE]: '🛡️',
      [DocumentType.RESERVATION]: '📅',
      [DocumentType.PASSPORT]: '📖',
      [DocumentType.VISA]: '🛂',
      [DocumentType.HOTEL]: '🏨',
      [DocumentType.CAR_RENTAL]: '🚗',
      [DocumentType.ACTIVITY]: '🎯',
      [DocumentType.OTHER]: '📄'
    };
    return icons[type] || '📄';
  }

  getStatusColor(status: DocumentStatus): string {
    const colors: { [key in DocumentStatus]: string } = {
      [DocumentStatus.VALID]: 'success',
      [DocumentStatus.EXPIRED]: 'danger',
      [DocumentStatus.PENDING]: 'warning',
      [DocumentStatus.CANCELLED]: 'medium'
    };
    return colors[status];
  }

  getStatusText(status: DocumentStatus): string {
    const texts: { [key in DocumentStatus]: string } = {
      [DocumentStatus.VALID]: 'Valide',
      [DocumentStatus.EXPIRED]: 'Expiré',
      [DocumentStatus.PENDING]: 'En attente',
      [DocumentStatus.CANCELLED]: 'Annulé'
    };
    return texts[status];
  }
} 