import { Injectable, inject } from '@angular/core';
import { InMemoryTaskApiService } from '../../../tasks/data-access/in-memory-task-api/in-memory-task-api.service';
import type { Statistic, StatisticsResponse } from '../../models/statistics.model';
import generatedStatistics from '../statistics.json';

/** Provides task statistics using the current in-memory task collection. */
@Injectable({ providedIn: 'root' })
export class InMemoryStatisticsApiService {
  private readonly taskApi = inject(InMemoryTaskApiService);

  /** Returns generated statistic metadata with values derived from current tasks. */
  getStatistics(): StatisticsResponse {
    const tasks = this.taskApi.getTasks();
    const values = new Map<string, number>([
      ['stat-001', tasks.length],
      ['stat-002', tasks.filter((task) => task.status === 'done').length],
      ['stat-003', tasks.filter((task) => task.status === 'in_progress').length],
      ['stat-004', tasks.filter((task) => task.isOverdue).length],
    ]);

    return {
      ...generatedStatistics,
      statistics: generatedStatistics.statistics.map((stat): Statistic => {
        if (
          stat.changeType !== 'positive' &&
          stat.changeType !== 'negative' &&
          stat.changeType !== 'neutral'
        ) {
          throw new Error(`Generated statistic "${stat.id}" has an invalid change type.`);
        }

        const value = values.get(stat.id);
        if (value === undefined) {
          throw new Error(`Generated statistic "${stat.id}" has no matching task count.`);
        }

        return { ...stat, value, changeType: stat.changeType };
      }),
      lastUpdated: new Date().toISOString(),
    };
  }
}
