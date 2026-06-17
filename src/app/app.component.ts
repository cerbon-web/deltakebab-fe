import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { HttpClientModule } from '@angular/common/http';
import { TranslateModule } from '@ngx-translate/core';
import { TranslateService } from '@ngx-translate/core';
import { LanguageSwitcherComponent } from './components/language-switcher/language-switcher.component';

/*
  AppComponent is a standalone root component. It sets up translations
  and provides global layout shell. Using signals for simple UI state.
*/
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule, MatToolbarModule, MatIconModule, HttpClientModule, TranslateModule, LanguageSwitcherComponent],
  template: `
    <header>
      <div class="container" style="display:flex;align-items:center;gap:12px;">
        <div style="display:flex;align-items:center;gap:12px;">
          <img src="/assets/logo.png" alt="Delta Kebab" width="48" height="48" />
          <div>
            <div style="font-weight:700">Delta Kebab</div>
            <div style="font-size:12px">{{ 'HERO.SLOGAN' | translate }}</div>
          </div>
        </div>
        <nav style="margin-left:auto;display:flex;align-items:center;gap:12px">
          <a routerLink="/">{{ 'NAV.HOME' | translate }}</a>
          <div style="display:flex;gap:8px;align-items:center">
            <app-language-switcher></app-language-switcher>
          </div>
        </nav>
      </div>
    </header>
    <router-outlet></router-outlet>
    <footer style="padding:16px;text-align:center;font-size:13px;background:#fff0ea;margin-top:24px;display:flex;align-items:center;justify-content:center;gap:12px;flex-wrap:wrap">
      <div>© Delta Kebab</div>
      <div style="display:flex;gap:8px;align-items:center">
        <a href="https://www.instagram.com/deltakebabs/" target="_blank" rel="noopener" aria-label="Delta Kebab Instagram" style="display:inline-flex;align-items:center;gap:6px;color:inherit;text-decoration:none">
          <!-- minimalist Instagram SVG -->
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" stroke-width="1.2"/>
            <circle cx="12" cy="12" r="3.2" stroke="currentColor" stroke-width="1.2"/>
            <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
          </svg>
        </a>

        <a href="https://www.facebook.com/deltakebab/" target="_blank" rel="noopener" aria-label="Delta Kebab Facebook" style="display:inline-flex;align-items:center;gap:6px;color:inherit;text-decoration:none">
          <!-- minimalist Facebook SVG -->
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M15 8h2.5V4.5H15c-2.2 0-3.5 1.3-3.5 3.5V11H9v3h2.5v7H15v-7h2.2l.3-3H15V8z" fill="currentColor" />
          </svg>
        </a>
      </div>
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
