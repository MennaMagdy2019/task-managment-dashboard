import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import type { Task, TaskActivity, TaskStatus } from '../../../../shared/models/task.model';
import { formatRelativeTime } from '../../utils/task-dashboard-helpers/task-dashboard.helpers';
import { TaskAnalyticsComponent } from '../task-analytics/task-analytics.component';
import {
  TASK_ACTIVITY_MESSAGES,
  TASK_STATUS_LABELS,
} from '../../../../shared/constants/task.constants';
import { I18nService } from '../../../../shared/i18n/i18n.service';
import type { TranslationKey } from '../../../../shared/i18n/i18n.defines';
import { TranslatePipe } from '../../../../shared/i18n/translate.pipe';

const ACTIVITY_KEYS: Record<TaskActivity['kind'], TranslationKey> = {
  created: 'activity.created',
  updated: 'activity.updated',
  completed: 'activity.completed',
  deleted: 'activity.deleted',
};
const STATUS_KEYS: Record<TaskStatus, TranslationKey> = {
  todo: 'status.todo',
  in_progress: 'status.inProgress',
  done: 'status.done',
};

@Component({
  selector: 'app-dashboard-insights',
  standalone: true,
  imports: [MatCardModule, MatListModule, TaskAnalyticsComponent, TranslatePipe],
  templateUrl: './dashboard-insights.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardInsightsComponent {
  private readonly i18n = inject(I18nService);
  readonly tasks = input<Task[]>([]);
  readonly activities = input<TaskActivity[]>([]);

  /** Formats an ISO timestamp as a short relative time for the activity feed. */
  timeAgo(value: string): string {
    return formatRelativeTime(value, Date.now(), this.i18n.language());
  }

  /** Translates known activity messages while preserving user-created task titles. */
  activityMessage(activity: TaskActivity): string {
    if (activity.message === TASK_ACTIVITY_MESSAGES.dueDateUpdated) {
      return this.i18n.translate('activity.dueDateUpdated');
    }

    if (activity.message.startsWith(TASK_ACTIVITY_MESSAGES.movedToStatus)) {
      const label = activity.message.slice(TASK_ACTIVITY_MESSAGES.movedToStatus.length).trim();
      const status = [
        { status: 'todo' as const, label: TASK_STATUS_LABELS.todo },
        { status: 'in_progress' as const, label: TASK_STATUS_LABELS.in_progress },
        { status: 'done' as const, label: TASK_STATUS_LABELS.done },
      ].find((candidate) => candidate.label === label);
      if (status) {
        return this.i18n.translate('activity.movedToStatus', {
          status: this.i18n.translate(STATUS_KEYS[status.status]),
        });
      }
    }

    return this.i18n.translate(ACTIVITY_KEYS[activity.kind]);
  }
}
