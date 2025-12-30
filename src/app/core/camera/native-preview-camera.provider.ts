import { Capacitor } from '@capacitor/core';

import { CameraProvider } from './camera-provider';

export class NativePreviewCameraProvider implements CameraProvider {
  isSupported(): boolean {
    return Capacitor.isNativePlatform();
  }

  async start(_target: HTMLVideoElement | HTMLElement): Promise<void> {
    // TODO: Integrate the native camera preview plugin here.
    // - Mount the preview inside the provided container element.
    // - Respect facingMode (front/back) once options are added.
    throw new Error('Native camera preview not implemented yet');
  }

  async capture(): Promise<Blob> {
    // TODO: Capture a snapshot from the native preview and return a Blob.
    throw new Error('Native camera preview not implemented yet');
  }

  stop(): void {
    // No-op for now.
  }
}
