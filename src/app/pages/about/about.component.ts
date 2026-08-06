import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { finalize } from 'rxjs/operators';
import { buildInfo } from '../../../environments/build-info';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'page-about',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './about.component.html',
  styles: [
    `.build-info { cursor: pointer; user-select: none; }`,
    `.secret-overlay { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.65); display: flex; align-items: center; justify-content: center; padding: 1.5rem; z-index: 1000; }`,
    `.secret-card { background: white; color: #111827; border-radius: 16px; padding: 1.5rem; max-width: 480px; width: 100%; display: flex; flex-direction: column; gap: 0.75rem; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3); }`,
    `.secret-card button { border: 0; border-radius: 999px; padding: 0.75rem 1rem; cursor: pointer; background: #1f2937; color: white; }`,
    `.secret-card button.secondary { background: #e5e7eb; color: #111827; }`
  ]
})
export class AboutComponent {
  private readonly apiService = inject(ApiService);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly buildDateLabel = this.formatBuildDate(buildInfo.buildDate);
  healthBuildDateLabel = '—';
  isLoadingHealth = false;
  private buildInfoTapCount = 0;
  isSecretPanelVisible = false;
  secretMessage = '';

  formatBuildDate(value?: string) {
    if (!value) {
      return '—';
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return value;
    }

    return parsed.toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'medium'
    });
  }

  onBuildInfoClick() {
    this.buildInfoTapCount += 1;
    if (this.buildInfoTapCount >= 7) {
      this.buildInfoTapCount = 0;
      this.secretMessage = 'Secret tools unlocked';
      this.isSecretPanelVisible = true;
      this.cdr.markForCheck();
    }
  }

  runNativeSoundTest() {
    this.sendToNative('playAlarm', { source: 'about-secret' });
  }

  runNativeNotificationTest() {
    this.sendToNative('showNotification', {
      title: 'Delta Android',
      body: 'Native notification test'
    });
  }

  runNativeFlashTest() {
    this.sendToNative('flashTest', {});
  }

  closeSecretPanel() {
    this.isSecretPanelVisible = false;
    this.secretMessage = '';
    this.cdr.markForCheck();
  }

  private sendToNative(event: string, payload: Record<string, unknown> = {}) {
    const android = window.Android;
    if (!android?.postMessage) {
      this.secretMessage = 'Native bridge unavailable';
      this.cdr.markForCheck();
      return;
    }

    android.postMessage(JSON.stringify({ event, payload }));
    this.secretMessage = 'Native action sent';
    this.cdr.markForCheck();
  }

  loadHealthBuildDate() {
    this.isLoadingHealth = true;
    this.healthBuildDateLabel = '—';
    this.cdr.markForCheck();

    this.apiService.healthCheck()
      .pipe(
        finalize(() => {
          this.isLoadingHealth = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (response) => {
          this.healthBuildDateLabel = response?.buildDate ? this.formatBuildDate(response.buildDate) : '—';
          this.cdr.markForCheck();
        },
        error: () => {
          this.healthBuildDateLabel = '—';
          this.cdr.markForCheck();
        }
      });
  }
}
