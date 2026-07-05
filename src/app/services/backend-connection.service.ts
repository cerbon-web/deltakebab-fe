import { inject, Injectable, signal } from '@angular/core';
import { finalize } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class BackendConnectionService {
  private readonly translate = inject(TranslateService);

  public readonly status = signal<'checking' | 'ready' | 'error'>('checking');
  public readonly message = signal<string>('');
  public readonly error = signal<string | null>(null);

  constructor(private apiService: ApiService) {
    this.syncMessage();
    this.translate.onLangChange.subscribe(() => this.syncMessage());
  }

  private syncMessage() {
    const translated = this.translate?.instant?.('CONNECTION.CONNECTING');
    if (this.status() === 'checking') {
      this.message.set(typeof translated === 'string' && translated ? translated : 'Łączenie...');
      return;
    }

    if (this.status() === 'ready') {
      const connected = this.translate?.instant?.('CONNECTION.CONNECTED');
      this.message.set(typeof connected === 'string' && connected ? connected : 'Połączono');
      return;
    }

    const unavailable = this.translate?.instant?.('CONNECTION.UNAVAILABLE');
    this.message.set(typeof unavailable === 'string' && unavailable ? unavailable : 'Usługa niedostępna');
  }

  checkHealth() {
    const connecting = this.translate?.instant?.('CONNECTION.CONNECTING');
    this.status.set('checking');
    this.message.set(typeof connecting === 'string' && connecting ? connecting : 'Łączenie...');
    this.error.set(null);

    return this.apiService.healthCheck().pipe(
      finalize(() => {
        if (this.status() === 'checking') {
          const preparing = this.translate?.instant?.('CONNECTION.PREPARING');
          this.message.set(typeof preparing === 'string' && preparing ? preparing : 'Przygotowywanie doświadczenia...');
        }
      })
    ).subscribe({
      next: () => {
        const connected = this.translate?.instant?.('CONNECTION.CONNECTED');
        this.status.set('ready');
        this.message.set(typeof connected === 'string' && connected ? connected : 'Połączono');
      },
      error: (err: Error) => {
        const unavailable = this.translate?.instant?.('CONNECTION.UNAVAILABLE');
        const serviceUnavailable = this.translate?.instant?.('CONNECTION.ERRORS.SERVICE_UNAVAILABLE');
        this.status.set('error');
        this.error.set(err.message || (typeof serviceUnavailable === 'string' && serviceUnavailable ? serviceUnavailable : 'Usługa jest tymczasowo niedostępna.'));
        this.message.set(typeof unavailable === 'string' && unavailable ? unavailable : 'Usługa niedostępna');
      }
    });
  }
}
