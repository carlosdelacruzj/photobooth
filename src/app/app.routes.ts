import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'config',
  },
  {
    path: 'config',
    loadComponent: () =>
      import('./pages/config/config.page').then((m) => m.ConfigPage),
  },
  {
    path: 'capture',
    loadComponent: () =>
      import('./pages/capture/capture.page').then((m) => m.CapturePage),
  },
  {
    path: 'resultado',
    loadComponent: () =>
      import('./pages/result/result.page').then((m) => m.ResultPage),
  },
  {
    path: '**',
    redirectTo: 'config',
  },
];