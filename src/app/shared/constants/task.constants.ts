/** Sentinel used when a task filter is not restricting its field. */
export const ALL_TASK_FILTER = 'all' as const;

/** Canonical task workflow values shared by task features. */
export const TASK_STATUS = {
  todo: 'todo',
  inProgress: 'in_progress',
  done: 'done',
} as const;

/** Canonical priority values shared by task features. */
export const TASK_PRIORITY = {
  high: 'high',
  medium: 'medium',
  low: 'low',
} as const;

/** Task statuses in their display and workflow order. */
export const TASK_STATUS_OPTIONS = [
  TASK_STATUS.todo,
  TASK_STATUS.inProgress,
  TASK_STATUS.done,
] as const;

/** Task priorities in their editor order. */
export const TASK_PRIORITY_OPTIONS = [
  TASK_PRIORITY.low,
  TASK_PRIORITY.medium,
  TASK_PRIORITY.high,
] as const;

/** Task priorities in the order used by analytics charts. */
export const TASK_PRIORITY_CHART_ORDER = [
  TASK_PRIORITY.high,
  TASK_PRIORITY.medium,
  TASK_PRIORITY.low,
] as const;

/** User-facing labels for task workflow states. */
export const TASK_STATUS_LABELS = {
  [TASK_STATUS.todo]: 'To do',
  [TASK_STATUS.inProgress]: 'In progress',
  [TASK_STATUS.done]: 'Done',
} as const;

/** User-facing labels for task priority levels. */
export const TASK_PRIORITY_LABELS = {
  [TASK_PRIORITY.high]: 'High',
  [TASK_PRIORITY.medium]: 'Medium',
  [TASK_PRIORITY.low]: 'Low',
} as const;

/** Repeated task activity messages used by the dashboard feed. */
export const TASK_ACTIVITY_MESSAGES = {
  created: 'created a task',
  updated: 'updated a task',
  completed: 'completed a task',
  deleted: 'deleted a task',
  dueDateUpdated: 'updated the due date for',
  movedToStatus: 'moved a task to',
} as const;

/** Shared task-editor field limits used by its validators and template. */
export const TASK_FIELD_LIMITS = {
  title: 80,
  description: 240,
  tag: 24,
} as const;

/** Maximum number of labels allowed on a task. */
export const MAX_TASK_TAGS = 4;
