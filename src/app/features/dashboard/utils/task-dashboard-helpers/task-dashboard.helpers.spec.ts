import { Task } from '../../../../shared/models/task.model';
import {
  calculateTaskStatistics,
  filterTasks,
  formatRelativeTime,
  placeTaskIdInOrder,
  reorderVisibleTaskIds,
  sortTasksByOrder,
  synchronizeTaskOrder,
} from './task-dashboard.helpers';

const sampleTasks: Task[] = [
  {
    id: 'one',
    title: 'Finish design',
    description: 'Review the latest screens',
    status: 'todo',
    priority: 'high',
    dueDate: '2026-11-10',
    assignee: { id: 'u1', name: 'Olivia Rhye', email: 'olivia@acme.com', initials: 'OR' },
    tags: [],
    createdAt: '2026-11-01T00:00:00.000Z',
    updatedAt: '2026-11-01T00:00:00.000Z',
  },
  {
    id: 'two',
    title: 'Ship feature',
    description: 'Finish implementation',
    status: 'done',
    priority: 'low',
    dueDate: '2026-11-09',
    assignee: { id: 'u2', name: 'Phoenix Baker', email: 'phoenix@acme.com', initials: 'PB' },
    tags: [],
    createdAt: '2026-11-01T00:00:00.000Z',
    updatedAt: '2026-11-01T00:00:00.000Z',
  },
];

describe('task dashboard helpers', () => {
  it('filters by text, priority, status, assignee, and view', () => {
    const filtered = filterTasks(sampleTasks, {
      search: 'design',
      priority: 'high',
      status: 'todo',
      assigneeId: 'u1',
      view: 'my-tasks',
      currentUserId: 'u1',
    });

    expect(filtered.map((task) => task.id)).toEqual(['one']);
  });

  it('filters upcoming tasks due within the next week and excludes completed tasks', () => {
    const filtered = filterTasks(sampleTasks, {
      search: '',
      priority: 'all',
      status: 'all',
      assigneeId: 'all',
      view: 'upcoming',
      currentUserId: 'u1',
      today: '2026-11-09',
      upcomingThrough: '2026-11-16',
    });

    expect(filtered.map((task) => task.id)).toEqual(['one']);
  });

  it('filters overdue unfinished tasks', () => {
    const filtered = filterTasks(sampleTasks, {
      search: '',
      priority: 'all',
      status: 'all',
      assigneeId: 'all',
      view: 'overdue',
      currentUserId: 'u1',
      today: '2026-11-11',
    });

    expect(filtered.map((task) => task.id)).toEqual(['one']);
  });

  it('calculates task counts and excludes completed overdue tasks', () => {
    expect(calculateTaskStatistics(sampleTasks, '2026-11-11')).toEqual({
      total: 2,
      done: 1,
      inProgress: 0,
      overdue: 1,
    });
  });

  it('sorts tasks by the selected order', () => {
    expect(sortTasksByOrder(sampleTasks, ['two', 'one']).map((task) => task.id)).toEqual([
      'two',
      'one',
    ]);
  });

  it('reconciles ordering after tasks are added or removed', () => {
    expect(synchronizeTaskOrder(['two', 'removed'], ['one', 'two', 'three'])).toEqual([
      'two',
      'one',
      'three',
    ]);
  });

  it('reorders visible task IDs without moving filtered-out IDs', () => {
    expect(reorderVisibleTaskIds(['one', 'hidden', 'two'], sampleTasks, 0, 1)).toEqual([
      'two',
      'hidden',
      'one',
    ]);
  });

  it('places a moved task next to the destination task', () => {
    expect(placeTaskIdInOrder(['one', 'two'], 'one', [sampleTasks[1]], 1)).toEqual(['two', 'one']);
  });

  it('formats recent activity timestamps', () => {
    expect(
      formatRelativeTime('2026-11-11T00:59:00.000Z', Date.parse('2026-11-11T01:00:00.000Z')),
    ).toBe('1m ago');
  });

  it('formats recent activity timestamps in German', () => {
    expect(
      formatRelativeTime('2026-11-11T00:59:00.000Z', Date.parse('2026-11-11T01:00:00.000Z'), 'de'),
    ).toBe('vor 1 Min.');
    expect(
      formatRelativeTime('2026-11-10T01:00:00.000Z', Date.parse('2026-11-11T01:00:00.000Z'), 'de'),
    ).toBe('Gestern');
  });
});
