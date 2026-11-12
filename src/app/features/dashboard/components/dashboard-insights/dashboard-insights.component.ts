import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { Task, TaskActivity } from '../../../../shared/models/task.model';
import { formatRelativeTime } from '../../utils/task-dashboard-helpers/task-dashboard.helpers';
import { TaskAnalyticsComponent } from '../task-analytics/task-analytics.component';

@Component({
  selector: 'app-dashboard-insights',
  standalone: true,
  imports: [MatCardModule, MatListModule, TaskAnalyticsComponent],
  templateUrl: './dashboard-insights.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardInsightsComponent {
  @Input() tasks: Task[] = [];
  @Input() activities: TaskActivity[] = [];

  /** Formats an ISO timestamp as a short relative time for the activity feed. */
  timeAgo(value: string): string {
    return formatRelativeTime(value);
  }
}
