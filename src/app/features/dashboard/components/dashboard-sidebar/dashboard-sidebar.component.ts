import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { APP_ROUTE_PATHS } from '../../../../shared/constants/app.constants';
import { ALL_TASK_FILTER } from '../../../../shared/constants/task.constants';
import type { Assignee } from '../../../../shared/models/task.model';
import type { DashboardNavigationAction, DashboardView } from '../../models/dashboard.model';

@Component({
  selector: 'app-dashboard-sidebar',
  standalone: true,
  imports: [MatButtonModule, MatListModule, RouterLink, RouterLinkActive],
  templateUrl: './dashboard-sidebar.component.html',
  styleUrl: './dashboard-sidebar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardSidebarComponent {
  readonly routePaths = APP_ROUTE_PATHS;
  @Input() users: readonly Assignee[] = [];
  @Input() assigneeFilter: string = ALL_TASK_FILTER;
  @Input() teamExpanded = false;
  @Output() readonly navigationSelected = new EventEmitter<DashboardNavigationAction>();
  @Output() readonly routeSelected = new EventEmitter<DashboardView>();
  @Output() readonly assigneeSelected = new EventEmitter<string>();
  @Output() readonly createTask = new EventEmitter<void>();

  /** Toggles whether the assignee shortcuts are displayed. */
  toggleTeamMenu(): void {
    this.navigationSelected.emit('team');
  }
}
