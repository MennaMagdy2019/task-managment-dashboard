import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardInsightsComponent } from './dashboard-insights.component';
import { I18nService } from '../../../../shared/i18n/i18n.service';
import {
  TASK_ACTIVITY_MESSAGES,
  TASK_STATUS_LABELS,
} from '../../../../shared/constants/task.constants';
import type { TaskActivity } from '../../../../shared/models/task.model';

describe('DashboardInsightsComponent', () => {
  let component: DashboardInsightsComponent;
  let fixture: ComponentFixture<DashboardInsightsComponent>;
  let mockI18nService: {
    language: ReturnType<typeof signal<string>>;
    translate: jasmine.Spy;
  };

  beforeEach(async () => {
    mockI18nService = {
      language: signal('en'),
      translate: jasmine
        .createSpy('translate')
        .and.callFake((key: string, params?: Record<string, string>) =>
          params ? `${key}:${JSON.stringify(params)}` : key,
        ),
    };

    await TestBed.configureTestingModule({
      imports: [DashboardInsightsComponent],
      providers: [{ provide: I18nService, useValue: mockI18nService }],
    })
      .overrideComponent(DashboardInsightsComponent, {
        set: {
          imports: [],
          template: '',
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(DashboardInsightsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component with default empty inputs', () => {
    expect(component).toBeTruthy();
    expect(component.tasks()).toEqual([]);
    expect(component.activities()).toEqual([]);
  });

  describe('timeAgo', () => {
    it('should format relative time using current timestamp and active language', () => {
      const fixedNow = new Date('2026-11-12T12:00:00.000Z').getTime();
      const fiveMinutesAgo = new Date('2026-11-12T11:55:00.000Z').toISOString();

      spyOn(Date, 'now').and.returnValue(fixedNow);
      mockI18nService.language.set('en');

      const result = component.timeAgo(fiveMinutesAgo);

      expect(Date.now).toHaveBeenCalled();
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('activityMessage', () => {
    it('should translate due date updated messages', () => {
      const activity = {
        id: '1',
        kind: 'updated',
        message: TASK_ACTIVITY_MESSAGES.dueDateUpdated,
        timestamp: '2026-11-12T10:00:00.000Z',
      } as unknown as TaskActivity;

      const result = component.activityMessage(activity);

      expect(mockI18nService.translate).toHaveBeenCalledWith('activity.dueDateUpdated');
      expect(result).toBe('activity.dueDateUpdated');
    });

    it('should translate movedToStatus message when moved to "todo"', () => {
      const activity = {
        id: '2',
        kind: 'updated',
        message: `${TASK_ACTIVITY_MESSAGES.movedToStatus} ${TASK_STATUS_LABELS.todo}`,
        timestamp: '2026-11-12T10:00:00.000Z',
        taskTitle: 'Test task',
        actor: 'Test User' as unknown as TaskActivity['actor'],
        occurredAt: '2026-11-12T10:00:00.000Z',
      } as TaskActivity;

      const result = component.activityMessage(activity);

      expect(mockI18nService.translate).toHaveBeenCalledWith('status.todo');
      expect(mockI18nService.translate).toHaveBeenCalledWith('activity.movedToStatus', {
        status: 'status.todo',
      });
      expect(result).toBe('activity.movedToStatus:{"status":"status.todo"}');
    });

    it('should translate movedToStatus message when moved to "in_progress"', () => {
      const activity = {
        id: '3',
        kind: 'updated',
        message: `${TASK_ACTIVITY_MESSAGES.movedToStatus} ${TASK_STATUS_LABELS.in_progress}`,
        timestamp: '2026-11-12T10:00:00.000Z',
      } as unknown as TaskActivity;

      const result = component.activityMessage(activity);

      expect(mockI18nService.translate).toHaveBeenCalledWith('status.inProgress');
      expect(mockI18nService.translate).toHaveBeenCalledWith('activity.movedToStatus', {
        status: 'status.inProgress',
      });
      expect(result).toBe('activity.movedToStatus:{"status":"status.inProgress"}');
    });

    it('should translate movedToStatus message when moved to "done"', () => {
      const activity = {
        id: '4',
        kind: 'updated',
        message: `${TASK_ACTIVITY_MESSAGES.movedToStatus} ${TASK_STATUS_LABELS.done}`,
        timestamp: '2026-11-12T10:00:00.000Z',
      } as unknown as TaskActivity;

      const result = component.activityMessage(activity);

      expect(mockI18nService.translate).toHaveBeenCalledWith('status.done');
      expect(mockI18nService.translate).toHaveBeenCalledWith('activity.movedToStatus', {
        status: 'status.done',
      });
      expect(result).toBe('activity.movedToStatus:{"status":"status.done"}');
    });

    it('should fall back to activity.kind translation if movedToStatus has an unknown status label', () => {
      const activity = {
        id: '5',
        kind: 'updated',
        message: `${TASK_ACTIVITY_MESSAGES.movedToStatus} UnknownStatus`,
        timestamp: '2026-11-12T10:00:00.000Z',
      } as unknown as TaskActivity;

      const result = component.activityMessage(activity);

      expect(mockI18nService.translate).toHaveBeenCalledWith('activity.updated');
      expect(result).toBe('activity.updated');
    });

    it('should translate standard activity kinds (created, updated, completed, deleted)', () => {
      const kinds: { kind: TaskActivity['kind']; expectedKey: string }[] = [
        { kind: 'created', expectedKey: 'activity.created' },
        { kind: 'updated', expectedKey: 'activity.updated' },
        { kind: 'completed', expectedKey: 'activity.completed' },
        { kind: 'deleted', expectedKey: 'activity.deleted' },
      ];

      for (const { kind, expectedKey } of kinds) {
        mockI18nService.translate.calls.reset();
        const activity = {
          id: `id-${kind}`,
          kind,
          message: 'Custom user task title',
          timestamp: '2026-11-12T10:00:00.000Z',
          taskTitle: 'Custom user task title',
          actor: 'Test User' as unknown as TaskActivity['actor'],
          occurredAt: '2026-11-12T10:00:00.000Z',
        } as unknown as TaskActivity;

        const result = component.activityMessage(activity);

        expect(mockI18nService.translate).toHaveBeenCalledWith(expectedKey);
        expect(result).toBe(expectedKey);
      }
    });
  });
});
