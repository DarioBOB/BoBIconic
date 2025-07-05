// Remise à zéro : page blanche
import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-bobbers',
  template: `<pre>{{ content }}</pre>`,
  styles: []
})
export class BobbersPage {
  content = '';
  constructor(private http: HttpClient) {
    this.http.get('assets/Firebase Export.txt', { responseType: 'text' }).subscribe({
      next: (data) => this.content = data,
      error: (err) => this.content = 'Erreur lors du chargement du fichier : ' + err.message
    });
  }
}
