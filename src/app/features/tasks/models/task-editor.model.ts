import type { Assignee, Task } from '../../../shared/models/task.model';

/** Dialog input and output types for creating or editing a task. */
export interface TaskEditorDialogData {
  task: Task | null;
  users: readonly Assignee[];
}
