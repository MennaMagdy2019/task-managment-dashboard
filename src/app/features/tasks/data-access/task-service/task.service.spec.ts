import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Component, inject } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Task, TaskDraft } from '../../../../shared/models/task.model';
import { TaskService } from './task.service';

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

@Component({
  standalone: true,
  template: '{{ service.tasks().length }}',
})
class TaskServiceHostComponent {
  readonly service = inject(TaskService);
}

describe('TaskService', () => {
  let fixture: ComponentFixture<TaskServiceHostComponent>;
  let service: TaskService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TaskServiceHostComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    fixture = TestBed.createComponent(TaskServiceHostComponent);
    service = fixture.componentInstance.service;
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('exposes loading, task data, and resource errors', fakeAsync(() => {
    fixture.detectChanges();
    tick();
    expect(service.isLoading()).toBeTrue();
    const request = httpTesting.expectOne('/api/tasks');
    request.flush([task]);
    tick();
    expect(service.tasks()).toEqual([task]);
    expect(service.error()).toBeUndefined();

    service.resource.reload();
    fixture.detectChanges();
    tick();
    const failedRequest = httpTesting.expectOne('/api/tasks');
    failedRequest.flush({ message: 'Unavailable' }, { status: 503, statusText: 'Unavailable' });
    tick();
    expect(service.error()).toBeTruthy();
  }));

  it('refreshes the task resource after successful create, update, and delete operations', fakeAsync(() => {
    fixture.detectChanges();
    tick();
    httpTesting.expectOne('/api/tasks').flush([task]);
    tick();

    service.createTask(draft).subscribe();
    httpTesting.expectOne({ method: 'POST', url: '/api/tasks' }).flush(task);
    tick();
    httpTesting.expectOne('/api/tasks').flush([task]);
    tick();

    service.updateTask('task/id ?', { title: 'Updated title' }).subscribe();
    httpTesting.expectOne({ method: 'PATCH', url: '/api/tasks/task%2Fid%20%3F' }).flush(task);
    tick();
    httpTesting.expectOne('/api/tasks').flush([task]);
    tick();

    service.deleteTask('task-1').subscribe();
    httpTesting.expectOne({ method: 'DELETE', url: '/api/tasks/task-1' }).flush(task);
    tick();
    httpTesting.expectOne('/api/tasks').flush([]);
    tick();

    expect(service.tasks()).toEqual([]);
  }));

  it('does not refresh task reads after a failed mutation', fakeAsync(() => {
    fixture.detectChanges();
    tick();
    httpTesting.expectOne('/api/tasks').flush([task]);
    tick();

    const error = jasmine.createSpy('error');
    service.createTask(draft).subscribe({ error });
    httpTesting
      .expectOne({ method: 'POST', url: '/api/tasks' })
      .flush({ message: 'Invalid task' }, { status: 400, statusText: 'Bad Request' });
    tick();

    expect(error).toHaveBeenCalled();
    httpTesting.expectNone('/api/tasks');
  }));
});
