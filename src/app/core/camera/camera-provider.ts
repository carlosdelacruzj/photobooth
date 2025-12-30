export interface CameraProviderOptions {
  facingMode?: 'user' | 'environment';
}

export interface CameraProvider {
  init?(options?: CameraProviderOptions): Promise<void>;
  isSupported(): boolean | Promise<boolean>;
  start(target: HTMLVideoElement | HTMLElement): Promise<void>;
  capture(): Promise<Blob>;
  stop(): void;
}
