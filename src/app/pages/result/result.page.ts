import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';

import { CollageResult, CollageService } from '../../core/services/collage.service';
import { PhotoboothStateService } from '../../core/services/photobooth-state.service';
import { isNative } from '../../core/utils/platform';

@Component({
  selector: 'app-result',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './result.page.html',
})
export class ResultPage implements OnInit {
  collage: CollageResult | null = null;
  isLoading = true;
  isNativePlatform = isNative();
  errorMessage = '';

  constructor(
    private readonly collageService: CollageService,
    private readonly state: PhotoboothStateService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    const session = this.state.getSession();
    if (session.photos.length < 4) {
      this.isLoading = false;
      void this.router.navigateByUrl('/config');
      return;
    }

    const backgroundDataUrl = this.state.getSelectedBackgroundDataUrl();

    this.collageService
      .generateCollage(session.photos, backgroundDataUrl, 'jpeg', 0.95)
      .then((result) => {
        this.collage = result;
      })
      .finally(() => {
        this.isLoading = false;
      });
  }

  handleExport(): void {
    if (!this.collage) {
      return;
    }

    if (this.isNativePlatform) {
      this.errorMessage = 'Export en movil pendiente (Share/Guardar).';
      return;
    }

    const exportData = this.collageService.exportCollage(this.collage);
    const url = URL.createObjectURL(exportData.blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = exportData.filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async restart(): Promise<void> {
    this.state.resetSession();
    await this.router.navigateByUrl('/config');
  }

}
