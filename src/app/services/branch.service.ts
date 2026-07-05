import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Branch {
  id: string;
  name: string;
  address?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  openingHours?: string;
  restaurantId?: string;
}

/*
  BranchService now loads branches from the backend `/restaurants` endpoint
  and flattens `restaurant.branches` into a single branch list.
*/
@Injectable({ providedIn: 'root' })
export class BranchService {
  private url = `${environment.apiBaseUrl}/restaurants`;
  constructor(private http: HttpClient) {}

  getBranches(): Observable<Branch[]> {
    return this.http.get<any[]>(this.url).pipe(
      map((restaurants) => restaurants.flatMap((r: any) =>
        (r.branches || []).map((b: any) => ({
          ...b,
          id: b.id,
          name: b.name || `${r.name} - ${b.city || b.street || ''}`,
          address: [b.street, b.buildingNumber, b.postalCode, b.city].filter(Boolean).join(', '),
          restaurantId: r.id
        }))
      ))
    );
  }
}
