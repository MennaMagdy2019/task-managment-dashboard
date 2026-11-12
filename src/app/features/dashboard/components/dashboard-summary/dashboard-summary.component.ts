import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { TranslatePipe } from '../../../../shared/i18n/translate.pipe';
import type { DashboardStatistics } from '../../models/dashboard.model';

@Component({
  selector: 'app-dashboard-summary',
  standalone: true,
  imports: [MatCardModule, MatProgressBarModule, TranslatePipe],
  templateUrl: './dashboard-summary.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardSummaryComponent {
  readonly stats = input<DashboardStatistics>({ total: 0, done: 0, inProgress: 0, overdue: 0 });
  readonly completionRate = input(0);
  readonly isLoading = input(false);
  readonly columns = input(4);
}
