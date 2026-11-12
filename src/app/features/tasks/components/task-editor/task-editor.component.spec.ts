import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Assignee, Task, TaskDraft, TEAM_MEMBERS } from '../../../../shared/models/task.model';
import { TaskEditorComponent } from './task-editor.component';

const task: Task = {
  id: 'task-1',
  title: 'Review release notes',
  description: 'Review the latest changes',
  status: 'in_progress',
  priority: 'high',
  dueDate: '2025-03-15',
  assignee: TEAM_MEMBERS[1],
  tags: ['planning', 'review'],
  createdAt: '2025-03-01T00:00:00.000Z',
  updatedAt: '2025-03-02T00:00:00.000Z',
};

describe('TaskEditorComponent', () => {
  const dialogData: { task: Task | null; users: Assignee[] } = {
    task: null,
    users: TEAM_MEMBERS,
  };
  let close: jasmine.Spy;

  beforeEach(async () => {
    close = jasmine.createSpy('close');
    dialogData.task = null;
    dialogData.users = TEAM_MEMBERS;
    await TestBed.configureTestingModule({
      imports: [TaskEditorComponent],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: dialogData },
        { provide: MatDialogRef, useValue: { close } },
      ],
    }).compileComponents();
  });

  function createComponent(currentTask: Task | null = null, users: Assignee[] = TEAM_MEMBERS) {
    dialogData.task = currentTask;
    dialogData.users = users;
    const fixture = TestBed.createComponent(TaskEditorComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('initializes sensible create defaults and requires a non-whitespace title', () => {
    const component = createComponent().componentInstance;

    expect(component.form.controls.priority.value).toBe('medium');
    expect(component.form.controls.status.value).toBe('todo');
    expect(component.form.controls.assigneeId.value).toBe(TEAM_MEMBERS[0].id);
    expect(component.form.controls.dueDate.value).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(component.tags.length).toBe(1);

    component.form.controls.title.setValue('   ');
    component.submit();

    expect(component.form.controls.title.touched).toBeTrue();
    expect(component.form.controls.title.hasError('whitespace')).toBeTrue();
    expect(close).not.toHaveBeenCalled();
  });

  it('normalizes valid task details and omits blank labels on submit', () => {
    const component = createComponent().componentInstance;
    component.form.patchValue({
      title: '  Ship the release  ',
      description: '  Prepare the notes  ',
      priority: 'high',
      status: 'done',
      dueDate: '2025-03-15',
      assigneeId: TEAM_MEMBERS[1].id,
    });
    component.tags.at(0).setValue('  planning  ');
    component.addTag();
    component.tags.at(1).setValue(' ');
    component.addTag();
    component.tags.at(2).setValue('  review  ');

    component.submit();

    const expected: TaskDraft = {
      title: 'Ship the release',
      description: 'Prepare the notes',
      priority: 'high',
      status: 'done',
      dueDate: '2025-03-15',
      assignee: TEAM_MEMBERS[1],
      tags: ['planning', 'review'],
    };
    expect(close).toHaveBeenCalledOnceWith(expected);
  });

  it('marks an assignee unavailable when it is no longer in the team list', () => {
    const component = createComponent().componentInstance;
    component.form.patchValue({
      title: 'A task',
      assigneeId: 'removed-user',
    });

    component.submit();

    expect(component.form.controls.assigneeId.hasError('unavailable')).toBeTrue();
    expect(close).not.toHaveBeenCalled();
  });

  it('preloads edit fields, enforces label limits, and labels each status', () => {
    const component = createComponent(task).componentInstance;

    expect(component.form.controls.title.value).toBe(task.title);
    expect(component.form.controls.assigneeId.value).toBe(task.assignee.id);
    expect(component.tags.getRawValue()).toEqual(task.tags);
    expect(component.statusLabel('todo')).toBe('To do');
    expect(component.statusLabel('in_progress')).toBe('In progress');
    expect(component.statusLabel('done')).toBe('Done');

    component.addTag();
    component.addTag();
    expect(component.tags.length).toBe(4);
    component.addTag();
    expect(component.tags.length).toBe(4);
    component.removeTag(0);
    expect(component.tags.length).toBe(3);
    component.removeTag(0);
    component.removeTag(0);
    component.removeTag(0);
    expect(component.tags.length).toBe(1);

    component.form.controls.title.setValue('x'.repeat(81));
    component.form.controls.description.setValue('x'.repeat(241));
    component.tags.at(0).setValue('x'.repeat(25));
    expect(component.form.invalid).toBeTrue();
  });
});
