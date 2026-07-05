import { inject, Injectable, signal } from '@angular/core';
import { finalize } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class BackendConnectionService {
  private readonly translate = inject(TranslateService);

  public readonly status = signal<'checking' | 'ready' | 'error'>('checking');
  public readonly message = signal<string>(this.translate.instant('CONNECTION.CONNECTING'));
  public readonly error = signal<string | null>(null);

  constructor(private apiService: ApiService) {
    this.translate.onLangChange.subscribe(() => {
      if (this.status() === 'checking') {
        this.message.set(this.translate.instant('CONNECTION.CONNECTING'));
      } else if (this.status() === 'ready') {
        this.message.set(this.translate.instant('CONNECTION.CONNECTED'));
      } else if (this.status() === 'error') {
        this.message.set(this.translate.instant('CONNECTION.UNAVAILABLE'));
      }
    });
  }

  checkHealth() {
    this.status.set('checking');
    this.message.set(this.translate.instant('CONNECTION.CONNECTING'));
    this.error.set(null);

    return this.apiService.healthCheck().pipe(
      finalize(() => {
        if (this.status() === 'checking') {
          this.message.set(this.translate.instant('CONNECTION.PREPARING'));
        }
      })
    ).subscribe({
      next: () => {
        this.status.set('ready');
        this.message.set(this.translate.instant('CONNECTION.CONNECTED'));
      },
      error: (err: Error) => {
        this.status.set('error');
        this.error.set(err.message || this.translate.instant('CONNECTION.ERRORS.SERVICE_UNAVAILABLE'));
        this.message.set(this.translate.instant('CONNECTION.UNAVAILABLE'));
      }
    });
  }
}
