import { Component, OnInit, NgZone, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { firstValueFrom } from 'rxjs';
import { BranchService, Branch } from '../services/branch.service';
import { GeolocationService } from '../services/geolocation.service';
import { haversineDistance } from '../utils/haversine';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatCardModule, TranslateModule, MatProgressSpinnerModule],
  template: `
    <style>
      @keyframes cp-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      .cp-fallback-spinner.spinning { animation: cp-spin 1s linear infinite; }
    </style>
    <main class="container">
      <section class="hero">
        <div>
          <h1>Delta Kebab</h1>
          <p>{{ 'HERO.SLOGAN' | translate }}</p>
          <div style="display:flex;align-items:center;gap:12px">
            <button class="cta" (click)="findNearest()" [disabled]="loading()">{{ 'HERO.CTA' | translate }}</button>
            <mat-progress-spinner *ngIf="loading()" diameter="24" mode="indeterminate" strokeWidth="3" style="color:#1976d2; z-index:2000; display:inline-block;"></mat-progress-spinner>
            <div *ngIf="loading()" class="cp-fallback-spinner" [class.spinning]="loading()" style="width:24px;height:24px;border:3px solid rgba(0,0,0,0.12);border-top-color:#1976d2;border-radius:50%;display:inline-block;margin-left:6px"></div>
          </div>
        </div>
        <img src="/assets/hero.jpg" alt="Delta Kebab hero" style="width:120px;border-radius:8px" />
      </section>

      <section aria-labelledby="nearest-title">
        <h2 id="nearest-title">{{ 'NEAREST.TITLE' | translate }}</h2>
        <div *ngIf="error()" style="color:#b00020">{{ error() }}</div>

        <!-- Show multiple nearby branches when available -->
        <div *ngIf="nearbyBranches() && nearbyBranches().length > 0">
          <div *ngFor="let n of nearbyBranches()">
            <div class="branch-card">
              <div style="display:flex;justify-content:space-between;align-items:center">
                <div>
                  <div style="font-weight:700">{{ n.name }}</div>
                  <div style="font-size:13px">{{ n.address }}</div>
                  <div style="font-size:13px">{{ n.openingHours }}</div>
                </div>
                <div style="text-align:right">
                  <div style="font-weight:700">{{ n.distanceKm }} km</div>
                  <a [href]="n.mapsLink" target="_blank">
                    <button mat-raised-button color="primary">{{ 'NEAREST.MAP' | translate }}</button>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Fallback: no nearby within 10km, show nearest overall -->
        <div *ngIf="nearestFallback()">
          <div class="branch-card">
            <div style="display:flex;justify-content:space-between;align-items:center">
              <div>
                <div style="font-weight:700">{{ nearestFallback()?.name }}</div>
                <div style="font-size:13px">{{ nearestFallback()?.address }}</div>
                <div style="font-size:13px">{{ nearestFallback()?.openingHours }}</div>
              </div>
              <div style="text-align:right">
                  <div style="font-weight:700">{{ nearestFallback()?.distanceKm }} km</div>
                  <a [href]="nearestFallback()?.mapsLink" target="_blank">
                  <button mat-raised-button color="primary">{{ 'NEAREST.MAP' | translate }}</button>
                </a>
              </div>
            </div>
          </div>
        </div>

        <!-- When no coords (or permission denied), show manual list -->
        <div *ngIf="!coords() && !loading()">
          <p>{{ 'NEAREST.PROMPT' | translate }}</p>
          <div *ngFor="let b of branches()">
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
  // Signals for reactive state
  branches = signal<Branch[]>([]);
  nearbyBranches = signal<(Branch & { distanceKm: number; mapsLink: string })[]>([]);
  nearestFallback = signal<(Branch & { distanceKm: number; mapsLink: string }) | null>(null);
  coords = signal<{ lat: number; lng: number } | null>(null);
  error = signal<string | null>(null);
  loading = signal(false);

  menu = [
    { title: 'Kebab Rollo', desc: 'Klasyczny kebab w roli' },
    { title: 'Kebab Box', desc: 'Kebab w pudełku z frytkami' },
    { title: 'Kebab Plate', desc: 'Kebab na talerzu z surówką' },
    { title: 'Tortilla Kebab', desc: 'Kebab w tortilli' }
  ];

  points = ['WHY.FRESH', 'WHY.FAST', 'WHY.LOCATIONS', 'WHY.QUALITY', 'WHY.FRIENDLY'];

  constructor(
    private branchService: BranchService,
    private geo: GeolocationService,
    private ngZone: NgZone,
  ) {}

  ngOnInit(): void {
    // preload branches into a signal
    this.branchService.getBranches().subscribe(b => {
      const sorted = b.sort((x, y) => {
        const c = (x.city || x.name).localeCompare(y.city || y.name);
        return c !== 0 ? c : x.name.localeCompare(y.name);
      });
      this.branches.set(sorted);
    });
  }

  async findNearest() {
    if (this.loading()) return;

    this.loading.set(true);
    this.error.set(null);
    this.nearbyBranches.set([]);
    this.nearestFallback.set(null);

    // Give the browser a frame to paint the spinner before starting geolocation
    await new Promise(requestAnimationFrame);

    try {
      const pos = await this.geo.getCurrentPosition();
      // callbacks may be outside NgZone; run signal updates inside the zone so Angular schedules rendering
      this.ngZone.run(() => {
        this.coords.set({ lat: pos.coords.latitude, lng: pos.coords.longitude });

        const computeAndSet = () => {
          const enriched = this.branches().map(b => {
            const d = haversineDistance(this.coords()!.lat, this.coords()!.lng, b.latitude, b.longitude);
            const distanceKm = Math.round(d * 10) / 10;
            if (!Number.isFinite(distanceKm) || isNaN(distanceKm)) console.warn('[Location] Invalid distance for branch', b.id, distanceKm);
            return { ...b, distanceKm, mapsLink: this.mapsLinkFor(b) };
          });

          const within10 = enriched.filter(e => e.distanceKm <= 10).sort((a, b) => a.distanceKm - b.distanceKm);

          if (within10.length > 0) {
            this.nearbyBranches.set(within10);
            this.nearestFallback.set(null);
          } else {
            const sortedAll = enriched.sort((a, b) => a.distanceKm - b.distanceKm);
            this.nearestFallback.set(sortedAll[0]);
            this.nearbyBranches.set([]);
            this.error.set('Nie znaleziono lokalu w promieniu 10 km. Wyświetlamy najbliższy.');
          }

          this.loading.set(false);
        };

        // Ensure branches are loaded before computing
        if (!this.branches() || this.branches().length === 0) {
          firstValueFrom(this.branchService.getBranches()).then(b => {
            this.branches.set(b);
            computeAndSet();
          }).catch(() => {
            this.error.set('Błąd wczytywania lokalizacji. Wyświetlamy wszystkie lokalizacje.');
            this.loading.set(false);
          });
        } else {
          computeAndSet();
        }
      });
    } catch (err: any) {
      this.ngZone.run(() => {
        console.warn('[Location] Geolocation error', err);
        this.coords.set(null);
        this.loading.set(false);
        if (err && err.code === 1) {
          this.error.set('Dostęp do lokalizacji odmówiony. Wyświetlamy wszystkie lokalizacje.');
        } else {
          this.error.set('Brak dostępu do lokalizacji. Wyświetlamy wszystkie lokalizacje.');
        }

        if (!this.branches() || this.branches().length === 0) {
          this.branchService.getBranches().subscribe(b => this.branches.set(b));
        }
      });
    }
  }

  

  selectManual(b: Branch) {
    // treat manual selection as nearest
    this.nearbyBranches.set([]);
    this.nearestFallback.set({ ...b, distanceKm: 0, mapsLink: this.mapsLinkFor(b) });
  }

  // retained for compatibility; main filtering happens in findNearest success callback
  calculateNearest() {
    return;
  }

  mapsLinkFor(b: Branch) {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(b.latitude + ',' + b.longitude)}`;
  }
}
