import { Injectable, signal } from '@angular/core';

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

  notify(notification: KitchenNotification) {
    this.activeNotification.set(notification);
    this.showBrowserNotification(notification);
    void this.pulseAlert();
  }

  private showBrowserNotification(notification: KitchenNotification) {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return;
    }

    if (Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.body,
        tag: `kitchen-${notification.orderId ?? Date.now()}`
      });
    }
  }

  private async pulseAlert() {
    if (this.isAlerting()) {
      return;
    }

    this.repeatCount = 0;
    this.isAlerting.set(true);
    await this.unlockAudio();
    void this.playSoundCycle();
  }

  private playSoundCycle() {
    if (this.repeatCount >= 10) {
      this.stopAlert();
      return;
    }

    try {
      const oscillator = this.createTone();
      oscillator.start();
      oscillator.stop(this.audioContext!.currentTime + 0.25);
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([120, 60, 120]);
      }
    } catch {
      // audio context may be blocked until user interacts
    }

    this.repeatCount += 1;
    this.alertTimer = window.setTimeout(() => {
      if (this.repeatCount >= 10) {
        this.stopAlert();
      } else {
        this.alertTimer = window.setTimeout(() => this.playSoundCycle(), 60000);
      }
    }, 15000);
  }

  stopAlert() {
    if (this.alertTimer) {
      window.clearTimeout(this.alertTimer);
      this.alertTimer = undefined;
    }
    // Close the AudioContext if created to stop ongoing sound.
    try {
      if (this.audioContext) {
        this.audioContext.close();
        this.audioContext = undefined;
        this.gainNode = undefined;
      }
    } catch {
      // ignore
    }
    this.isAlerting.set(false);
    this.activeNotification.set(null);
  }
}
