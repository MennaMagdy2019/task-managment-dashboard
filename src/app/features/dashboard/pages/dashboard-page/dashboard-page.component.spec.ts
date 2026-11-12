import { HttpErrorResponse } from '@angular/common/http';
import { CdkDrag, CdkDragDrop, CdkDropList } from '@angular/cdk/drag-drop';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { routes } from '../../../../app.routes';
import { Task, TaskDraft } from '../../../../shared/models/task.model';
import { TaskService } from '../../../tasks/data-access/task-service/task.service';
import { DashboardPageComponent } from './dashboard-page.component';

const task: Task = {
  id: 'task-1',
  title: 'Review release notes',
  description: 'Review the latest changes',
  status: 'todo',
  priority: 'medium',
  dueDate: '2099-12-31',
  assignee: {
    id: 'u1',
    name: 'Olivia Rhye',
    email: 'olivia@acme.com',
    initials: 'OR',
  },
  tags: [],
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

const draft: TaskDraft = {
  title: task.title,
  description: task.description,
  status: task.status,
  priority: task.priority,
  dueDate: task.dueDate,
  assignee: task.assignee,
  tags: task.tags,
};

describe('DashboardPageComponent', () => {
  const store = {
    tasks: jasmine.createSpy('tasks').and.callFake(() => [task]),
    isLoading: jasmine.createSpy('isLoading').and.returnValue(false),
    error: jasmine.createSpy('error').and.returnValue(undefined),
    createTask: jasmine.createSpy('createTask').and.returnValue(of(task)),
    updateTask: jasmine.createSpy('updateTask').and.returnValue(of(task)),
    deleteTask: jasmine.createSpy('deleteTask').and.returnValue(of(task)),
  };
  const dialog = {
    open: jasmine.createSpy('open').and.returnValue({ afterClosed: () => of(undefined) }),
  };
  const snackBar = { open: jasmine.createSpy('open') };

  beforeEach(async () => {
    store.tasks.calls.reset();
    store.isLoading.calls.reset();
    store.error.calls.reset();
    store.createTask.calls.reset();
    store.updateTask.calls.reset();
    store.deleteTask.calls.reset();
    dialog.open.calls.reset();
    store.tasks.and.callFake(() => [task]);
    store.isLoading.and.returnValue(false);
    store.error.and.returnValue(undefined);
    store.createTask.and.returnValue(of(task));
    store.updateTask.and.returnValue(of(task));
    store.deleteTask.and.returnValue(of(task));
    dialog.open.and.returnValue({ afterClosed: () => of(undefined) });
    snackBar.open.calls.reset();

    TestBed.configureTestingModule({
      imports: [DashboardPageComponent],
      providers: [provideRouter(routes), { provide: TaskService, useValue: store }],
    });
    TestBed.overrideComponent(DashboardPageComponent, {
      add: {
        providers: [
          { provide: MatDialog, useValue: dialog },
          { provide: MatSnackBar, useValue: snackBar },
        ],
      },
    });
    await TestBed.compileComponents();
  });

  /** Creates and renders a dashboard page fixture with the configured test providers. */
  function createFixture() {
    const fixture = TestBed.createComponent(DashboardPageComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('updates local filters, team navigation, responsive state, and notices', async () => {
    const fixture = createFixture();
    const component = fixture.componentInstance;
    await TestBed.inject(Router).navigateByUrl('/dashboard');
    fixture.detectChanges();

    component.query.set('campaign');
    component.priorityFilter.set('high');
    component.statusFilter.set('done');
    component.assigneeFilter.set('u2');
    component.selectNavigationItem('team');
    expect(component.teamExpanded()).toBeTrue();
    expect(component.assigneeFilter()).toBe('u2');
    expect(component.statusFilter()).toBe('all');

    component.setAssignee('u2');
    expect(component.assigneeFilter()).toBe('all');
    component.setAssignee('u2');
    await fixture.whenStable();
    expect(component.assigneeFilter()).toBe('u2');

    component.toggleSidebar();
    expect(component.sidebarOpen()).toBeTrue();
    component.closeOnEscape();
    expect(component.sidebarOpen()).toBeFalse();
    component.viewportWidth.set(600);
    expect(component.isMobile()).toBeTrue();
    expect(component.statColumns()).toBe(2);
    component.onResize();
    expect(component.viewportWidth()).toBe(window.innerWidth);

    component.selectNavigationItem('settings');
    expect(snackBar.open).toHaveBeenCalledWith(
      'Settings are coming soon.',
      'Dismiss',
      jasmine.objectContaining({ duration: 3000 }),
    );

    component.clearFilters();
    await fixture.whenStable();
    expect(component.query()).toBe('');
    expect(component.priorityFilter()).toBe('all');
    expect(component.statusFilter()).toBe('all');
    expect(component.teamExpanded()).toBeFalse();
  });

  it('selects the first team member with tasks and opens the filtered Dashboard', async () => {
    const phoenixTask: Task = {
      ...task,
      id: 'task-2',
      assignee: {
        id: 'u2',
        name: 'Phoenix Baker',
        email: 'phoenix@acme.com',
        initials: 'PB',
      },
    };
    store.tasks.and.returnValue([phoenixTask]);
    const fixture = createFixture();
    const component = fixture.componentInstance;
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/analytics');
    fixture.detectChanges();

    component.selectNavigationItem('team');
    await fixture.whenStable();
    fixture.detectChanges();

    expect(router.url).toBe('/team/u2');
    expect(component.view()).toBe('dashboard');
    expect(component.teamExpanded()).toBeTrue();
    expect(component.assigneeFilter()).toBe('u2');
    expect(component.filteredTasks()).toEqual([phoenixTask]);
  });

  it('saves new and existing tasks and reports API failures', () => {
    const component = createFixture().componentInstance;

    component.saveTask(draft, null);
    expect(store.createTask).toHaveBeenCalledOnceWith(draft);
    expect(snackBar.open).toHaveBeenCalledWith(
      'Task created successfully.',
      'Dismiss',
      jasmine.objectContaining({ duration: 3500 }),
    );

    store.updateTask.and.returnValue(throwError(() => new HttpErrorResponse({ status: 404 })));
    component.saveTask(draft, task);
    expect(store.updateTask).toHaveBeenCalledOnceWith(task.id, draft);
    expect(snackBar.open).toHaveBeenCalledWith(
      'Could not save this task. The task was not found.',
      'Dismiss',
      jasmine.objectContaining({ duration: 6000 }),
    );
    expect(component.activities().length).toBeGreaterThan(4);
  });

  it('reorders tasks within a column and persists cross-column moves', () => {
    const fixture = createFixture();
    const component = fixture.componentInstance;
    const secondTask = { ...task, id: 'task-2', title: 'Second task' };
    const visibleTasks = [task, secondTask];
    component.taskOrder.set(['task-1', 'task-2']);

    const sameColumn = createDropEvent(visibleTasks, visibleTasks, 0, 1, task);
    component.onDrop({ event: sameColumn, status: 'todo' });
    expect(component.taskOrder()).toEqual(['task-2', 'task-1']);
    expect(store.updateTask).not.toHaveBeenCalled();

    store.updateTask.and.returnValue(of({ ...task, status: 'done' }));
    const crossColumn = createDropEvent([secondTask], [task], 0, 0, task);
    component.onDrop({ event: crossColumn, status: 'done' });
    expect(store.updateTask).toHaveBeenCalledOnceWith(task.id, { status: 'done' });
    expect(snackBar.open).toHaveBeenCalledWith(
      'Task moved to Done.',
      'Dismiss',
      jasmine.objectContaining({ duration: 3500 }),
    );

    store.updateTask.and.returnValue(throwError(() => new HttpErrorResponse({ status: 503 })));
    component.onDrop({ event: crossColumn, status: 'in_progress' });
    expect(snackBar.open).toHaveBeenCalledWith(
      'Could not move this task. The service is temporarily unavailable.',
      'Dismiss',
      jasmine.objectContaining({ duration: 6000 }),
    );
  });

  it('opens the editor and handles delete confirmation outcomes', async () => {
    const component = createFixture().componentInstance;
    await import('../../../tasks/components/task-editor/task-editor.component');
    dialog.open.and.returnValue({ afterClosed: () => of(draft) });
    component.openCreate();
    await new Promise((resolve) => setTimeout(resolve, 25));
    expect(dialog.open).toHaveBeenCalled();
    expect(store.createTask).toHaveBeenCalledWith(draft);

    await import('../../../../shared/components/confirm-delete-dialog/confirm-delete-dialog.component');
    dialog.open.and.returnValue({ afterClosed: () => of(true) });
    component.askDelete(task);
    await new Promise((resolve) => setTimeout(resolve, 25));
    expect(store.deleteTask).toHaveBeenCalledOnceWith(task.id);
    expect(snackBar.open).toHaveBeenCalledWith(
      'Task deleted.',
      'Dismiss',
      jasmine.objectContaining({ duration: 3500 }),
    );

    dialog.open.and.returnValue({ afterClosed: () => of(false) });
    component.askDelete(task);
    await new Promise((resolve) => setTimeout(resolve, 25));
    expect(store.deleteTask).toHaveBeenCalledOnceWith(task.id);
  });
});

/** Builds a CDK drop event for same-column reordering or cross-column movement. */
function createDropEvent(
  previousTasks: Task[],
  destinationTasks: Task[],
  previousIndex: number,
  currentIndex: number,
  droppedTask: Task,
): CdkDragDrop<Task[], Task[], Task> {
  const previousContainer = { data: previousTasks } as CdkDropList<Task[]>;
  return {
    previousIndex,
    currentIndex,
    item: { data: droppedTask } as CdkDrag<Task>,
    container:
      previousTasks === destinationTasks
        ? previousContainer
        : ({ data: destinationTasks } as CdkDropList<Task[]>),
    previousContainer,
    isPointerOverContainer: true,
    distance: { x: 0, y: 0 },
    dropPoint: { x: 0, y: 0 },
    event: new MouseEvent('mouseup'),
  };
}
