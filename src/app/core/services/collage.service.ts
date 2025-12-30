import { Injectable } from '@angular/core';

import {
  COLLAGE_HEIGHT,
  COLLAGE_WIDTH,
  getFixedSlots,
} from '../photobooth.constants';

export interface CollageResult {
  blob: Blob;
  dataUrl: string;
  mimeType: 'image/jpeg' | 'image/png';
}

export interface CollageExport {
  blob: Blob;
  filename: string;
  mimeType: 'image/jpeg' | 'image/png';
}

@Injectable({ providedIn: 'root' })
export class CollageService {
  async generateCollage(
    photos: Blob[],
    backgroundDataUrl?: string | null,
    format: 'jpeg' | 'png' = 'jpeg',
    quality = 0.95
  ): Promise<CollageResult> {
    const canvas = document.createElement('canvas');
    canvas.width = COLLAGE_WIDTH;
    canvas.height = COLLAGE_HEIGHT;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas context not available');
    }

    await this.drawBackground(ctx, backgroundDataUrl);

    const slots = getFixedSlots().slice(0, photos.length);
    for (let i = 0; i < slots.length; i += 1) {
      const slot = slots[i];
      const photo = photos[i];
      const image = await this.loadImage(photo);

      const slotX = slot.x;
      const slotY = slot.y;
      const slotW = slot.width;
      const slotH = slot.height;

      this.drawCover(ctx, image, slotX, slotY, slotW, slotH);
    }

    const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
    const dataUrl = canvas.toDataURL(
      mimeType,
      format === 'jpeg' ? quality : undefined
    );
    const blob = await this.canvasToBlob(canvas, mimeType, quality);

    return { blob, dataUrl, mimeType };
  }

  exportCollage(result: CollageResult): CollageExport {
    return {
      blob: result.blob,
      mimeType: result.mimeType,
      filename: this.buildFilename(result.mimeType),
    };
  }

  private async drawBackground(
    ctx: CanvasRenderingContext2D,
    backgroundDataUrl?: string | null
  ): Promise<void> {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);

    if (!backgroundDataUrl) {
      return;
    }

    try {
      const image = await this.loadImage(backgroundDataUrl);
      this.drawCover(ctx, image, 0, 0, width, height);
    } catch {
      // Keep default background if the image fails to load.
    }
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

  private loadImage(source: Blob | string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const url = typeof source === 'string' ? source : URL.createObjectURL(source);
      const image = new Image();
      image.onload = () => {
        if (typeof source !== 'string') {
          URL.revokeObjectURL(url);
        }
        resolve(image);
      };
      image.onerror = () => {
        if (typeof source !== 'string') {
          URL.revokeObjectURL(url);
        }
        reject(new Error('Failed to load image'));
      };
      image.src = url;
    });
  }

  private canvasToBlob(
    canvas: HTMLCanvasElement,
    mimeType: 'image/jpeg' | 'image/png',
    quality: number
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to export collage'));
          }
        },
        mimeType,
        mimeType === 'image/jpeg' ? quality : undefined
      );
    });
  }

  private buildFilename(mimeType: string): string {
    const now = new Date();
    const pad = (value: number) => value.toString().padStart(2, '0');
    const yyyy = now.getFullYear();
    const mm = pad(now.getMonth() + 1);
    const dd = pad(now.getDate());
    const hh = pad(now.getHours());
    const min = pad(now.getMinutes());
    const ss = pad(now.getSeconds());
    const ext = mimeType === 'image/png' ? 'png' : 'jpg';
    return `photobooth_${yyyy}${mm}${dd}_${hh}${min}${ss}.${ext}`;
  }
}
