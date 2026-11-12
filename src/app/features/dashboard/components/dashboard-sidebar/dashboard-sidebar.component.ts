import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Assignee } from '../../../../shared/models/task.model';

type DashboardSidebarAction = 'team' | 'settings';

@Component({
  selector: 'app-dashboard-sidebar',
  standalone: true,
  imports: [MatButtonModule, MatListModule, RouterLink, RouterLinkActive],
  templateUrl: './dashboard-sidebar.component.html',
  styleUrl: './dashboard-sidebar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardSidebarComponent {
  @Input() users: Assignee[] = [];
  @Input() assigneeFilter = 'all';
  @Input() teamExpanded = false;
  @Output() readonly navigationSelected = new EventEmitter<DashboardSidebarAction>();
  @Output() readonly assigneeSelected = new EventEmitter<string>();
  @Output() readonly createTask = new EventEmitter<void>();

  /** Toggles whether the assignee shortcuts are displayed. */
  toggleTeamMenu(): void {
    this.navigationSelected.emit('team');
  }
}
