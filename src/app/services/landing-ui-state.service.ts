import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LandingUiStateService {
  readonly loading = signal(false);
  readonly menuLoading = signal(false);

  setLoading(value: boolean) {
    this.loading.set(value);
  }

  setMenuLoading(value: boolean) {
    this.menuLoading.set(value);
  }
}
