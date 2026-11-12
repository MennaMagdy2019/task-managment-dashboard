import type { TaskPriority, TaskStatus } from '../../../shared/models/task.model';
import { ALL_TASK_FILTER } from '../../../shared/constants/task.constants';

/** Dashboard route-backed and filter-specific views. */
export type DashboardView = 'dashboard' | 'my-tasks' | 'upcoming' | 'overdue' | 'analytics';

/** Navigation actions emitted by the dashboard sidebar. */
export type DashboardNavigationAction = 'team' | 'settings';

/** Result style used by dashboard snack-bar notifications. */
export type DashboardNoticeKind = 'success' | 'error';

/** Priority filter value, including the unfiltered option. */
export type BoardPriorityFilter = typeof ALL_TASK_FILTER | TaskPriority;

/** Status filter value, including the unfiltered option. */
export type BoardStatusFilter = typeof ALL_TASK_FILTER | TaskStatus;

/** Inputs used to filter tasks for the current dashboard view. */
export interface TaskFilterOptions {
  search: string;
  priority: BoardPriorityFilter;
  status: BoardStatusFilter;
  assigneeId: string;
  view: DashboardView;
  currentUserId: string;
  today?: string;
  upcomingThrough?: string;
}

/** Aggregate task totals displayed in the dashboard summary. */
export interface DashboardStatistics {
  total: number;
  done: number;
  inProgress: number;
  overdue: number;
}
