import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'page-about',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './about.component.html'
})
export class AboutComponent {}
