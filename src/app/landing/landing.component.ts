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
import { mapsLinkForBranch } from '../utils/location';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatCardModule, TranslateModule, MatProgressSpinnerModule],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss']
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
      import('../utils/branches').then(m => {
        this.branches.set(m.sortBranches(b));
      }).catch(() => this.branches.set(b));
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
            return { ...b, distanceKm, mapsLink: mapsLinkForBranch(b) };
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
    } catch (err: unknown) {
      this.ngZone.run(() => {
        console.warn('[Location] Geolocation error', err);
        this.coords.set(null);
        this.loading.set(false);
        const maybe = err as { code?: number };
        if (maybe && maybe.code === 1) {
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
    this.nearestFallback.set({ ...b, distanceKm: 0, mapsLink: mapsLinkForBranch(b) });
  }

  // retained for compatibility; main filtering happens in findNearest success callback
  calculateNearest() {
    return;
  }

  // mapsLinkFor moved to src/app/utils/location.ts
}
