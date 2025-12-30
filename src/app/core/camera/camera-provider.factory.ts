import { Capacitor } from '@capacitor/core';

import { CameraProvider } from './camera-provider';
import { NativePreviewCameraProvider } from './native-preview-camera.provider';
import { WebcamCameraProvider } from './webcam-camera-provider';

export const getCameraProvider = (): CameraProvider => {
  return Capacitor.isNativePlatform()
    ? new NativePreviewCameraProvider()
    : new WebcamCameraProvider();
};
