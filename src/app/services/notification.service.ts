import { Injectable, signal } from '@angular/core';

interface NotificationServiceWorkerMessage {
  type: 'KITCHEN_NOTIFICATION';
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
}

export interface KitchenNotification {
  title: string;
  body: string;
  orderId?: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  public readonly activeNotification = signal<KitchenNotification | null>(null);
  public readonly isAlerting = signal(false);
  private audioContext?: AudioContext;
  private gainNode?: GainNode;
  private alertTimer?: number;
  private repeatCount = 0;
  private audioUnlocked = false;
  private alertInterval?: number;
  private alertEndTime = 0;
  private readonly storageKey = 'kitchen-notification';

  constructor() {
    if (typeof window === 'undefined') {
      return;
    }

    const unlockInteraction = () => {
      void this.unlockAudio();
      void this.requestPermission();
    };

    window.addEventListener('pointerdown', unlockInteraction, { once: true, capture: true });
    window.addEventListener('touchstart', unlockInteraction, { once: true, capture: true });
    window.addEventListener('keydown', unlockInteraction, { once: true, capture: true });
    window.addEventListener('focus', () => void this.restorePendingNotification());
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        void this.restorePendingNotification();
      }
    });

    void this.registerServiceWorker();
    void this.restorePendingNotification();
  }

  private createTone() {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
      this.gainNode = this.audioContext.createGain();
      this.gainNode.gain.setValueAtTime(0.15, this.audioContext.currentTime);
      this.gainNode.connect(this.audioContext.destination);
    }

    const oscillator = this.audioContext.createOscillator();
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(440, this.audioContext.currentTime);
    oscillator.connect(this.gainNode!);
    return oscillator;
  }

  private async unlockAudio() {
    if (this.audioUnlocked) {
      return;
    }

    try {
      if (!this.audioContext) {
        this.audioContext = new AudioContext();
        this.gainNode = this.audioContext.createGain();
        this.gainNode.gain.setValueAtTime(0.15, this.audioContext.currentTime);
        this.gainNode.connect(this.audioContext.destination);
      }

      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
      this.audioUnlocked = true;
    } catch {
      this.audioUnlocked = false;
    }
  }

  async requestPermission() {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return;
    }

    if (Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  }

  private restorePendingNotification() {
    if (this.activeNotification() || this.isAlerting()) {
      return;
    }

    const stored = this.loadStoredNotification();
    if (stored) {
      this.activeNotification.set(stored);
      void this.pulseAlert();
    }
  }

  private loadStoredNotification(): KitchenNotification | null {
    if (typeof window === 'undefined' || !window.localStorage) {
      return null;
    }

    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) {
        return null;
      }

      const parsed = JSON.parse(raw) as KitchenNotification;
      return parsed?.title && parsed?.body ? parsed : null;
    } catch {
      return null;
    }
  }

  private storeNotification(notification: KitchenNotification) {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }

    try {
      localStorage.setItem(this.storageKey, JSON.stringify(notification));
    } catch {
      // ignore
    }
  }

  private clearStoredNotification() {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }

    try {
      localStorage.removeItem(this.storageKey);
    } catch {
      // ignore
    }
  }

  private async registerServiceWorker() {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    try {
      const swUrl = new URL('notification-sw.js', window.location.href).toString();
      await navigator.serviceWorker.register(swUrl, { scope: './' });
    } catch {
      // ignore service worker registration issues on unsupported browsers
    }
  }

  notify(notification: KitchenNotification) {
    if (this.activeNotification() || this.isAlerting()) {
      this.stopAlert();
    }

    this.clearStoredNotification();
    this.activeNotification.set(notification);
    this.storeNotification(notification);
    this.showBrowserNotification(notification);
    void this.pulseAlert();
  }

  private showBrowserNotification(notification: KitchenNotification) {
    if (typeof window === 'undefined') {
      return;
    }

    const tag = `kitchen-${notification.orderId ?? Date.now()}`;
    const payload: NotificationServiceWorkerMessage = {
      type: 'KITCHEN_NOTIFICATION',
      title: notification.title,
      body: notification.body,
      tag
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        if (registration.showNotification) {
          const options: any = {
            body: payload.body,
            tag: payload.tag,
            icon: payload.icon,
            badge: payload.badge,
            vibrate: [300, 100, 300],
            requireInteraction: true,
            renotify: true,
            silent: false
          };
          registration.showNotification(payload.title, options);
        } else {
          registration.active?.postMessage(payload);
        }
      }).catch(() => {
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(payload.title, {
            body: payload.body,
            tag,
            silent: false
          });
        }
      });
      return;
    }

    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.body,
        tag,
        silent: false
      });
    }
  }

  private async pulseAlert() {
    if (this.isAlerting()) {
      return;
    }

    this.repeatCount = 0;
    this.alertEndTime = Date.now() + 5 * 60 * 1000;
    this.isAlerting.set(true);
    await this.unlockAudio();
    this.startRepeatingTone();
  }

  private startRepeatingTone() {
    const playBuzz = () => {
      if (!this.audioContext || Date.now() >= this.alertEndTime) {
        this.stopAlert();
        return;
      }

      try {
        const oscillator = this.createTone();
        const now = this.audioContext.currentTime;
        oscillator.start(now);
        oscillator.stop(now + 0.8);
      } catch {
        // audio context may be blocked until user interacts
      }

      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([300, 100, 300]);
      }

      this.alertInterval = window.setTimeout(playBuzz, 1000);
    };

    playBuzz();
  }

  stopAlert() {
    if (this.alertTimer) {
      window.clearTimeout(this.alertTimer);
      this.alertTimer = undefined;
    }
    if (this.alertInterval) {
      window.clearTimeout(this.alertInterval);
      this.alertInterval = undefined;
    }
    this.alertEndTime = 0;

    try {
      if (this.audioContext) {
        this.audioContext.close();
        this.audioContext = undefined;
        this.gainNode = undefined;
      }
    } catch {
      // ignore
    }
    this.audioUnlocked = false;
    this.clearStoredNotification();
    this.isAlerting.set(false);
    this.activeNotification.set(null);
  }
}
