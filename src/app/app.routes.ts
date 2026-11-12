import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'dashboard',
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./features/dashboard/pages/dashboard-page/dashboard-page.component').then(
        (module) => module.DashboardPageComponent,
      ),
  },
  {
    path: 'tasks',
    loadComponent: () =>
      import('./features/dashboard/pages/dashboard-page/dashboard-page.component').then(
        (module) => module.DashboardPageComponent,
      ),
  },
  {
    path: 'analytics',
    loadComponent: () =>
      import('./features/dashboard/pages/dashboard-page/dashboard-page.component').then(
        (module) => module.DashboardPageComponent,
      ),
  },
  { path: '**', redirectTo: 'dashboard' },
];
