import { CameraProvider } from './camera-provider';

export class NativeCameraProvider implements CameraProvider {
  async start(_videoEl: HTMLVideoElement): Promise<void> {
    throw new Error('Native camera provider not implemented');
  }

  async capture(_videoEl: HTMLVideoElement): Promise<Blob> {
    throw new Error('Native camera provider not implemented');
  }

  stop(): void {
    // No-op for now.
  }
}
