import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';

import { PHOTO_COUNT } from '../photobooth.constants';

export type FacingMode = 'front' | 'back';
export type SessionStatus = 'idle' | 'countingDown' | 'capturing' | 'completed';

export interface PhotoboothConfig {
  secondsPerShot: number;
  facingMode: FacingMode;
  backgroundGallery: Array<{ id: string; name?: string; dataUrl: string }>;
  selectedBackgroundId: string | null;
}

export interface PhotoboothSession {
  sessionId: string | null;
  status: SessionStatus;
  currentIndex: number;
  totalPhotos: number;
  photos: Blob[];
}

const CONFIG_KEY = 'photobooth_config';

@Injectable({ providedIn: 'root' })
export class PhotoboothStateService {
  private config: PhotoboothConfig = {
    secondsPerShot: 3,
    facingMode: 'back',
    backgroundGallery: [],
    selectedBackgroundId: null,
  };

  private session: PhotoboothSession = {
    sessionId: null,
    status: 'idle',
    currentIndex: 0,
    totalPhotos: 0,
    photos: [],
  };

  getSession(): PhotoboothSession {
    return {
      ...this.session,
      photos: [...this.session.photos],
    };
  }

  getConfig(): PhotoboothConfig {
    return { ...this.config };
  }

  setConfig(next: Partial<PhotoboothConfig>): void {
    this.config = { ...this.config, ...next };
  }

  addBackground(item: { id: string; name?: string; dataUrl: string }): void {
    this.config = {
      ...this.config,
      backgroundGallery: [...this.config.backgroundGallery, item],
      selectedBackgroundId: item.id,
    };
  }

  removeBackground(id: string): void {
    const backgroundGallery = this.config.backgroundGallery.filter(
      (item) => item.id !== id
    );
    const selectedBackgroundId =
      this.config.selectedBackgroundId === id
        ? backgroundGallery[0]?.id ?? null
        : this.config.selectedBackgroundId;

    this.config = {
      ...this.config,
      backgroundGallery,
      selectedBackgroundId,
    };
  }

  selectBackground(id: string | null): void {
    this.config = {
      ...this.config,
      selectedBackgroundId: id,
    };
  }

  getSelectedBackgroundDataUrl(): string | null {
    const selectedId = this.config.selectedBackgroundId;
    if (!selectedId) {
      return null;
    }
    const item = this.config.backgroundGallery.find(
      (entry) => entry.id === selectedId
    );
    return item?.dataUrl ?? null;
  }

  async loadConfig(): Promise<void> {
    const { value } = await Preferences.get({ key: CONFIG_KEY });
    if (!value) {
      return;
    }

    try {
      const parsed = JSON.parse(value) as Partial<PhotoboothConfig> & {
        backgroundDataUrl?: string | null;
      };
      this.setConfig(parsed);
      this.normalizeBackgroundConfig(parsed);
    } catch {
      // Ignore invalid stored config and keep defaults.
    }
  }

  async saveConfig(): Promise<void> {
    await Preferences.set({
      key: CONFIG_KEY,
      value: JSON.stringify(this.config),
    });
  }

  startSession(): void {
    this.session = {
      sessionId: this.generateSessionId(),
      status: 'idle',
      currentIndex: 0,
      totalPhotos: PHOTO_COUNT,
      photos: [],
    };
  }

  addPhoto(photo: Blob): void {
    const photos = [...this.session.photos, photo];
    this.session = {
      ...this.session,
      photos,
      currentIndex: photos.length,
      status: photos.length >= this.session.totalPhotos ? 'completed' : 'capturing',
    };
  }

  setStatus(status: SessionStatus): void {
    this.session = {
      ...this.session,
      status,
    };
  }

  resetSession(): void {
    this.session = {
      sessionId: null,
      status: 'idle',
      currentIndex: 0,
      totalPhotos: 0,
      photos: [],
    };
  }

  hasActiveSession(): boolean {
    return this.session.sessionId !== null;
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  private normalizeBackgroundConfig(parsed: {
    backgroundGallery?: Array<{ id: string; name?: string; dataUrl: string }>;
    selectedBackgroundId?: string | null;
    backgroundDataUrl?: string | null;
  }): void {
    const gallery = parsed.backgroundGallery ?? [];
    let selectedBackgroundId = parsed.selectedBackgroundId ?? null;

    if (!selectedBackgroundId && parsed.backgroundDataUrl) {
      const migratedId = `bg-${Date.now()}`;
      this.config.backgroundGallery = [
        ...gallery,
        { id: migratedId, dataUrl: parsed.backgroundDataUrl },
      ];
      this.config.selectedBackgroundId = migratedId;
      return;
    }

    this.config.backgroundGallery = gallery;
    this.config.selectedBackgroundId =
      selectedBackgroundId &&
      gallery.some((item) => item.id === selectedBackgroundId)
        ? selectedBackgroundId
        : null;
  }
}
