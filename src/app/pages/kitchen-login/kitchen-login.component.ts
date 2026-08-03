import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'page-kitchen-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, TranslateModule],
  templateUrl: './kitchen-login.component.html',
  styleUrls: ['./kitchen-login.component.scss']
})
export class KitchenLoginComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  email = '';
  password = '';
  error = signal<string | null>(null);
  loading = signal(false);

  login() {
    this.loading.set(true);
    this.error.set(null);

    this.authService.login(this.email, this.password).subscribe({
      next: () => {
        this.loading.set(false);
        const user = this.authService.user();
        const isSuperAdmin = user?.roles?.includes('SUPER_ADMIN');
        const hasBranchAccess = Boolean(user?.branchIds?.length);

        if (!isSuperAdmin && !hasBranchAccess) {
          this.router.navigate(['/kitchen/select-branch']);
          return;
        }

        this.router.navigate(['/kitchen']);
      },
      error: (err: any) => {
        this.loading.set(false);
        this.error.set(err?.error?.message || err?.message || 'Login failed.');
      }
    });
  }
}
