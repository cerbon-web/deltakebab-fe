import { Injectable, signal } from '@angular/core';
import { finalize } from 'rxjs';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class BackendConnectionService {

  public readonly status = signal<'checking' | 'ready' | 'error'>('checking');
  public readonly message = signal<string>('');
  public readonly error = signal<string | null>(null);

  constructor(private apiService: ApiService) {
    this.syncMessage();
  }

  private syncMessage() {
    if (this.status() === 'checking') {
      this.message.set('Łączenie...');
      return;
    }

    if (this.status() === 'ready') {
      this.message.set('Połączono');
      return;
    }

    this.message.set('Usługa niedostępna');
  }

  checkHealth() {
    this.status.set('checking');
    this.message.set('Łączenie...');
    this.error.set(null);

    return this.apiService.healthCheck().pipe(
      finalize(() => {
        if (this.status() === 'checking') {
          this.message.set('Przygotowywanie doświadczenia...');
        }
      })
    ).subscribe({
      next: () => {
        this.status.set('ready');
        this.message.set('Połączono');
      },
      error: () => {
        this.status.set('error');
        this.error.set('Serwer jest chwilowo niedostępny. Spróbuj ponownie za chwilę.');
        this.message.set('Usługa niedostępna');
      }
    });
  }
}
