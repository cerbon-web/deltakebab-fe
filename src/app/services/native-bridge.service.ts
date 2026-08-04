import { Injectable, signal } from '@angular/core';

interface NativeBridgeCommandPayload { [key: string]: unknown; }

interface NativeAndroidBridge {
  postMessage?: (message: string) => void;
}

declare global {
  interface Window {
    Android?: NativeAndroidBridge;
  }
}

@Injectable({ providedIn: 'root' })
export class NativeBridgeService {
  readonly isNativeApp = signal(false);
  readonly nativeReady = signal(false);
  readonly firebaseRegistered = signal(false);
  readonly nativeNotificationMode = signal(false);

  constructor() {
    if (typeof window === 'undefined') {
      return;
    }

    const handleBridgeEvent = (event: Event) => {
      const customEvent = event as CustomEvent<{ [key: string]: unknown } | undefined>;
      const detail = customEvent.detail ?? {};
      const eventName = customEvent.type.replace(/^android:/, '');

      if (eventName === 'nativeReady') {
        this.nativeReady.set(true);
        this.isNativeApp.set(true);
      }

      if (eventName === 'firebaseRegistered') {
        this.firebaseRegistered.set(Boolean(detail?.registered ?? detail?.token));
      }

      if (eventName === 'firebaseRegistrationFailed') {
        this.firebaseRegistered.set(false);
      }

      if (eventName === 'registrationRemoved') {
        this.firebaseRegistered.set(false);
        this.nativeNotificationMode.set(false);
      }

      if (eventName === 'notificationReceived') {
        this.nativeNotificationMode.set(true);
      }

      if (eventName === 'tokenRefreshed') {
        this.firebaseRegistered.set(true);
      }
    };

    window.addEventListener('android:nativeReady', handleBridgeEvent);
    window.addEventListener('android:firebaseRegistered', handleBridgeEvent);
    window.addEventListener('android:firebaseRegistrationFailed', handleBridgeEvent);
    window.addEventListener('android:registrationRemoved', handleBridgeEvent);
    window.addEventListener('android:notificationReceived', handleBridgeEvent);
    window.addEventListener('android:tokenRefreshed', handleBridgeEvent);

    this.isNativeApp.set(Boolean(window.Android?.postMessage));
    this.nativeReady.set(Boolean(window.Android?.postMessage));
  }

  isNativeAndroidApp(): boolean {
    return this.nativeReady() || this.isNativeApp() || Boolean(typeof window !== 'undefined' && window.Android?.postMessage);
  }

  send(event: string, payload: NativeBridgeCommandPayload = {}) {
    if (typeof window === 'undefined') {
      return;
    }

    const android = window.Android;
    if (!android?.postMessage) {
      return;
    }

    android.postMessage(JSON.stringify({ event, payload }));
  }

  saveAuthentication(auth: { token?: string; userId?: string; branchId?: string; branchName?: string }) {
    this.send('saveAuthentication', {
      token: auth.token ?? '',
      userId: auth.userId ?? '',
      branchId: auth.branchId ?? '',
      branchName: auth.branchName ?? ''
    });
  }

  updateBranchInformation(branchId?: string, branchName?: string) {
    this.send('updateBranchInformation', {
      branchId: branchId ?? '',
      branchName: branchName ?? ''
    });
  }

  registerForPushNotifications() {
    this.send('registerForPushNotifications', {});
  }

  unregisterForPushNotifications() {
    this.send('unregisterForPushNotifications', {});
    this.firebaseRegistered.set(false);
    this.nativeNotificationMode.set(false);
  }

  logout() {
    this.send('logout', {});
  }

  isNativeNotificationEnabled(): boolean {
    return this.isNativeAndroidApp() && this.firebaseRegistered() && this.nativeNotificationMode();
  }
}
