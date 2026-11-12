import { TestBed } from '@angular/core/testing';
import { TEAM_MEMBERS } from '../../../../shared/models/task.model';
import type { TaskDraft } from '../../../../shared/models/task.model';
import { InMemoryTaskApiService, MockApiError } from './in-memory-task-api.service';

describe('InMemoryTaskApiService', () => {
  let service: InMemoryTaskApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [InMemoryTaskApiService],
    });
    service = TestBed.inject(InMemoryTaskApiService);
  });

  it('returns detached tasks with overdue status derived from today', () => {
    const firstRead = service.getTasks();
    const originalTitle = firstRead[0].title;
    const originalAssigneeName = firstRead[0].assignee.name;
    firstRead[0].title = 'Changed outside the API';
    firstRead[0].assignee.name = 'Changed outside the API';
    firstRead[0].tags.push('external');

    const nextRead = service.getTasks();
    expect(nextRead[0].title).toBe(originalTitle);
    expect(nextRead[0].assignee.name).toBe(originalAssigneeName);
    expect(nextRead[0].tags).not.toContain('external');

    const today = new Date().toISOString().slice(0, 10);
    for (const task of nextRead) {
      expect(task.isOverdue).toBe(task.status !== 'done' && task.dueDate < today);
    }
  });

  it('sets completion time when creating a completed task', () => {
    const draft: TaskDraft = {
      title: 'Completed on creation',
      description: 'A task created in the done state',
      status: 'done',
      priority: 'low',
      dueDate: '2000-01-01',
      assignee: TEAM_MEMBERS[0],
      tags: [],
    };
    const created = service.createTask(draft);

    expect(created.completedAt).toBeDefined();
    expect(created.isOverdue).toBeFalse();
  });

  it('rejects unknown fields in an assignee payload', () => {
    const draft = {
      title: 'Invalid assignee',
      description: '',
      status: 'todo',
      priority: 'low',
      dueDate: '2099-12-31',
      assignee: { ...TEAM_MEMBERS[0], role: 'admin' },
      tags: [],
    };

    expect(() => service.createTask(draft)).toThrowError(MockApiError);
  });

  it('rejects invalid create payload values and unknown fields', () => {
    const validDraft: TaskDraft = {
      title: 'Valid task',
      description: 'Task details',
      status: 'todo',
      priority: 'medium',
      dueDate: '2099-12-31',
      assignee: TEAM_MEMBERS[0],
      tags: ['planning'],
    };
    const invalidDrafts: unknown[] = [
      null,
      [],
      { ...validDraft, title: '   ' },
      { ...validDraft, status: 'blocked' },
      { ...validDraft, priority: 'urgent' },
      { ...validDraft, dueDate: 'tomorrow' },
      { ...validDraft, dueDate: '2024-02-30' },
      { ...validDraft, assignee: { ...TEAM_MEMBERS[0], email: 'other@example.com' } },
      { ...validDraft, tags: ['valid', 42] },
      { ...validDraft, completedAt: '2024-01-01T00:00:00.000Z' },
    ];

    for (const draft of invalidDrafts) {
      expect(() => service.createTask(draft)).toThrowError(MockApiError);
    }
  });

  it('validates patches, tracks completion transitions, and returns detached updated tasks', () => {
    const task = service.createTask({
      title: 'Patch lifecycle',
      description: '',
      status: 'todo',
      priority: 'low',
      dueDate: '2099-12-31',
      assignee: TEAM_MEMBERS[0],
      tags: ['one'],
    });

    expect(() => service.updateTask('missing-task', { title: 'Updated' })).toThrowError(
      MockApiError,
    );
    const invalidPatches: unknown[] = [
      null,
      {},
      { title: ' ' },
      { description: 5 },
      { status: 'blocked' },
      { priority: 'urgent' },
      { dueDate: 'not-a-date' },
      { assignee: { ...TEAM_MEMBERS[0], role: 'admin' } },
      { tags: ['valid', false] },
      { id: 'cannot-update-id' },
    ];
    for (const patch of invalidPatches) {
      expect(() => service.updateTask(task.id, patch)).toThrowError(MockApiError);
    }

    const completed = service.updateTask(task.id, { status: 'done' });
    expect(completed.completedAt).toBeDefined();
    expect(completed.isOverdue).toBeFalse();

    const reopened = service.updateTask(task.id, { status: 'in_progress', tags: ['two'] });
    expect(reopened.completedAt).toBeUndefined();
    reopened.tags.push('changed outside the API');
    expect(service.getTasks().find((item) => item.id === task.id)?.tags).toEqual(['two']);
  });

  it('deletes tasks and reports a typed not-found error', () => {
    const task = service.getTasks()[0];

    expect(service.deleteTask(task.id).id).toBe(task.id);
    expect(service.getTasks().some((item) => item.id === task.id)).toBeFalse();
    expect(() => service.deleteTask(task.id)).toThrowError(MockApiError);
  });
});
