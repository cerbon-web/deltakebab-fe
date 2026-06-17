import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { HttpClientModule } from '@angular/common/http';
import { TranslateModule } from '@ngx-translate/core';
import { TranslateService } from '@ngx-translate/core';

/*
  AppComponent is a standalone root component. It sets up translations
  and provides global layout shell. Using signals for simple UI state.
*/
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule, MatToolbarModule, MatIconModule, HttpClientModule, TranslateModule],
  template: `
    <header>
      <div class="container" style="display:flex;align-items:center;gap:12px;">
        <div style="display:flex;align-items:center;gap:12px;">
          <img src="/assets/logo.png" alt="Delta Kebab" width="48" height="48" />
          <div>
            <div style="font-weight:700">Delta Kebab</div>
            <div style="font-size:12px">Najlepszy kebab w Trójmieście i okolicach</div>
          </div>
        </div>
        <nav style="margin-left:auto;display:flex;align-items:center;gap:12px">
          <a routerLink="/">{{ 'NAV.HOME' | translate }}</a>
          <div style="display:flex;gap:8px;align-items:center">
            <button aria-label="Polski" (click)="switchLang('pl')" style="background:none;border:0;padding:4px">
              <img src="/assets/flags/pl.svg" alt="PL" width="24" height="16" />
            </button>
            <button aria-label="English" (click)="switchLang('en')" style="background:none;border:0;padding:4px">
              <img src="/assets/flags/en.svg" alt="EN" width="24" height="16" />
            </button>
            <button aria-label="Українська" (click)="switchLang('uk')" style="background:none;border:0;padding:4px">
              <img src="/assets/flags/uk.svg" alt="UK" width="24" height="16" />
            </button>
          </div>
        </nav>
      </div>
    </header>
    <router-outlet></router-outlet>
    <footer style="padding:16px;text-align:center;font-size:13px;background:#fff0ea;margin-top:24px">
      © Delta Kebab
    </footer>
  `
})
export class AppComponent implements OnInit {
  // example signal for future global UI state
  public showMenu = signal(false);

  constructor(private translate: TranslateService) {}

  ngOnInit(): void {
    // translation setup: Polish default
    this.translate.addLangs(['pl','en','uk']);
    const saved = localStorage.getItem('delta-lang');
    const defaultLang = saved ?? 'pl';
    this.translate.setDefaultLang('pl');
    this.translate.use(defaultLang);
  }

  switchLang(lang: string) {
    this.translate.use(lang);
    localStorage.setItem('delta-lang', lang);
  }
}
