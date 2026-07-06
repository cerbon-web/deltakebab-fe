import { Component, OnInit, signal, HostListener, ElementRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { HttpClientModule } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule } from '@ngx-translate/core';
import { TranslateService } from '@ngx-translate/core';
import { LanguageSwitcherComponent } from './components/language-switcher/language-switcher.component';
import { DevIndicatorComponent } from './components/dev-indicator/dev-indicator.component';
import { BackendConnectionService } from './services/backend-connection.service';
import { environment } from '../environments/environment';

/*
  AppComponent is a standalone root component. It sets up translations
  and provides global layout shell. Using signals for simple UI state.
*/
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule, MatToolbarModule, MatIconModule, HttpClientModule, MatButtonModule, MatProgressSpinnerModule, TranslateModule, LanguageSwitcherComponent, DevIndicatorComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  public environment = environment;
  // example signal for future global UI state
  public showMenu = signal(false);
  public connectionStatus = signal<'checking' | 'ready' | 'error'>('checking');
  public connectionMessage = signal<string>('');
  public connectionError = signal<string | null>(null);
  private host = inject(ElementRef<HTMLElement>);

  constructor(
    private translate: TranslateService,
    private backendConnection: BackendConnectionService
  ) {
    this.connectionStatus = this.backendConnection.status;
    this.connectionMessage = this.backendConnection.message;
    this.connectionError = this.backendConnection.error;
    this.connectionMessage.set('Łączenie...');
  }

  ngOnInit(): void {
    // translation setup: Polish default
    this.translate.addLangs(['pl','en','uk']);
    const saved = localStorage.getItem('delta-lang');
    const defaultLang = saved ?? 'pl';
    this.translate.setDefaultLang('pl');
    this.translate.use(defaultLang);

    this.backendConnection.checkHealth();
  }

  switchLang(lang: string) {
    this.translate.use(lang);
    localStorage.setItem('delta-lang', lang);
  }

  retryConnection() {
    this.backendConnection.checkHealth();
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
