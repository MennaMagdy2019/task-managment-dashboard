import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import {
  FormArray,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { TitleCasePipe } from '@angular/common';
import type { TaskDraft, TaskPriority, TaskStatus } from '../../../../shared/models/task.model';
import {
  MAX_TASK_TAGS,
  TASK_PRIORITY,
  TASK_FIELD_LIMITS,
  TASK_STATUS,
  TASK_PRIORITY_OPTIONS,
  TASK_STATUS_LABELS,
  TASK_STATUS_OPTIONS,
} from '../../../../shared/constants/task.constants';
import type { TaskEditorDialogData } from '../../models/task-editor.model';

/** Rejects string values that contain only whitespace. */
const nonWhitespace: ValidatorFn = (control) =>
  typeof control.value === 'string' && !control.value.trim() ? { whitespace: true } : null;

@Component({
  selector: 'app-task-editor',
  standalone: true,
  host: { class: 'block text-[#202b3c]' },
  imports: [
    MatDialogModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    TitleCasePipe,
  ],
  templateUrl: './task-editor.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskEditorComponent {
  readonly data = inject<TaskEditorDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<TaskEditorComponent, TaskDraft>);
  readonly task = this.data.task;
  readonly users = this.data.users;

  readonly priorities = TASK_PRIORITY_OPTIONS;
  readonly statuses = TASK_STATUS_OPTIONS;
  readonly fieldLimits = TASK_FIELD_LIMITS;
  readonly maxTaskTags = MAX_TASK_TAGS;
  readonly tags = new FormArray<FormControl<string>>([]);
  readonly form = new FormGroup({
    title: new FormControl('', {
      nonNullable: true,
      validators: [nonWhitespace, Validators.maxLength(TASK_FIELD_LIMITS.title)],
    }),
    description: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(TASK_FIELD_LIMITS.description)],
    }),
    priority: new FormControl<TaskPriority>(TASK_PRIORITY.medium, {
      nonNullable: true,
      validators: [Validators.required],
    }),
    status: new FormControl<TaskStatus>(TASK_STATUS.todo, {
      nonNullable: true,
      validators: [Validators.required],
    }),
    dueDate: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    assigneeId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    tags: this.tags,
  });

  /** Initializes form controls from the task being edited or create-mode defaults. */
  constructor() {
    for (const tag of this.task?.tags.length ? this.task.tags : ['']) {
      this.tags.push(
        new FormControl(tag, {
          nonNullable: true,
          validators: [Validators.maxLength(TASK_FIELD_LIMITS.tag)],
        }),
        { emitEvent: false },
      );
    }
    this.form.reset({
      title: this.task?.title ?? '',
      description: this.task?.description ?? '',
      priority: this.task?.priority ?? TASK_PRIORITY.medium,
      status: this.task?.status ?? TASK_STATUS.todo,
      dueDate: this.task?.dueDate ?? new Date().toISOString().slice(0, 10),
      assigneeId: this.task?.assignee.id ?? this.users[0]?.id ?? '',
    });
  }

  /** Validates the form and closes the dialog with a normalized task draft. */
  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const value = this.form.getRawValue();
    const assignee = this.users.find((user) => user.id === value.assigneeId);
    if (!assignee) {
      this.form.controls.assigneeId.setErrors({ unavailable: true });
      return;
    }

    this.dialogRef.close({
      title: value.title.trim(),
      description: value.description.trim(),
      priority: value.priority,
      status: value.status,
      dueDate: value.dueDate,
      assignee,
      tags: this.tags
        .getRawValue()
        .map((tag) => tag.trim())
        .filter(Boolean)
        .slice(0, MAX_TASK_TAGS),
    });
  }

  /** Adds an empty tag control while respecting the maximum number of tags. */
  addTag(): void {
    if (this.tags.length < MAX_TASK_TAGS) {
      this.tags.push(
        new FormControl('', {
          nonNullable: true,
          validators: [Validators.maxLength(TASK_FIELD_LIMITS.tag)],
        }),
      );
    }
  }

  /** Removes a tag control when at least one editable tag field remains. */
  removeTag(index: number): void {
    if (this.tags.length > 1) this.tags.removeAt(index);
  }

  /** Returns the display label for a task status. */
  statusLabel(status: TaskStatus): string {
    return TASK_STATUS_LABELS[status];
  }
}
