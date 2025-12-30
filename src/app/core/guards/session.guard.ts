import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { PhotoboothStateService } from '../services/photobooth-state.service';

export const sessionGuard: CanActivateFn = () => {
  const state = inject(PhotoboothStateService);
  const router = inject(Router);

  if (state.hasActiveSession()) {
    return true;
  }

  return router.parseUrl('/config');
};
