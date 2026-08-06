import { Injectable, signal } from '@angular/core';
import type { NativeAndroidBridge, NativeBridgeCommandPayload } from '../types/native-bridge';

@Injectable({ providedIn: 'root' })
export class NativeBridgeService {
  readonly nativeReady = signal(false);
  readonly firebaseRegistered = signal(false);
  readonly nativeNotificationMode = signal(false);
  readonly socketConnected = signal(false);
  readonly socketDisconnected = signal(false);
  readonly networkOnline = signal(false);
  readonly alarmActive = signal(false);

  constructor() {
    if (typeof window === 'undefined') {
      return;
    }

    const handleBridgeEvent = (event: Event) => {
      const customEvent = event as CustomEvent<{ [key: string]: unknown } | undefined>;
      const detail = customEvent.detail ?? {};
      const eventName = customEvent.type.replace(/^android:/, '');

      if (eventName === 'nativeReady') {
        const ready = Boolean(detail?.ready ?? detail?.status ?? true);
        this.nativeReady.set(ready);
        if (ready && this.firebaseRegistered()) {
          this.nativeNotificationMode.set(true);
        }
      }

      if (eventName === 'nativeStatusChanged') {
        const ready = Boolean(detail?.ready ?? detail?.status);
        this.nativeReady.set(ready);
        if (ready && this.firebaseRegistered()) {
          this.nativeNotificationMode.set(true);
        }
      }

      if (eventName === 'firebaseRegistered') {
        const registered = Boolean(detail?.registered ?? detail?.token);
        this.firebaseRegistered.set(registered);
        if (registered && this.nativeReady()) {
          this.nativeNotificationMode.set(true);
        }
      }

      if (eventName === 'firebaseRegistrationFailed') {
        this.firebaseRegistered.set(false);
      }

      if (eventName === 'registrationRemoved') {
        this.firebaseRegistered.set(false);
        this.nativeNotificationMode.set(false);
      }

      if (eventName === 'socketConnected') {
        this.socketConnected.set(true);
        this.socketDisconnected.set(false);
      }

      if (eventName === 'socketDisconnected') {
        this.socketConnected.set(false);
        this.socketDisconnected.set(true);
      }

      if (eventName === 'networkOnline') {
        this.networkOnline.set(true);
      }

      if (eventName === 'networkOffline') {
        this.networkOnline.set(false);
      }

      if (eventName === 'alarmStarted') {
        this.alarmActive.set(true);
      }

      if (eventName === 'alarmStopped') {
        this.alarmActive.set(false);
      }

      if (eventName === 'notificationReceived' || eventName === 'notificationOpened') {
        if (this.isNativeAndroidApp() && this.firebaseRegistered()) {
          this.nativeNotificationMode.set(true);
        }
      }

      if (eventName === 'tokenRefreshed') {
        this.firebaseRegistered.set(true);
        if (this.nativeReady()) {
          this.nativeNotificationMode.set(true);
        }
      }
    };

    window.addEventListener('android:nativeReady', handleBridgeEvent);
    window.addEventListener('android:nativeStatusChanged', handleBridgeEvent);
    window.addEventListener('android:firebaseRegistered', handleBridgeEvent);
    window.addEventListener('android:firebaseRegistrationFailed', handleBridgeEvent);
    window.addEventListener('android:registrationRemoved', handleBridgeEvent);
    window.addEventListener('android:notificationReceived', handleBridgeEvent);
    window.addEventListener('android:notificationOpened', handleBridgeEvent);
    window.addEventListener('android:networkOnline', handleBridgeEvent);
    window.addEventListener('android:networkOffline', handleBridgeEvent);
    window.addEventListener('android:alarmStarted', handleBridgeEvent);
    window.addEventListener('android:alarmStopped', handleBridgeEvent);
    window.addEventListener('android:tokenRefreshed', handleBridgeEvent);

    this.probeNativeBridge();
  }

  private probeNativeBridge(): void {
    if (typeof window === 'undefined') {
      return;
    }

    const android = window.Android;
    if (typeof android?.isNativeAndroidApp === 'function') {
      try {
        const isNative = android.isNativeAndroidApp();
        if (isNative) {
          this.nativeReady.set(true);
        }
      } catch {
        // Best effort only.
      }
      return;
    }

    if (typeof android?.postMessage === 'function') {
      this.send('isNativeAndroidApp');
    }
  }

  isNativeAndroidApp(): boolean {
    if (this.nativeReady()) {
      return true;
    }

    if (typeof window === 'undefined') {
      return false;
    }

    const android = window.Android;
    if (typeof android?.isNativeAndroidApp === 'function') {
      try {
        const isNative = android.isNativeAndroidApp();
        if (isNative) {
          this.nativeReady.set(true);
        }
        return isNative;
      } catch {
        return this.nativeReady();
      }
    }

    if (typeof android?.postMessage === 'function') {
      this.send('isNativeAndroidApp');
    }

    return this.nativeReady();
  }

  private send(event: string, payload: NativeBridgeCommandPayload = {}): void {
    if (typeof window === 'undefined') {
      return;
    }

    const android = window.Android;
    if (!android?.postMessage) {
      return;
    }

    android.postMessage(JSON.stringify({ event, payload }));
  }

  private getAndroidBridge(): NativeAndroidBridge | null {
    if (typeof window === 'undefined') {
      return null;
    }
    return window.Android ?? null;
  }

  saveAuthentication(auth: { token?: string; userId?: string; branchId?: string; branchName?: string }): void {
    const android = this.getAndroidBridge();
    if (typeof android?.updateAuthentication === 'function') {
      android.updateAuthentication(
        auth.token ?? '',
        auth.userId ?? '',
        auth.branchId ?? '',
        auth.branchName ?? ''
      );
      return;
    }

    this.send('saveAuthentication', {
      token: auth.token ?? '',
      userId: auth.userId ?? '',
      branchId: auth.branchId ?? '',
      branchName: auth.branchName ?? ''
    });
  }

  updateAuthentication(auth: { token?: string; userId?: string; branchId?: string; branchName?: string }): void {
    const android = this.getAndroidBridge();
    if (typeof android?.updateAuthentication === 'function') {
      android.updateAuthentication(
        auth.token ?? '',
        auth.userId ?? '',
        auth.branchId ?? '',
        auth.branchName ?? ''
      );
      return;
    }

    this.send('updateAuthentication', {
      token: auth.token ?? '',
      userId: auth.userId ?? '',
      branchId: auth.branchId ?? '',
      branchName: auth.branchName ?? ''
    });
  }

  updateBranchInformation(branchId?: string, branchName?: string): void {
    const android = this.getAndroidBridge();
    if (typeof android?.updateBranchInformation === 'function') {
      android.updateBranchInformation(branchId ?? '', branchName ?? '');
      return;
    }

    this.send('updateBranchInformation', {
      branchId: branchId ?? '',
      branchName: branchName ?? ''
    });
  }

  registerForPushNotifications(): void {
    const android = this.getAndroidBridge();
    if (typeof android?.registerForPushNotifications === 'function') {
      android.registerForPushNotifications();
      return;
    }

    this.send('registerForPushNotifications', {});
  }

  unregisterForPushNotifications(): void {
    const android = this.getAndroidBridge();
    if (typeof android?.unregisterForPushNotifications === 'function') {
      android.unregisterForPushNotifications();
    } else {
      this.send('unregisterForPushNotifications', {});
    }

    this.firebaseRegistered.set(false);
    this.nativeNotificationMode.set(false);
  }

  playAlarm(): void {
    const android = this.getAndroidBridge();
    if (typeof android?.playAlarm === 'function') {
      android.playAlarm();
      return;
    }
    this.send('playAlarm');
  }

  stopAlarm(): void {
    const android = this.getAndroidBridge();
    if (typeof android?.stopAlarm === 'function') {
      android.stopAlarm();
      return;
    }
    this.send('stopAlarm');
  }

  vibrate(): void {
    const android = this.getAndroidBridge();
    if (typeof android?.vibrate === 'function') {
      android.vibrate();
      return;
    }
    this.send('vibrate');
  }

  openSettings(): void {
    const android = this.getAndroidBridge();
    if (typeof android?.openSettings === 'function') {
      android.openSettings();
      return;
    }
    this.send('openSettings');
  }

  ping(): void {
    const android = this.getAndroidBridge();
    if (typeof android?.ping === 'function') {
      android.ping();
      return;
    }
    this.send('ping');
  }

  logout(): void {
    this.send('logout', {});
  }

  isNativeNotificationEnabled(): boolean {
    return this.isNativeAndroidApp() && this.firebaseRegistered() && this.nativeNotificationMode();
  }
}
