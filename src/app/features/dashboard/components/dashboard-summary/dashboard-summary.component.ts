import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { DashboardStatistics } from '../../models/dashboard.model';

@Component({
  selector: 'app-dashboard-summary',
  standalone: true,
  imports: [MatCardModule, MatProgressBarModule],
  templateUrl: './dashboard-summary.component.html',
  styleUrl: './dashboard-summary.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardSummaryComponent {
  @Input() stats: DashboardStatistics = { total: 0, done: 0, inProgress: 0, overdue: 0 };
  @Input() completionRate = 0;
  @Input() isLoading = false;
  @Input() columns = 4;
}
