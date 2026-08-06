export interface NativeBridgeCommandPayload {
  [key: string]: unknown;
}

export interface NativeAndroidBridge {
  postMessage?: (message: string) => void;
  isNativeAndroidApp?: () => boolean;
  registerForPushNotifications?: () => void;
  unregisterForPushNotifications?: () => void;
  updateBranchInformation?: (branchId: string, branchName: string) => void;
  updateAuthentication?: (token: string, userId: string, branchId: string, branchName: string) => void;
  playAlarm?: () => void;
  stopAlarm?: () => void;
  vibrate?: () => void;
  openSettings?: () => void;
  ping?: () => void;
}

declare global {
  interface Window {
    Android?: NativeAndroidBridge;
  }
}
