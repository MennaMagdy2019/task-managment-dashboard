import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatMenuModule } from '@angular/material/menu';
import { Task } from '../../../../shared/models/task.model';
import { TASK_STATUS } from '../../../../shared/constants/task.constants';

@Component({
  selector: 'app-task-card',
  standalone: true,
  imports: [MatButtonModule, MatCardModule, MatMenuModule],
  templateUrl: './task-card.component.html',
  styleUrl: './task-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskCardComponent {
  @Input({ required: true }) task!: Task;
  @Output() readonly edit = new EventEmitter<Task>();
  @Output() readonly remove = new EventEmitter<Task>();

  /** Indicates whether an unfinished task has a due date before today. */
  get overdue(): boolean {
    return (
      this.task.status !== TASK_STATUS.done &&
      this.task.dueDate < new Date().toISOString().slice(0, 10)
    );
  }

  /** Returns the date-row icon for the task status, overriding overdue tasks with a warning. */
  get dateStatusIcon(): string {
    if (this.overdue) return 'warning';
    if (this.task.status === TASK_STATUS.inProgress) return 'schedule';
    if (this.task.status === TASK_STATUS.done) return 'check_circle';
    return 'calendar_today';
  }

  /** Formats due or completion dates as the relative labels used on task cards. */
  get dueLabel(): string {
    const today = new Date().toISOString().slice(0, 10);

    if (this.task.status === TASK_STATUS.done) {
      const completedDate = (this.task.completedAt ?? this.task.updatedAt).slice(0, 10);
      const daysSinceCompletion = Math.round(
        (Date.parse(`${today}T00:00:00Z`) - Date.parse(`${completedDate}T00:00:00Z`)) / 86_400_000,
      );
      if (daysSinceCompletion === 0) return 'Completed today';
      if (daysSinceCompletion === 1) return 'Completed yesterday';
      const formattedDate = new Date(`${completedDate}T12:00:00`).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
      return `Completed ${formattedDate}`;
    }

    const daysUntilDue = Math.round(
      (Date.parse(`${this.task.dueDate}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) /
        86_400_000,
    );
    if (daysUntilDue < 0) {
      const overdueDays = Math.abs(daysUntilDue);
      return `Overdue by ${overdueDays} ${overdueDays === 1 ? 'day' : 'days'}`;
    }
    if (daysUntilDue === 0) return 'Due today';
    if (daysUntilDue === 7) return 'Due in 1 week';
    if (daysUntilDue > 7 && daysUntilDue % 7 === 0) {
      return `Due in ${daysUntilDue / 7} weeks`;
    }
    return `Due in ${daysUntilDue} ${daysUntilDue === 1 ? 'day' : 'days'}`;
  }
}
