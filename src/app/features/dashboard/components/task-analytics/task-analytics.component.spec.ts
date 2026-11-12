import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Task } from '../../../../shared/models/task.model';
import { TaskAnalyticsComponent } from './task-analytics.component';

const tasks: Task[] = [
  {
    id: 'one',
    title: 'Review design',
    description: 'Check the latest design',
    status: 'todo',
    priority: 'high',
    dueDate: '2026-11-20',
    assignee: { id: 'u1', name: 'Olivia Rhye', email: 'olivia@example.com', initials: 'OR' },
    tags: [],
    createdAt: '2026-11-01T00:00:00.000Z',
    updatedAt: '2026-11-01T00:00:00.000Z',
  },
  {
    id: 'two',
    title: 'Ship feature',
    description: 'Complete implementation',
    status: 'done',
    priority: 'low',
    dueDate: '2026-11-22',
    assignee: { id: 'u2', name: 'Phoenix Baker', email: 'phoenix@example.com', initials: 'PB' },
    tags: [],
    createdAt: '2026-11-01T00:00:00.000Z',
    updatedAt: '2026-11-01T00:00:00.000Z',
  },
];

describe('TaskAnalyticsComponent', () => {
  let fixture: ComponentFixture<TaskAnalyticsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaskAnalyticsComponent],
    }).compileComponents();
  });

  it('renders both task charts and accessible counts when tasks exist', () => {
    fixture = TestBed.createComponent(TaskAnalyticsComponent);
    fixture.componentRef.setInput('tasks', tasks);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelectorAll('canvas').length).toBe(2);
    expect(element.textContent).toContain('High · 1');
    expect(element.textContent).toContain('Medium · 0');
    expect(element.textContent).toContain('Low · 1');
    expect(element.textContent).toContain('To do · 1');
    expect(element.textContent).toContain('Done · 1');
  });

  it('shows an empty state and no charts when there are no tasks', () => {
    fixture = TestBed.createComponent(TaskAnalyticsComponent);
    fixture.componentRef.setInput('tasks', []);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelectorAll('canvas').length).toBe(2);
    expect(element.querySelectorAll('[role="status"]').length).toBe(2);
    expect(element.textContent).toContain('No task data to chart yet.');
  });
});
