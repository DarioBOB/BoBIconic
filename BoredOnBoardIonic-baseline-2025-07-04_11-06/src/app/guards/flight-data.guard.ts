import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { WindowPageService } from '../pages/window-page.service';
import { map, take } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class FlightDataGuard implements CanActivate {
  constructor(
    private windowPageService: WindowPageService,
    private router: Router
  ) {}

  canActivate() {
    return this.windowPageService.getFlightData$().pipe(
      take(1),
      map(flightData => {
        if (flightData) {
          return true;
        }
        // Rediriger vers une page d'erreur ou de chargement
        this.router.navigate(['/error', 'no-flight-data']);
        return false;
      })
    );
  }
} 