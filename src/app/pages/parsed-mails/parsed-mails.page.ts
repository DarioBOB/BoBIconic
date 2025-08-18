import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonHeader, 
  IonContent, 
  IonButton, 
  IonIcon, 
  IonSearchbar, 
  IonSelect, 
  IonSelectOption, 
  IonCard, 
  IonCardHeader, 
  IonCardTitle, 
  IonCardSubtitle, 
  IonCardContent, 
  IonBadge, 
  IonChip, 
  IonLabel, 
  IonSpinner 
} from '@ionic/angular/standalone';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { UserStatusBarComponent } from '../../components/user-status-bar/user-status-bar.component';

export interface ParsedBooking {
  booking_type: 'flight' | 'hotel' | 'car_rental' | 'activity' | 'restaurant' | 'other';
  provider: string;
  reference_number?: string;
  location?: string;
  checkin_date?: string;
  checkout_date?: string;
  departure_date?: string;
  arrival_date?: string;
  name?: string;
  price?: number;
  currency?: string;
  address?: string;
  contact_info?: {
    phone?: string;
    email?: string;
  };
  flight_details?: {
    flight_number?: string;
    departure_airport?: string;
    arrival_airport?: string;
    departure_time?: string;
    arrival_time?: string;
  };
  hotel_details?: {
    room_type?: string;
    guests?: number;
    amenities?: string[];
  };
  car_details?: {
    car_type?: string;
    pickup_location?: string;
    dropoff_location?: string;
    pickup_time?: string;
    dropoff_time?: string;
  };
  activity_details?: {
    activity_type?: string;
    duration?: string;
    participants?: number;
  };
  tags?: string[];
  confidence: number;
  raw_email_id: string;
  parsed_at: string;
}

@Component({
  selector: 'app-parsed-mails',
  templateUrl: './parsed-mails.page.html',
  styleUrls: ['./parsed-mails.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonContent,
    IonButton,
    IonIcon,
    IonSearchbar,
    IonSelect,
    IonSelectOption,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonBadge,
    IonChip,
    IonLabel,
    IonSpinner,
    UserStatusBarComponent
  ]
})
export class ParsedMailsPage implements OnInit {
  bookings: ParsedBooking[] = [];
  filteredBookings: ParsedBooking[] = [];
  isLoading = false;
  searchTerm = '';
  selectedType = '';
  selectedProvider = '';
  
  bookingTypes = [
    { value: '', label: 'Tous les types' },
    { value: 'flight', label: 'Vols', icon: 'airplane' },
    { value: 'hotel', label: 'Hôtels', icon: 'bed' },
    { value: 'car_rental', label: 'Location de voiture', icon: 'car' },
    { value: 'activity', label: 'Activités', icon: 'map' },
    { value: 'restaurant', label: 'Restaurants', icon: 'restaurant' },
    { value: 'other', label: 'Autres', icon: 'ellipsis-horizontal' }
  ];

  providers: string[] = [];
  stats = {
    totalFiles: 0,
    types: {} as Record<string, number>,
    providers: {} as Record<string, number>
  };

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadBookings();
    this.loadStats();
  }

  async loadBookings() {
    this.isLoading = true;
    try {
      const response = await this.http.get<any>('http://localhost:3000/api/parsed-bookings').toPromise();
      if (response.success) {
        this.bookings = response.bookings;
        this.filteredBookings = [...this.bookings];
        this.extractProviders();
      }
    } catch (error) {
      console.error('Erreur lors du chargement des réservations:', error);
    } finally {
      this.isLoading = false;
    }
  }

  async loadStats() {
    try {
      const response = await this.http.get<any>('http://localhost:3000/api/email-stats').toPromise();
      if (response.success) {
        this.stats = response.storage;
      }
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    }
  }

  async parseNewEmails() {
    this.isLoading = true;
    try {
      const response = await this.http.post<any>('http://localhost:3000/api/parse-mails', {}).toPromise();
      if (response.success) {
        console.log('Parsing terminé:', response);
        await this.loadBookings();
        await this.loadStats();
      }
    } catch (error) {
      console.error('Erreur lors du parsing:', error);
    } finally {
      this.isLoading = false;
    }
  }

  filterBookings() {
    this.filteredBookings = this.bookings.filter(booking => {
      const matchesSearch = !this.searchTerm || 
        booking.name?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        booking.location?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        booking.provider.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        booking.reference_number?.toLowerCase().includes(this.searchTerm.toLowerCase());

      const matchesType = !this.selectedType || booking.booking_type === this.selectedType;
      const matchesProvider = !this.selectedProvider || 
        booking.provider.toLowerCase().includes(this.selectedProvider.toLowerCase());

      return matchesSearch && matchesType && matchesProvider;
    });
  }

  onSearchChange() {
    this.filterBookings();
  }

  onTypeChange() {
    this.filterBookings();
  }

  onProviderChange() {
    this.filterBookings();
  }

  private extractProviders() {
    const providerSet = new Set<string>();
    this.bookings.forEach(booking => {
      providerSet.add(booking.provider);
    });
    this.providers = Array.from(providerSet).sort();
  }

  getBookingTypeIcon(type: string): string {
    const typeInfo = this.bookingTypes.find(t => t.value === type);
    return typeInfo?.icon || 'ellipsis-horizontal';
  }

  getBookingTypeLabel(type: string): string {
    const typeInfo = this.bookingTypes.find(t => t.value === type);
    return typeInfo?.label || 'Autre';
  }

  getBookingTypeColor(type: string): string {
    const colors: Record<string, string> = {
      flight: 'primary',
      hotel: 'secondary',
      car_rental: 'tertiary',
      activity: 'success',
      restaurant: 'warning',
      other: 'medium'
    };
    return colors[type] || 'medium';
  }

  formatDate(dateString: string | undefined | null): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatPrice(price?: number, currency?: string): string {
    if (!price) return 'Non spécifié';
    return `${price} ${currency || 'EUR'}`;
  }

  getBookingSummary(booking: ParsedBooking): string {
    switch (booking.booking_type) {
      case 'flight':
        return `${booking.flight_details?.flight_number || 'Vol'} - ${booking.flight_details?.departure_airport || ''} → ${booking.flight_details?.arrival_airport || ''}`;
      case 'hotel':
        return `${booking.name || 'Hôtel'} - ${booking.location || ''}`;
      case 'car_rental':
        return `${booking.car_details?.car_type || 'Voiture'} - ${booking.car_details?.pickup_location || ''}`;
      case 'activity':
        return `${booking.name || 'Activité'} - ${booking.activity_details?.duration || ''}`;
      default:
        return booking.name || booking.location || 'Réservation';
    }
  }

  refresh() {
    this.loadBookings();
    this.loadStats();
  }

  trackByBooking(index: number, booking: ParsedBooking): string {
    return booking.raw_email_id;
  }
} 