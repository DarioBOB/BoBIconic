import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { Storage } from '@ionic/storage-angular';
import { Airport, Airline, Aircraft } from '../models/flight.interface';

@Injectable({
  providedIn: 'root'
})
export class FlightDataService {
  private readonly OPENFLIGHTS_AIRPORTS_URL = 'https://raw.githubusercontent.com/jpatokal/openflights/master/data/airports.dat';
  private readonly OPENFLIGHTS_AIRLINES_URL = 'https://raw.githubusercontent.com/jpatokal/openflights/master/data/airlines.dat';
  private readonly OPENFLIGHTS_AIRCRAFT_URL = 'https://raw.githubusercontent.com/jpatokal/openflights/master/data/planes.dat';
  private readonly OUR_AIRPORTS_URL = 'https://davidmegginson.github.io/ourairports-data/airports.csv';

  constructor(
    private http: HttpClient,
    private storage: Storage
  ) {
    this.initStorage();
  }

  private async initStorage() {
    await this.storage.create();
  }

  // Gestion des aéroports
  async getAirportDetails(icao: string): Promise<Airport | null> {
    const cachedData = await this.storage.get(`airport_${icao}`);
    if (cachedData) {
      return cachedData;
    }

    try {
      const openFlightsData = await this.getOpenFlightsAirport(icao);
      const ourAirportsData = await this.getOurAirportsData(icao);
      
      const enrichedData: Airport = {
        ...openFlightsData,
        ...ourAirportsData,
        lastUpdated: new Date().toISOString()
      };

      await this.storage.set(`airport_${icao}`, enrichedData);
      return enrichedData;
    } catch (error) {
      console.error('Error fetching airport data:', error);
      return null;
    }
  }

  // Gestion des compagnies aériennes
  async getAirlineDetails(iata: string): Promise<Airline | null> {
    const cachedData = await this.storage.get(`airline_${iata}`);
    if (cachedData) {
      return cachedData;
    }

    try {
      const data = await this.fetchAirlineData(iata);
      await this.storage.set(`airline_${iata}`, data);
      return data;
    } catch (error) {
      console.error('Error fetching airline data:', error);
      return null;
    }
  }

  // Gestion des avions
  async getAircraftDetails(icao: string): Promise<Aircraft | null> {
    const cachedData = await this.storage.get(`aircraft_${icao}`);
    if (cachedData) {
      return cachedData;
    }

    try {
      const data = await this.fetchAircraftData(icao);
      await this.storage.set(`aircraft_${icao}`, data);
      return data;
    } catch (error) {
      console.error('Error fetching aircraft data:', error);
      return null;
    }
  }

  // Méthodes privées pour le fetching des données
  private async getOpenFlightsAirport(icao: string): Promise<Airport | null> {
    return this.http.get(this.OPENFLIGHTS_AIRPORTS_URL, { responseType: 'text' })
      .pipe(
        map(data => this.parseOpenFlightsAirportData(data, icao)),
        catchError(error => {
          console.error('Error fetching OpenFlights airport data:', error);
          return of(null);
        })
      ).toPromise() || Promise.resolve(null);
  }

  private async getOurAirportsData(icao: string): Promise<Partial<Airport> | null> {
    return this.http.get(this.OUR_AIRPORTS_URL, { responseType: 'text' })
      .pipe(
        map(data => this.parseOurAirportsData(data, icao)),
        catchError(error => {
          console.error('Error fetching OurAirports data:', error);
          return of(null);
        })
      ).toPromise() || Promise.resolve(null);
  }

  private async fetchAirlineData(iata: string): Promise<Airline | null> {
    return this.http.get(this.OPENFLIGHTS_AIRLINES_URL, { responseType: 'text' })
      .pipe(
        map(data => this.parseOpenFlightsAirlineData(data, iata)),
        catchError(error => {
          console.error('Error fetching airline data:', error);
          return of(null);
        })
      ).toPromise() || Promise.resolve(null);
  }

  private async fetchAircraftData(icao: string): Promise<Aircraft | null> {
    return this.http.get(this.OPENFLIGHTS_AIRCRAFT_URL, { responseType: 'text' })
      .pipe(
        map(data => this.parseOpenFlightsAircraftData(data, icao)),
        catchError(error => {
          console.error('Error fetching aircraft data:', error);
          return of(null);
        })
      ).toPromise() || Promise.resolve(null);
  }

  // Parsers pour les différents formats de données
  private parseOpenFlightsAirportData(data: string, icao: string): Airport | null {
    const lines = data.split('\n');
    for (const line of lines) {
      const fields = line.split(',');
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
          source: fields[13]
        };
      }
    }
    return null;
  }

  private parseOurAirportsData(data: string, icao: string): Partial<Airport> | null {
    const lines = data.split('\n');
    for (const line of lines) {
      const fields = line.split(',');
      if (fields[1] === icao) {
        return {
          name: fields[3],
          latitude: parseFloat(fields[4]),
          longitude: parseFloat(fields[5]),
          altitude: parseFloat(fields[6]),
          type: fields[2],
          terminal: fields[12],
          gate: fields[13],
          services: fields[17]
        };
      }
    }
    return null;
  }

  private parseOpenFlightsAirlineData(data: string, iata: string): Airline | null {
    const lines = data.split('\n');
    for (const line of lines) {
      const fields = line.split(',');
      if (fields[3] === iata) {
        return {
          name: fields[1],
          alias: fields[2],
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

  private parseOpenFlightsAircraftData(data: string, icao: string): Aircraft | null {
    const lines = data.split('\n');
    for (const line of lines) {
      const fields = line.split(',');
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

  // Méthode pour forcer la mise à jour des données
  async forceUpdate(icao: string): Promise<void> {
    await this.storage.remove(`airport_${icao}`);
    await this.getAirportDetails(icao);
  }
} 