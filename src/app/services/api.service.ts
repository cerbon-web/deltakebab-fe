import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';
import { environment } from '../../environments/environment';

export interface HealthResponse {
  status: string;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly baseUrl = environment.apiBaseUrl;
  private readonly translate = inject(TranslateService);

  constructor(private http: HttpClient) {}

  healthCheck(): Observable<HealthResponse> {
    return this.http.get<HealthResponse>(`${this.baseUrl}/health`).pipe(
      catchError((error) => this.handleError(error))
    );
  }

  getRestaurants(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/restaurants`).pipe(
      catchError((error) => this.handleError(error))
    );
  }

  getNearestRestaurants(lat: number, lng: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/restaurants/nearest?lat=${lat}&lng=${lng}`).pipe(
      catchError((error) => this.handleError(error))
    );
  }

  getMenu(branchId: string | number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/menu/${branchId}`).pipe(
      catchError((error) => this.handleError(error))
    );
  }

  createOrder(payload: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/orders`, payload).pipe(
      catchError((error) => this.handleError(error))
    );
  }

  private handleError(error: HttpErrorResponse) {
    const offlineMessage = this.translate?.instant?.('CONNECTION.ERRORS.BACKEND_OFFLINE');
    const genericMessage = this.translate?.instant?.('CONNECTION.ERRORS.GENERIC');
    const message = error.status === 0
      ? (typeof offlineMessage === 'string' && offlineMessage ? offlineMessage : 'Backend is temporarily unavailable.')
      : error.error?.message || (typeof genericMessage === 'string' && genericMessage ? genericMessage : 'Something went wrong.');

    return throwError(() => new Error(message));
  }
}
