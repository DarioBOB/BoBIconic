import { Component, Input, Output, EventEmitter, SimpleChanges, OnChanges } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-flight-search-bar',
  template: `
    <div class="flight-search-bar">
      <div class="flight-search-header">
        <label>Numéro de vol</label>
        <span class="callsign-circle" *ngIf="callsign">{{ callsign }}</span>
      </div>
      <ion-input
        [(ngModel)]="inputValue"
        (ngModelChange)="onInputChange($event)"
        [placeholder]="'Ex: LX1820'"
        name="callsign"
        required
      ></ion-input>
      <ion-button size="small" (click)="search.emit(inputValue)">RECHERCHER</ion-button>
    </div>
  `,
  styles: [`
    .flight-search-bar {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 0 8px;
      background: transparent;
      box-shadow: none;
      margin: 0;
      max-width: 100%;
    }
    .flight-search-header {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 0;
      font-size: 1em;
    }
    .callsign-circle {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: #1976d2;
      color: #fff;
      font-weight: bold;
      font-size: 0.95em;
      box-shadow: none;
    }
    ion-input {
      max-width: 90px;
      font-size: 0.95em;
      height: 28px;
      --padding-start: 4px;
      --padding-end: 4px;
    }
    ion-button {
      height: 28px;
      font-size: 0.95em;
      --padding-top: 0;
      --padding-bottom: 0;
      --border-radius: 6px;
    }
  `],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule]
})
export class FlightSearchBarComponent implements OnChanges {
  @Input() callsign: string = '';
  @Output() search = new EventEmitter<string>();
  @Output() callsignChange = new EventEmitter<string>();
  inputValue: string = '';

  ngOnChanges(changes: SimpleChanges) {
    if (changes['callsign']) {
      this.inputValue = this.callsign || '';
    }
  }

  onInputChange(val: string) {
    this.inputValue = val;
    this.callsignChange.emit(val);
  }
} 