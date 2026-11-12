import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { DragDropModule } from '@angular/cdk/drag-drop';
import type { CdkDragDrop } from '@angular/cdk/drag-drop';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { TitleCasePipe } from '@angular/common';
import {
  ALL_TASK_FILTER,
  TASK_PRIORITY_CHART_ORDER,
  TASK_PRIORITY_LABELS,
  TASK_STATUS_LABELS,
  TASK_STATUS_OPTIONS,
} from '../../../../shared/constants/task.constants';
import type { Task, TaskStatus } from '../../../../shared/models/task.model';
import type { BoardPriorityFilter, BoardStatusFilter } from '../../models/dashboard.model';
import type { TaskBoardColumn, TaskDropEvent } from '../../models/task-board.model';
import { TaskCardComponent } from '../../../tasks/components/task-card/task-card.component';

export type { BoardPriorityFilter, BoardStatusFilter } from '../../models/dashboard.model';
export type { TaskBoardColumn, TaskDropEvent } from '../../models/task-board.model';

@Component({
  selector: 'app-task-board',
  standalone: true,
  imports: [
    DragDropModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressBarModule,
    MatSelectModule,
    TitleCasePipe,
    TaskCardComponent,
  ],
  templateUrl: './task-board.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskBoardComponent {
  readonly allFilterValue = ALL_TASK_FILTER;
  readonly statusOptions = TASK_STATUS_OPTIONS;
  readonly statusLabels = TASK_STATUS_LABELS;
  readonly priorityOptions = TASK_PRIORITY_CHART_ORDER;
  readonly priorityLabels = TASK_PRIORITY_LABELS;
  readonly columns = input<TaskBoardColumn[]>([]);
  readonly tasks = input<Task[]>([]);
  readonly loading = input(false);
  readonly hasMatchingTasks = input(false);
  readonly statusFilter = input<BoardStatusFilter>(ALL_TASK_FILTER);
  readonly priorityFilter = input<BoardPriorityFilter>(ALL_TASK_FILTER);
  readonly dropListIds = input<string[]>([]);
  readonly statusFilterChange = output<BoardStatusFilter>();
  readonly priorityFilterChange = output<BoardPriorityFilter>();
  readonly createTask = output<void>();
  readonly editTask = output<Task>();
  readonly removeTask = output<Task>();
  readonly taskDropped = output<TaskDropEvent>();

  /** Returns the visible tasks belonging to the requested status column. */
  tasksFor(status: TaskStatus): Task[] {
    return this.tasks().filter((task) => task.status === status);
  }

  /** Emits a drag/drop event with the destination status for the page controller. */
  onDrop(event: CdkDragDrop<Task[], Task[], Task>, status: TaskStatus): void {
    this.taskDropped.emit({ event, status });
  }
}
