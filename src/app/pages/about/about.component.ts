import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'page-about',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  template: `
    <main class="container">
      <h1>{{ 'ABOUT.TITLE' | translate }}</h1>
      <p>Delta Kebab is a family restaurant serving tasty kebabs made from high-quality ingredients.</p>
    </main>
  `
})
export class AboutComponent {}
