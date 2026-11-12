import type { TaskPriority, TaskStatus } from '../../../shared/models/task.model';

export type DashboardView = 'dashboard' | 'my-tasks' | 'upcoming' | 'overdue' | 'analytics';
export type DashboardNavItem = 'dashboard' | 'tasks' | 'analytics' | 'team' | 'settings';
export type BoardPriorityFilter = 'all' | TaskPriority;
export type BoardStatusFilter = 'all' | TaskStatus;

export interface DashboardStatistics {
  total: number;
  done: number;
  inProgress: number;
  overdue: number;
}
