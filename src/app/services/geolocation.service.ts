import { Injectable } from '@angular/core';

/* GeolocationService wraps the browser Geolocation API in a Promise.
   Keeps the component code clean and testable.
*/
@Injectable({ providedIn: 'root' })
export class GeolocationService {
  getCurrentPosition(options?: PositionOptions): Promise<GeolocationPosition> {
    return this.getAccuratePosition(options);
  }

  getAccuratePosition(options?: PositionOptions, accuracyThresholdMeters = 1000, maxAttempts = 3): Promise<GeolocationPosition> {
    const defaultOptions: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    };
    const mergedOptions = { ...defaultOptions, ...options };

    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      const attempt = (attemptNumber: number) => {
        const requestOptions: PositionOptions = {
          ...mergedOptions,
          enableHighAccuracy: attemptNumber === 1 && mergedOptions.enableHighAccuracy !== false,
          timeout: attemptNumber === 1 ? (mergedOptions.timeout ?? 10000) : Math.max(mergedOptions.timeout ?? 10000, 8000)
        };

        navigator.geolocation.getCurrentPosition(
          (position) => {
            const accuracy = Number(position?.coords?.accuracy);
            if (Number.isNaN(accuracy)) {
              if (attemptNumber < maxAttempts) {
                attempt(attemptNumber + 1);
                return;
              }

              resolve(position);
              return;
            }

            if (accuracy > accuracyThresholdMeters && attemptNumber < maxAttempts) {
              attempt(attemptNumber + 1);
              return;
            }

            resolve(position);
          },
          (error) => {
            if ((error.code === error.TIMEOUT || error.code === error.POSITION_UNAVAILABLE) && attemptNumber < maxAttempts) {
              attempt(attemptNumber + 1);
              return;
            }

            reject(this.toError(error));
          },
          requestOptions
        );
      };

      attempt(1);
    });
  }

  private toError(error: GeolocationPositionError | Error): Error {
    if (error instanceof Error) {
      return error;
    }

    switch (error.code) {
      case error.PERMISSION_DENIED:
        return new Error('Location permission was denied.');
      case error.POSITION_UNAVAILABLE:
        return new Error('Location information is unavailable.');
      case error.TIMEOUT:
        return new Error('Location lookup timed out.');
      default:
        return new Error('Unable to determine your location.');
    }
  }
}
