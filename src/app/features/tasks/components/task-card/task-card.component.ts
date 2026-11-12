import { ChangeDetectionStrategy, Component, inject, output, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatMenuModule } from '@angular/material/menu';
import { Task } from '../../../../shared/models/task.model';
import { TASK_STATUS } from '../../../../shared/constants/task.constants';
import { I18nService } from '../../../../shared/i18n/i18n.service';
import { TranslatePipe } from '../../../../shared/i18n/translate.pipe';
import type { TranslationKey } from '../../../../shared/i18n/i18n.defines';

@Component({
  selector: 'app-task-card',
  standalone: true,
  imports: [MatButtonModule, MatCardModule, MatMenuModule, TranslatePipe],
  templateUrl: './task-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskCardComponent {
  readonly i18n = inject(I18nService);
  readonly task = input.required<Task>();
  readonly edit = output<Task>();
  readonly remove = output<Task>();
  readonly priorityKeys: Record<Task['priority'], TranslationKey> = {
    high: 'priority.high',
    medium: 'priority.medium',
    low: 'priority.low',
  };

  /** Indicates whether an unfinished task has a due date before today. */
  get overdue(): boolean {
    const task = this.task();
    return task.status !== TASK_STATUS.done && task.dueDate < new Date().toISOString().slice(0, 10);
  }

  /** Returns the date-row icon for the task status, overriding overdue tasks with a warning. */
  get dateStatusIcon(): string {
    if (this.overdue) return 'warning';
    const task = this.task();
    if (task.status === TASK_STATUS.inProgress) return 'schedule';
    if (task.status === TASK_STATUS.done) return 'check_circle';
    return 'calendar_today';
  }

  /** Formats due or completion dates in the active application language. */
  get dueLabel(): string {
    const today = new Date().toISOString().slice(0, 10);

    const task = this.task();
    if (task.status === TASK_STATUS.done) {
      const completedDate = (task.completedAt ?? task.updatedAt).slice(0, 10);
      const daysSinceCompletion = Math.round(
        (Date.parse(`${today}T00:00:00Z`) - Date.parse(`${completedDate}T00:00:00Z`)) / 86_400_000,
      );
      if (daysSinceCompletion === 0) return this.i18n.translate('due.completedToday');
      if (daysSinceCompletion === 1) return this.i18n.translate('due.completedYesterday');
      const formattedDate = this.i18n.formatDate(new Date(`${completedDate}T12:00:00`), {
        month: 'short',
        day: 'numeric',
      });
      return this.i18n.translate('due.completedOn', { date: formattedDate });
    }

    const daysUntilDue = Math.round(
      (Date.parse(`${task.dueDate}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86_400_000,
    );
    if (daysUntilDue < 0) {
      const overdueDays = Math.abs(daysUntilDue);
      return this.i18n.translate(overdueDays === 1 ? 'due.overdueOne' : 'due.overdueMany', {
        count: overdueDays,
      });
    }
    if (daysUntilDue === 0) return this.i18n.translate('due.today');
    if (daysUntilDue === 7) return this.i18n.translate('due.week');
    if (daysUntilDue > 7 && daysUntilDue % 7 === 0) {
      return this.i18n.translate('due.weeks', { count: daysUntilDue / 7 });
    }
    return this.i18n.translate(daysUntilDue === 1 ? 'due.dayOne' : 'due.daysMany', {
      count: daysUntilDue,
    });
  }
}
