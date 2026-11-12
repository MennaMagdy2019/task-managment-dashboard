import { TASK_PRIORITY, TASK_STATUS } from '../constants/task.constants';

/** Supported task workflow states. */
export type TaskStatus = (typeof TASK_STATUS)[keyof typeof TASK_STATUS];

/** Supported task priority levels. */
export type TaskPriority = (typeof TASK_PRIORITY)[keyof typeof TASK_PRIORITY];

/** A team member who may own a task. */
export interface Assignee {
  id: string;
  name: string;
  email: string;
  initials: string;
  avatar?: string;
}

/** A persisted task shown on the dashboard and task board. */
export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  assignee: Assignee;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  isOverdue?: boolean;
  completedAt?: string;
}

/** Fields a user must provide when creating a task. */
export type TaskDraft = Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'isOverdue' | 'completedAt'>;

/** Editable fields accepted by the task update API. */
export type TaskPatch = Partial<
  Pick<Task, 'title' | 'description' | 'status' | 'priority' | 'dueDate' | 'assignee' | 'tags'>
>;

/** A recent task-related action shown in the activity feed. */
export interface TaskActivity {
  id: string;
  message: string;
  taskTitle: string;
  actor: Assignee;
  occurredAt: string;
  kind: 'created' | 'updated' | 'completed' | 'deleted';
}
