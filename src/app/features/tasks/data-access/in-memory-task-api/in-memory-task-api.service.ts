import { Injectable } from '@angular/core';
import {
  Assignee,
  Task,
  TaskDraft,
  TaskPriority,
  TaskStatus,
  TEAM_MEMBERS,
} from '../../../../shared/models/task.model';
import generatedTaskData from '../tasks.json';

const EDITABLE_TASK_FIELDS: ReadonlySet<string> = new Set([
  'title',
  'description',
  'status',
  'priority',
  'dueDate',
  'assignee',
  'tags',
]);
const ASSIGNEE_FIELDS: ReadonlySet<string> = new Set(['id', 'name', 'email', 'initials', 'avatar']);

interface GeneratedTask {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  dueDate: string;
  isOverdue: boolean;
  assignee: Omit<Assignee, 'initials'>;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

/** Expected API error surfaced by the in-memory backend. */
export class MockApiError extends Error {
  /** Creates an API error carrying the HTTP status the mock backend should return. */
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'MockApiError';
  }
}

/** Checks whether an untrusted value is a supported task status. */
function isTaskStatus(value: unknown): value is TaskStatus {
  return value === 'todo' || value === 'in_progress' || value === 'done';
}

/** Checks whether an untrusted value is a supported task priority. */
function isTaskPriority(value: unknown): value is TaskPriority {
  return value === 'low' || value === 'medium' || value === 'high';
}

/** Determines whether a task is overdue on the supplied UTC date. */
function isTaskOverdue(status: TaskStatus, dueDate: string, today: string): boolean {
  return status !== 'done' && dueDate < today;
}

/** Validates and converts a generated task record into the application model. */
function normalizeGeneratedTask(task: GeneratedTask): Task {
  if (!isTaskStatus(task.status) || !isTaskPriority(task.priority)) {
    throw new Error(`Generated task "${task.id}" has an invalid status or priority.`);
  }

  const today = new Date().toISOString().slice(0, 10);
  return {
    ...task,
    status: task.status,
    priority: task.priority,
    isOverdue: isTaskOverdue(task.status, task.dueDate, today),
    assignee: {
      ...task.assignee,
      initials: task.assignee.avatar?.trim() || task.assignee.id.slice(-2).toUpperCase(),
    },
  };
}

/** Validates that a date string is a real ISO calendar date. */
function isValidDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

/** Validates that an assignee matches a configured team member. */
function isAssignee(value: unknown): value is Assignee {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const assignee = value as Partial<Assignee>;
  if (!Object.keys(value).every((key) => ASSIGNEE_FIELDS.has(key))) return false;

  const member = TEAM_MEMBERS.find((candidate) => candidate.id === assignee.id);
  return (
    !!member &&
    assignee.name === member.name &&
    assignee.email === member.email &&
    assignee.initials === member.initials &&
    (assignee.avatar === undefined || typeof assignee.avatar === 'string')
  );
}

/** Validates the complete payload accepted by the task-create endpoint. */
function isTaskDraft(body: unknown): body is TaskDraft {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return false;
  const draft = body as Partial<TaskDraft>;
  if (!Object.keys(body).every((key) => EDITABLE_TASK_FIELDS.has(key))) return false;

  return (
    typeof draft.title === 'string' &&
    draft.title.trim().length > 0 &&
    typeof draft.description === 'string' &&
    isTaskStatus(draft.status) &&
    isTaskPriority(draft.priority) &&
    isValidDate(draft.dueDate) &&
    isAssignee(draft.assignee) &&
    Array.isArray(draft.tags) &&
    draft.tags.every((tag) => typeof tag === 'string')
  );
}

/** Validates the allowed fields and values accepted by the task-update endpoint. */
function isTaskPatch(body: unknown): body is Partial<Task> {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return false;
  const patch = body as Partial<Task>;
  const keys = Object.keys(body);

  if (keys.length === 0 || !keys.every((key) => EDITABLE_TASK_FIELDS.has(key))) return false;
  if (
    patch.title !== undefined &&
    (typeof patch.title !== 'string' || patch.title.trim().length === 0)
  )
    return false;
  if (patch.description !== undefined && typeof patch.description !== 'string') return false;
  if (patch.status !== undefined && !isTaskStatus(patch.status)) return false;
  if (patch.priority !== undefined && !isTaskPriority(patch.priority)) return false;
  if (patch.dueDate !== undefined && !isValidDate(patch.dueDate)) return false;
  if (patch.assignee !== undefined && !isAssignee(patch.assignee)) return false;
  if (
    patch.tags !== undefined &&
    (!Array.isArray(patch.tags) || !patch.tags.every((tag) => typeof tag === 'string'))
  )
    return false;

  return true;
}

/** Copies a task and its nested mutable values before exposing it to a caller. */
function cloneTask(task: Task): Task {
  return { ...task, tags: [...task.tags], assignee: { ...task.assignee } };
}

/**
 * In-memory implementation of the task API used by the mock HTTP interceptor.
 * Data is seeded from generated JSON and resets when the application reloads.
 */
@Injectable({ providedIn: 'root' })
export class InMemoryTaskApiService {
  private tasks: Task[] = generatedTaskData.tasks.map((task) => normalizeGeneratedTask(task));

  /** Returns a detached task list with overdue flags recalculated for today. */
  getTasks(): Task[] {
    const today = new Date().toISOString().slice(0, 10);
    return this.tasks.map((task) =>
      cloneTask({
        ...task,
        isOverdue: isTaskOverdue(task.status, task.dueDate, today),
      }),
    );
  }

  /** Validates and stores a task draft, returning a detached created task. */
  createTask(body: unknown): Task {
    if (!isTaskDraft(body)) throw new MockApiError(400, 'Invalid task details.');

    const now = new Date().toISOString();
    const created: Task = {
      ...body,
      assignee: { ...body.assignee },
      tags: [...body.tags],
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
      isOverdue: isTaskOverdue(body.status, body.dueDate, now.slice(0, 10)),
      ...(body.status === 'done' ? { completedAt: now } : {}),
    };
    this.tasks = [created, ...this.tasks];
    return cloneTask(created);
  }

  /** Validates and applies a partial task update, or raises a typed API error. */
  updateTask(id: string, body: unknown): Task {
    const taskIndex = this.tasks.findIndex((task) => task.id === id);
    if (taskIndex < 0) throw new MockApiError(404, 'Task not found.');
    if (!isTaskPatch(body)) throw new MockApiError(400, 'Invalid task changes.');

    const current = this.tasks[taskIndex];
    const now = new Date().toISOString();
    const updated: Task = {
      ...current,
      ...body,
      ...(body.assignee ? { assignee: { ...body.assignee } } : {}),
      ...(body.tags ? { tags: [...body.tags] } : {}),
      updatedAt: now,
      ...(body.status === 'done' && current.status !== 'done' ? { completedAt: now } : {}),
      ...(body.status && body.status !== 'done' ? { completedAt: undefined } : {}),
    };
    updated.isOverdue = isTaskOverdue(updated.status, updated.dueDate, now.slice(0, 10));
    this.tasks = this.tasks.map((task, index) => (index === taskIndex ? updated : task));
    return cloneTask(updated);
  }

  /** Removes a task and returns the removed record, or raises a not-found API error. */
  deleteTask(id: string): Task {
    const taskIndex = this.tasks.findIndex((task) => task.id === id);
    if (taskIndex < 0) throw new MockApiError(404, 'Task not found.');

    const [deleted] = this.tasks.splice(taskIndex, 1);
    return cloneTask(deleted);
  }
}
