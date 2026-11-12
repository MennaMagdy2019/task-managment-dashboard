import { HttpErrorResponse } from '@angular/common/http';
import {
  createInitialActivities,
  createTaskActivity,
  dashboardUrlForView,
  dashboardViewFromUrl,
  isMobileViewport,
  statisticColumnCount,
  taskErrorMessage,
  taskMoveActivity,
  teamMemberUrl,
} from './dashboard-page.helpers';

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
    expect(dashboardViewFromUrl('/team/u2')).toBe('dashboard');
    expect(dashboardUrlForView('my-tasks')).toBe('/tasks');
    expect(dashboardUrlForView('analytics')).toBe('/analytics');
    expect(dashboardUrlForView('dashboard')).toBe('/dashboard');
    expect(teamMemberUrl('u2')).toBe('/team/u2');
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
    expect(
      taskErrorMessage(new HttpErrorResponse({ status: 0 }), fallback, (key) => `DE ${key}`),
    ).toBe(`${fallback} DE connection`);
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

  it('selects responsive breakpoints at their exact edges', () => {
    expect(statisticColumnCount(1099)).toBe(2);
    expect(statisticColumnCount(1100)).toBe(4);
    expect(isMobileViewport(699)).toBeTrue();
    expect(isMobileViewport(700)).toBeFalse();
  });
});
