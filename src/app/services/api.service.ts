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
      catchError(this.handleError)
    );
  }

  getRestaurants(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/restaurants`).pipe(
      catchError(this.handleError)
    );
  }

  getNearestRestaurants(lat: number, lng: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/restaurants/nearest?lat=${lat}&lng=${lng}`).pipe(
      catchError(this.handleError)
    );
  }

  getMenu(restaurantId: string | number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/menu/${restaurantId}`).pipe(
      catchError(this.handleError)
    );
  }

  createOrder(payload: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/orders`, payload).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse) {
    const message = error.status === 0
      ? this.translate.instant('CONNECTION.ERRORS.BACKEND_OFFLINE')
      : error.error?.message || this.translate.instant('CONNECTION.ERRORS.GENERIC');

    return throwError(() => new Error(message));
  }
}
