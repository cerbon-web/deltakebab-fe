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
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
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
