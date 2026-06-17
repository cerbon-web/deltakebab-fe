import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'page-contact',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  template: `
    <main class="container">
      <h1>{{ 'CONTACT.TITLE' | translate }}</h1>
      <p>Phone: +48 000 000 000</p>
      <p>Email: kontakt@deltakebab.pl</p>
    </main>
  `
})
export class ContactComponent {}
