import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';
import { environment } from '../../environments/environment';
import { CreateOrderPayload, CreateOrderResponse, MenuResponse, Restaurant } from '../types/domain';
import { LanguageService } from './language.service';

export interface ApiErrorPayload {
  status: 'error';
  code: string;
  message: string;
  errors?: Array<{ field?: string; code: string; message?: string }>;
}

export interface HealthResponse {
  status: string;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly baseUrl = environment.apiBaseUrl;
  private readonly translate = inject(TranslateService);
  private readonly languageService = inject(LanguageService);

  constructor(private http: HttpClient) {}

  healthCheck(): Observable<HealthResponse> {
    return this.http.get<HealthResponse>(`${this.baseUrl}/health`).pipe(
      catchError((error) => this.handleError(error))
    );
  }

  getRestaurants(): Observable<Restaurant[]> {
    return this.http.get<Restaurant[]>(`${this.baseUrl}/restaurants`).pipe(
      catchError((error) => this.handleError(error))
    );
  }

  getNearestRestaurants(lat: number, lng: number): Observable<Restaurant[]> {
    return this.http.get<Restaurant[]>(`${this.baseUrl}/restaurants/nearest?lat=${lat}&lng=${lng}`).pipe(
      catchError((error) => this.handleError(error))
    );
  }

  getMenu(branchId: string | number): Observable<MenuResponse> {
    const lang = this.languageService.currentLang() || 'pl';
    return this.http.get<MenuResponse>(`${this.baseUrl}/menu/${branchId}?lang=${encodeURIComponent(lang)}`).pipe(
      catchError((error) => this.handleError(error))
    );
  }

  createOrder(payload: CreateOrderPayload): Observable<CreateOrderResponse> {
    return this.http.post<CreateOrderResponse>(`${this.baseUrl}/orders`, payload).pipe(
      catchError((error) => this.handleError(error))
    );
  }

  getOrderById(orderId: string): Observable<CreateOrderResponse> {
    return this.http.get<CreateOrderResponse>(`${this.baseUrl}/orders/${orderId}`).pipe(
      catchError((error) => this.handleError(error))
    );
  }

  private handleError(error: HttpErrorResponse) {
    const offlineMessage = this.translate?.instant?.('CONNECTION.ERRORS.BACKEND_OFFLINE');
    const genericMessage = this.translate?.instant?.('CONNECTION.ERRORS.GENERIC');

    if (error.status === 0) {
      const errorWithPayload = new Error(typeof offlineMessage === 'string' && offlineMessage ? offlineMessage : 'Backend is temporarily unavailable.') as Error & { payload?: ApiErrorPayload };
      errorWithPayload.payload = undefined;
      return throwError(() => errorWithPayload);
    }

    const payload = error.error as ApiErrorPayload | undefined;
    const fallbackMessage = typeof genericMessage === 'string' && genericMessage ? genericMessage : 'Something went wrong.';
    const message = payload?.message || payload?.code || fallbackMessage;
    const errorWithPayload = new Error(message) as Error & { payload?: ApiErrorPayload };
    errorWithPayload.payload = payload;

    return throwError(() => errorWithPayload);
  }
}
