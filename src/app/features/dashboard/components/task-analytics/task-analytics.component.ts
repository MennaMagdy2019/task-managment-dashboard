import { isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  Input,
  OnChanges,
  OnDestroy,
  PLATFORM_ID,
  ViewChild,
} from '@angular/core';
import {
  ArcElement,
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  DoughnutController,
  Legend,
  LinearScale,
  Tooltip,
} from 'chart.js';
import type { Task } from '../../../../shared/models/task.model';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import {
  TASK_PRIORITY_CHART_ORDER,
  TASK_PRIORITY_LABELS,
  TASK_STATUS_LABELS,
  TASK_STATUS_OPTIONS,
} from '../../../../shared/constants/task.constants';

let chartsRegistered = false;

@Component({
  selector: 'app-task-analytics',
  standalone: true,
  imports: [MatCardModule, MatChipsModule],
  templateUrl: './task-analytics.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskAnalyticsComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input({ required: true }) tasks: Task[] = [];
  readonly priorityLabels = TASK_PRIORITY_LABELS;
  readonly statusLabels = TASK_STATUS_LABELS;
  @ViewChild('priorityCanvas') private priorityCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('statusCanvas') private statusCanvas?: ElementRef<HTMLCanvasElement>;
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private renderVersion = 0;

  private priorityChart?: Chart<'doughnut', number[], string>;
  private statusChart?: Chart<'bar', number[], string>;

  /** Returns task counts in the priority chart's High, Medium, Low order. */
  get priorityCounts(): number[] {
    return TASK_PRIORITY_CHART_ORDER.map(
      (priority) => this.tasks.filter((task) => task.priority === priority).length,
    );
  }

  /** Returns task counts in the status chart's To do, In progress, Done order. */
  get statusCounts(): number[] {
    return TASK_STATUS_OPTIONS.map(
      (status) => this.tasks.filter((task) => task.status === status).length,
    );
  }

  /** Creates the charts after their canvas elements are available. */
  ngAfterViewInit(): void {
    this.scheduleChartRender();
  }

  /** Refreshes chart values when the task input changes. */
  ngOnChanges(): void {
    if (this.priorityChart || this.statusChart) this.refreshCharts();
  }

  /** Releases Chart.js instances when the analytics component is destroyed. */
  ngOnDestroy(): void {
    this.renderVersion++;
    this.destroyCharts();
  }

  /** Releases Chart.js instances before replacing or removing their canvases. */
  private destroyCharts(): void {
    this.priorityChart?.destroy();
    this.statusChart?.destroy();
    this.priorityChart = undefined;
    this.statusChart = undefined;
  }

  /** Rebuilds the charts to match the currently rendered canvases and task data. */
  private refreshCharts(): void {
    this.renderVersion++;
    this.destroyCharts();
    if (!this.tasks.length) return;
    this.scheduleChartRender();
  }

  /** Renders the chart instances after Angular has attached conditional canvases. */
  private scheduleChartRender(): void {
    if (!this.isBrowser || !this.tasks.length) return;
    const renderVersion = ++this.renderVersion;
    requestAnimationFrame(() => {
      if (renderVersion !== this.renderVersion) return;
      if (!this.priorityCanvas || !this.statusCanvas) return;
      this.registerChartElements();
      this.createCharts();
      this.updateCharts();
    });
  }

  /** Creates the priority and status charts with dashboard-specific styling. */
  private createCharts(): void {
    const textColor = '#778397';
    const gridColor = '#eef1f5';

    if (this.priorityCanvas) {
      this.priorityChart = new Chart(this.priorityCanvas.nativeElement, {
        type: 'doughnut',
        data: {
          labels: TASK_PRIORITY_CHART_ORDER.map((priority) => TASK_PRIORITY_LABELS[priority]),
          datasets: [
            {
              data: [0, 0, 0],
              backgroundColor: ['#eb6471', '#f4b545', '#5dc2a0'],
              borderWidth: 0,
              hoverOffset: 4,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '72%',
          plugins: {
            legend: { display: false },
            tooltip: { backgroundColor: '#1e293b', padding: 10, cornerRadius: 8 },
          },
        },
      });
    }

    if (this.statusCanvas) {
      this.statusChart = new Chart(this.statusCanvas.nativeElement, {
        type: 'bar',
        data: {
          labels: TASK_STATUS_OPTIONS.map((status) => TASK_STATUS_LABELS[status]),
          datasets: [
            {
              data: [0, 0, 0],
              backgroundColor: ['#8aabff', '#4b7df0', '#58c5a1'],
              borderRadius: 6,
              barThickness: 15,
            },
          ],
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: { backgroundColor: '#1e293b', padding: 10, cornerRadius: 8 },
          },
          scales: {
            x: {
              beginAtZero: true,
              ticks: { precision: 0, color: textColor, font: { size: 10 } },
              grid: { color: gridColor },
              border: { display: false },
            },
            y: {
              ticks: { color: textColor, font: { size: 10 } },
              grid: { display: false },
              border: { display: false },
            },
          },
        },
      });
    }
  }

  /** Registers only the Chart.js controllers and plugins used in this component. */
  private registerChartElements(): void {
    if (chartsRegistered) return;
    Chart.register(
      ArcElement,
      BarController,
      BarElement,
      CategoryScale,
      DoughnutController,
      LinearScale,
      Tooltip,
      Legend,
    );
    chartsRegistered = true;
  }

  /** Pushes the latest task counts into the existing chart instances. */
  private updateCharts(): void {
    if (this.priorityChart) {
      this.priorityChart.data.datasets[0].data = this.priorityCounts;
      this.priorityChart.update();
    }
    if (this.statusChart) {
      this.statusChart.data.datasets[0].data = this.statusCounts;
      this.statusChart.update();
    }
  }
}
