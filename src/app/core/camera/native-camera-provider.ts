import { CameraProvider } from './camera-provider';

export class NativeCameraProvider implements CameraProvider {
  isSupported(): boolean {
    return false;
  }

  async start(_target: HTMLVideoElement | HTMLElement): Promise<void> {
    throw new Error('Native camera provider not implemented');
  }

  async capture(): Promise<Blob> {
    throw new Error('Native camera provider not implemented');
  }

  stop(): void {
    // No-op for now.
  }
}
