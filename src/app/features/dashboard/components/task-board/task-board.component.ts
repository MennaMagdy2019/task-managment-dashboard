import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { Task, TaskStatus } from '../../../../shared/models/task.model';
import { BoardPriorityFilter, BoardStatusFilter } from '../../models/dashboard.model';
import { TaskCardComponent } from '../../../tasks/components/task-card/task-card.component';

export type { BoardPriorityFilter, BoardStatusFilter } from '../../models/dashboard.model';

export interface TaskDropEvent {
  event: CdkDragDrop<Task[], Task[], Task>;
  status: TaskStatus;
}

export interface TaskBoardColumn {
  status: TaskStatus;
  label: string;
  icon: string;
}

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
  ],
  templateUrl: './task-board.component.html',
  styleUrl: './task-board.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskBoardComponent {
  @Input() columns: TaskBoardColumn[] = [];
  @Input() tasks: Task[] = [];
  @Input() loading = false;
  @Input() hasMatchingTasks = false;
  @Input() statusFilter: BoardStatusFilter = 'all';
  @Input() priorityFilter: BoardPriorityFilter = 'all';
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
