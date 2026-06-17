import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'page-why-us',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  template: `
    <main class="container">
      <h1>{{ 'WHY.TITLE' | translate }}</h1>
      <ul>
        <li>Fresh ingredients</li>
        <li>Fast service</li>
        <li>Multiple locations</li>
        <li>Quality meat</li>
        <li>Friendly atmosphere</li>
      </ul>
    </main>
  `
})
export class WhyUsComponent {}
