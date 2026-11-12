/** Identifies request paths handled by the task and statistics API. */
export function isTaskApiRequest(url: string): boolean {
  const path = url.split('?')[0];
  return path === '/api/tasks' || /^\/api\/tasks\/[^/]+$/.test(path) || path === '/api/statistics';
}
