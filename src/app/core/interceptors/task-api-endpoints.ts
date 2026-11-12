import { API_ENDPOINTS } from '../../shared/constants/api.constants';

/** Matches an individual task endpoint and captures its encoded task ID. */
export const TASK_ITEM_ENDPOINT_PATTERN = /^\/api\/tasks\/([^/?]+)$/;

/** Identifies request paths handled by the task and statistics API. */
export function isTaskApiRequest(url: string): boolean {
  const path = url.split('?')[0];
  return (
    path === API_ENDPOINTS.tasks ||
    TASK_ITEM_ENDPOINT_PATTERN.test(path) ||
    path === API_ENDPOINTS.statistics
  );
}
