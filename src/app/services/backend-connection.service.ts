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
  private readonly getText = (key: string, fallback = key) => {
    return this.translate?.instant ? this.translate.instant(key) : fallback;
  };

  constructor(private apiService: ApiService) {
    this.syncMessage();
    this.translate.onLangChange.subscribe(() => this.syncMessage());
  }

  private syncMessage() {
    if (this.status() === 'checking') {
      this.message.set(this.getText('CONNECTION.CONNECTING'));
      return;
    }

    if (this.status() === 'ready') {
      this.message.set(this.getText('CONNECTION.CONNECTED'));
      return;
    }

    this.message.set(this.getText('CONNECTION.UNAVAILABLE'));
  }

  checkHealth() {
    this.status.set('checking');
    this.message.set(this.getText('CONNECTION.CONNECTING'));
    this.error.set(null);

    return this.apiService.healthCheck().pipe(
      finalize(() => {
        if (this.status() === 'checking') {
          this.message.set(this.getText('CONNECTION.PREPARING'));
        }
      })
    ).subscribe({
      next: () => {
        this.status.set('ready');
        this.message.set(this.getText('CONNECTION.CONNECTED'));
      },
      error: (err: Error) => {
        this.status.set('error');
        this.error.set(err.message || this.getText('CONNECTION.ERRORS.SERVICE_UNAVAILABLE'));
        this.message.set(this.getText('CONNECTION.UNAVAILABLE'));
      }
    });
  }
}
