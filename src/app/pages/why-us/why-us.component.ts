import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'page-why-us',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './why-us.component.html'
})
export class WhyUsComponent {}
