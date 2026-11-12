import { DestroyRef, Injectable, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import type { TaskDropEvent } from '../../models/task-board.model';
import type { DashboardNoticeKind } from '../../models/dashboard.model';
import { TaskService } from '../../../tasks/data-access/task-service/task.service';
import type { TaskEditorDialogData } from '../../../tasks/models/task-editor.model';
import type { ConfirmDeleteDialogData } from '../../../../shared/models/confirm-delete-dialog.model';
import { TASK_ACTIVITY_MESSAGES } from '../../../../shared/constants/task.constants';
import { TEAM_MEMBERS } from '../../../../shared/constants/team.constants';
import type { Task, TaskActivity, TaskDraft } from '../../../../shared/models/task.model';
import {
  placeTaskIdInOrder,
  reorderVisibleTaskIds,
  synchronizeTaskOrder,
} from '../../utils/task-dashboard-helpers/task-dashboard.helpers';
import {
  createInitialActivities,
  createTaskActivity,
  taskErrorMessage,
  taskMoveActivity,
} from '../../utils/dashboard-page-helpers/dashboard-page.helpers';
import { I18nService } from '../../../../shared/i18n/i18n.service';
import type { TaskErrorSuffix, TranslationKey } from '../../../../shared/i18n/i18n.defines';

const ERROR_TRANSLATION_KEYS: Record<TaskErrorSuffix, TranslationKey> = {
  connection: 'error.connection',
  invalidTask: 'error.invalidTask',
  missingTask: 'error.missingTask',
  unavailable: 'error.unavailable',
};

/** Coordinates dashboard task actions, dialogs, ordering, and action feedback. */
@Injectable()
export class DashboardPageActionsService {
  private readonly store = inject(TaskService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly i18n = inject(I18nService);
  private readonly destroyRef = inject(DestroyRef);

  readonly taskOrder = signal<string[]>([]);
  readonly activities = signal<TaskActivity[]>(createInitialActivities());

  constructor() {
    effect(() => {
      const taskIds = this.store.tasks().map((task) => task.id);
      this.taskOrder.update((order) => synchronizeTaskOrder(order, taskIds));
    });
  }

  /** Opens the task editor in create mode. */
  openCreate(): void {
    void this.openEditor(null);
  }

  /** Opens the task editor with the selected task. */
  openEdit(task: Task): void {
    void this.openEditor(task);
  }

  /** Persists a task draft, updates activity, and reports the result to the user. */
  saveTask(draft: TaskDraft, task: Task | null): void {
    const request = task ? this.store.updateTask(task.id, draft) : this.store.createTask(draft);

    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (saved) => {
        this.recordActivity(
          task ? 'updated' : 'created',
          task ? TASK_ACTIVITY_MESSAGES.updated : TASK_ACTIVITY_MESSAGES.created,
          saved.title,
        );
        this.setNotice(
          this.i18n.translate(task ? 'notice.taskUpdated' : 'notice.taskCreated'),
          'success',
        );
      },
      error: (error: unknown) => this.setNotice(this.taskError(error, 'error.save'), 'error'),
    });
  }

  /** Opens a confirmation dialog before deleting the selected task. */
  askDelete(task: Task): void {
    void import('../../../../shared/components/confirm-delete-dialog/confirm-delete-dialog.component')
      .then(({ ConfirmDeleteDialogComponent }) => {
        const data: ConfirmDeleteDialogData = { taskTitle: task.title };
        this.dialog
          .open<
            InstanceType<typeof ConfirmDeleteDialogComponent>,
            ConfirmDeleteDialogData,
            boolean
          >(ConfirmDeleteDialogComponent, { data, width: '420px', maxWidth: '95vw' })
          .afterClosed()
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe((confirmed) => {
            if (confirmed) this.deleteTask(task);
          });
      })
      .catch((error: unknown) => {
        this.setNotice(this.taskError(error, 'error.openDeleteConfirmation'), 'error');
      });
  }

  /** Applies a task-board drop by reordering local display order or persisting a status change. */
  onDrop({ event, status }: TaskDropEvent): void {
    const task = event.item.data;
    if (event.previousContainer === event.container) {
      if (event.previousIndex !== event.currentIndex) {
        this.reorderVisibleTasks(event.container.data, event.previousIndex, event.currentIndex);
      }
      return;
    }

    this.placeTaskInColumn(task.id, event.container.data, event.currentIndex);
    this.store
      .updateTask(task.id, { status })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          const activity = taskMoveActivity(status);
          this.recordActivity(activity.kind, activity.message, updated.title);
          this.setNotice(
            this.i18n.translate('notice.taskMoved', {
              status: this.i18n.translate(
                status === 'in_progress' ? 'status.inProgress' : `status.${status}`,
              ),
            }),
            'success',
          );
        },
        error: (error: unknown) => this.setNotice(this.taskError(error, 'error.move'), 'error'),
      });
  }

  /** Loads the task editor lazily and handles its submitted task draft. */
  private async openEditor(task: Task | null): Promise<void> {
    try {
      const { TaskEditorComponent } =
        await import('../../../tasks/components/task-editor/task-editor.component');
      const data: TaskEditorDialogData = { task, users: TEAM_MEMBERS };
      this.dialog
        .open<InstanceType<typeof TaskEditorComponent>, TaskEditorDialogData, TaskDraft>(
          TaskEditorComponent,
          {
            data,
            width: '560px',
            maxWidth: '95vw',
            maxHeight: '95vh',
            autoFocus: 'first-tabbable',
          },
        )
        .afterClosed()
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((draft) => {
          if (draft) this.saveTask(draft, task);
        });
    } catch (error: unknown) {
      this.setNotice(this.taskError(error, 'error.openEditor'), 'error');
    }
  }

  /** Deletes a task and reports the success or failure through activity and notifications. */
  private deleteTask(task: Task): void {
    this.store
      .deleteTask(task.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.recordActivity('deleted', TASK_ACTIVITY_MESSAGES.deleted, task.title);
          this.setNotice(this.i18n.translate('notice.taskDeleted'), 'success');
        },
        error: (error: unknown) => this.setNotice(this.taskError(error, 'error.delete'), 'error'),
      });
  }

  private taskError(error: unknown, fallback: TranslationKey): string {
    return taskErrorMessage(error, this.i18n.translate(fallback), (key) =>
      this.i18n.translate(ERROR_TRANSLATION_KEYS[key]),
    );
  }

  /** Converts the visible task IDs into their new local order after a same-column drop. */
  private reorderVisibleTasks(visibleTasks: Task[], from: number, to: number): void {
    this.taskOrder.update((order) => reorderVisibleTaskIds(order, visibleTasks, from, to));
  }

  /** Inserts a moved task next to its drop target in the local display order. */
  private placeTaskInColumn(taskId: string, destination: Task[], index: number): void {
    this.taskOrder.update((order) => placeTaskIdInOrder(order, taskId, destination, index));
  }

  /** Adds a task-related event to the bounded recent-activity feed. */
  private recordActivity(kind: TaskActivity['kind'], message: string, taskTitle: string): void {
    const activity = createTaskActivity(kind, message, taskTitle);
    this.activities.update((items) => [activity, ...items].slice(0, 8));
  }

  /** Shows a success or error snack-bar notification. */
  private setNotice(text: string, kind: DashboardNoticeKind): void {
    this.snackBar.open(text, this.i18n.translate('common.dismiss'), {
      duration: kind === 'error' ? 6000 : 3500,
    });
  }
}
