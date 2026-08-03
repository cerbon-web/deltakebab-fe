declare module '@angular/service-worker' {
  export function provideServiceWorker(workerScript: string, opts?: { enabled?: boolean }): any;
}
