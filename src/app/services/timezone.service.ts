import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { LoggerService } from './logger.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TimezoneService {
  private cache = new Map<string, string>();
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
  private readonly CACHE_TIMESTAMPS = new Map<string, number>();
  
  // Cache pour les abréviations GPT
  private gptCache = new Map<string, { abbr: string, offset: string, label: string }>();
  private readonly GPT_CACHE_DURATION = 60 * 60 * 1000; // 1 heure pour GPT
  private readonly GPT_CACHE_TIMESTAMPS = new Map<string, number>();

  constructor(
    private http: HttpClient,
    private logger: LoggerService
  ) {}

  /**
   * Obtient le fuseau horaire IANA pour une ville ou un code IATA
   * @param city Nom de la ville (optionnel)
   * @param iata Code IATA de l'aéroport (optionnel)
   * @returns Promise<string> Fuseau horaire IANA (ex: 'Europe/Zurich')
   */
  async getTimezone(city?: string, iata?: string): Promise<string> {
    if (!city && !iata) {
      this.logger.warn('Timezone', 'Aucune ville ou IATA fourni', { city, iata });
      return 'UTC';
    }

    const cacheKey = `${city || ''}_${iata || ''}`;
    
    // Vérifier le cache
    if (this.isCacheValid(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (cached) {
        this.logger.debug('Timezone', 'Résultat depuis le cache', { city, iata, timezone: cached });
        return cached;
      }
    }

    try {
      const response = await this.http.post<{ timezone: string }>('/api/get-timezone', {
        city: city || undefined,
        iata: iata || undefined
      }).toPromise();

      if (response && response.timezone) {
        const timezone = response.timezone;
        
        // Mettre en cache
        this.cache.set(cacheKey, timezone);
        this.CACHE_TIMESTAMPS.set(cacheKey, Date.now());
        
        this.logger.debug('Timezone', 'Fuseau horaire obtenu', { city, iata, timezone });
        return timezone;
      } else {
        this.logger.warn('Timezone', 'Réponse invalide du serveur', { city, iata, response });
        return 'UTC';
      }
    } catch (error) {
      this.logger.error('Timezone', 'Erreur lors de la récupération du fuseau horaire', { city, iata, error });
      return 'UTC';
    }
  }

  /**
   * Formate une date dans le fuseau horaire spécifié
   * @param date Date à formater
   * @param timezone Fuseau horaire IANA
   * @param locale Locale pour le formatage (défaut: 'fr-FR')
   * @returns Date formatée
   */
  formatDateInTimezone(date: Date | string, timezone: string, locale: string = 'fr-FR'): string {
    if (!date) return '';
    
    const d = new Date(date);
    return d.toLocaleTimeString(locale, { 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: false, 
      timeZone: timezone 
    });
  }

  /**
   * Obtient et formate l'heure de départ d'un plan de vol
   * @param plan Plan de vol
   * @returns Promise<string> Heure formatée
   */
  async getDepartureTime(plan: any): Promise<string> {
    if (!plan || plan.type !== 'flight') {
      return '';
    }

    let city = '';
    if (plan.details?.flight?.departure?.city) {
      city = plan.details.flight.departure.city;
    }
    
    const iata = plan.details?.flight?.departure?.airport || '';
    const timezone = await this.getTimezone(city, iata);
    
    return this.formatDateInTimezone(plan.startDate, timezone);
  }

  /**
   * Obtient et formate l'heure d'arrivée d'un plan de vol
   * @param plan Plan de vol
   * @returns Promise<string> Heure formatée
   */
  async getArrivalTime(plan: any): Promise<string> {
    if (!plan || plan.type !== 'flight') {
      return '';
    }

    let city = '';
    if (plan.details?.flight?.arrival?.city) {
      city = plan.details.flight.arrival.city;
    }
    
    const iata = plan.details?.flight?.arrival?.airport || '';
    const timezone = await this.getTimezone(city, iata);
    
    return this.formatDateInTimezone(plan.endDate, timezone);
  }

  /**
   * Retourne le nom du fuseau horaire pour le départ d'un plan
   */
  async getDepartureTimezoneName(plan: any): Promise<string> {
    if (!plan || plan.type !== 'flight') return 'UTC';
    let city = '';
    if (plan.details?.flight?.departure?.city) {
      city = plan.details.flight.departure.city;
    }
    const iata = plan.details?.flight?.departure?.airport || '';
    return await this.getTimezone(city, iata);
  }

  /**
   * Retourne le nom du fuseau horaire pour l'arrivée d'un plan
   */
  async getArrivalTimezoneName(plan: any): Promise<string> {
    if (!plan || plan.type !== 'flight') return 'UTC';
    let city = '';
    if (plan.details?.flight?.arrival?.city) {
      city = plan.details.flight.arrival.city;
    }
    const iata = plan.details?.flight?.arrival?.airport || '';
    return await this.getTimezone(city, iata);
  }

  /**
   * Interroge OpenAI pour obtenir la ville principale d'un code IATA
   */
  async getCityFromIata(iata: string): Promise<string> {
    if (!iata) return '';
    // Utilise fetch pour appeler l'API OpenAI
    const apiKey = (environment as any).openaiApiKey || (window as any).OPENAI_API_KEY;
    const prompt = `Quelle est la ville principale desservie par l'aéroport dont le code IATA est ${iata} ? Réponds uniquement par le nom de la ville, sans phrase.`;
    const body = {
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'Tu es un assistant de géolocalisation.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 20,
      temperature: 0
    };
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(body)
    });
    if (!response.ok) return '';
    const data = await response.json();
    const city = data.choices?.[0]?.message?.content?.trim() || '';
    return city;
  }

  /**
   * Interroge OpenAI pour obtenir l'abréviation de fuseau horaire d'une ville à une date donnée
   */
  async getTimezoneAbbreviationFromCity(city: string, date: Date | string, iata?: string): Promise<{ abbr: string, offset: string, label: string }> {
    let effectiveCity = city;
    if ((!effectiveCity || effectiveCity.length < 2) && iata) {
      effectiveCity = await this.getCityFromIata(iata);
    }
    if (!effectiveCity || !date) return { abbr: 'UTC', offset: '+0', label: 'UTC +0' };
    const apiKey = (environment as any).openaiApiKey || (window as any).OPENAI_API_KEY;
      const d = typeof date === 'string' ? new Date(date) : date;
    const prompt = `Donne uniquement l'abréviation du fuseau horaire (ex: CEST, CET, EET, UTC, etc.) pour la ville de ${effectiveCity} à la date du ${d.toISOString().split('T')[0]}. Réponds uniquement par l'abréviation, rien d'autre.`;
    const body = {
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'Tu es un assistant de géolocalisation.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 10,
      temperature: 0
    };
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(body)
      });
      const data = await response.json();
      const abbr = data.choices?.[0]?.message?.content?.trim().replace(/[^A-Z]/g, '') || 'UTC';
      this.logger.debug('OpenAI timezone abbr', JSON.stringify({ prompt, abbr, data }));
      return { abbr, offset: '', label: abbr };
    } catch (e) {
      this.logger.error('OpenAI timezone abbr error', JSON.stringify({ city: effectiveCity, date, error: e }));
      return { abbr: 'UTC', offset: '+0', label: 'UTC +0' };
    }
  }

  /**
   * Teste la validité de la clé OpenAI en envoyant un prompt simple
   */
  async testOpenAiKey(): Promise<void> {
    const apiKey = (environment as any).openaiApiKey || (window as any).OPENAI_API_KEY;
    const prompt = 'Dis juste OK';
    const body = {
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'user', content: prompt }
      ],
      max_tokens: 5,
      temperature: 0
    };
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(body)
      });
      const data = await response.json();
      const result = data.choices?.[0]?.message?.content?.trim() || '';
      this.logger.debug('Test OpenAI key', JSON.stringify({ prompt, result, data }));
      if (result.toLowerCase().includes('ok')) {
        alert('✅ Clé OpenAI valide ! Réponse : ' + result);
      } else {
        alert('❌ Clé OpenAI testée, mais réponse inattendue : ' + result);
      }
    } catch (e) {
      this.logger.error('Test OpenAI key error', JSON.stringify({ error: e }));
      alert('❌ Erreur lors du test de la clé OpenAI. Voir la console.');
    }
  }

  /**
   * Vérifie si le cache est encore valide
   * @param key Clé du cache
   * @returns boolean
   */
  private isCacheValid(key: string): boolean {
    const timestamp = this.CACHE_TIMESTAMPS.get(key);
    if (!timestamp) return false;
    
    return (Date.now() - timestamp) < this.CACHE_DURATION;
  }

  /**
   * Vérifie si le cache GPT est encore valide
   * @param key Clé du cache
   * @returns boolean
   */
  private isGptCacheValid(key: string): boolean {
    const timestamp = this.GPT_CACHE_TIMESTAMPS.get(key);
    if (!timestamp) return false;
    
    return (Date.now() - timestamp) < this.GPT_CACHE_DURATION;
  }

  /**
   * Vide le cache
   */
  clearCache(): void {
    this.cache.clear();
    this.CACHE_TIMESTAMPS.clear();
    this.gptCache.clear();
    this.GPT_CACHE_TIMESTAMPS.clear();
    this.logger.debug('Timezone', 'Cache vidé');
  }

  /**
   * Obtient les statistiques du cache
   */
  getCacheStats(): { size: number; keys: string[]; gptSize: number; gptKeys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      gptSize: this.gptCache.size,
      gptKeys: Array.from(this.gptCache.keys())
    };
  }
} 