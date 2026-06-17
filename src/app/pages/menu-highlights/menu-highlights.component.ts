import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'page-menu-highlights',
  standalone: true,
  imports: [CommonModule, MatCardModule, TranslateModule],
  templateUrl: './menu-highlights.component.html'
})
export class MenuHighlightsComponent {}
