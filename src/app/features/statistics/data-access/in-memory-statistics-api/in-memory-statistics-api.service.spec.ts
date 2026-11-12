import { TestBed } from '@angular/core/testing';
import { TEAM_MEMBERS } from '../../../../shared/models/task.model';
import { InMemoryTaskApiService } from '../../../tasks/data-access/in-memory-task-api/in-memory-task-api.service';
import { InMemoryStatisticsApiService } from './in-memory-statistics-api.service';

describe('InMemoryStatisticsApiService', () => {
  let service: InMemoryStatisticsApiService;
  let taskApi: InMemoryTaskApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [InMemoryStatisticsApiService, InMemoryTaskApiService],
    });
    service = TestBed.inject(InMemoryStatisticsApiService);
    taskApi = TestBed.inject(InMemoryTaskApiService);
  });

  it('derives statistic values from the current task collection', () => {
    const initial = service.getStatistics();
    const totalBefore = initial.statistics.find((stat) => stat.id === 'stat-001')?.value;
    const completedBefore = initial.statistics.find((stat) => stat.id === 'stat-002')?.value;

    taskApi.createTask({
      title: 'Completed task',
      description: '',
      status: 'done',
      priority: 'low',
      dueDate: '2000-01-01',
      assignee: TEAM_MEMBERS[0],
      tags: [],
    });

    const updated = service.getStatistics();
    expect(updated.statistics.find((stat) => stat.id === 'stat-001')?.value).toBe(
      (totalBefore ?? 0) + 1,
    );
    expect(updated.statistics.find((stat) => stat.id === 'stat-002')?.value).toBe(
      (completedBefore ?? 0) + 1,
    );
    expect(updated.lastUpdated).toBeTruthy();
  });

  it('derives overdue statistics from unfinished tasks with past due dates', () => {
    const overdueBefore = service
      .getStatistics()
      .statistics.find((stat) => stat.id === 'stat-004')?.value;

    taskApi.createTask({
      title: 'Overdue task',
      description: '',
      status: 'todo',
      priority: 'medium',
      dueDate: '2000-01-01',
      assignee: TEAM_MEMBERS[0],
      tags: [],
    });

    expect(service.getStatistics().statistics.find((stat) => stat.id === 'stat-004')?.value).toBe(
      (overdueBefore ?? 0) + 1,
    );
  });
});
