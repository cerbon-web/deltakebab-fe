import { Injectable } from '@angular/core';

/* GeolocationService wraps the browser Geolocation API in a Promise.
   Keeps the component code clean and testable.
*/
@Injectable({ providedIn: 'root' })
export class GeolocationService {
  getCurrentPosition(options?: PositionOptions): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }
      navigator.geolocation.getCurrentPosition(resolve, reject, options);
    });
  }
}
