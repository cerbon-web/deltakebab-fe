import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { BranchService, Branch } from '../services/branch.service';
import { GeolocationService } from '../services/geolocation.service';
import { haversineDistance } from '../utils/haversine';
import { TranslateModule, TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatCardModule, TranslateModule],
  template: `
    <main class="container">
      <section class="hero">
        <div>
          <h1>Delta Kebab</h1>
          <p>{{ 'HERO.SLOGAN' | translate }}</p>
          <button class="cta" (click)="findNearest()">{{ 'HERO.CTA' | translate }}</button>
        </div>
        <img src="/assets/hero.jpg" alt="Delta Kebab hero" style="width:120px;border-radius:8px" />
      </section>

      <section aria-labelledby="nearest-title">
        <h2 id="nearest-title">{{ 'NEAREST.TITLE' | translate }}</h2>
        <div *ngIf="error" style="color:#b00020">{{ error }}</div>
        <div *ngIf="nearest">
          <div class="branch-card">
            <div style="display:flex;justify-content:space-between;align-items:center">
              <div>
                <div style="font-weight:700">{{ nearest.name }}</div>
                <div style="font-size:13px">{{ nearest.address }}</div>
                <div style="font-size:13px">{{ nearest.openingHours }}</div>
              </div>
              <div style="text-align:right">
                <div style="font-weight:700">{{ nearest.distanceKm }} km</div>
                <a [href]="nearest.mapsLink" target="_blank">
                  <button mat-raised-button color="primary">{{ 'NEAREST.MAP' | translate }}</button>
                </a>
              </div>
            </div>
          </div>
        </div>

        <div *ngIf="!coords">
          <p>{{ 'NEAREST.PROMPT' | translate }}</p>
          <div *ngFor="let b of branches">
            <div class="branch-card">
              <div style="display:flex;justify-content:space-between;align-items:center">
                <div>
                  <div style="font-weight:700">{{ b.name }}</div>
                  <div style="font-size:13px">{{ b.address }}</div>
                </div>
                <div>
                  <button mat-stroked-button (click)="selectManual(b)">{{ 'NEAREST.SELECT' | translate }}</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2>{{ 'ABOUT.TITLE' | translate }}</h2>
        <p>{{ 'ABOUT.TEXT' | translate }}</p>
      </section>

      <section>
        <h2>{{ 'MENU.TITLE' | translate }}</h2>
        <div class="menu-grid">
          <mat-card *ngFor="let item of menu">
            <mat-card-title>{{ item.title }}</mat-card-title>
            <mat-card-content>{{ item.desc }}</mat-card-content>
          </mat-card>
        </div>
      </section>

      <section>
        <h2>{{ 'WHY.TITLE' | translate }}</h2>
        <ul>
          <li *ngFor="let p of points">{{ p | translate }}</li>
        </ul>
      </section>

      <section>
        <h2>{{ 'CONTACT.TITLE' | translate }}</h2>
        <p>{{ 'CONTACT.PHONE' | translate }}: +48 000 000 000</p>
        <p>{{ 'CONTACT.EMAIL' | translate }}: kontakt@deltakebab.pl</p>
      </section>
    </main>
  `
})
export class LandingComponent implements OnInit {
  branches: Branch[] = [];
  nearest: (Branch & { distanceKm: number; mapsLink: string }) | null = null;
  coords: { lat: number; lng: number } | null = null;
  error: string | null = null;

  menu = [
    { title: 'Kebab Rollo', desc: 'Klasyczny kebab w roli' },
    { title: 'Kebab Box', desc: 'Kebab w pudełku z frytkami' },
    { title: 'Kebab Plate', desc: 'Kebab na talerzu z surówką' },
    { title: 'Tortilla Kebab', desc: 'Kebab w tortilli' }
  ];

  points = ['WHY.FRESH', 'WHY.FAST', 'WHY.LOCATIONS', 'WHY.QUALITY', 'WHY.FRIENDLY'];

  constructor(private branchService: BranchService, private geo: GeolocationService) {}

  ngOnInit(): void {
    this.branchService.getBranches().subscribe(b => (this.branches = b));
  }

  findNearest() {
    this.error = null;
    this.geo.getCurrentPosition().then(pos => {
      this.coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      this.calculateNearest();
    }).catch(err => {
      this.error = 'Brak dostępu do lokalizacji. Wyświetlamy wszystkie lokalizacje.';
    });
  }

  selectManual(b: Branch) {
    // treat manual selection as nearest
    this.nearest = { ...b, distanceKm: 0, mapsLink: this.mapsLinkFor(b) };
  }

  calculateNearest() {
    if (!this.coords || this.branches.length === 0) return;
    let best: (Branch & { distanceKm: number }) | null = null;
    for (const b of this.branches) {
      const d = haversineDistance(this.coords.lat, this.coords.lng, b.latitude, b.longitude);
      if (!best || d < best.distanceKm) best = { ...b, distanceKm: Math.round(d * 10) / 10 };
    }
    if (best) {
      this.nearest = { ...best, mapsLink: this.mapsLinkFor(best) } as any;
    }
  }

  mapsLinkFor(b: Branch) {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(b.latitude + ',' + b.longitude)}`;
  }
}
