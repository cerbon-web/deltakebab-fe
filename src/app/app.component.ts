import { Component, OnInit, signal, HostListener, ElementRef, inject } from '@angular/core';
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
    <style>
      header.site-header { position: sticky; top: 0; z-index: 60; background: linear-gradient(90deg, var(--primary), #8b2b0f); color: #fff; border-bottom: 1px solid rgba(0,0,0,0.06);} 
      .site-header .container { display:flex;align-items:center;gap:12px;padding:10px 16px;max-width:1100px;margin:0 auto; }
      .brand { display:flex;align-items:center;gap:12px; }
      .brand .title { font-weight:700 }
      .brand .slogan { font-size:12px; color:rgba(255,255,255,0.9) }

      nav.main-nav { margin-left:auto; display:flex; align-items:center; gap:12px; }
      nav.main-nav a { text-decoration:none; color:inherit; padding:6px 8px; border-radius:6px }
      nav.main-nav a:hover { background: rgba(255,255,255,0.06) }

      /* Mobile menu toggle */
      .menu-toggle { display:none; background:transparent;border:0;padding:6px 8px;border-radius:6px; }

      /* Mobile menu panel */
      .mobile-menu { display:none; position:absolute; left:0; right:0; top:100%; background: linear-gradient(90deg, var(--primary), #8b2b0f); color:#fff; box-shadow:0 12px 40px rgba(2,6,23,0.12); border-bottom-left-radius:8px; border-bottom-right-radius:8px; z-index:59 }
      .mobile-menu ul { list-style:none; margin:0; padding:8px; display:flex; flex-direction:column; gap:6px }
      .mobile-menu a { padding:12px 16px; display:block; color: #fff }
      .mobile-menu a:hover { background: rgba(255,255,255,0.06) }

      /* Mobile actions (language + other controls) shown next to hamburger */
      .mobile-actions { display:none; margin-left:8px }
      @media (max-width: 768px) { .mobile-actions { display:flex; align-items:center } }

      @media (max-width: 768px) {
        .site-header .container { padding:8px 12px }
        nav.main-nav { display:none }
        .menu-toggle { display:inline-flex; align-items:center; gap:6px }
        .mobile-menu[aria-hidden="false"] { display:block }
      }
    </style>

    <header class="site-header">
      <div class="container">
        <div class="brand">
          <img src="/assets/logo.png" alt="Delta Kebab" width="40" height="40" />
          <div>
            <div class="title">Delta Kebab</div>
            <div class="slogan">{{ 'HERO.SLOGAN' | translate }}</div>
          </div>
        </div>

        <button class="menu-toggle" aria-label="Toggle menu" (click)="showMenu.update(v => !v)">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <rect x="3" y="6" width="18" height="2" fill="currentColor" rx="1"/>
            <rect x="3" y="11" width="18" height="2" fill="currentColor" rx="1"/>
            <rect x="3" y="16" width="18" height="2" fill="currentColor" rx="1"/>
          </svg>
        </button>

        <nav class="main-nav" role="navigation" aria-label="Main navigation">
          <a routerLink="/">{{ 'NAV.LANDING' | translate }}</a>
          <a routerLink="/menu">{{ 'NAV.MENU' | translate }}</a>
          <a routerLink="/why-us">{{ 'NAV.WHY' | translate }}</a>
          <a routerLink="/contact">{{ 'NAV.CONTACT' | translate }}</a>
          <a routerLink="/about">{{ 'NAV.ABOUT' | translate }}</a>
          <div style="display:flex;gap:8px;align-items:center">
            <app-language-switcher></app-language-switcher>
          </div>
        </nav>
        <div class="mobile-actions">
          <app-language-switcher></app-language-switcher>
        </div>

        <div class="mobile-menu" role="menu" [attr.aria-hidden]="!showMenu()">
          <ul>
            <li><a routerLink="/" (click)="showMenu.set(false)">{{ 'NAV.LANDING' | translate }}</a></li>
            <li><a routerLink="/menu" (click)="showMenu.set(false)">{{ 'NAV.MENU' | translate }}</a></li>
            <li><a routerLink="/why-us" (click)="showMenu.set(false)">{{ 'NAV.WHY' | translate }}</a></li>
            <li><a routerLink="/contact" (click)="showMenu.set(false)">{{ 'NAV.CONTACT' | translate }}</a></li>
            <li><a routerLink="/about" (click)="showMenu.set(false)">{{ 'NAV.ABOUT' | translate }}</a></li>
          </ul>
        </div>
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
  private host = inject(ElementRef<HTMLElement>);

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

  @HostListener('document:click', ['$event'])
  onDocClick(e: MouseEvent) {
    if (!this.showMenu()) return;
    const target = e.target as Node;
    if (!this.host.nativeElement.contains(target)) {
      this.showMenu.set(false);
    }
  }
}
