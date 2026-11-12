import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
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
  @Input() columns: TaskBoardColumn[] = [];
  @Input() tasks: Task[] = [];
  @Input() loading = false;
  @Input() hasMatchingTasks = false;
  @Input() statusFilter: BoardStatusFilter = ALL_TASK_FILTER;
  @Input() priorityFilter: BoardPriorityFilter = ALL_TASK_FILTER;
  @Input() dropListIds: string[] = [];
  @Output() readonly statusFilterChange = new EventEmitter<BoardStatusFilter>();
  @Output() readonly priorityFilterChange = new EventEmitter<BoardPriorityFilter>();
  @Output() readonly createTask = new EventEmitter<void>();
  @Output() readonly editTask = new EventEmitter<Task>();
  @Output() readonly removeTask = new EventEmitter<Task>();
  @Output() readonly taskDropped = new EventEmitter<TaskDropEvent>();

  /** Returns the visible tasks belonging to the requested status column. */
  tasksFor(status: TaskStatus): Task[] {
    return this.tasks.filter((task) => task.status === status);
  }

  /** Emits a drag/drop event with the destination status for the page controller. */
  onDrop(event: CdkDragDrop<Task[], Task[], Task>, status: TaskStatus): void {
    this.taskDropped.emit({ event, status });
  }
}
