import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  HostListener,
  computed,
  effect,
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
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DashboardHeaderComponent } from '../../components/dashboard-header/dashboard-header.component';
import { DashboardInsightsComponent } from '../../components/dashboard-insights/dashboard-insights.component';
import { DashboardSidebarComponent } from '../../components/dashboard-sidebar/dashboard-sidebar.component';
import { DashboardSummaryComponent } from '../../components/dashboard-summary/dashboard-summary.component';
import {
  TaskBoardComponent,
  TaskDropEvent,
} from '../../components/task-board/task-board.component';
import {
  CURRENT_USER,
  Task,
  TaskActivity,
  TaskDraft,
  TaskStatus,
  TEAM_MEMBERS,
} from '../../../../shared/models/task.model';
import {
  BoardPriorityFilter,
  BoardStatusFilter,
  DashboardStatistics,
  DashboardView,
} from '../../models/dashboard.model';
import { TaskService } from '../../../tasks/data-access/task-service/task.service';
import {
  calculateTaskStatistics,
  filterTasks,
  placeTaskIdInOrder,
  reorderVisibleTaskIds,
  sortTasksByOrder,
  synchronizeTaskOrder,
  taskStatusLabel,
} from '../../utils/task-dashboard-helpers/task-dashboard.helpers';
import {
  countUpcomingTasks,
  createInitialActivities,
  createTaskActivity,
  dashboardUrlForView,
  dashboardViewFromUrl,
  DASHBOARD_COLUMNS,
  isMobileViewport,
  statisticColumnCount,
  taskErrorMessage,
  taskMoveActivity,
} from '../../utils/dashboard-page-helpers/dashboard-page.helpers';

/**
 * Coordinates dashboard state, task operations, dialogs, and notifications.
 * The layout and individual dashboard regions are delegated to standalone
 * presentational components.
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
  ],
  templateUrl: '../assets/dashboard-page.component.html',
  styleUrl: '../assets/dashboard-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPageComponent {
  readonly title = 'TaskFlow';
  readonly store = inject(TaskService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  readonly users = TEAM_MEMBERS;
  readonly currentUser = CURRENT_USER;
  readonly columns = DASHBOARD_COLUMNS;
  readonly dropListIds = DASHBOARD_COLUMNS.map((column) => `list-${column.status}`);

  readonly view = signal<DashboardView>('dashboard');
  readonly teamExpanded = signal(false);
  readonly viewportWidth = signal(window.innerWidth);
  readonly isMobile = computed(() => isMobileViewport(this.viewportWidth()));
  readonly statColumns = computed(() => statisticColumnCount(this.viewportWidth()));
  readonly query = signal('');
  readonly priorityFilter = signal<BoardPriorityFilter>('all');
  readonly statusFilter = signal<BoardStatusFilter>('all');
  readonly assigneeFilter = signal('all');
  readonly sidebarOpen = signal(false);
  readonly taskOrder = signal<string[]>([]);
  private preserveTeamMenuOnNavigation = false;

  readonly tasks = computed(() => {
    return sortTasksByOrder(this.store.tasks(), this.taskOrder());
  });
  readonly myTasksCount = computed(
    () => this.store.tasks().filter((task) => task.assignee.id === this.currentUser.id).length,
  );
  readonly overdueCount = computed(() => this.stats().overdue);
  readonly upcomingCount = computed(() => countUpcomingTasks(this.store.tasks()));

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

  readonly activities = signal<TaskActivity[]>(createInitialActivities());

  /** Keeps user-controlled task ordering aligned with the latest resource data. */
  constructor() {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        const keepTeamMenuOpen = this.preserveTeamMenuOnNavigation;
        this.preserveTeamMenuOnNavigation = false;
        this.applyViewState(this.viewFromUrl(), keepTeamMenuOpen);
      });
    this.applyViewState(this.viewFromUrl());

    effect(() => {
      const taskIds = this.store.tasks().map((task) => task.id);
      this.synchronizeTaskOrder(taskIds);
    });
  }

  /** Selects a dashboard view and clears incompatible assignee and status filters. */
  setView(view: DashboardView): void {
    void this.router.navigateByUrl(dashboardUrlForView(view));
  }

  /** Resolves the current route to its dashboard task view. */
  private viewFromUrl(): DashboardView {
    return dashboardViewFromUrl(this.router.url);
  }

  /** Applies the sidebar actions that remain local to the dashboard. */
  selectNavigationItem(item: 'team' | 'settings'): void {
    if (item === 'team') {
      const shouldExpand = !this.teamExpanded();
      this.teamExpanded.set(shouldExpand);
      this.assigneeFilter.set('all');
      this.statusFilter.set('all');
      if (shouldExpand && this.view() !== 'dashboard') {
        this.preserveTeamMenuOnNavigation = true;
        void this.router.navigateByUrl('/dashboard');
      }
      this.sidebarOpen.set(false);
    } else {
      this.teamExpanded.set(false);
      this.sidebarOpen.set(false);
      this.snackBar.open('Settings are coming soon.', 'Dismiss', { duration: 3000 });
    }
  }

  /** Applies view-specific filters without performing navigation. */
  private applyViewState(view: DashboardView, keepTeamMenuOpen = false): void {
    this.view.set(view);
    this.teamExpanded.set(keepTeamMenuOpen && view === 'dashboard');
    if (!keepTeamMenuOpen) {
      this.assigneeFilter.set('all');
    }
    this.statusFilter.set('all');
    this.sidebarOpen.set(false);
  }

  /** Resets search and every task view/filter to the dashboard defaults. */
  clearFilters(): void {
    this.query.set('');
    this.priorityFilter.set('all');
    this.statusFilter.set('all');
    this.assigneeFilter.set('all');
    this.teamExpanded.set(false);
    this.setView('dashboard');
  }

  /** Toggles a team-member filter and returns to the dashboard task view. */
  setAssignee(id: string): void {
    if (this.view() !== 'dashboard') {
      this.preserveTeamMenuOnNavigation = true;
      void this.router.navigateByUrl('/dashboard');
    }
    this.teamExpanded.set(true);
    this.assigneeFilter.set(this.assigneeFilter() === id ? 'all' : id);
    this.sidebarOpen.set(false);
  }

  /** Opens or closes the responsive navigation drawer. */
  toggleSidebar(): void {
    this.sidebarOpen.update((open) => !open);
  }

  /** Opens the task editor in create mode. */
  openCreate(): void {
    void this.openEditor(null);
  }

  /** Opens the task editor with the selected task. */
  openEdit(task: Task): void {
    void this.openEditor(task);
  }

  /** Persists a task draft, updates activity, and reports the result to the user. */
  saveTask(draft: TaskDraft, task: Task | null): void {
    const request = task ? this.store.updateTask(task.id, draft) : this.store.createTask(draft);

    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (saved) => {
        this.recordActivity(
          task ? 'updated' : 'created',
          task ? 'updated a task' : 'created a task',
          saved.title,
        );
        this.setNotice(task ? 'Task changes saved.' : 'Task created successfully.', 'success');
      },
      error: (error: unknown) =>
        this.setNotice(taskErrorMessage(error, 'Could not save this task.'), 'error'),
    });
  }

  /** Opens a confirmation dialog before deleting the selected task. */
  askDelete(task: Task): void {
    void import('../../../../shared/components/confirm-delete-dialog/confirm-delete-dialog.component').then(
      ({ ConfirmDeleteDialogComponent }) => {
        this.dialog
          .open(ConfirmDeleteDialogComponent, {
            data: { taskTitle: task.title },
            width: '420px',
            maxWidth: '95vw',
          })
          .afterClosed()
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe((confirmed: boolean) => {
            if (confirmed) this.deleteTask(task);
          });
      },
    );
  }

  /** Applies a task-board drop by reordering local display order or persisting a status change. */
  onDrop({ event, status }: TaskDropEvent): void {
    const task = event.item.data;
    if (event.previousContainer === event.container) {
      if (event.previousIndex !== event.currentIndex) {
        this.reorderVisibleTasks(event.container.data, event.previousIndex, event.currentIndex);
      }
      return;
    }

    this.placeTaskInColumn(task.id, event.container.data, event.currentIndex);
    this.store
      .updateTask(task.id, { status })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          const activity = taskMoveActivity(status);
          this.recordActivity(activity.kind, activity.message, updated.title);
          this.setNotice(`Task moved to ${this.statusLabel(status)}.`, 'success');
        },
        error: (error: unknown) =>
          this.setNotice(taskErrorMessage(error, 'Could not move this task.'), 'error'),
      });
  }

  /** Returns a user-facing label for a task status. */
  statusLabel(status: TaskStatus): string {
    return taskStatusLabel(status);
  }

  /** Removes hidden tasks from the stored order and appends newly loaded task IDs. */
  private synchronizeTaskOrder(taskIds: string[]): void {
    this.taskOrder.update((order) => synchronizeTaskOrder(order, taskIds));
  }

  /** Loads the task editor lazily and handles its submitted task draft. */
  private async openEditor(task: Task | null): Promise<void> {
    const { TaskEditorComponent } =
      await import('../../../tasks/components/task-editor/task-editor.component');
    this.dialog
      .open(TaskEditorComponent, {
        data: { task, users: this.users },
        width: '560px',
        maxWidth: '95vw',
        maxHeight: '95vh',
        autoFocus: 'first-tabbable',
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((draft: TaskDraft | undefined) => {
        if (draft) this.saveTask(draft, task);
      });
  }

  /** Deletes a task and reports the success or failure through activity and notifications. */
  private deleteTask(task: Task): void {
    this.store
      .deleteTask(task.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.recordActivity('deleted', 'deleted a task', task.title);
          this.setNotice('Task deleted.', 'success');
        },
        error: (error: unknown) =>
          this.setNotice(taskErrorMessage(error, 'Could not delete this task.'), 'error'),
      });
  }

  /** Converts the visible task IDs into their new local order after a same-column drop. */
  private reorderVisibleTasks(visibleTasks: Task[], from: number, to: number): void {
    this.taskOrder.update((order) => reorderVisibleTaskIds(order, visibleTasks, from, to));
  }

  /** Inserts a moved task next to its drop target in the local display order. */
  private placeTaskInColumn(taskId: string, destination: Task[], index: number): void {
    this.taskOrder.update((order) => placeTaskIdInOrder(order, taskId, destination, index));
  }

  /** Adds a task-related event to the bounded recent-activity feed. */
  private recordActivity(kind: TaskActivity['kind'], message: string, taskTitle: string): void {
    const activity = createTaskActivity(kind, message, taskTitle);
    this.activities.update((items) => [activity, ...items].slice(0, 8));
  }

  /** Shows a success or error snack-bar notification. */
  private setNotice(text: string, kind: 'success' | 'error'): void {
    this.snackBar.open(text, 'Dismiss', { duration: kind === 'error' ? 6000 : 3500 });
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
}
