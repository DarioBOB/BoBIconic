import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { SharedModule } from '../shared/shared.module';
import { UserStatusBarComponent } from '../components/user-status-bar/user-status-bar.component';
import { SupportService, SupportTicket, TicketCategory, TicketPriority, TicketStatus, TicketStatistics } from '../services/support.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-support',
  standalone: true,
  templateUrl: './support.page.html',
  styleUrls: ['./support.page.scss'],
  imports: [SharedModule, UserStatusBarComponent, CommonModule, IonicModule]
})
export class SupportPage implements OnInit, OnDestroy {
  tickets: SupportTicket[] = [];
  filteredTickets: SupportTicket[] = [];
  statistics: TicketStatistics = {
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0,
    closed: 0,
    urgent: 0,
    high: 0,
    medium: 0,
    low: 0
  };
  searchTerm: string = '';
  selectedStatus: TicketStatus | null = null;
  isLoading: boolean = true;

  statusOptions = [
    { value: TicketStatus.OPEN, label: 'Ouverts', icon: 'document' },
    { value: TicketStatus.IN_PROGRESS, label: 'En Cours', icon: 'time' },
    { value: TicketStatus.WAITING_FOR_USER, label: 'En Attente', icon: 'pause' },
    { value: TicketStatus.RESOLVED, label: 'Résolus', icon: 'checkmark-circle' },
    { value: TicketStatus.CLOSED, label: 'Fermés', icon: 'close-circle' }
  ];

  private subscriptions: Subscription[] = [];

  constructor(public supportService: SupportService) {
    console.log('SupportPage: Constructeur appelé');
    console.log('SupportPage: Service support:', this.supportService);
  }

  ngOnInit() {
    console.log('SupportPage: ngOnInit appelé');
    this.subscribeToData();
    
    // Test pour forcer le chargement
    setTimeout(() => {
      console.log('SupportPage: Test après 2 secondes');
      console.log('SupportPage: Tickets actuels:', this.tickets.length);
      console.log('SupportPage: Statistiques actuelles:', this.statistics);
      console.log('SupportPage: État de chargement:', this.isLoading);
    }, 2000);
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private subscribeToData() {
    console.log('SupportPage: Début de la souscription aux données');
    
    // Souscription aux tickets
    const ticketsSub = this.supportService.tickets$.subscribe(tickets => {
      console.log('SupportPage: Tickets reçus:', tickets.length);
      this.tickets = tickets;
      this.filterTickets();
    });

    // Souscription aux statistiques
    const statisticsSub = this.supportService.statistics$.subscribe(statistics => {
      console.log('SupportPage: Statistiques reçues:', statistics);
      this.statistics = statistics;
    });

    // Souscription à l'état de chargement
    const loadingSub = this.supportService.loading$.subscribe(loading => {
      console.log('SupportPage: État de chargement:', loading);
      this.isLoading = loading;
    });

    this.subscriptions.push(ticketsSub, statisticsSub, loadingSub);
  }

  filterTickets() {
    this.filteredTickets = this.supportService.filterTickets({
      searchTerm: this.searchTerm,
      status: this.selectedStatus || undefined
    });
  }

  selectStatus(status: TicketStatus) {
    this.selectedStatus = this.selectedStatus === status ? null : status;
    this.filterTickets();
  }

  getStatusColor(status: TicketStatus): string {
    const colors: { [key in TicketStatus]: string } = {
      [TicketStatus.OPEN]: '#3880ff',
      [TicketStatus.IN_PROGRESS]: '#ffc409',
      [TicketStatus.WAITING_FOR_USER]: '#92949c',
      [TicketStatus.RESOLVED]: '#2dd36f',
      [TicketStatus.CLOSED]: '#222428'
    };
    return colors[status];
  }

  getShortDescription(description: string): string {
    return description.length > 150 ? description.substring(0, 150) + '...' : description;
  }

  trackByTicket(index: number, ticket: SupportTicket): string {
    return ticket.id;
  }

  // Actions sur les tickets
  createNewTicket() {
    console.log('Créer un nouveau ticket');
    // TODO: Implémenter la modal de création
  }

  viewTicket(ticket: SupportTicket) {
    console.log('Voir ticket:', ticket);
    // TODO: Implémenter la vue détaillée
  }

  viewMyTickets() {
    console.log('Voir mes tickets');
    // TODO: Implémenter le filtrage par utilisateur
  }
} 