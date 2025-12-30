export interface CameraProvider {
  start(videoEl: HTMLVideoElement): Promise<void>;
  capture(videoEl: HTMLVideoElement): Promise<Blob>;
  stop(): void;
}
