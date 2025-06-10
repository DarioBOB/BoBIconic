import { TestBed } from '@angular/core/testing';
import { WindowPageService } from './window-page.service';
import { FlightData, Waypoint } from '../models/flight.interface';

describe('WindowPageService', () => {
  let service: WindowPageService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WindowPageService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with demo data', () => {
    const flightData = service.getFlightData();
    const waypoints = service.getWaypoints();

    expect(flightData).toBeTruthy();
    expect(flightData?.flightNumber).toBe('A3 1234');
    expect(waypoints.length).toBeGreaterThan(0);
    expect(waypoints[0].lat).toBe(46.2381);
  });

  it('should update flight data', () => {
    const newFlightData: FlightData = {
      flightNumber: 'TEST123',
      airline: 'Test Airline',
      aircraft: 'Test Aircraft',
      departureAirport: 'TEST',
      departureCity: 'Test City',
      arrivalAirport: 'TEST2',
      arrivalCity: 'Test City 2',
      departureLocal: '00:00',
      departureTimeGeneva: '00:00',
      departureTimeAthens: '00:00',
      arrivalLocal: '00:00',
      arrivalTimeGeneva: '00:00',
      arrivalTimeAthens: '00:00',
      status: 'Test',
      phase: 'Test',
      progressPercent: 0,
      lat_t_deg: 0,
      lon_t_deg: 0,
      altitude: 0,
      v_sol_kmh: 0,
      v_sol_kt: 0,
      d_elapsed_km: 0,
      d_remaining_km: 0,
      duration: '0h00',
      elapsed: '0h00',
      remaining: '0h00',
      eta: '00:00',
      nowGeneva: '00:00',
      nowAthens: '00:00'
    };

    service.setFlightData(newFlightData);
    expect(service.getFlightData()?.flightNumber).toBe('TEST123');
  });

  it('should update waypoints', () => {
    const newWaypoints: Waypoint[] = [
      { lat: 0, lng: 0, timestamp: Date.now(), altitude: 0, speed: 0 }
    ];

    service.setWaypoints(newWaypoints);
    expect(service.getWaypoints().length).toBe(1);
    expect(service.getWaypoints()[0].lat).toBe(0);
  });

  it('should emit flight data changes', (done) => {
    const newFlightData: FlightData = {
      flightNumber: 'TEST123',
      airline: 'Test Airline',
      aircraft: 'Test Aircraft',
      departureAirport: 'TEST',
      departureCity: 'Test City',
      arrivalAirport: 'TEST2',
      arrivalCity: 'Test City 2',
      departureLocal: '00:00',
      departureTimeGeneva: '00:00',
      departureTimeAthens: '00:00',
      arrivalLocal: '00:00',
      arrivalTimeGeneva: '00:00',
      arrivalTimeAthens: '00:00',
      status: 'Test',
      phase: 'Test',
      progressPercent: 0,
      lat_t_deg: 0,
      lon_t_deg: 0,
      altitude: 0,
      v_sol_kmh: 0,
      v_sol_kt: 0,
      d_elapsed_km: 0,
      d_remaining_km: 0,
      duration: '0h00',
      elapsed: '0h00',
      remaining: '0h00',
      eta: '00:00',
      nowGeneva: '00:00',
      nowAthens: '00:00'
    };

    service.getFlightData$().subscribe(data => {
      if (data?.flightNumber === 'TEST123') {
        done();
      }
    });

    service.setFlightData(newFlightData);
  });
}); 