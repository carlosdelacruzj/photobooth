import { CameraProvider } from './camera-provider';

export class WebcamCameraProvider implements CameraProvider {
  private stream: MediaStream | null = null;
  private videoEl: HTMLVideoElement | null = null;
  private facingMode?: 'user' | 'environment';

  isSupported(): boolean {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }

  async init(options?: { facingMode?: 'user' | 'environment' }): Promise<void> {
    this.facingMode = options?.facingMode;
  }

  async start(target: HTMLVideoElement | HTMLElement): Promise<void> {
    if (!(target instanceof HTMLVideoElement)) {
      throw new Error('Webcam target must be a video element');
    }

    const videoEl = target;
    this.videoEl = videoEl;
    const videoConstraints: MediaTrackConstraints | boolean = this.facingMode
      ? { facingMode: { ideal: this.facingMode } }
      : true;
    this.stream = await navigator.mediaDevices.getUserMedia({
      video: videoConstraints,
      audio: false,
    });

    videoEl.srcObject = this.stream;
    await videoEl.play();
  }

  async capture(): Promise<Blob> {
    const videoEl = this.videoEl;
    if (!videoEl) {
      throw new Error('Webcam not started');
    }
    const canvas = document.createElement('canvas');
    canvas.width = videoEl.videoWidth || 1280;
    canvas.height = videoEl.videoHeight || 720;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas context not available');
    }

    ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to capture frame'));
          }
        },
        'image/jpeg',
        0.92
      );
    });
  }

  stop(): void {
    if (!this.stream) {
      return;
    }

    this.stream.getTracks().forEach((track) => track.stop());
    this.stream = null;
    this.videoEl = null;
  }
}
