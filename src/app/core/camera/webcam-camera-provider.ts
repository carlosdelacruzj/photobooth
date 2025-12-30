import { CameraProvider } from './camera-provider';

export class WebcamCameraProvider implements CameraProvider {
  private stream: MediaStream | null = null;

  async start(videoEl: HTMLVideoElement): Promise<void> {
    this.stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false,
    });

    videoEl.srcObject = this.stream;
    await videoEl.play();
  }

  async capture(videoEl: HTMLVideoElement): Promise<Blob> {
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
  }
}
