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
  templateUrl: './about.component.html'
})
export class AboutComponent {
  private readonly apiService = inject(ApiService);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly buildDateLabel = this.formatBuildDate(buildInfo.buildDate);
  healthBuildDateLabel = '—';
  isLoadingHealth = false;

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
