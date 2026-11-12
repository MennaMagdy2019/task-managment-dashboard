import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  HostListener,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DashboardHeaderComponent } from '../../components/dashboard-header/dashboard-header.component';
import { DashboardInsightsComponent } from '../../components/dashboard-insights/dashboard-insights.component';
import { DashboardSidebarComponent } from '../../components/dashboard-sidebar/dashboard-sidebar.component';
import { DashboardSummaryComponent } from '../../components/dashboard-summary/dashboard-summary.component';
import { TaskBoardComponent } from '../../components/task-board/task-board.component';
import type { Task, TaskDraft, TaskStatus } from '../../../../shared/models/task.model';
import { CURRENT_USER, TEAM_MEMBERS } from '../../../../shared/constants/team.constants';
import { ALL_TASK_FILTER } from '../../../../shared/constants/task.constants';
import { APP_ROUTE_PATHS } from '../../../../shared/constants/app.constants';
import type {
  BoardPriorityFilter,
  BoardStatusFilter,
  DashboardNavigationAction,
  DashboardStatistics,
  DashboardView,
} from '../../models/dashboard.model';
import type { TaskDropEvent } from '../../models/task-board.model';
import { TaskService } from '../../../tasks/data-access/task-service/task.service';
import {
  calculateTaskStatistics,
  filterTasks,
  sortTasksByOrder,
} from '../../utils/task-dashboard-helpers/task-dashboard.helpers';
import {
  dashboardUrlForView,
  dashboardViewFromUrl,
  DASHBOARD_COLUMNS,
  isMobileViewport,
  statisticColumnCount,
  teamMemberUrl,
} from '../../utils/dashboard-page-helpers/dashboard-page.helpers';
import { DashboardPageActionsService } from './dashboard-page-actions.service';
import { I18nService } from '../../../../shared/i18n/i18n.service';
import { TranslatePipe } from '../../../../shared/i18n/translate.pipe';

/**
 * Coordinates dashboard view state, navigation, and responsive layout.
 * Task operations and their feedback are handled by a page-scoped action service.
 */
@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [
    DashboardHeaderComponent,
    DashboardInsightsComponent,
    DashboardSidebarComponent,
    DashboardSummaryComponent,
    MatButtonModule,
    MatCardModule,
    MatDialogModule,
    MatProgressBarModule,
    MatSnackBarModule,
    MatSidenavModule,
    TaskBoardComponent,
    TranslatePipe,
  ],
  templateUrl: './dashboard-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DashboardPageActionsService],
})
export class DashboardPageComponent {
  readonly store = inject(TaskService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly actions = inject(DashboardPageActionsService);
  private readonly i18n = inject(I18nService);
  readonly users = TEAM_MEMBERS;
  readonly currentUser = CURRENT_USER;
  readonly columns = DASHBOARD_COLUMNS;
  readonly loadingSkeletons: Record<TaskStatus, readonly number[]> = {
    todo: [1, 2, 3, 4, 5],
    in_progress: [1, 2, 3, 4],
    done: [1, 2, 3],
  };
  readonly dropListIds = DASHBOARD_COLUMNS.map((column) => `list-${column.status}`);
  readonly taskOrder = this.actions.taskOrder;
  readonly activities = this.actions.activities;

  readonly view = signal<DashboardView>('dashboard');
  readonly teamExpanded = signal(false);
  readonly viewportWidth = signal(window.innerWidth);
  readonly isMobile = computed(() => isMobileViewport(this.viewportWidth()));
  readonly statColumns = computed(() => statisticColumnCount(this.viewportWidth()));
  readonly query = signal('');
  readonly priorityFilter = signal<BoardPriorityFilter>(ALL_TASK_FILTER);
  readonly statusFilter = signal<BoardStatusFilter>(ALL_TASK_FILTER);
  readonly assigneeFilter = signal<string>(ALL_TASK_FILTER);
  readonly sidebarOpen = signal(false);

  readonly tasks = computed(() => {
    return sortTasksByOrder(this.store.tasks(), this.taskOrder());
  });

  readonly filteredTasks = computed(() => {
    return filterTasks(this.tasks(), {
      search: this.query(),
      priority: this.priorityFilter(),
      status: this.statusFilter(),
      assigneeId: this.assigneeFilter(),
      view: this.view(),
      currentUserId: this.currentUser.id,
    });
  });

  readonly stats = computed<DashboardStatistics>(() => {
    return calculateTaskStatistics(this.store.tasks());
  });

  readonly completionRate = computed(() => {
    const total = this.stats().total;
    return total ? Math.round((this.stats().done / total) * 100) : 0;
  });

  /** Synchronizes the active dashboard view with router navigation. */
  constructor() {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => this.applyRouteState());
    this.applyRouteState();
  }

  /** Selects a dashboard view and clears incompatible assignee and status filters. */
  setView(view: DashboardView): void {
    void this.router.navigateByUrl(dashboardUrlForView(view));
  }

  /** Resolves the current route to its dashboard task view. */
  private viewFromUrl(): DashboardView {
    return dashboardViewFromUrl(this.router.url);
  }

  /**
   * Applies a route's dashboard view and any team member encoded in its URL. */
  private applyRouteState(): void {
    const assigneeId = this.teamMemberIdFromUrl();
    const isKnownAssignee = this.users.some((user) => user.id === assigneeId);
    if (assigneeId && isKnownAssignee) {
      this.assigneeFilter.set(assigneeId);
      this.applyViewState('dashboard', true);
      return;
    }

    this.applyViewState(this.viewFromUrl());
  }

  /**
   * Reads the team member ID from a `/team/:id` route.
   * @returns The team member ID or null if the route is not a team member route.
   */
  private teamMemberIdFromUrl(): string | null {
    const segments = this.router.parseUrl(this.router.url).root.children['primary']?.segments ?? [];
    if (segments.length !== 2 || segments[0].path !== APP_ROUTE_PATHS.team.segment) return null;
    return segments[1].path;
  }

  /**
   * Opens Team with the first assigned member selected or shows the Settings notice.
   * @param item The navigation item to select.
   */
  selectNavigationItem(item: DashboardNavigationAction): void {
    if (item === 'team') {
      const shouldExpand = !this.teamExpanded();
      this.teamExpanded.set(shouldExpand);
      if (!shouldExpand) return;

      this.statusFilter.set(ALL_TASK_FILTER);
      if (this.assigneeFilter() !== ALL_TASK_FILTER) return;

      const firstAssignedMember = this.users.find((user) =>
        this.tasks().some((task) => task.assignee.id === user.id),
      );
      if (firstAssignedMember) {
        this.applyAssigneeFilter(firstAssignedMember.id, false);
      } else {
        this.assigneeFilter.set(ALL_TASK_FILTER);
      }
    } else {
      this.teamExpanded.set(false);
      this.sidebarOpen.set(false);
      this.snackBar.open(
        this.i18n.translate('notice.settings'),
        this.i18n.translate('common.dismiss'),
        { duration: 3000 },
      );
    }
  }

  /**
   * Closes the sidebar menu and reapplies state when selecting the current route.
   * @param view The dashboard view to select.
   */
  onRouteSelected(view: DashboardView): void {
    this.teamExpanded.set(false);
    this.sidebarOpen.set(false);
    if (this.viewFromUrl() === view) this.applyViewState(view);
  }

  /**
   * Applies view-specific filters without performing navigation.
   * @param view The dashboard view to select.
   * @param preserveAssignee Whether to preserve the current assignee filter.
   */
  private applyViewState(view: DashboardView, preserveAssignee = false): void {
    this.view.set(view);
    this.teamExpanded.set(preserveAssignee);
    if (!preserveAssignee) this.assigneeFilter.set(ALL_TASK_FILTER);
    this.statusFilter.set(ALL_TASK_FILTER);
    this.sidebarOpen.set(false);
  }

  /** Resets search and every task view/filter to the dashboard defaults. */
  clearFilters(): void {
    this.query.set('');
    this.priorityFilter.set(ALL_TASK_FILTER);
    this.statusFilter.set(ALL_TASK_FILTER);
    this.assigneeFilter.set(ALL_TASK_FILTER);
    this.teamExpanded.set(false);
    this.setView('dashboard');
  }

  /** Toggles a team-member filter and updates the team route. */
  setAssignee(id: string): void {
    const assigneeId = this.assigneeFilter() === id ? ALL_TASK_FILTER : id;
    this.applyAssigneeFilter(assigneeId);
  }

  /** Applies a member filter and navigates to its canonical team URL. */
  private applyAssigneeFilter(assigneeId: string, closeSidebar = true): void {
    this.teamExpanded.set(true);
    this.assigneeFilter.set(assigneeId);
    if (closeSidebar) this.sidebarOpen.set(false);
    const destination =
      assigneeId === ALL_TASK_FILTER ? APP_ROUTE_PATHS.dashboard.url : teamMemberUrl(assigneeId);
    if (this.router.url !== destination) void this.router.navigateByUrl(destination);
  }

  /** Opens or closes the responsive navigation drawer. */
  toggleSidebar(): void {
    this.sidebarOpen.update((open) => !open);
  }

  /** Closes the mobile navigation drawer when the user presses Escape. */
  @HostListener('document:keydown.escape')
  closeOnEscape(): void {
    this.sidebarOpen.set(false);
  }

  /** Refreshes the responsive layout breakpoint when the browser window changes size. */
  @HostListener('window:resize')
  onResize(): void {
    this.viewportWidth.set(window.innerWidth);
  }

  /** Opens the task editor in create mode. */
  openCreate(): void {
    this.actions.openCreate();
  }

  /** Opens the task editor with the selected task. */
  openEdit(task: Task): void {
    this.actions.openEdit(task);
  }

  /** Persists the submitted task draft through the dashboard action service. */
  saveTask(draft: TaskDraft, task: Task | null): void {
    this.actions.saveTask(draft, task);
  }

  /** Opens a confirmation dialog before deleting the selected task. */
  askDelete(task: Task): void {
    this.actions.askDelete(task);
  }

  /** Applies a task-board drop through the dashboard action service. */
  onDrop(event: TaskDropEvent): void {
    this.actions.onDrop(event);
  }
}
