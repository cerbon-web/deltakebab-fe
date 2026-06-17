import { Injectable, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

export type AppLang = 'en' | 'pl' | 'uk';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private translate = inject(TranslateService);

  public currentLang = signal<AppLang>('pl');

  public readonly available = [
    { code: 'pl' as AppLang, labelKey: 'LANG.POLISH', nativeName: 'Polski', flag: '/assets/flags/pl.svg' },
    { code: 'en' as AppLang, labelKey: 'LANG.ENGLISH', nativeName: 'English', flag: '/assets/flags/en.svg' },
    { code: 'uk' as AppLang, labelKey: 'LANG.UKRAINIAN', nativeName: 'Українська', flag: '/assets/flags/uk.svg' },
  ];

  constructor() {
    const saved = (localStorage.getItem('delta-lang') as AppLang) || 'pl';
    this.translate.addLangs(['pl', 'en', 'uk']);
    this.translate.setDefaultLang('pl');
    this.translate.use(saved);
    this.currentLang.set(saved);
    this.translate.onLangChange.subscribe((e) => this.currentLang.set(e.lang as AppLang));
  }

  setLang(lang: AppLang) {
    if (this.currentLang() === lang) return;
    this.translate.use(lang);
    localStorage.setItem('delta-lang', lang);
    this.currentLang.set(lang);
  }

  instant(key: string, params?: Record<string, unknown> | undefined) {
    return this.translate.instant(key, params as any);
  }

  getFlagFor(code: AppLang) {
    return this.available.find((a) => a.code === code)?.flag ?? '/assets/flags/pl.svg';
  }
}
