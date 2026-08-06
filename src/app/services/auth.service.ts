import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { NativeBridgeService } from './native-bridge.service';

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    roles: string[];
    branchIds?: string[];
  };
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http: HttpClient;
  private readonly nativeBridgeService = inject(NativeBridgeService);
  public readonly user = signal<AuthResponse['user'] | null>(null);
  public readonly token = signal<string | null>(null);

  constructor(http: HttpClient) {
    this.http = http;
    const savedToken = localStorage.getItem('delta_kitchen_token');
    const savedUser = localStorage.getItem('delta_kitchen_user');

    if (savedToken && savedUser) {
      this.token.set(savedToken);
      this.user.set(JSON.parse(savedUser));
    }
  }

  login(email: string, password: string) {
    return this.http.post<AuthResponse>(`${environment.apiBaseUrl}/auth/login`, { email, password }).pipe(
      tap(response => {
        this.token.set(response.token);
        this.user.set(response.user);
        localStorage.setItem('delta_kitchen_token', response.token);
        localStorage.setItem('delta_kitchen_user', JSON.stringify(response.user));

        const user = response.user;
        const branchId = user.branchIds?.[0] ?? '';
        const branchName = user.name || 'Delta Kebab';

        this.nativeBridgeService.saveAuthentication({
          token: response.token,
          userId: user.id,
          branchId,
          branchName
        });

        if (this.nativeBridgeService.isNativeAndroidApp()) {
          this.nativeBridgeService.registerForPushNotifications();
        }
      })
    );
  }

  logout() {
    this.nativeBridgeService.unregisterForPushNotifications();
    this.nativeBridgeService.logout();
    this.token.set(null);
    this.user.set(null);
    localStorage.removeItem('delta_kitchen_token');
    localStorage.removeItem('delta_kitchen_user');
  }

  isAuthenticated() {
    return Boolean(this.token());
  }
}
