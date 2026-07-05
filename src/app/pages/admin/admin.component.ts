import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCardModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSnackBarModule, TranslateModule],
  template: `
    <main class="admin-shell">
      <mat-card>
        <h2>{{ 'ADMIN.TITLE' | translate }}</h2>
        <p>{{ 'ADMIN.DESCRIPTION' | translate }}</p>

        <div class="actions">
          <button mat-raised-button color="warn" (click)="resetDatabase()">{{ 'ADMIN.ACTIONS.RESET' | translate }}</button>
          <button mat-raised-button color="primary" (click)="exportDatabase()">{{ 'ADMIN.ACTIONS.EXPORT' | translate }}</button>
          <button mat-raised-button (click)="fileInput.click()">{{ 'ADMIN.ACTIONS.IMPORT' | translate }}</button>
        </div>

        <input #fileInput type="file" accept="application/json" hidden (change)="importDatabase($event)" />

        <mat-form-field appearance="outline">
          <mat-label>{{ 'ADMIN.FORM.CONFIRM_RESET' | translate }}</mat-label>
          <input matInput [(ngModel)]="confirmation" [attr.placeholder]="'ADMIN.FORM.CONFIRMATION_PLACEHOLDER' | translate" />
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>{{ 'ADMIN.FORM.TOKEN' | translate }}</mat-label>
          <input matInput [(ngModel)]="token" [attr.placeholder]="'ADMIN.FORM.TOKEN_PLACEHOLDER' | translate" />
        </mat-form-field>

        <label class="clear-existing">
          <input type="checkbox" [(ngModel)]="clearExisting" />
          {{ 'ADMIN.FORM.CLEAR_EXISTING' | translate }}
        </label>
      </mat-card>
    </main>
  `,
  styles: [
    '.admin-shell{padding:2rem;max-width:900px;margin:0 auto}',
    '.actions{display:flex;gap:1rem;flex-wrap:wrap;margin:1rem 0}',
    'mat-form-field{width:100%;max-width:320px}',
    '.clear-existing{display:flex;align-items:center;gap:.5rem;margin-top:1rem}'
  ]
})
export class AdminComponent {
  private readonly translate = inject(TranslateService);
  confirmation = '';
  token = '';
  clearExisting = false;
  private readonly apiBaseUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient, private snackBar: MatSnackBar) {}

  private getAuthHeaders(): { [header: string]: string | string[] } {
    return this.token ? { Authorization: `Bearer ${this.token}` } : {};
  }

  private showSnack(key: string) {
    this.snackBar.open(this.translate.instant(key), this.translate.instant('ADMIN.COMMON.CLOSE'), { duration: 3000 });
  }

  resetDatabase() {
    this.http.post(`${this.apiBaseUrl}/admin/db/reset`, { confirmation: this.confirmation }, { headers: this.getAuthHeaders() }).subscribe({
      next: () => this.showSnack('ADMIN.SNACKBAR.RESET_SUCCESS'),
      error: () => this.showSnack('ADMIN.SNACKBAR.RESET_FAILED')
    });
  }

  exportDatabase() {
    this.http.get(`${this.apiBaseUrl}/admin/db/export`, { responseType: 'blob', headers: this.getAuthHeaders() }).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'database-export.json';
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => this.showSnack('ADMIN.SNACKBAR.EXPORT_FAILED')
    });
  }

  importDatabase(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const payload = JSON.parse(String(reader.result));
        this.http.post(`${this.apiBaseUrl}/admin/db/import`, { ...payload, clearExisting: this.clearExisting }, { headers: this.getAuthHeaders() }).subscribe({
          next: () => this.showSnack('ADMIN.SNACKBAR.IMPORT_SUCCESS'),
          error: () => this.showSnack('ADMIN.SNACKBAR.IMPORT_FAILED')
        });
      } catch {
        this.showSnack('ADMIN.SNACKBAR.IMPORT_INVALID_JSON');
      }
    };
    reader.readAsText(file);
  }
}
