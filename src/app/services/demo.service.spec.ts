import { TestBed } from '@angular/core/testing';
import { DemoService } from './demo.service';
import { Auth } from '@angular/fire/auth';
import { Firestore } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { LoggerService } from './logger.service';
import { DateTimeService } from './date-time.service';
import { of } from 'rxjs';

describe('DemoService', () => {
  let service: DemoService;
  let mockAuth: jasmine.SpyObj<Auth>;
  let mockFirestore: jasmine.SpyObj<Firestore>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockLogger: jasmine.SpyObj<LoggerService>;
  let mockDateTimeService: jasmine.SpyObj<DateTimeService>;

  beforeEach(() => {
    const authSpy = jasmine.createSpyObj('Auth', ['currentUser']);
    const firestoreSpy = jasmine.createSpyObj('Firestore', ['collection']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    const loggerSpy = jasmine.createSpyObj('LoggerService', ['error']);
    const dateTimeSpy = jasmine.createSpyObj('DateTimeService', ['getCurrentDateTime']);

    TestBed.configureTestingModule({
      providers: [
        DemoService,
        { provide: Auth, useValue: authSpy },
        { provide: Firestore, useValue: firestoreSpy },
        { provide: Router, useValue: routerSpy },
        { provide: LoggerService, useValue: loggerSpy },
        { provide: DateTimeService, useValue: dateTimeSpy }
      ]
    });

    service = TestBed.inject(DemoService);
    mockAuth = TestBed.inject(Auth) as jasmine.SpyObj<Auth>;
    mockFirestore = TestBed.inject(Firestore) as jasmine.SpyObj<Firestore>;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    mockLogger = TestBed.inject(LoggerService) as jasmine.SpyObj<LoggerService>;
    mockDateTimeService = TestBed.inject(DateTimeService) as jasmine.SpyObj<DateTimeService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
    
  describe('Recalage du voyage en cours', () => {
    it('should correctly recalculate ongoing trip dates based on first flight', async () => {
      // Simuler now = 2025-07-07T12:00:00Z
      const testNow = new Date('2025-07-07T12:00:00Z');
      mockDateTimeService.getCurrentDateTime.and.returnValue({ 
        date: testNow,
        iso: testNow.toISOString(),
        utc: testNow.toUTCString(),
        local: testNow.toString(),
        timeZone: 'UTC',
        offsetMinutes: 0,
        offsetHours: 0,
        localISO: testNow.toISOString()
      });

      // Données de test du voyage Athènes
      const testTrip = {
        id: 'ZRH6s0nTMyyPfTDWbHoR',
        title: { fr: 'Voyage démo Athènes', en: 'Demo trip Athens' },
        startDate: new Date('2024-07-05T07:15:00Z'),
        endDate: new Date('2024-07-13T13:00:00Z'),
          plans: [
            {
            id: 'KWC5GXJZhAIRJdfvZly9',
              type: 'flight',
            title: { fr: 'Vol Genève → Athènes', en: 'Flight Geneva → Athens' },
            startDate: new Date('2024-07-05T07:15:00Z'),
            endDate: new Date('2024-07-05T10:45:00Z'),
            details: {
              flight: {
                flight_number: 'A3 847',
                airline: 'Aegean Airlines',
                departure: { airport: 'Genève Aéroport (GVA)' },
                arrival: { airport: 'Aéroport International d\'Athènes (ATH)' },
                confirmation: 'A3GVAATH567'
              }
            }
            }
          ]
        };

      // Appeler la méthode de recalage
      const result = await (service as any).recalageOngoingDemoTrip(testTrip, testNow);

      // Vérifications
      expect(result).toBeTruthy();
      expect(result.plans).toBeTruthy();
      expect(result.plans.length).toBe(1);

      const flightPlan = result.plans[0];
      expect(flightPlan.type).toBe('flight');

      // Vérifier que le premier vol est recalculé selon la logique : now - (durée/3)
      const originalFlightDuration = 3.5 * 60 * 60 * 1000; // 3h30 en ms
      const expectedNewStart = new Date(testNow.getTime() - originalFlightDuration / 3);
      const expectedNewEnd = new Date(testNow.getTime() + originalFlightDuration * 2 / 3);

      // Tolérance de 1 minute pour les calculs de dates
      const tolerance = 60 * 1000;
      expect(Math.abs(flightPlan.startDate.getTime() - expectedNewStart.getTime())).toBeLessThan(tolerance);
      expect(Math.abs(flightPlan.endDate.getTime() - expectedNewEnd.getTime())).toBeLessThan(tolerance);

      // Vérifier que les propriétés de timezone sont ajoutées
      expect(flightPlan.departureTimeAffiche).toBeTruthy();
      expect(flightPlan.arrivalTimeAffiche).toBeTruthy();
      expect(flightPlan.departureTzAbbr).toBeTruthy();
      expect(flightPlan.arrivalTzAbbr).toBeTruthy();

      // Vérifier que les heures sont formatées correctement (HH:mm)
      expect(flightPlan.departureTimeAffiche).toMatch(/^\d{2}:\d{2}$/);
      expect(flightPlan.arrivalTimeAffiche).toMatch(/^\d{2}:\d{2}$/);

      // Vérifier que les abréviations de timezone sont présentes
      expect(flightPlan.departureTzAbbr).toMatch(/^[A-Z]{3,4}$/);
      expect(flightPlan.arrivalTzAbbr).toMatch(/^[A-Z]{3,4}$/);

      console.log('✅ Test de recalage réussi:', {
        originalStart: testTrip.plans[0].startDate.toISOString(),
        originalEnd: testTrip.plans[0].endDate.toISOString(),
        newStart: flightPlan.startDate.toISOString(),
        newEnd: flightPlan.endDate.toISOString(),
        departureTime: flightPlan.departureTimeAffiche,
        arrivalTime: flightPlan.arrivalTimeAffiche,
        departureTz: flightPlan.departureTzAbbr,
        arrivalTz: flightPlan.arrivalTzAbbr
      });
    });

    it('should handle timezone formatting with moment-timezone', async () => {
      const testDate = new Date('2025-07-07T12:00:00Z');
      
      // Tester le formatage avec différents timezones
      const testCases = [
        { timezone: 'Europe/Zurich', expectedAbbr: 'CEST' },
        { timezone: 'Europe/Athens', expectedAbbr: 'EEST' },
        { timezone: 'America/Montreal', expectedAbbr: 'EDT' },
        { timezone: 'Africa/Casablanca', expectedAbbr: 'WEST' }
      ];

      for (const testCase of testCases) {
        const result = await (service as any).formatTimeWithTimezone(testDate, testCase.timezone);
        
        expect(result).toBeTruthy();
        expect(result.time).toMatch(/^\d{2}:\d{2}$/);
        expect(result.abbr).toBeTruthy();
        
        console.log(`✅ Timezone ${testCase.timezone}: ${result.time} ${result.abbr}`);
      }
    });
  });
}); 