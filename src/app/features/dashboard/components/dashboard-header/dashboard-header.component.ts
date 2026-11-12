import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterLink } from '@angular/router';
import { APP_ROUTE_PATHS } from '../../../../shared/constants/app.constants';
import { I18nService } from '../../../../shared/i18n/i18n.service';
import { TranslatePipe } from '../../../../shared/i18n/translate.pipe';

@Component({
  selector: 'app-dashboard-header',
  standalone: true,
  imports: [
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatToolbarModule,
    RouterLink,
    TranslatePipe,
  ],
  templateUrl: './dashboard-header.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardHeaderComponent {
  readonly routePaths = APP_ROUTE_PATHS;
  readonly i18n = inject(I18nService);
  readonly query = input('');
  readonly userInitials = input('');
  readonly sidebarOpen = input(false);
  readonly queryChange = output<string>();
  readonly menuToggle = output<void>();

  /** Emits the current search text when the user types into the global search box. */
  onSearchInput(event: Event): void {
    if (event.target instanceof HTMLInputElement) this.queryChange.emit(event.target.value);
  }
}
