import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { POITableComponent } from './poi-table.component';

@NgModule({
    declarations: [
        POITableComponent
    ],
    imports: [
        CommonModule,
        MatTableModule
    ],
    exports: [
        POITableComponent
    ]
})
export class POITableModule { } 