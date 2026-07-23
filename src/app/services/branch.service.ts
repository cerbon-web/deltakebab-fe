import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { Branch, Restaurant } from '../types/domain';

/*
  BranchService now loads branches from the backend `/restaurants` endpoint
  and flattens `restaurant.branches` into a single branch list.
*/
@Injectable({ providedIn: 'root' })
export class BranchService {
  private url = `${environment.apiBaseUrl}/restaurants`;
  constructor(private http: HttpClient) {}

  getBranches(): Observable<Branch[]> {
    return this.http.get<Restaurant[]>(this.url).pipe(
      map((restaurants) => restaurants.flatMap((restaurant) =>
        (restaurant.branches || []).map((branch) => ({
          ...branch,
          id: branch.id,
          name: branch.name || `${restaurant.name} - ${branch.city || branch.street || ''}`,
          address: [branch.street, branch.buildingNumber, branch.postalCode, branch.city].filter(Boolean).join(', '),
          restaurantId: restaurant.id
        }))
      ))
    );
  }
}
