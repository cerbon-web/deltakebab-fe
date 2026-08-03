import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';
import { BranchService } from '../../services/branch.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'page-kitchen-select-branch',
  standalone: true,
  imports: [CommonModule, RouterModule, MatCardModule, MatButtonModule, TranslateModule],
  templateUrl: './kitchen-select-branch.component.html',
  styleUrls: ['./kitchen-select-branch.component.scss']
})
export class KitchenSelectBranchComponent implements OnInit {
  private branchService = inject(BranchService);
  private authService = inject(AuthService);
  private router = inject(Router);

  branches: any[] = [];
  loading = false;
  error: string | null = null;

  ngOnInit(): void {
    this.loading = true;
    this.branchService.getBranches().subscribe({
      next: (b) => { this.branches = b; this.loading = false; },
      error: (e) => { this.error = 'Unable to load branches'; this.loading = false; }
    });
  }

  select(branch: any) {
    const token = this.authService.token();
    if (!token) {
      this.error = 'Not authenticated';
      return;
    }

    this.loading = true;
    this.branchService.assignBranch(branch.id, token).subscribe({
      next: (res: { token: string; user: any }) => {
        // update local auth state
        this.authService.token.set(res.token);
        this.authService.user.set(res.user);
        localStorage.setItem('delta_kitchen_token', res.token);
        localStorage.setItem('delta_kitchen_user', JSON.stringify(res.user));
        this.loading = false;
        this.router.navigate(['/kitchen']);
      },
      error: (err) => { this.error = err?.error?.message || 'Assignment failed'; this.loading = false; }
    });
  }
}
