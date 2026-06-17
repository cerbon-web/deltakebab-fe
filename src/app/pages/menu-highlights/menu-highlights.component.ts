import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'page-menu-highlights',
  standalone: true,
  imports: [CommonModule, MatCardModule, TranslateModule],
  template: `
    <main class="container">
      <h1>{{ 'MENU.TITLE' | translate }}</h1>
      <div class="menu-grid">
        <mat-card>
          <mat-card-title>Kebab Rollo</mat-card-title>
          <mat-card-content>Klasyczny kebab w roli</mat-card-content>
        </mat-card>
        <mat-card>
          <mat-card-title>Kebab Box</mat-card-title>
          <mat-card-content>Kebab w pudełku z frytkami</mat-card-content>
        </mat-card>
        <mat-card>
          <mat-card-title>Kebab Plate</mat-card-title>
          <mat-card-content>Kebab na talerzu z surówką</mat-card-content>
        </mat-card>
        <mat-card>
          <mat-card-title>Tortilla Kebab</mat-card-title>
          <mat-card-content>Kebab w tortilli</mat-card-content>
        </mat-card>
      </div>
    </main>
  `
})
export class MenuHighlightsComponent {}
