import { Capacitor } from '@capacitor/core';
import {
  CameraPreview,
  CameraPreviewOptions,
  CameraPreviewPictureOptions,
} from '@capacitor-community/camera-preview';

import { CameraProvider, CameraProviderOptions } from './camera-provider';

export class NativePreviewCameraProvider implements CameraProvider {
  private facingMode: 'user' | 'environment' | undefined;
  private isStarted = false;
  private containerEl: HTMLElement | null = null;

  isSupported(): boolean {
    return Capacitor.isNativePlatform();
  }

  async init(options?: CameraProviderOptions): Promise<void> {
    this.facingMode = options?.facingMode;
  }

  async start(_target: HTMLVideoElement | HTMLElement): Promise<void> {
    if (!(_target instanceof HTMLElement)) {
      throw new Error('Native preview target must be an HTML element');
    }

    const container = _target;
    if (!container.id) {
      container.id = `native-preview-${Date.now()}`;
    }

    const rect = container.getBoundingClientRect();
    const width = Math.max(1, Math.floor(rect.width || container.clientWidth));
    const height = Math.max(1, Math.floor(rect.height || container.clientHeight));

    const options: CameraPreviewOptions = {
      parent: container.id,
      className: 'native-camera-preview',
      toBack: false,
      position: this.facingMode === 'user' ? 'front' : 'rear',
      width,
      height,
    };

    await CameraPreview.start(options);
    this.isStarted = true;
    this.containerEl = container;
  }

  async capture(): Promise<Blob> {
    if (!this.isStarted) {
      throw new Error('Native preview not started');
    }

    const pictureOptions: CameraPreviewPictureOptions = {
      quality: 90,
    };

    const result = await CameraPreview.capture(pictureOptions);
    const base64 = result.value;
    return this.base64ToBlob(base64, 'image/jpeg');
  }

  stop(): void {
    if (!this.isStarted) {
      return;
    }

    CameraPreview.stop();
    this.isStarted = false;
    this.containerEl = null;
  }

  private base64ToBlob(base64: string, mimeType: string): Blob {
    const binary = atob(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new Blob([bytes], { type: mimeType });
  }
}
