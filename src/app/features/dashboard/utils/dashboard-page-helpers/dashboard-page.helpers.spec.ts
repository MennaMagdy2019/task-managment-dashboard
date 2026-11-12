import { HttpErrorResponse } from '@angular/common/http';
import { Task } from '../../../../shared/models/task.model';
import {
  countUpcomingTasks,
  createInitialActivities,
  createTaskActivity,
  dashboardUrlForView,
  dashboardViewFromUrl,
  isMobileViewport,
  statisticColumnCount,
  taskErrorMessage,
  taskMoveActivity,
} from './dashboard-page.helpers';

function createTask(id: string, dueDate: string, status: Task['status'] = 'todo'): Task {
  return {
    id,
    title: `Task ${id}`,
    description: '',
    status,
    priority: 'medium',
    dueDate,
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
}

describe('dashboard page helpers', () => {
  it('creates stable sample activities relative to the supplied date', () => {
    const now = new Date('2024-05-20T12:00:00.000Z');
    const activities = createInitialActivities(now);

    expect(activities).toHaveSize(4);
    expect(activities[0].occurredAt).toBe(now.toISOString());
    expect(activities[2].occurredAt).toBe('2024-05-19T12:00:00.000Z');
  });

  it('maps route paths and view states to canonical dashboard URLs', () => {
    expect(dashboardViewFromUrl('/tasks?filter=mine')).toBe('my-tasks');
    expect(dashboardViewFromUrl('/analytics')).toBe('analytics');
    expect(dashboardViewFromUrl('/dashboard?team=u1')).toBe('dashboard');
    expect(dashboardUrlForView('my-tasks')).toBe('/tasks');
    expect(dashboardUrlForView('upcoming')).toBe('/dashboard');
    expect(dashboardUrlForView('analytics')).toBe('/analytics');
    expect(dashboardUrlForView('dashboard')).toBe('/dashboard');
    expect(dashboardUrlForView('overdue')).toBe('/dashboard');
  });

  it('creates a current-user activity entry with a unique ID', () => {
    const activity = createTaskActivity(
      'created',
      'created a task',
      'Write tests',
      new Date('2024-05-20T12:00:00.000Z'),
    );

    expect(activity).toEqual(
      jasmine.objectContaining({
        message: 'created a task',
        taskTitle: 'Write tests',
        actor: jasmine.objectContaining({ id: 'u1' }),
        occurredAt: '2024-05-20T12:00:00.000Z',
        kind: 'created',
      }),
    );
    expect(activity.id).toBeTruthy();
  });

  it('provides actionable messages for known HTTP errors and preserves the fallback otherwise', () => {
    const fallback = 'Could not save.';
    expect(
      taskErrorMessage(
        new HttpErrorResponse({ status: 400, error: { message: 'Invalid payload.' } }),
        fallback,
      ),
    ).toBe(`${fallback} Invalid payload.`);
    expect(taskErrorMessage(new HttpErrorResponse({ status: 0 }), fallback)).toContain(
      'Check your connection',
    );
    expect(taskErrorMessage(new HttpErrorResponse({ status: 400 }), fallback)).toContain(
      'Check the task details',
    );
    expect(taskErrorMessage(new HttpErrorResponse({ status: 404 }), fallback)).toContain(
      'task was not found',
    );
    expect(taskErrorMessage(new HttpErrorResponse({ status: 503 }), fallback)).toContain(
      'temporarily unavailable',
    );
    expect(taskErrorMessage(new HttpErrorResponse({ status: 403 }), fallback)).toBe(fallback);
    expect(taskErrorMessage(new Error('unexpected'), fallback)).toBe(fallback);
  });

  it('describes task moves according to their destination status', () => {
    expect(taskMoveActivity('todo')).toEqual({
      kind: 'updated',
      message: 'moved a task to To do',
    });
    expect(taskMoveActivity('in_progress')).toEqual({
      kind: 'updated',
      message: 'moved a task to In progress',
    });
    expect(taskMoveActivity('done')).toEqual({
      kind: 'completed',
      message: 'moved a task to Done',
    });
  });

  it('counts unfinished tasks due today through seven days from today inclusively', () => {
    const tasks = [
      createTask('today', '2024-12-29'),
      createTask('last-day', '2025-01-05'),
      createTask('past', '2024-12-28'),
      createTask('outside', '2025-01-06'),
      createTask('completed', '2024-12-29', 'done'),
    ];

    expect(countUpcomingTasks(tasks, '2024-12-29')).toBe(2);
  });

  it('selects responsive breakpoints at their exact edges', () => {
    expect(statisticColumnCount(1099)).toBe(2);
    expect(statisticColumnCount(1100)).toBe(4);
    expect(isMobileViewport(699)).toBeTrue();
    expect(isMobileViewport(700)).toBeFalse();
  });
});
