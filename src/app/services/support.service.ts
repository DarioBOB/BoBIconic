import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

// Interfaces pour les tickets de support
export interface SupportTicket {
  id: string;
  title: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  userId: string;
  userName: string;
  userEmail: string;
  createdAt: Date;
  updatedAt: Date;
  assignedTo?: string;
  assignedToName?: string;
  resolution?: string;
  resolvedAt?: Date;
  attachments: TicketAttachment[];
  tags: string[];
  browserInfo?: {
    userAgent: string;
    platform: string;
    language: string;
    screenResolution: string;
  };
  appInfo?: {
    version: string;
    build: string;
    platform: 'web' | 'ios' | 'android';
  };
}

export interface TicketAttachment {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  fileUrl: string;
  uploadedAt: Date;
}

export enum TicketCategory {
  BUG = 'bug',
  FEATURE_REQUEST = 'feature_request',
  GENERAL_INQUIRY = 'general_inquiry',
  TECHNICAL_ISSUE = 'technical_issue',
  ACCOUNT_ISSUE = 'account_issue',
  BILLING_ISSUE = 'billing_issue',
  OTHER = 'other'
}

export enum TicketPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export enum TicketStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  WAITING_FOR_USER = 'waiting_for_user',
  RESOLVED = 'resolved',
  CLOSED = 'closed'
}

export interface TicketFilter {
  status?: TicketStatus;
  priority?: TicketPriority;
  category?: TicketCategory;
  assignedTo?: string;
  dateFrom?: Date;
  dateTo?: Date;
  searchTerm?: string;
}

export interface TicketStatistics {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
  urgent: number;
  high: number;
  medium: number;
  low: number;
}

@Injectable({
  providedIn: 'root'
})
export class SupportService {
  private ticketsSubject = new BehaviorSubject<SupportTicket[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private statisticsSubject = new BehaviorSubject<TicketStatistics>({
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0,
    closed: 0,
    urgent: 0,
    high: 0,
    medium: 0,
    low: 0
  });

  public tickets$ = this.ticketsSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();
  public statistics$ = this.statisticsSubject.asObservable();

  constructor() {
    console.log('SupportService: Initialisation du service');
    this.loadTickets();
  }

  // Chargement des tickets
  private loadTickets() {
    console.log('SupportService: Début du chargement des tickets');
    this.loadingSubject.next(true);
    
    // Simulation d'un appel API
    setTimeout(() => {
      console.log('SupportService: Génération des tickets de démonstration');
      const tickets = this.generateSampleTickets();
      console.log('SupportService: Tickets générés:', tickets.length);
      this.ticketsSubject.next(tickets);
      this.updateStatistics();
      this.loadingSubject.next(false);
      console.log('SupportService: Chargement terminé');
    }, 1000);
  }

  // Génération de tickets de démonstration
  private generateSampleTickets(): SupportTicket[] {
    return [
      {
        id: 'TICKET-001',
        title: 'Problème de connexion à l\'application',
        description: 'Je n\'arrive pas à me connecter à l\'application depuis hier. L\'écran reste bloqué sur la page de connexion avec un message d\'erreur "Connexion impossible". J\'ai essayé de redémarrer l\'application et de vider le cache mais le problème persiste.',
        category: TicketCategory.TECHNICAL_ISSUE,
        priority: TicketPriority.HIGH,
        status: TicketStatus.IN_PROGRESS,
        userId: 'user-1',
        userName: 'Jean Dupont',
        userEmail: 'jean.dupont@email.com',
        createdAt: new Date('2024-01-15T10:30:00'),
        updatedAt: new Date('2024-01-16T14:20:00'),
        assignedTo: 'support-1',
        assignedToName: 'Marie Support',
        attachments: [
          {
            id: 'att-1',
            fileName: 'screenshot_error.png',
            fileSize: 245760,
            fileType: 'image/png',
            fileUrl: '/assets/support/screenshot_error.png',
            uploadedAt: new Date('2024-01-15T10:35:00')
          }
        ],
        tags: ['connexion', 'erreur', 'blocage'],
        browserInfo: {
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          platform: 'Windows 10',
          language: 'fr-FR',
          screenResolution: '1920x1080'
        },
        appInfo: {
          version: '1.2.3',
          build: '20240115',
          platform: 'web'
        }
      },
      {
        id: 'TICKET-002',
        title: 'Demande d\'ajout de fonctionnalité pour les voyages',
        description: 'Il serait très utile d\'ajouter une fonctionnalité pour exporter les voyages en format PDF. Cela permettrait de partager facilement nos itinéraires avec des amis ou de les imprimer pour les garder en version papier.',
        category: TicketCategory.FEATURE_REQUEST,
        priority: TicketPriority.MEDIUM,
        status: TicketStatus.OPEN,
        userId: 'user-2',
        userName: 'Sophie Martin',
        userEmail: 'sophie.martin@email.com',
        createdAt: new Date('2024-01-14T16:45:00'),
        updatedAt: new Date('2024-01-14T16:45:00'),
        attachments: [],
        tags: ['fonctionnalité', 'export', 'pdf', 'voyage'],
        browserInfo: {
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          platform: 'macOS',
          language: 'fr-FR',
          screenResolution: '2560x1600'
        },
        appInfo: {
          version: '1.2.3',
          build: '20240115',
          platform: 'web'
        }
      },
      {
        id: 'TICKET-003',
        title: 'Bug dans le jeu 4096 - tuiles qui disparaissent',
        description: 'Dans le jeu 4096, parfois les tuiles disparaissent de manière inattendue après une fusion. Cela se produit environ 1 fois sur 10 parties. J\'ai perdu plusieurs parties à cause de ce bug.',
        category: TicketCategory.BUG,
        priority: TicketPriority.HIGH,
        status: TicketStatus.OPEN,
        userId: 'user-3',
        userName: 'Pierre Durand',
        userEmail: 'pierre.durand@email.com',
        createdAt: new Date('2024-01-13T09:15:00'),
        updatedAt: new Date('2024-01-13T09:15:00'),
        attachments: [
          {
            id: 'att-2',
            fileName: 'bug_4096.mp4',
            fileSize: 2048000,
            fileType: 'video/mp4',
            fileUrl: '/assets/support/bug_4096.mp4',
            uploadedAt: new Date('2024-01-13T09:20:00')
          }
        ],
        tags: ['jeu', '4096', 'bug', 'tuiles'],
        browserInfo: {
          userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
          platform: 'iOS',
          language: 'fr-FR',
          screenResolution: '390x844'
        },
        appInfo: {
          version: '1.2.3',
          build: '20240115',
          platform: 'ios'
        }
      },
      {
        id: 'TICKET-004',
        title: 'Problème de synchronisation des documents',
        description: 'Les documents que j\'ai ajoutés sur mon téléphone ne s\'affichent pas sur la version web de l\'application. La synchronisation semble ne pas fonctionner correctement.',
        category: TicketCategory.TECHNICAL_ISSUE,
        priority: TicketPriority.MEDIUM,
        status: TicketStatus.WAITING_FOR_USER,
        userId: 'user-4',
        userName: 'Emma Bernard',
        userEmail: 'emma.bernard@email.com',
        createdAt: new Date('2024-01-12T11:30:00'),
        updatedAt: new Date('2024-01-15T10:00:00'),
        assignedTo: 'support-2',
        assignedToName: 'Thomas Tech',
        resolution: 'Nous avons identifié le problème de synchronisation. Pouvez-vous vérifier que vous êtes bien connecté avec le même compte sur les deux appareils ?',
        attachments: [],
        tags: ['synchronisation', 'documents', 'multi-appareils'],
        browserInfo: {
          userAgent: 'Mozilla/5.0 (Linux; Android 13; SM-G991B) AppleWebKit/537.36',
          platform: 'Android',
          language: 'fr-FR',
          screenResolution: '1080x2400'
        },
        appInfo: {
          version: '1.2.3',
          build: '20240115',
          platform: 'android'
        }
      },
      {
        id: 'TICKET-005',
        title: 'Question sur l\'utilisation des filtres de recherche',
        description: 'Je ne comprends pas comment utiliser les filtres avancés dans la recherche de vols. Pouvez-vous m\'expliquer comment filtrer par compagnie aérienne et par prix ?',
        category: TicketCategory.GENERAL_INQUIRY,
        priority: TicketPriority.LOW,
        status: TicketStatus.RESOLVED,
        userId: 'user-5',
        userName: 'Lucas Moreau',
        userEmail: 'lucas.moreau@email.com',
        createdAt: new Date('2024-01-10T14:20:00'),
        updatedAt: new Date('2024-01-11T09:30:00'),
        assignedTo: 'support-1',
        assignedToName: 'Marie Support',
        resolution: 'Voici un guide détaillé sur l\'utilisation des filtres : [lien vers la documentation]. Les filtres par compagnie se trouvent dans l\'onglet "Compagnies" et les filtres de prix dans "Prix".',
        resolvedAt: new Date('2024-01-11T09:30:00'),
        attachments: [],
        tags: ['aide', 'filtres', 'recherche'],
        browserInfo: {
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          platform: 'Windows 11',
          language: 'fr-FR',
          screenResolution: '1920x1080'
        },
        appInfo: {
          version: '1.2.3',
          build: '20240115',
          platform: 'web'
        }
      }
    ];
  }

  // Mise à jour des statistiques
  private updateStatistics() {
    const tickets = this.ticketsSubject.value;
    
    const statistics: TicketStatistics = {
      total: tickets.length,
      open: tickets.filter(t => t.status === TicketStatus.OPEN).length,
      inProgress: tickets.filter(t => t.status === TicketStatus.IN_PROGRESS).length,
      resolved: tickets.filter(t => t.status === TicketStatus.RESOLVED).length,
      closed: tickets.filter(t => t.status === TicketStatus.CLOSED).length,
      urgent: tickets.filter(t => t.priority === TicketPriority.URGENT).length,
      high: tickets.filter(t => t.priority === TicketPriority.HIGH).length,
      medium: tickets.filter(t => t.priority === TicketPriority.MEDIUM).length,
      low: tickets.filter(t => t.priority === TicketPriority.LOW).length
    };
    
    this.statisticsSubject.next(statistics);
  }

  // Méthodes publiques

  // Obtenir tous les tickets
  getTickets(): Observable<SupportTicket[]> {
    return this.tickets$;
  }

  // Obtenir les statistiques
  getStatistics(): Observable<TicketStatistics> {
    return this.statistics$;
  }

  // Obtenir l'état de chargement
  getLoadingState(): Observable<boolean> {
    return this.loading$;
  }

  // Filtrer les tickets
  filterTickets(filter: TicketFilter): SupportTicket[] {
    const tickets = this.ticketsSubject.value;
    
    return tickets.filter(ticket => {
      // Filtre par statut
      if (filter.status && ticket.status !== filter.status) {
        return false;
      }

      // Filtre par priorité
      if (filter.priority && ticket.priority !== filter.priority) {
        return false;
      }

      // Filtre par catégorie
      if (filter.category && ticket.category !== filter.category) {
        return false;
      }

      // Filtre par assigné
      if (filter.assignedTo && ticket.assignedTo !== filter.assignedTo) {
        return false;
      }

      // Filtre par date
      if (filter.dateFrom && ticket.createdAt < filter.dateFrom) {
        return false;
      }
      if (filter.dateTo && ticket.createdAt > filter.dateTo) {
        return false;
      }

      // Filtre par terme de recherche
      if (filter.searchTerm) {
        const searchLower = filter.searchTerm.toLowerCase();
        const matchesSearch = 
          ticket.title.toLowerCase().includes(searchLower) ||
          ticket.description.toLowerCase().includes(searchLower) ||
          ticket.tags.some(tag => tag.toLowerCase().includes(searchLower));
        if (!matchesSearch) return false;
      }

      return true;
    });
  }

  // Obtenir un ticket par ID
  getTicketById(id: string): SupportTicket | undefined {
    return this.ticketsSubject.value.find(ticket => ticket.id === id);
  }

  // Créer un nouveau ticket
  createTicket(ticketData: Omit<SupportTicket, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<SupportTicket> {
    return new Promise((resolve) => {
      const newTicket: SupportTicket = {
        ...ticketData,
        id: this.generateTicketId(),
        createdAt: new Date(),
        updatedAt: new Date(),
        status: TicketStatus.OPEN
      };

      const currentTickets = this.ticketsSubject.value;
      const updatedTickets = [...currentTickets, newTicket];
      
      this.ticketsSubject.next(updatedTickets);
      this.updateStatistics();
      
      resolve(newTicket);
    });
  }

  // Mettre à jour un ticket
  updateTicket(id: string, updates: Partial<SupportTicket>): Promise<SupportTicket> {
    return new Promise((resolve, reject) => {
      const currentTickets = this.ticketsSubject.value;
      const ticketIndex = currentTickets.findIndex(ticket => ticket.id === id);
      
      if (ticketIndex === -1) {
        reject(new Error('Ticket non trouvé'));
        return;
      }

      const updatedTicket = { 
        ...currentTickets[ticketIndex], 
        ...updates, 
        updatedAt: new Date() 
      };
      const updatedTickets = [...currentTickets];
      updatedTickets[ticketIndex] = updatedTicket;
      
      this.ticketsSubject.next(updatedTickets);
      this.updateStatistics();
      
      resolve(updatedTicket);
    });
  }

  // Fermer un ticket
  closeTicket(id: string, resolution?: string): Promise<SupportTicket> {
    return this.updateTicket(id, {
      status: TicketStatus.CLOSED,
      resolution: resolution || 'Ticket fermé par l\'utilisateur',
      resolvedAt: new Date()
    });
  }

  // Réouvrir un ticket
  reopenTicket(id: string): Promise<SupportTicket> {
    return this.updateTicket(id, {
      status: TicketStatus.OPEN,
      resolution: undefined,
      resolvedAt: undefined
    });
  }

  // Ajouter un commentaire/résolution
  addResolution(id: string, resolution: string): Promise<SupportTicket> {
    return this.updateTicket(id, {
      resolution,
      resolvedAt: new Date(),
      status: TicketStatus.RESOLVED
    });
  }

  // Obtenir les tickets par utilisateur
  getTicketsByUser(userId: string): SupportTicket[] {
    return this.ticketsSubject.value.filter(ticket => ticket.userId === userId);
  }

  // Obtenir les tickets urgents
  getUrgentTickets(): SupportTicket[] {
    return this.ticketsSubject.value.filter(ticket => ticket.priority === TicketPriority.URGENT);
  }

  // Obtenir les tickets ouverts
  getOpenTickets(): SupportTicket[] {
    return this.ticketsSubject.value.filter(ticket => ticket.status === TicketStatus.OPEN);
  }

  // Obtenir les tickets en cours
  getInProgressTickets(): SupportTicket[] {
    return this.ticketsSubject.value.filter(ticket => ticket.status === TicketStatus.IN_PROGRESS);
  }

  // Générer un ID de ticket unique
  private generateTicketId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `TICKET-${timestamp}-${random}`.toUpperCase();
  }

  // Méthodes utilitaires
  getCategoryLabel(category: TicketCategory): string {
    const labels: { [key in TicketCategory]: string } = {
      [TicketCategory.BUG]: '🐛 Bug',
      [TicketCategory.FEATURE_REQUEST]: '💡 Demande de fonctionnalité',
      [TicketCategory.GENERAL_INQUIRY]: '❓ Question générale',
      [TicketCategory.TECHNICAL_ISSUE]: '🔧 Problème technique',
      [TicketCategory.ACCOUNT_ISSUE]: '👤 Problème de compte',
      [TicketCategory.BILLING_ISSUE]: '💳 Problème de facturation',
      [TicketCategory.OTHER]: '📄 Autre'
    };
    return labels[category];
  }

  getPriorityLabel(priority: TicketPriority): string {
    const labels: { [key in TicketPriority]: string } = {
      [TicketPriority.LOW]: '🟢 Faible',
      [TicketPriority.MEDIUM]: '🟡 Moyenne',
      [TicketPriority.HIGH]: '🔴 Élevée',
      [TicketPriority.URGENT]: '🚨 Urgente'
    };
    return labels[priority];
  }

  getStatusLabel(status: TicketStatus): string {
    const labels: { [key in TicketStatus]: string } = {
      [TicketStatus.OPEN]: '📝 Ouvert',
      [TicketStatus.IN_PROGRESS]: '⚡ En cours',
      [TicketStatus.WAITING_FOR_USER]: '⏳ En attente',
      [TicketStatus.RESOLVED]: '✅ Résolu',
      [TicketStatus.CLOSED]: '🔒 Fermé'
    };
    return labels[status];
  }

  getPriorityColor(priority: TicketPriority): string {
    const colors: { [key in TicketPriority]: string } = {
      [TicketPriority.LOW]: 'success',
      [TicketPriority.MEDIUM]: 'warning',
      [TicketPriority.HIGH]: 'danger',
      [TicketPriority.URGENT]: 'danger'
    };
    return colors[priority];
  }

  getStatusColor(status: TicketStatus): string {
    const colors: { [key in TicketStatus]: string } = {
      [TicketStatus.OPEN]: 'primary',
      [TicketStatus.IN_PROGRESS]: 'warning',
      [TicketStatus.WAITING_FOR_USER]: 'medium',
      [TicketStatus.RESOLVED]: 'success',
      [TicketStatus.CLOSED]: 'dark'
    };
    return colors[status];
  }

  getCategoryColor(category: TicketCategory): string {
    const colors: { [key in TicketCategory]: string } = {
      [TicketCategory.BUG]: 'danger',
      [TicketCategory.FEATURE_REQUEST]: 'primary',
      [TicketCategory.GENERAL_INQUIRY]: 'medium',
      [TicketCategory.TECHNICAL_ISSUE]: 'warning',
      [TicketCategory.ACCOUNT_ISSUE]: 'secondary',
      [TicketCategory.BILLING_ISSUE]: 'tertiary',
      [TicketCategory.OTHER]: 'dark'
    };
    return colors[category];
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  // Collecter les informations du navigateur
  collectBrowserInfo() {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      screenResolution: `${screen.width}x${screen.height}`
    };
  }

  // Collecter les informations de l'application
  collectAppInfo() {
    return {
      version: '1.2.3', // À récupérer depuis l'environnement
      build: '20240115',
      platform: 'web' as const
    };
  }
} 