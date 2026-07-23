import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { Branch } from '../types/domain';

@Injectable({ providedIn: 'root' })
export class LandingLocationService {
  constructor(
    private http: HttpClient,
    private translate: TranslateService
  ) {}

  async reverseGeocodeLocation(lat: number, lng: number): Promise<string | null> {
    const language = this.translate.currentLang || this.translate.defaultLang || 'en';
    const params = new HttpParams()
      .set('format', 'jsonv2')
      .set('lat', lat.toString())
      .set('lon', lng.toString())
      .set('zoom', '18')
      .set('addressdetails', '1')
      .set('accept-language', language);

    try {
      const response = await firstValueFrom(this.http.get<any>('https://nominatim.openstreetmap.org/reverse', { params }));
      const address = response?.address ?? {};
      const street = [address.road, address.pedestrian, address.path].filter(Boolean)[0] ?? '';
      const houseNumber = address.house_number ?? '';
      const city = [address.city, address.town, address.village, address.suburb, address.municipality].filter(Boolean)[0] ?? '';

      const formatted = [street && houseNumber ? `${street} ${houseNumber}` : street || houseNumber, city].filter(Boolean).join(', ');
      return formatted || response?.display_name || null;
    } catch {
      return null;
    }
  }

  getLocationErrorMessage(err: unknown, fallbackKey: string, permissionKey: string): string {
    const maybe = err as { code?: number; message?: string };
    const message = maybe?.message?.toLowerCase() ?? '';

    if (message.includes('accuracy')) {
      return 'LANDING.ERRORS.LOCATION_INACCURATE';
    }

    if (maybe?.code === 1 || message.includes('permission')) {
      return permissionKey;
    }

    if (message.includes('timed out') || message.includes('unavailable') || message.includes('support')) {
      return fallbackKey;
    }

    return fallbackKey;
  }

  calculateBranchDistances(branches: Branch[], userLat: number, userLng: number) {
    const distancesMap = new Map<string, number>();
    const branchesWithDistance = branches.map((branch: Branch) => {
      const branchLat = branch.latitude;
      const branchLng = branch.longitude;
      const validCoords = branchLat != null && branchLng != null && !Number.isNaN(Number(branchLat)) && !Number.isNaN(Number(branchLng));

      if (!validCoords) {
        return { ...branch, distance: null };
      }

      const distance = this.calculateDistance(userLat, userLng, Number(branchLat), Number(branchLng));
      distancesMap.set(String(branch.id), distance);
      return { ...branch, distance };
    });

    return { distancesMap, branchesWithDistance };
  }

  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const toRad = (value: number) => (value * Math.PI) / 180;
    const earthRadiusKm = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return earthRadiusKm * c;
  }
}
