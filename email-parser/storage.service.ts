import fs from 'fs-extra';
import path from 'path';
import { ParsedBooking } from './openai.service.js';

export class StorageService {
  private storageDir: string;

  constructor(storageDir: string = './parsed-emails') {
    this.storageDir = storageDir;
    this.ensureStorageDir();
  }

  private async ensureStorageDir(): Promise<void> {
    try {
      await fs.ensureDir(this.storageDir);
      console.log(`Storage directory ensured: ${this.storageDir}`);
    } catch (error) {
      console.error('Error creating storage directory:', error);
      throw error;
    }
  }

  public async saveBooking(booking: ParsedBooking): Promise<string> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `booking_${timestamp}_${booking.raw_email_id}.json`;
      const filepath = path.join(this.storageDir, filename);

      await fs.writeJson(filepath, booking, { spaces: 2 });
      console.log(`Booking saved: ${filepath}`);
      
      return filepath;
    } catch (error) {
      console.error('Error saving booking:', error);
      throw error;
    }
  }

  public async saveMultipleBookings(bookings: ParsedBooking[]): Promise<string[]> {
    const savedFiles: string[] = [];
    
    for (const booking of bookings) {
      try {
        const filepath = await this.saveBooking(booking);
        savedFiles.push(filepath);
      } catch (error) {
        console.error(`Error saving booking ${booking.raw_email_id}:`, error);
      }
    }
    
    return savedFiles;
  }

  public async getAllBookings(): Promise<ParsedBooking[]> {
    try {
      const files = await fs.readdir(this.storageDir);
      const jsonFiles = files.filter(file => file.endsWith('.json'));
      
      const bookings: ParsedBooking[] = [];
      
      for (const file of jsonFiles) {
        try {
          const filepath = path.join(this.storageDir, file);
          const booking = await fs.readJson(filepath);
          bookings.push(booking);
        } catch (error) {
          console.error(`Error reading file ${file}:`, error);
        }
      }
      
      // Trier par date de parsing (plus récent en premier)
      bookings.sort((a, b) => new Date(b.parsed_at).getTime() - new Date(a.parsed_at).getTime());
      
      return bookings;
    } catch (error) {
      console.error('Error reading all bookings:', error);
      return [];
    }
  }

  public async getBookingsByType(type: string): Promise<ParsedBooking[]> {
    const allBookings = await this.getAllBookings();
    return allBookings.filter(booking => booking.booking_type === type);
  }

  public async getBookingsByProvider(provider: string): Promise<ParsedBooking[]> {
    const allBookings = await this.getAllBookings();
    return allBookings.filter(booking => 
      booking.provider.toLowerCase().includes(provider.toLowerCase())
    );
  }

  public async searchBookings(query: string): Promise<ParsedBooking[]> {
    const allBookings = await this.getAllBookings();
    const lowerQuery = query.toLowerCase();
    
    return allBookings.filter(booking => 
      booking.name?.toLowerCase().includes(lowerQuery) ||
      booking.location?.toLowerCase().includes(lowerQuery) ||
      booking.provider.toLowerCase().includes(lowerQuery) ||
      booking.reference_number?.toLowerCase().includes(lowerQuery) ||
      booking.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  public async deleteBooking(filepath: string): Promise<void> {
    try {
      await fs.remove(filepath);
      console.log(`Booking deleted: ${filepath}`);
    } catch (error) {
      console.error('Error deleting booking:', error);
      throw error;
    }
  }

  public async getStorageStats(): Promise<{
    totalFiles: number;
    totalSize: number;
    types: Record<string, number>;
    providers: Record<string, number>;
  }> {
    try {
      const files = await fs.readdir(this.storageDir);
      const jsonFiles = files.filter(file => file.endsWith('.json'));
      
      let totalSize = 0;
      const types: Record<string, number> = {};
      const providers: Record<string, number> = {};
      
      for (const file of jsonFiles) {
        try {
          const filepath = path.join(this.storageDir, file);
          const stats = await fs.stat(filepath);
          totalSize += stats.size;
          
          const booking = await fs.readJson(filepath);
          
          // Compter les types
          types[booking.booking_type] = (types[booking.booking_type] || 0) + 1;
          
          // Compter les fournisseurs
          providers[booking.provider] = (providers[booking.provider] || 0) + 1;
        } catch (error) {
          console.error(`Error processing file ${file}:`, error);
        }
      }
      
      return {
        totalFiles: jsonFiles.length,
        totalSize,
        types,
        providers
      };
    } catch (error) {
      console.error('Error getting storage stats:', error);
      return {
        totalFiles: 0,
        totalSize: 0,
        types: {},
        providers: {}
      };
    }
  }
} 