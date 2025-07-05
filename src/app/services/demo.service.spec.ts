import { TestBed } from '@angular/core/testing';
import { DemoService } from './demo.service';
import { Auth } from '@angular/fire/auth';
import { Firestore } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { LoggerService } from './logger.service';
import { DateTimeService } from './date-time.service';

describe('DemoService', () => {
  let service: DemoService;
  let mockAuth: jasmine.SpyObj<Auth>;
  let mockFirestore: jasmine.SpyObj<Firestore>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockLogger: jasmine.SpyObj<LoggerService>;
  let mockDateTimeService: jasmine.SpyObj<DateTimeService>;

  beforeEach(() => {
    mockAuth = jasmine.createSpyObj('Auth', ['currentUser']);
    mockFirestore = jasmine.createSpyObj('Firestore', ['collection']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockLogger = jasmine.createSpyObj('LoggerService', ['log', 'error']);
    mockDateTimeService = jasmine.createSpyObj('DateTimeService', ['getCurrentDateTime']);

    TestBed.configureTestingModule({
      providers: [
        DemoService,
        { provide: Auth, useValue: mockAuth },
        { provide: Firestore, useValue: mockFirestore },
        { provide: Router, useValue: mockRouter },
        { provide: LoggerService, useValue: mockLogger },
        { provide: DateTimeService, useValue: mockDateTimeService }
      ]
    });

    service = TestBed.inject(DemoService);
  });

  describe('Recalage des voyages démo', () => {
    const testNow = new Date('2025-07-04T12:00:00Z');
    
    beforeEach(() => {
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
    });

    describe('recalagePastDemoTrip', () => {
      it('devrait recaler le voyage passé selon les requirements', () => {
        // Arrange
        const mockTrip = {
          startDate: new Date('2024-04-15T09:00:00Z'),
          endDate: new Date('2024-04-22T13:45:00Z'),
          plans: [
            {
              type: 'flight',
              startDate: new Date('2024-04-15T09:00:00Z'),
              endDate: new Date('2024-04-15T11:30:00Z'),
              details: { flight: { departure_time: '09:00', arrival_time: '11:30' } }
            },
            {
              type: 'hotel',
              startDate: new Date('2024-04-15T13:00:00Z'),
              endDate: new Date('2024-04-22T11:00:00Z')
            }
          ]
        };

        // Act
        const result = (service as any).recalagePastDemoTrip(mockTrip, testNow);

        // Assert
        expect(result.startDate).toEqual(new Date('2025-05-28T12:00:00Z')); // now - 37 jours
        expect(result.endDate).toEqual(new Date('2025-06-04T12:00:00Z')); // now - 30 jours
        
        // Vérifier que les plans sont décalés du même offset
        const flightPlan = result.plans.find((p: any) => p.type === 'flight');
        expect(flightPlan.startDate).toEqual(new Date('2025-05-28T09:00:00Z'));
        expect(flightPlan.endDate).toEqual(new Date('2025-05-28T11:30:00Z'));
        expect(flightPlan.details.flight.departure_time).toBe('09:00');
        expect(flightPlan.details.flight.arrival_time).toBe('11:30');
      });
    });

    describe('recalageFutureDemoTrip', () => {
      it('devrait recaler le voyage futur selon les requirements', () => {
        // Arrange
        const mockTrip = {
          startDate: new Date('2025-09-10T10:40:00Z'),
          endDate: new Date('2025-09-26T06:30:00Z'),
          plans: [
            {
              type: 'flight',
              startDate: new Date('2025-09-10T10:40:00Z'),
              endDate: new Date('2025-09-10T13:00:00Z'),
              details: { flight: { departure_time: '10:40', arrival_time: '13:00' } }
            },
            {
              type: 'hotel',
              startDate: new Date('2025-09-10T15:00:00Z'),
              endDate: new Date('2025-09-12T11:00:00Z')
            }
          ]
        };

        // Act
        const result = (service as any).recalageFutureDemoTrip(mockTrip, testNow);

        // Assert
        expect(result.startDate).toEqual(new Date('2025-09-02T12:00:00Z')); // now + 60 jours
        expect(result.endDate).toEqual(new Date('2025-09-09T12:00:00Z')); // now + 67 jours
        
        // Vérifier que les plans sont décalés du même offset
        const flightPlan = result.plans.find((p: any) => p.type === 'flight');
        expect(flightPlan.startDate).toEqual(new Date('2025-09-02T10:40:00Z'));
        expect(flightPlan.endDate).toEqual(new Date('2025-09-02T13:00:00Z'));
        expect(flightPlan.details.flight.departure_time).toBe('10:40');
        expect(flightPlan.details.flight.arrival_time).toBe('13:00');
      });
    });

    describe('recalageOngoingDemoTrip', () => {
      it('devrait recaler le voyage en cours selon les requirements', () => {
        // Arrange
        const mockTrip = {
          startDate: new Date('2024-07-05T07:15:00Z'),
          endDate: new Date('2024-07-13T13:00:00Z'),
          plans: [
            {
              type: 'flight',
              startDate: new Date('2024-07-05T07:15:00Z'),
              endDate: new Date('2024-07-05T10:45:00Z'),
              details: { flight: { departure_time: '07:15', arrival_time: '10:45' } }
            },
            {
              type: 'hotel',
              startDate: new Date('2024-07-05T14:00:00Z'),
              endDate: new Date('2024-07-07T09:00:00Z')
            }
          ]
        };

        // Act
        const result = (service as any).recalageOngoingDemoTrip(mockTrip, testNow);

        // Assert
        // Le vol doit être positionné à now - durée/3
        const flightDuration = 3.5 * 60 * 60 * 1000; // 3h30 en ms
        const expectedFlightStart = new Date(testNow.getTime() - flightDuration / 3);
        const expectedFlightEnd = new Date(testNow.getTime() + flightDuration * 2 / 3);
        
        const flightPlan = result.plans.find((p: any) => p.type === 'flight');
        expect(flightPlan.startDate.getTime()).toBeCloseTo(expectedFlightStart.getTime(), -2);
        expect(flightPlan.endDate.getTime()).toBeCloseTo(expectedFlightEnd.getTime(), -2);
        
        // Vérifier que le vol est en cours maintenant
        expect(testNow.getTime()).toBeGreaterThanOrEqual(flightPlan.startDate.getTime());
        expect(testNow.getTime()).toBeLessThanOrEqual(flightPlan.endDate.getTime());
        
        // Vérifier que les horaires sont mis à jour
        expect(flightPlan.details.flight.departure_time).toBe('11:20'); // 12:00 - 40min
        expect(flightPlan.details.flight.arrival_time).toBe('14:50'); // 12:00 + 2h50
      });
    });
  });
}); 