import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterLink } from '@angular/router';
import { APP_ROUTE_PATHS } from '../../../../shared/constants/app.constants';

@Component({
  selector: 'app-dashboard-header',
  standalone: true,
  imports: [MatButtonModule, MatFormFieldModule, MatInputModule, MatToolbarModule, RouterLink],
  templateUrl: './dashboard-header.component.html',
  styleUrl: './dashboard-header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardHeaderComponent {
  readonly routePaths = APP_ROUTE_PATHS;
  @Input() query = '';
  @Input() userInitials = '';
  @Input() sidebarOpen = false;
  @Output() readonly queryChange = new EventEmitter<string>();
  @Output() readonly menuToggle = new EventEmitter<void>();

  /** Emits the current search text when the user types into the global search box. */
  onSearchInput(event: Event): void {
    if (event.target instanceof HTMLInputElement) this.queryChange.emit(event.target.value);
  }
}
