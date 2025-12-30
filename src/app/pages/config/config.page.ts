import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';

import {
  COLLAGE_HEIGHT,
  COLLAGE_WIDTH,
  getFixedSlots,
} from '../../core/photobooth.constants';
import { PhotoboothStateService } from '../../core/services/photobooth-state.service';

@Component({
  selector: 'app-config',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
  templateUrl: './config.page.html',
})
export class ConfigPage implements OnInit {
  secondsPerShot = 3;
  useFrontCamera = false;
  backgroundGallery: Array<{ id: string; name?: string; dataUrl: string }> = [];
  selectedBackgroundId: string | null = null;
  isPreviewOpen = false;
  errorMessage = '';

  @ViewChild('previewCanvas', { static: false })
  previewCanvasRef?: ElementRef<HTMLCanvasElement>;

  @ViewChild('fullPreviewCanvas', { static: false })
  fullPreviewCanvasRef?: ElementRef<HTMLCanvasElement>;

  constructor(
    private readonly state: PhotoboothStateService,
    private readonly router: Router
  ) {}

  async ngOnInit(): Promise<void> {
    await this.state.loadConfig();
    const config = this.state.getConfig();

    this.secondsPerShot = config.secondsPerShot;
    this.useFrontCamera = config.facingMode === 'front';
    this.backgroundGallery = config.backgroundGallery ?? [];
    this.selectedBackgroundId = config.selectedBackgroundId ?? null;
    this.renderTemplatePreview();
  }

  async start(): Promise<void> {
    this.state.setConfig({
      secondsPerShot: this.secondsPerShot,
      facingMode: this.useFrontCamera ? 'front' : 'back',
      selectedBackgroundId: this.selectedBackgroundId,
    });
    await this.state.saveConfig();

    this.state.startSession();
    await this.router.navigateByUrl('/capture');
  }

  async onBackgroundSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    if (this.backgroundGallery.length >= 8) {
      this.errorMessage = 'Maximo 8 fondos.';
      input.value = '';
      return;
    }

    const dataUrl = await this.readFileAsDataUrl(file);
    const resized = await this.resizeImageToMax(dataUrl, 1080, 1920);
    const id = `bg-${Date.now()}-${Math.random().toString(16).slice(2)}`;

    this.state.addBackground({ id, dataUrl: resized });
    await this.state.saveConfig();
    this.backgroundGallery = this.state.getConfig().backgroundGallery;
    this.selectedBackgroundId = this.state.getConfig().selectedBackgroundId;
    this.renderTemplatePreview();
    input.value = '';
  }

  async removeBackground(id: string): Promise<void> {
    this.state.removeBackground(id);
    await this.state.saveConfig();
    this.backgroundGallery = this.state.getConfig().backgroundGallery;
    this.selectedBackgroundId = this.state.getConfig().selectedBackgroundId;
    this.renderTemplatePreview();
  }

  async selectBackground(id: string | null): Promise<void> {
    this.selectedBackgroundId = id;
    this.state.selectBackground(id);
    await this.state.saveConfig();
    this.renderTemplatePreview();
  }


  private readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

  openPreview(): void {
    this.isPreviewOpen = true;
    setTimeout(() => this.renderTemplatePreview(), 0);
  }

  closePreview(): void {
    this.isPreviewOpen = false;
  }

  private async renderTemplatePreview(): Promise<void> {
    const previewCanvas = this.previewCanvasRef?.nativeElement;
    if (previewCanvas) {
      await this.renderPreviewCanvas(previewCanvas, 270, 480);
    }

    const fullCanvas = this.fullPreviewCanvasRef?.nativeElement;
    if (fullCanvas) {
      await this.renderPreviewCanvas(fullCanvas, 540, 960);
    }
  }

  private async renderPreviewCanvas(
    canvas: HTMLCanvasElement,
    width: number,
    height: number
  ): Promise<void> {
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);

    const backgroundDataUrl = this.state.getSelectedBackgroundDataUrl();
    if (backgroundDataUrl) {
      try {
        const image = await this.loadImage(backgroundDataUrl);
        this.drawCover(ctx, image, 0, 0, width, height);
      } catch {
        // Keep fallback background.
      }
    }

    const scaleX = width / COLLAGE_WIDTH;
    const scaleY = height / COLLAGE_HEIGHT;
    const slots = getFixedSlots();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;

    for (const slot of slots) {
      const x = slot.x * scaleX;
      const y = slot.y * scaleY;
      const w = slot.width * scaleX;
      const h = slot.height * scaleY;
      ctx.strokeRect(x, y, w, h);
    }

  }

  private loadImage(dataUrl: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('Failed to load background'));
      image.src = dataUrl;
    });
  }

  private async resizeImageToMax(
    dataUrl: string,
    maxWidth: number,
    maxHeight: number
  ): Promise<string> {
    const image = await this.loadImage(dataUrl);
    const scale = Math.min(
      1,
      maxWidth / image.width,
      maxHeight / image.height
    );

    if (scale === 1) {
      return dataUrl;
    }

    const canvas = document.createElement('canvas');
    canvas.width = Math.round(image.width * scale);
    canvas.height = Math.round(image.height * scale);

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return dataUrl;
    }

    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    const isPng = dataUrl.startsWith('data:image/png');
    return canvas.toDataURL(isPng ? 'image/png' : 'image/jpeg', 0.92);
  }

  private drawCover(
    ctx: CanvasRenderingContext2D,
    image: HTMLImageElement,
    x: number,
    y: number,
    width: number,
    height: number
  ): void {
    const imageRatio = image.width / image.height;
    const slotRatio = width / height;

    let sx = 0;
    let sy = 0;
    let sw = image.width;
    let sh = image.height;

    if (imageRatio > slotRatio) {
      sw = image.height * slotRatio;
      sx = (image.width - sw) / 2;
    } else if (imageRatio < slotRatio) {
      sh = image.width / slotRatio;
      sy = (image.height - sh) / 2;
    }

    ctx.drawImage(image, sx, sy, sw, sh, x, y, width, height);
  }

}
