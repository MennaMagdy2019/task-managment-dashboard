/** Canonical route segments and URLs shared by router and navigation helpers. */
export const APP_ROUTE_PATHS = {
  dashboard: { segment: 'dashboard', url: '/dashboard' },
  tasks: { segment: 'tasks', url: '/tasks' },
  analytics: { segment: 'analytics', url: '/analytics' },
  team: { segment: 'team', url: '/team' },
} as const;

/** Common action labels reused by application notifications. */
export const UI_ACTION_LABELS = {
  dismiss: 'Dismiss',
} as const;
