import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { DragDropModule } from '@angular/cdk/drag-drop';
import type { CdkDragDrop } from '@angular/cdk/drag-drop';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import {
  ALL_TASK_FILTER,
  TASK_PRIORITY_CHART_ORDER,
  TASK_STATUS_OPTIONS,
} from '../../../../shared/constants/task.constants';
import type { Task, TaskPriority, TaskStatus } from '../../../../shared/models/task.model';
import type { BoardPriorityFilter, BoardStatusFilter } from '../../models/dashboard.model';
import type { TaskBoardColumn, TaskDropEvent } from '../../models/task-board.model';
import { TaskCardComponent } from '../../../tasks/components/task-card/task-card.component';
import { I18nService } from '../../../../shared/i18n/i18n.service';
import type { TranslationKey } from '../../../../shared/i18n/i18n.defines';
import { TranslatePipe } from '../../../../shared/i18n/translate.pipe';

const STATUS_TRANSLATION_KEYS: Record<TaskStatus, TranslationKey> = {
  todo: 'status.todo',
  in_progress: 'status.inProgress',
  done: 'status.done',
};
const PRIORITY_TRANSLATION_KEYS: Record<TaskPriority, TranslationKey> = {
  high: 'priority.high',
  medium: 'priority.medium',
  low: 'priority.low',
};

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
    TaskCardComponent,
    TranslatePipe,
  ],
  templateUrl: './task-board.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskBoardComponent {
  private readonly i18n = inject(I18nService);
  readonly allFilterValue = ALL_TASK_FILTER;
  readonly statusOptions = TASK_STATUS_OPTIONS;
  readonly priorityOptions = TASK_PRIORITY_CHART_ORDER;
  readonly loadingSkeletons: Record<TaskStatus, readonly number[]> = {
    todo: [1, 2, 3, 4, 5],
    in_progress: [1, 2, 3, 4],
    done: [1, 2, 3],
  };
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

  /** Returns a localized task status label. */
  statusLabel(status: TaskStatus): string {
    return this.i18n.translate(STATUS_TRANSLATION_KEYS[status]);
  }

  /** Returns a localized task priority label. */
  priorityLabel(priority: TaskPriority): string {
    return this.i18n.translate(PRIORITY_TRANSLATION_KEYS[priority]);
  }

  /** Returns the visible tasks belonging to the requested status column. */
  tasksFor(status: TaskStatus): Task[] {
    return this.tasks().filter((task) => task.status === status);
  }

  /** Emits a drag/drop event with the destination status for the page controller. */
  onDrop(event: CdkDragDrop<Task[], Task[], Task>, status: TaskStatus): void {
    this.taskDropped.emit({ event, status });
  }
}
