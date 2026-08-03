import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
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
    this.apiService.healthCheck().subscribe({
      next: (response) => {
        this.healthBuildDateLabel = this.formatBuildDate(response.buildDate);
        this.isLoadingHealth = false;
      },
      error: () => {
        this.healthBuildDateLabel = '—';
        this.isLoadingHealth = false;
      }
    });
  }
}
