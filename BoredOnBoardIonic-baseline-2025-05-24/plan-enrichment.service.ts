import { Injectable } from '@angular/core';
import { Firestore, doc, updateDoc } from '@angular/fire/firestore';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { FlightEnrichmentService } from './flight-enrichment.service';

interface FlightRadar24Response {
  result: {
    response: {
      data: {
        flight: {
          status: {
            text: string;
            code: string;
          };
          time: {
            scheduled: {
              departure: number;
              arrival: number;
            };
            real: {
              departure: number;
              arrival: number;
            };
          };
          airport: {
            origin: {
              code: string;
              name: string;
              position: {
                latitude: number;
                longitude: number;
              };
            };
            destination: {
              code: string;
              name: string;
              position: {
                latitude: number;
                longitude: number;
              };
            };
          };
          aircraft: {
            model: {
              code: string;
              text: string;
            };
          };
        };
      };
    };
  };
}

@Injectable({
  providedIn: 'root'
})
export class PlanEnrichmentService {
  private readonly FR24_API_KEY = environment.flightRadar24ApiKey;
  private readonly OPENAI_API_KEY = environment.openaiApiKey;
  private readonly FR24_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private flightCache: Map<string, { data: any; timestamp: number }> = new Map();

  constructor(
    private firestore: Firestore,
    private http: HttpClient,
    private flightEnrichment: FlightEnrichmentService
  ) {}

  async enrichPlan(plan: any): Promise<any> {
    if (!plan) return plan;

    try {
      // Enrichissement spécifique selon le type de plan
      switch (plan.type) {
        case 'flight':
          return await this.enrichFlightPlan(plan);
        case 'hotel':
          return await this.enrichHotelPlan(plan);
        case 'car_rental':
          return await this.enrichCarRentalPlan(plan);
        default:
          return await this.enrichGenericPlan(plan);
      }
    } catch (error) {
      console.error('Erreur lors de l\'enrichissement du plan:', error);
      return plan; // Retourne le plan original en cas d'erreur
    }
  }

  private async enrichFlightPlan(plan: any): Promise<any> {
    const flightNumber = plan.details?.flight?.flight_number || plan.details?.flight_number;
    const departureIcao = plan.details?.flight?.departure?.airport;
    const arrivalIcao = plan.details?.flight?.arrival?.airport;
    if (!flightNumber || !departureIcao || !arrivalIcao) return plan;

    try {
      // Enrichir avec OpenFlights/OurAirports
      const departureAirport = await this.flightEnrichment.getAirportDetails(departureIcao);
      const arrivalAirport = await this.flightEnrichment.getAirportDetails(arrivalIcao);
      const airline = await this.flightEnrichment.getAirlineDetails(plan.details?.flight?.airline);

      // Ajout des données enrichies au plan
      return {
        ...plan,
        details: {
          ...plan.details,
          flight: {
            ...plan.details.flight,
            departureAirport: departureAirport || { message: 'Aucune donnée enrichie disponible (mode démo).' },
            arrivalAirport: arrivalAirport || { message: 'Aucune donnée enrichie disponible (mode démo).' },
            airline: airline || { message: 'Aucune donnée enrichie disponible (mode démo).' }
          }
        }
      };
    } catch (error) {
      console.error('Erreur enrichissement open data:', error);
      return {
        ...plan,
        details: {
          ...plan.details,
          flight: {
            ...plan.details.flight,
            departureAirport: { message: 'Aucune donnée enrichie disponible (erreur).' },
            arrivalAirport: { message: 'Aucune donnée enrichie disponible (erreur).' },
            airline: { message: 'Aucune donnée enrichie disponible (erreur).' }
          }
        }
      };
    }
  }

  private async enrichHotelPlan(plan: any): Promise<any> {
    try {
      const enrichedData = await this.enrichWithOpenAI(plan);
      await this.updatePlanInFirestore(plan.id, enrichedData);
      return enrichedData;
    } catch (error) {
      console.error('Erreur lors de l\'enrichissement de l\'hôtel:', error);
      return plan;
    }
  }

  private async enrichCarRentalPlan(plan: any): Promise<any> {
    try {
      const enrichedData = await this.enrichWithOpenAI(plan);
      await this.updatePlanInFirestore(plan.id, enrichedData);
      return enrichedData;
    } catch (error) {
      console.error('Erreur lors de l\'enrichissement de la location:', error);
      return plan;
    }
  }

  private async enrichGenericPlan(plan: any): Promise<any> {
    try {
      const enrichedData = await this.enrichWithOpenAI(plan);
      await this.updatePlanInFirestore(plan.id, enrichedData);
      return enrichedData;
    } catch (error) {
      console.error('Erreur lors de l\'enrichissement générique:', error);
      return plan;
    }
  }

  private async getFlightData(flightNumber: string): Promise<any> {
    // Désactivé : return null pour éviter l'appel à l'API payante
    return null;
  }

  private async enrichWithOpenAI(plan: any, fr24Data?: any): Promise<any> {
    try {
      const prompt = this.buildOpenAIPrompt(plan, fr24Data);
      const response = await this.http.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'Tu es un assistant spécialisé dans l\'enrichissement de données de voyage. Ta tâche est d\'enrichir les informations fournies avec des détails pertinents et utiles.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7
        },
        {
          headers: {
            'Authorization': `Bearer ${this.OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      ).toPromise();

      return this.mergeOpenAIData(plan, response);
    } catch (error) {
      console.error('Erreur OpenAI:', error);
      return plan;
    }
  }

  private buildOpenAIPrompt(plan: any, fr24Data?: any): string {
    let prompt = `Enrichis les informations suivantes sur un plan de voyage :\n`;
    prompt += `Type: ${plan.type}\n`;
    prompt += `Titre: ${plan.title}\n`;
    prompt += `Dates: ${plan.startDate} - ${plan.endDate}\n`;
    
    if (plan.details) {
      prompt += `Détails actuels: ${JSON.stringify(plan.details, null, 2)}\n`;
    }

    if (fr24Data) {
      prompt += `Données FlightRadar24: ${JSON.stringify(fr24Data, null, 2)}\n`;
    }

    prompt += `\nAjoute des informations pertinentes comme :\n`;
    prompt += `- Descriptions détaillées\n`;
    prompt += `- Informations pratiques\n`;
    prompt += `- Suggestions connexes\n`;
    prompt += `- Conseils utiles\n`;
    prompt += `Réponds au format JSON.`;

    return prompt;
  }

  private mergeOpenAIData(plan: any, openAIResponse: any): any {
    try {
      const enrichedData = JSON.parse(openAIResponse.choices[0].message.content);
      return {
        ...plan,
        details: {
          ...plan.details,
          enriched: enrichedData
        }
      };
    } catch (error) {
      console.error('Erreur lors de la fusion des données OpenAI:', error);
      return plan;
    }
  }

  private getCachedFlightData(flightNumber: string): any {
    const cached = this.flightCache.get(flightNumber);
    if (cached && Date.now() - cached.timestamp < this.FR24_CACHE_TTL) {
      return cached.data;
    }
    return null;
  }

  private cacheFlightData(flightNumber: string, data: any): void {
    this.flightCache.set(flightNumber, {
      data,
      timestamp: Date.now()
    });
  }

  private async updatePlanInFirestore(planId: string, enrichedData: any): Promise<void> {
    try {
      const planRef = doc(this.firestore, 'plans', planId);
      await updateDoc(planRef, {
        details: enrichedData.details,
        lastEnriched: new Date()
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour Firestore:', error);
    }
  }
} 