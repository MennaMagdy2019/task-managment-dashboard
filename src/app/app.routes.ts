import { Routes } from '@angular/router';
import { APP_ROUTE_PATHS } from './shared/constants/app.constants';

/** Lazily loads the page shared by dashboard, tasks, and analytics routes. */
const loadDashboardPage = () =>
  import('./features/dashboard/pages/dashboard-page/dashboard-page.component').then(
    (module) => module.DashboardPageComponent,
  );

/** Application route configuration with a dashboard fallback for unknown URLs. */
export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'dashboard',
  },
  {
    path: APP_ROUTE_PATHS.dashboard.segment,
    loadComponent: loadDashboardPage,
  },
  {
    path: APP_ROUTE_PATHS.tasks.segment,
    loadComponent: loadDashboardPage,
  },
  {
    path: APP_ROUTE_PATHS.analytics.segment,
    loadComponent: loadDashboardPage,
  },
  {
    path: `${APP_ROUTE_PATHS.team.segment}/:id`,
    loadComponent: loadDashboardPage,
  },
  { path: '**', redirectTo: 'dashboard' },
];
