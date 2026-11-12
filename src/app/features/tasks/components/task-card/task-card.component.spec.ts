import { ComponentFixture, TestBed } from '@angular/core/testing';
import type { Task } from '../../../../shared/models/task.model';
import { I18nService } from '../../../../shared/i18n/i18n.service';
import { TaskCardComponent } from './task-card.component';

const baseTask: Task = {
  id: 'task-1',
  title: 'Review release notes',
  description: 'Review the latest changes',
  status: 'todo',
  priority: 'high',
  dueDate: '2026-11-14',
  assignee: {
    id: 'user-1',
    name: 'Olivia Rhye',
    email: 'olivia@example.com',
    initials: 'OR',
  },
  tags: ['Planning'],
  createdAt: '2026-11-10T00:00:00.000Z',
  updatedAt: '2026-11-11T00:00:00.000Z',
};

describe('TaskCardComponent', () => {
  beforeEach(async () => {
    jasmine.clock().install();
    jasmine.clock().mockDate(new Date('2026-11-12T12:00:00.000Z'));
    await TestBed.configureTestingModule({
      imports: [TaskCardComponent],
    }).compileComponents();
  });

  afterEach(() => {
    TestBed.inject(I18nService).setLanguage('en');
    localStorage.removeItem('taskflow.language');
    jasmine.clock().uninstall();
  });

  it('shows a calendar icon and due label for a todo task', () => {
    const fixture = createFixture();

    expect(fixture.nativeElement.querySelector('.due-date')?.textContent).toContain(
      'Due in 2 days',
    );
    expect(fixture.nativeElement.querySelector('.due-date-icon')?.textContent.trim()).toBe(
      'calendar_today',
    );
  });

  it('shows a schedule icon for an in-progress task', () => {
    const fixture = createFixture({ status: 'in_progress' });

    expect(fixture.nativeElement.querySelector('.due-date-icon')?.textContent.trim()).toBe(
      'schedule',
    );
  });

  it('shows one warning icon and the overdue duration for an overdue task', () => {
    const fixture = createFixture({ dueDate: '2026-11-10' });

    expect(fixture.nativeElement.querySelector('.due-date')?.textContent).toContain(
      'Overdue by 2 days',
    );
    expect(fixture.nativeElement.querySelectorAll('.due-date-icon').length).toBe(1);
    expect(fixture.nativeElement.querySelector('.due-date-icon')?.textContent.trim()).toBe(
      'warning',
    );
  });

  it('shows completion labels without a warning icon for done tasks', () => {
    const todayFixture = createFixture({
      status: 'done',
      completedAt: '2026-11-12T10:00:00.000Z',
    });
    const yesterdayFixture = createFixture({
      status: 'done',
      completedAt: '2026-11-11T10:00:00.000Z',
    });

    expect(todayFixture.nativeElement.querySelector('.due-date')?.textContent).toContain(
      'Completed today',
    );
    expect(yesterdayFixture.nativeElement.querySelector('.due-date')?.textContent).toContain(
      'Completed yesterday',
    );
    expect(todayFixture.nativeElement.querySelector('.due-date-icon')?.textContent.trim()).toBe(
      'check_circle',
    );
    expect(yesterdayFixture.nativeElement.querySelector('.due-date-icon')?.textContent.trim()).toBe(
      'check_circle',
    );
  });

  it('updates due labels when the application language changes', () => {
    const fixture = createFixture();

    TestBed.inject(I18nService).setLanguage('de');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.due-date')?.textContent).toContain(
      'In 2 Tagen fällig',
    );
  });
});

/** Creates the task card with the supplied task overrides. */
function createFixture(overrides: Partial<Task> = {}): ComponentFixture<TaskCardComponent> {
  const fixture = TestBed.createComponent(TaskCardComponent);
  fixture.componentRef.setInput('task', { ...baseTask, ...overrides });
  fixture.detectChanges();
  return fixture;
}
