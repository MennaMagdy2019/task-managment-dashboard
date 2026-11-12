import { PLATFORM_ID } from '@angular/core';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Chart } from 'chart.js';
import { I18nService } from '../../../../shared/i18n/i18n.service';
import { Task } from '../../../../shared/models/task.model';
import { TaskAnalyticsComponent } from './task-analytics.component';

describe('TaskAnalyticsComponent', () => {
  let fixture: ComponentFixture<TaskAnalyticsComponent>;
  let component: TaskAnalyticsComponent;
  let mockI18nService: {
    language: ReturnType<typeof signal<string>>;
    translate: jasmine.Spy<(key: string) => string>;
  };

  const mockTasks: Task[] = [
    { id: '1', title: 'Task 1', priority: 'high', status: 'todo' } as Task,
    { id: '2', title: 'Task 2', priority: 'high', status: 'in_progress' } as Task,
    { id: '3', title: 'Task 3', priority: 'medium', status: 'done' } as Task,
    { id: '4', title: 'Task 4', priority: 'low', status: 'done' } as Task,
  ];

  beforeEach(async () => {
    mockI18nService = {
      language: signal('en'),
      translate: jasmine.createSpy('translate').and.callFake((key: string) => `translated.${key}`),
    };

    // Stub requestAnimationFrame to execute synchronously in unit tests
    spyOn(window, 'requestAnimationFrame').and.callFake((cb: FrameRequestCallback) => {
      cb(0);
      return 1;
    });

    await TestBed.configureTestingModule({
      imports: [TaskAnalyticsComponent],
      providers: [
        { provide: I18nService, useValue: mockI18nService },
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    })
      // Override template to isolate component TypeScript logic and guarantee canvas presence
      .overrideComponent(TaskAnalyticsComponent, {
        set: {
          template: `
            <canvas id="priorityCanvas" #priorityCanvas></canvas>
            <canvas id="statusCanvas" #statusCanvas></canvas>
          `,
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(TaskAnalyticsComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    // Ensure Chart.js instances are cleaned up between tests
    if (component) {
      component.ngOnDestroy();
    }
  });

  it('should create the component', () => {
    fixture.componentRef.setInput('tasks', []);
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  describe('Computed Signals', () => {
    it('should calculate priorityCounts in [High, Medium, Low] order', () => {
      fixture.componentRef.setInput('tasks', mockTasks);
      fixture.detectChanges();

      expect(component.priorityCounts()).toEqual([2, 1, 1]);
    });

    it('should calculate statusCounts in [To do, In progress, Done] order', () => {
      fixture.componentRef.setInput('tasks', mockTasks);
      fixture.detectChanges();

      expect(component.statusCounts()).toEqual([1, 1, 2]);
    });

    it('should return zero arrays when tasks input is empty', () => {
      fixture.componentRef.setInput('tasks', []);
      fixture.detectChanges();

      expect(component.priorityCounts()).toEqual([0, 0, 0]);
      expect(component.statusCounts()).toEqual([0, 0, 0]);
    });
  });

  describe('Chart Initialization and Lifecycle', () => {
    it('should initialize priorityChart and statusChart when tasks are provided', () => {
      fixture.componentRef.setInput('tasks', mockTasks);
      fixture.detectChanges(); // Triggers ngAfterViewInit -> scheduleChartRender

      const priorityChart = Chart.getChart('priorityCanvas');
      const statusChart = Chart.getChart('statusCanvas');

      expect(priorityChart).toBeDefined();
      expect(priorityChart?.data.datasets[0].data).toEqual([2, 1, 1]);

      expect(statusChart).toBeDefined();
      expect(statusChart?.data.datasets[0].data).toEqual([1, 1, 2]);
    });

    it('should not create charts when tasks list is empty', () => {
      fixture.componentRef.setInput('tasks', []);
      fixture.detectChanges();

      expect(Chart.getChart('priorityCanvas')).toBeUndefined();
      expect(Chart.getChart('statusCanvas')).toBeUndefined();
    });

    it('should rebuild charts on ngOnChanges when tasks input updates', () => {
      fixture.componentRef.setInput('tasks', mockTasks);
      fixture.detectChanges();

      const initialPriorityChart = Chart.getChart('priorityCanvas');
      expect(initialPriorityChart).toBeDefined();
      const destroySpy = spyOn(initialPriorityChart!, 'destroy').and.callThrough();

      // Update input to trigger ngOnChanges
      const updatedTasks: Task[] = [
        { id: '1', title: 'Task 1', priority: 'low', status: 'todo' } as Task,
      ];
      fixture.componentRef.setInput('tasks', updatedTasks);
      fixture.detectChanges();

      expect(destroySpy).toHaveBeenCalled();
      const newPriorityChart = Chart.getChart('priorityCanvas');
      expect(newPriorityChart).toBeDefined();
      expect(newPriorityChart).not.toBe(initialPriorityChart);
      expect(newPriorityChart?.data.datasets[0].data).toEqual([0, 0, 1]);
    });

    it('should destroy charts without recreating them when tasks become empty', () => {
      fixture.componentRef.setInput('tasks', mockTasks);
      fixture.detectChanges();

      const priorityChart = Chart.getChart('priorityCanvas');
      const statusChart = Chart.getChart('statusCanvas');
      expect(priorityChart).toBeDefined();
      expect(statusChart).toBeDefined();
      const priorityDestroySpy = spyOn(priorityChart!, 'destroy').and.callThrough();
      const statusDestroySpy = spyOn(statusChart!, 'destroy').and.callThrough();

      fixture.componentRef.setInput('tasks', []);
      fixture.detectChanges();

      expect(priorityDestroySpy).toHaveBeenCalled();
      expect(statusDestroySpy).toHaveBeenCalled();
      expect(Chart.getChart('priorityCanvas')).toBeUndefined();
      expect(Chart.getChart('statusCanvas')).toBeUndefined();
    });

    it('should destroy charts on ngOnDestroy', () => {
      fixture.componentRef.setInput('tasks', mockTasks);
      fixture.detectChanges();

      const priorityChart = Chart.getChart('priorityCanvas');
      const statusChart = Chart.getChart('statusCanvas');
      expect(priorityChart).toBeDefined();
      expect(statusChart).toBeDefined();
      const priorityDestroySpy = spyOn(priorityChart!, 'destroy').and.callThrough();
      const statusDestroySpy = spyOn(statusChart!, 'destroy').and.callThrough();

      component.ngOnDestroy();

      expect(priorityDestroySpy).toHaveBeenCalled();
      expect(statusDestroySpy).toHaveBeenCalled();
      expect(Chart.getChart('priorityCanvas')).toBeUndefined();
      expect(Chart.getChart('statusCanvas')).toBeUndefined();
    });
  });

  describe('I18n Reactivity', () => {
    it('should update chart labels and re-render when i18n language signal changes', () => {
      fixture.componentRef.setInput('tasks', mockTasks);
      fixture.detectChanges();

      const priorityChart = Chart.getChart('priorityCanvas');
      const statusChart = Chart.getChart('statusCanvas');
      expect(priorityChart).toBeDefined();
      expect(statusChart).toBeDefined();

      const priorityUpdateSpy = spyOn(priorityChart!, 'update');
      const statusUpdateSpy = spyOn(statusChart!, 'update');

      mockI18nService.translate.and.callFake((key: string) => `es.${key}`);
      mockI18nService.language.set('es');
      fixture.detectChanges(); // Flushes the Angular effect

      expect(priorityUpdateSpy).toHaveBeenCalled();
      expect(statusUpdateSpy).toHaveBeenCalled();
      expect(priorityChart?.data.labels).toEqual([
        'es.priority.high',
        'es.priority.medium',
        'es.priority.low',
      ]);
      expect(statusChart?.data.labels).toEqual([
        'es.status.todo',
        'es.status.inProgress',
        'es.status.done',
      ]);
    });
  });
});

describe('TaskAnalyticsComponent (Server Platform)', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaskAnalyticsComponent],
      providers: [
        {
          provide: I18nService,
          useValue: { language: signal('en'), translate: (k: string) => k },
        },
        { provide: PLATFORM_ID, useValue: 'server' },
      ],
    })
      .overrideComponent(TaskAnalyticsComponent, {
        set: {
          template:
            '<canvas id="priorityCanvas" #priorityCanvas></canvas><canvas id="statusCanvas" #statusCanvas></canvas>',
        },
      })
      .compileComponents();
  });

  it('should not render charts when running on the server', () => {
    const fixture = TestBed.createComponent(TaskAnalyticsComponent);
    fixture.componentRef.setInput('tasks', [
      { id: '1', title: 'Task 1', priority: 'high', status: 'todo' } as Task,
    ]);
    fixture.detectChanges();

    expect(Chart.getChart('priorityCanvas')).toBeUndefined();
    expect(Chart.getChart('statusCanvas')).toBeUndefined();
  });
});
