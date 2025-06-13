import { Injectable } from '@angular/core';
import { Firestore, collection, doc, setDoc, getDoc, getDocs, query, where } from '@angular/fire/firestore';
import { HttpClient } from '@angular/common/http';
import { Observable, from, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Airport, Airline, Aircraft } from '../models/flight.interface';

@Injectable({
  providedIn: 'root'
})
export class FlightEnrichmentService {
  private readonly OPENFLIGHTS_AIRPORTS_URL = 'https://raw.githubusercontent.com/jpatokal/openflights/master/data/airports.dat';
  private readonly OPENFLIGHTS_AIRLINES_URL = 'https://raw.githubusercontent.com/jpatokal/openflights/master/data/airlines.dat';
  private readonly OUR_AIRPORTS_URL = 'https://davidmegginson.github.io/ourairports-data/airports.csv';
  private readonly OPENFLIGHTS_AIRCRAFT_URL = 'https://raw.githubusercontent.com/jpatokal/openflights/master/data/planes.dat';

  constructor(
    // private firestore: Firestore, // Désactivé en mode démo
    private http: HttpClient
  ) {}

  async getAirportDetails(icao: string): Promise<Airport | null> {
    try {
      // Mode démo : ignorer Firestore, utiliser uniquement OpenFlights/OurAirports
      const airport = await this.getOpenFlightsAirport(icao);
      if (airport) {
        const enrichedAirport = await this.enrichWithOurAirports(airport);
        return enrichedAirport;
      }
      return { message: 'Aucune donnée enrichie disponible (mode démo).' } as any;
    } catch (error) {
      console.error('Error getting airport details:', error);
      return { message: 'Aucune donnée enrichie disponible (erreur).' } as any;
    }
  }

  async getAirlineDetails(iata: string): Promise<Airline | null> {
    try {
      // Mode démo : ignorer Firestore, utiliser uniquement OpenFlights
      const airline = await this.getOpenFlightsAirline(iata);
      if (airline) return airline;
      return { message: 'Aucune donnée enrichie disponible (mode démo).' } as any;
    } catch (error) {
      console.error('Error getting airline details:', error);
      return { message: 'Aucune donnée enrichie disponible (erreur).' } as any;
    }
  }

  async getAircraftDetails(icao: string): Promise<Aircraft | null> {
    try {
      // Mode démo : utiliser OpenFlights planes.dat
      const aircraft = await this.getOpenFlightsAircraft(icao);
      if (aircraft) return aircraft;
      return { message: 'Aucune donnée enrichie disponible (mode démo).' } as any;
    } catch (error) {
      console.error('Error getting aircraft details:', error);
      return { message: 'Aucune donnée enrichie disponible (erreur).' } as any;
    }
  }

  // Méthodes privées pour le fetching des données
  private async getOpenFlightsAirport(icao: string): Promise<Airport | null> {
    try {
      const data = await this.http.get(this.OPENFLIGHTS_AIRPORTS_URL, { responseType: 'text' }).toPromise();
      if (!data) return null;
      return this.parseOpenFlightsAirportData(data, icao);
    } catch (error) {
      console.error('Error fetching OpenFlights airport data:', error);
      return null;
    }
  }

  private async getOpenFlightsAirline(iata: string): Promise<Airline | null> {
    try {
      const data = await this.http.get(this.OPENFLIGHTS_AIRLINES_URL, { responseType: 'text' }).toPromise();
      if (!data) return null;
      return this.parseOpenFlightsAirlineData(data, iata);
    } catch (error) {
      console.error('Error fetching airline data:', error);
      return null;
    }
  }

  private async getOpenSkyAircraft(icao24: string): Promise<Aircraft | null> {
    // TODO: Implémenter l'appel à l'API OpenSky Network
    return null;
  }

  private async enrichWithOurAirports(airport: Airport): Promise<Airport> {
    try {
      const data = await this.http.get(this.OUR_AIRPORTS_URL, { responseType: 'text' }).toPromise();
      if (!data) return airport;
      const enrichment = this.parseOurAirportsData(data, airport.icao);
      return { ...airport, ...enrichment, lastUpdated: new Date().toISOString() };
    } catch (error) {
      console.error('Error enriching with OurAirports:', error);
      return airport;
    }
  }

  // Parsers pour les différents formats de données
  private parseOpenFlightsAirportData(data: string, icao: string): Airport | null {
    const lines = data.split('\n');
    for (const line of lines) {
      const fields = line.split(',').map(field => field.replace(/^"|"$/g, ''));
      if (fields[5] === icao) {
        return {
          name: fields[1],
          city: fields[2],
          country: fields[3],
          iata: fields[4],
          icao: fields[5],
          latitude: parseFloat(fields[6]),
          longitude: parseFloat(fields[7]),
          altitude: parseFloat(fields[8]),
          timezone: fields[9],
          dst: fields[10],
          tz: fields[11],
          type: fields[12],
          source: fields[13],
          lastUpdated: new Date().toISOString()
        };
      }
    }
    return null;
  }

  private parseOpenFlightsAirlineData(data: string, iata: string): Airline | null {
    const lines = data.split('\n');
    for (const line of lines) {
      const fields = line.split(',').map(field => field.replace(/^"|"$/g, ''));
      if (fields[3] === iata) {
        return {
          name: fields[1],
          alias: fields[2] || '',
          iata: fields[3],
          icao: fields[4],
          callsign: fields[5],
          country: fields[6],
          active: fields[7] === 'Y'
        };
      }
    }
    return null;
  }

  private parseOurAirportsData(data: string, icao: string): Partial<Airport> {
    const lines = data.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    for (let i = 1; i < lines.length; i++) {
      const fields = lines[i].split(',').map(field => field.replace(/^"|"$/g, ''));
      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = fields[index];
      });
      if (row.icao === icao) {
        return {
          terminal: row.terminal || undefined,
          gate: row.gate || undefined,
          services: row.services || undefined
        };
      }
    }
    return {};
  }

  private async getOpenFlightsAircraft(icao: string): Promise<Aircraft | null> {
    try {
      const data = await this.http.get(this.OPENFLIGHTS_AIRCRAFT_URL, { responseType: 'text' }).toPromise();
      if (!data) return null;
      return this.parseOpenFlightsAircraftData(data, icao);
    } catch (error) {
      console.error('Error fetching aircraft data:', error);
      return null;
    }
  }

  private parseOpenFlightsAircraftData(data: string, icao: string): Aircraft | null {
    const lines = data.split('\n');
    for (const line of lines) {
      const fields = line.split(',').map(field => field.replace(/^"|"$/g, ''));
      if (fields[0] === icao) {
        return {
          icao: fields[0],
          name: fields[1],
          manufacturer: fields[2],
          type: fields[3],
          engines: parseInt(fields[4], 10),
          seats: parseInt(fields[5], 10),
          speed: parseInt(fields[6], 10),
          range: parseInt(fields[7], 10)
        };
      }
    }
    return null;
  }
} 