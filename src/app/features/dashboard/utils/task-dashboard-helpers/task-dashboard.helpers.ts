import type { Task, TaskStatus } from '../../../../shared/models/task.model';
import type {
  BoardPriorityFilter,
  BoardStatusFilter,
  DashboardStatistics,
  DashboardView,
} from '../../models/dashboard.model';

/**
 * Filters tasks by search text, priority, status, assignee, and dashboard view.
 * @param tasks The list of tasks to filter.
 * @param options The filtering options.
 * @returns The filtered list of tasks.
 */
export function filterTasks(
  tasks: Task[],
  options: {
    search: string;
    priority: BoardPriorityFilter;
    status: BoardStatusFilter;
    assigneeId: string;
    view: DashboardView;
    currentUserId: string;
    today?: string;
    upcomingThrough?: string;
  },
): Task[] {
  const search = options.search.trim().toLowerCase();
  const today = options.today ?? new Date().toISOString().slice(0, 10);
  const upcomingThrough = options.upcomingThrough ?? dateAfter(today, 7);
  return tasks.filter((task) => {
    const matchesText =
      !search || `${task.title} ${task.description}`.toLowerCase().includes(search);
    const matchesPriority = options.priority === 'all' || task.priority === options.priority;
    const matchesStatus = options.status === 'all' || task.status === options.status;
    const matchesAssignee = options.assigneeId === 'all' || task.assignee.id === options.assigneeId;
    const matchesView =
      options.view === 'my-tasks'
        ? task.assignee.id === options.currentUserId
        : options.view === 'upcoming'
          ? task.status !== 'done' && task.dueDate >= today && task.dueDate <= upcomingThrough
          : options.view === 'overdue'
            ? task.status !== 'done' && task.dueDate < today
            : true;
    return matchesText && matchesPriority && matchesStatus && matchesAssignee && matchesView;
  });
}

/**
 * Returns a YYYY-MM-DD date the specified number of calendar days after the input.
 * @param date The input date.
 * @param days The number of calendar days to add.
 * @returns The resulting date.
 */
export function dateAfter(date: string, days: number): string {
  const result = new Date(`${date}T00:00:00.000Z`);
  result.setUTCDate(result.getUTCDate() + days);
  return result.toISOString().slice(0, 10);
}

/**
 *  Calculates dashboard task totals, including unfinished tasks that are overdue today.
 * @argument tasks The list of tasks to calculate statistics for.
 * @argument today The current date in YYYY-MM-DD format (defaults to today).
 * @returns An object containing the total, done, inProgress, and overdue task counts.
 */
export function calculateTaskStatistics(
  tasks: Task[],
  today = new Date().toISOString().slice(0, 10),
): DashboardStatistics {
  return {
    total: tasks.length,
    done: tasks.filter((task) => task.status === 'done').length,
    inProgress: tasks.filter((task) => task.status === 'in_progress').length,
    overdue: tasks.filter((task) => task.status !== 'done' && task.dueDate < today).length,
  };
}

/**
 * Sorts tasks by user-defined order while placing new/unordered IDs at the end.
 * @param tasks The list of tasks to sort.
 * @param order The user-defined order.
 * @returns The sorted list of tasks.
 */
export function sortTasksByOrder(tasks: Task[], order: string[]): Task[] {
  if (!order.length) return tasks;
  const indexes = new Map(order.map((id, index) => [id, index]));
  return [...tasks].sort(
    (a, b) =>
      (indexes.get(a.id) ?? Number.MAX_SAFE_INTEGER) -
      (indexes.get(b.id) ?? Number.MAX_SAFE_INTEGER),
  );
}

/**
 * Reconciles the persisted visual order with the current task collection.
 * @param order The persisted visual order.
 * @param taskIds The IDs of the current tasks.
 * @returns The updated visual order.
 */
export function synchronizeTaskOrder(order: string[], taskIds: string[]): string[] {
  const existing = new Set(taskIds);
  const kept = order.filter((id) => existing.has(id));
  const ordered = new Set(kept);
  const next = [...kept, ...taskIds.filter((id) => !ordered.has(id))];
  return next.length === order.length && next.every((id, index) => id === order[index])
    ? order
    : next;
}

/**
 * Reorders visible task IDs while preserving the relative positions of filtered-out IDs.
 * @param order The current visual order.
 * @param visibleTasks The list of currently visible tasks.
 * @param from The index of the task to move.
 * @param to The index where the task should be moved.
 * @returns The updated visual order.
 */
export function reorderVisibleTaskIds(
  order: string[],
  visibleTasks: Task[],
  from: number,
  to: number,
): string[] {
  const visibleIds = visibleTasks.map((task) => task.id);
  const visibleSet = new Set(visibleIds);
  const [movedId] = visibleIds.splice(from, 1);
  visibleIds.splice(to, 0, movedId);
  let nextVisible = 0;
  return order.map((id) => (visibleSet.has(id) ? (visibleIds[nextVisible++] ?? id) : id));
}

/**
 * Inserts a task ID adjacent to its destination-column neighbor after a cross-column drop.
 * @param order The current visual order.
 * @param taskId The ID of the task to place.
 * @param destination The list of tasks in the destination column.
 * @param index The index where the task should be placed.
 * @returns The updated visual order.
 */
export function placeTaskIdInOrder(
  order: string[],
  taskId: string,
  destination: Task[],
  index: number,
): string[] {
  const next = order.filter((id) => id !== taskId);
  const beforeId = destination[index]?.id;
  const afterId = destination[Math.max(0, index - 1)]?.id;
  const insertionIndex = beforeId
    ? next.indexOf(beforeId)
    : afterId
      ? next.indexOf(afterId) + 1
      : next.length;
  next.splice(insertionIndex < 0 ? next.length : insertionIndex, 0, taskId);
  return next;
}

/**
 * Returns the user-facing label for a task status.
 * @param status The task status.
 * @returns The user-facing label.
 */
export function taskStatusLabel(status: TaskStatus): string {
  return status === 'todo' ? 'To do' : status === 'in_progress' ? 'In progress' : 'Done';
}

/**
 * Formats an ISO timestamp as a compact relative-time label.
 * @param value The ISO timestamp.
 * @param now The current timestamp.
 * @returns The formatted relative-time label.
 */

export function formatRelativeTime(value: string, now = Date.now()): string {
  const minutes = Math.max(0, Math.floor((now - new Date(value).getTime()) / 60_000));
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return days === 1 ? 'Yesterday' : `${days} days ago`;
}
