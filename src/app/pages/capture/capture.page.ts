import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';

import { CameraProvider } from '../../core/camera/camera-provider';
import { getCameraProvider } from '../../core/camera/camera-provider.factory';
import { PhotoboothStateService } from '../../core/services/photobooth-state.service';
import { isNative } from '../../core/utils/platform';

@Component({
  selector: 'app-capture',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './capture.page.html',
})
export class CapturePage implements OnInit, AfterViewInit, OnDestroy {
  countdown = 0;
  currentIndex = 0;
  totalPhotos = 0;
  isRunning = false;
  errorMessage = '';
  isNativePlatform = isNative();

  @ViewChild('videoPreview', { static: false })
  videoPreviewRef?: ElementRef<HTMLVideoElement>;

  @ViewChild('nativePreviewContainer', { static: false })
  nativePreviewContainerRef?: ElementRef<HTMLDivElement>;

  private provider: CameraProvider | null = null;
  private isCancelled = false;
  private countdownResolver: (() => void) | null = null;
  private timers: Array<{ id: number; type: 'timeout' | 'interval' }> = [];

  constructor(
    private readonly state: PhotoboothStateService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    const session = this.state.getSession();
    this.currentIndex = session.currentIndex;
    this.totalPhotos = session.totalPhotos;
  }

  async ngAfterViewInit(): Promise<void> {
    this.provider = getCameraProvider();
    const config = this.state.getConfig();
    await this.provider.init?.({
      facingMode: config.facingMode === 'front' ? 'user' : 'environment',
    });
    const target = this.isNativePlatform
      ? this.nativePreviewContainerRef?.nativeElement
      : this.videoPreviewRef?.nativeElement;

    if (!target) {
      return;
    }

    try {
      await this.provider.start(target);
    } catch {
      await this.handleError(
        'No se pudo iniciar la camara.'
      );
    }
  }

  ionViewDidLeave(): void {
    this.clearAllTimers();
    this.provider?.stop();
  }

  ngOnDestroy(): void {
    this.clearAllTimers();
    this.provider?.stop();
  }

  async start(): Promise<void> {
    if (this.isRunning || this.totalPhotos === 0) {
      return;
    }

    if (!this.provider) {
      return;
    }

    this.isRunning = true;
    this.isCancelled = false;
    this.errorMessage = '';

    const config = this.state.getConfig();

    for (let i = 0; i < this.totalPhotos; i += 1) {
      if (this.isCancelled) {
        break;
      }

      this.state.setStatus('countingDown');
      await this.runCountdown(config.secondsPerShot);
      if (this.isCancelled) {
        break;
      }

      this.state.setStatus('capturing');
      try {
        const photo = await this.provider.capture();
        this.state.addPhoto(photo);
        this.currentIndex = this.state.getSession().currentIndex;
      } catch {
        await this.handleError('Fallo la captura de la foto.');
        break;
      }
    }

    this.isRunning = false;

    if (this.isCancelled) {
      return;
    }

    await this.router.navigateByUrl('/resultado');
  }

  async cancel(): Promise<void> {
    if (this.isCancelled) {
      return;
    }

    this.isCancelled = true;
    this.clearAllTimers();
    this.provider?.stop();
    this.state.resetSession();
    await this.router.navigateByUrl('/config');
  }

  private async runCountdown(seconds: number): Promise<void> {
    this.clearAllTimers();
    const totalSeconds = Math.max(1, Math.floor(seconds));
    this.countdown = totalSeconds;

    return new Promise((resolve) => {
      this.countdownResolver = resolve;
      this.addInterval(() => {
        if (this.isCancelled) {
          return;
        }
        this.countdown = Math.max(0, this.countdown - 1);
      }, 1000);

      this.addTimeout(() => {
        this.countdown = 0;
        this.clearAllTimers();
        resolve();
      }, totalSeconds * 1000);
    });
  }

  private addTimeout(handler: () => void, ms: number): void {
    const id = window.setTimeout(handler, ms);
    this.timers.push({ id, type: 'timeout' });
  }

  private addInterval(handler: () => void, ms: number): void {
    const id = window.setInterval(handler, ms);
    this.timers.push({ id, type: 'interval' });
  }

  private clearAllTimers(): void {
    for (const timer of this.timers) {
      if (timer.type === 'timeout') {
        clearTimeout(timer.id);
      } else {
        clearInterval(timer.id);
      }
    }
    this.timers = [];

    if (this.countdownResolver) {
      const resolver = this.countdownResolver;
      this.countdownResolver = null;
      resolver();
    }
  }

  private async handleError(message: string): Promise<void> {
    this.errorMessage = message;
    this.isRunning = false;
    this.isCancelled = true;
    this.clearAllTimers();
    this.provider?.stop();
    this.state.resetSession();
    this.addTimeout(() => {
      void this.router.navigateByUrl('/config');
    }, 500);
  }
}
