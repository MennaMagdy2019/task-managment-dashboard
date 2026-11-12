import { TitleCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { Task } from '../../../../shared/models/task.model';
import { TASK_STATUS } from '../../../../shared/constants/task.constants';

@Component({
  selector: 'app-task-card',
  standalone: true,
  imports: [MatButtonModule, MatCardModule, MatChipsModule, MatMenuModule, TitleCasePipe],
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

  /** Formats the due date as Today, Tomorrow, or a short calendar date. */
  get dueLabel(): string {
    const today = new Date().toISOString().slice(0, 10);
    if (this.task.dueDate === today) return 'Today';
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (this.task.dueDate === tomorrow.toISOString().slice(0, 10)) return 'Tomorrow';
    return new Date(`${this.task.dueDate}T12:00:00`).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }
}
