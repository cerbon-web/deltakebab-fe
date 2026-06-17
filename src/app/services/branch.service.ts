import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Branch {
  id: number;
  name: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  openingHours: string;
}

/*
  BranchService loads branch data from a JSON file in assets.
  This keeps branch management simple: edit JSON and redeploy.
*/
@Injectable({ providedIn: 'root' })
export class BranchService {
  private url = '/assets/data/branches.json';
  constructor(private http: HttpClient) {}

  getBranches(): Observable<Branch[]> {
    return this.http.get<Branch[]>(this.url);
  }
}
