import type { CdkDragDrop } from '@angular/cdk/drag-drop';
import type { Task, TaskStatus } from '../../../shared/models/task.model';

/** A status-column definition rendered by the task board. */
export interface TaskBoardColumn {
  status: TaskStatus;
  label: string;
  icon: string;
}

/** A drag/drop event paired with its destination task status. */
export interface TaskDropEvent {
  event: CdkDragDrop<Task[], Task[], Task>;
  status: TaskStatus;
}
