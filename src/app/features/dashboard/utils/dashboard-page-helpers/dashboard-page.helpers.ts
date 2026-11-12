import type { DashboardView } from '../../models/dashboard.model';
import { HttpErrorResponse } from '@angular/common/http';
import type { TaskBoardColumn } from '../../components/task-board/task-board.component';
import { CURRENT_USER, TEAM_MEMBERS } from '../../../../shared/models/task.model';
import type { Task, TaskActivity, TaskStatus } from '../../../../shared/models/task.model';

/** Dashboard board columns in their display order. */
export const DASHBOARD_COLUMNS: TaskBoardColumn[] = [
  { status: 'todo', label: 'To do', icon: '○' },
  { status: 'in_progress', label: 'In progress', icon: '◷' },
  { status: 'done', label: 'Done', icon: '✓' },
];

/**
 * Creates the initial sample activity displayed before new task actions occur.
 * @param now The current date and time.
 * @returns The list of initial activities.
 */
export function createInitialActivities(now = new Date()): TaskActivity[] {
  const daysAgo = (days: number): string => {
    const date = new Date(now);
    date.setDate(date.getDate() - days);
    return date.toISOString();
  };

  return [
    {
      id: 'a1',
      message: 'completed a task',
      taskTitle: 'Publish product release notes',
      actor: TEAM_MEMBERS[4],
      occurredAt: daysAgo(0),
      kind: 'completed',
    },
    {
      id: 'a2',
      message: 'updated the due date for',
      taskTitle: 'Prepare Q3 campaign brief',
      actor: TEAM_MEMBERS[1],
      occurredAt: daysAgo(0),
      kind: 'updated',
    },
    {
      id: 'a3',
      message: 'created a task',
      taskTitle: 'Build the integrations page',
      actor: TEAM_MEMBERS[1],
      occurredAt: daysAgo(1),
      kind: 'created',
    },
    {
      id: 'a4',
      message: 'completed a task',
      taskTitle: 'Finalize brand guidelines',
      actor: TEAM_MEMBERS[2],
      occurredAt: daysAgo(1),
      kind: 'completed',
    },
  ];
}

/**
 * Maps implemented application URLs to the corresponding task view.
 * @param url The application URL.
 * @returns The corresponding task view.
 */
export function dashboardViewFromUrl(url: string): DashboardView {
  const path = url.split('?')[0];
  if (path === '/tasks') return 'my-tasks';
  if (path === '/analytics') return 'analytics';
  return 'dashboard';
}

/**
 * Maps a task view to its canonical application URL.
 * @param view The task view.
 * @returns The canonical application URL.
 */
export function dashboardUrlForView(view: DashboardView): string {
  switch (view) {
    case 'my-tasks':
      return '/tasks';
    case 'upcoming':
      return '/dashboard';
    case 'analytics':
      return '/analytics';
    case 'dashboard':
    case 'overdue':
      return '/dashboard';
  }
}

/**
 * Creates a bounded activity entry for an action made by the current user.
 * @param kind The type of activity.
 * @param message The activity message.
 * @param taskTitle The title of the task associated with the activity.
 * @param now The current date and time.
 * @returns The created task activity.
 */
export function createTaskActivity(
  kind: TaskActivity['kind'],
  message: string,
  taskTitle: string,
  now = new Date(),
): TaskActivity {
  return {
    id: crypto.randomUUID(),
    message,
    taskTitle,
    actor: CURRENT_USER,
    occurredAt: now.toISOString(),
    kind,
  };
}

/**
 * Returns the user-facing message for a task API error.
 * @param error The error object.
 * @param fallback The fallback message.
 * @returns The user-facing message.
 */
export function taskErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof HttpErrorResponse) {
    const status = error.status;
    const body = error.error as { message?: unknown } | null;
    if (body && typeof body.message === 'string') return `${fallback} ${body.message}`;
    if (status === 0) return `${fallback} Check your connection and try again.`;
    if (status === 400) return `${fallback} Check the task details and try again.`;
    if (status === 404) return `${fallback} The task was not found.`;
    if (typeof status === 'number' && status >= 500)
      return `${fallback} The service is temporarily unavailable.`;
  }
  return fallback;
}

/**
 * Builds the activity message used when a task changes status.
 * @param status The new task status.
 * @returns The activity message.
 */
export function taskMoveActivity(status: TaskStatus): Pick<TaskActivity, 'kind' | 'message'> {
  return {
    kind: status === 'done' ? 'completed' : 'updated',
    message: `moved a task to ${status === 'todo' ? 'To do' : status === 'in_progress' ? 'In progress' : 'Done'}`,
  };
}

/**
 * Counts unfinished tasks due within the next seven calendar days.
 * @param tasks The list of tasks to evaluate.
 * @param today The current date in YYYY-MM-DD format.
 * @returns The number of upcoming tasks.
 */
export function countUpcomingTasks(
  tasks: Task[],
  today = new Date().toISOString().slice(0, 10),
): number {
  const through = new Date(`${today}T00:00:00.000Z`);
  through.setUTCDate(through.getUTCDate() + 7);
  const throughDate = through.toISOString().slice(0, 10);
  return tasks.filter(
    (task) => task.status !== 'done' && task.dueDate >= today && task.dueDate <= throughDate,
  ).length;
}

/**
 * Converts a board viewport width to its responsive statistic card column count.
 * @param viewportWidth The width of the viewport.
 * @returns The number of columns for the statistic cards.
 */
export function statisticColumnCount(viewportWidth: number): number {
  return viewportWidth < 1100 ? 2 : 4;
}

/**
 * Determines whether the current viewport should display the mobile navigation.
 * @param viewportWidth The width of the viewport.
 * @returns True if the mobile navigation should be displayed, false otherwise.
 */
export function isMobileViewport(viewportWidth: number): boolean {
  return viewportWidth < 700;
}
