import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { APP_ROUTE_PATHS } from '../../../../shared/constants/app.constants';
import { ALL_TASK_FILTER } from '../../../../shared/constants/task.constants';
import { TranslatePipe } from '../../../../shared/i18n/translate.pipe';
import type { Assignee } from '../../../../shared/models/task.model';
import type { DashboardNavigationAction, DashboardView } from '../../models/dashboard.model';

@Component({
  selector: 'app-dashboard-sidebar',
  standalone: true,
  imports: [MatButtonModule, MatListModule, RouterLink, RouterLinkActive, TranslatePipe],
  templateUrl: './dashboard-sidebar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardSidebarComponent {
  readonly routePaths = APP_ROUTE_PATHS;
  readonly users = input<readonly Assignee[]>([]);
  readonly assigneeFilter = input<string>(ALL_TASK_FILTER);
  readonly teamExpanded = input(false);
  readonly navigationSelected = output<DashboardNavigationAction>();
  readonly routeSelected = output<DashboardView>();
  readonly assigneeSelected = output<string>();
  readonly createTask = output<void>();

  /** Toggles whether the assignee shortcuts are displayed. */
  toggleTeamMenu(): void {
    this.navigationSelected.emit('team');
  }
}
