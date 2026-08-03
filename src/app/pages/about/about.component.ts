import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { buildInfo } from '../../../environments/build-info';

@Component({
  selector: 'page-about',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './about.component.html'
})
export class AboutComponent {
  readonly buildDateLabel = this.formatBuildDate(buildInfo.buildDate);

  private formatBuildDate(value?: string) {
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
}
