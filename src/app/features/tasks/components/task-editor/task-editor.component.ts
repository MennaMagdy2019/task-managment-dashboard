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
import {
  Assignee,
  Task,
  TaskDraft,
  TaskPriority,
  TaskStatus,
} from '../../../../shared/models/task.model';

interface TaskEditorData {
  task: Task | null;
  users: Assignee[];
}

/** Rejects string values that contain only whitespace. */
const nonWhitespace: ValidatorFn = (control) =>
  typeof control.value === 'string' && !control.value.trim() ? { whitespace: true } : null;

@Component({
  selector: 'app-task-editor',
  standalone: true,
  imports: [
    MatDialogModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    TitleCasePipe,
  ],
  templateUrl: '../assets/task-editor.component.html',
  styleUrl: '../assets/task-editor.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskEditorComponent {
  readonly data = inject<TaskEditorData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<TaskEditorComponent, TaskDraft>);
  readonly task = this.data.task;
  readonly users = this.data.users;

  readonly priorities: TaskPriority[] = ['low', 'medium', 'high'];
  readonly statuses: TaskStatus[] = ['todo', 'in_progress', 'done'];
  readonly tags = new FormArray<FormControl<string>>([]);
  readonly form = new FormGroup({
    title: new FormControl('', {
      nonNullable: true,
      validators: [nonWhitespace, Validators.maxLength(80)],
    }),
    description: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(240)],
    }),
    priority: new FormControl<TaskPriority>('medium', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    status: new FormControl<TaskStatus>('todo', {
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
        new FormControl(tag, { nonNullable: true, validators: [Validators.maxLength(24)] }),
        { emitEvent: false },
      );
    }
    this.form.reset({
      title: this.task?.title ?? '',
      description: this.task?.description ?? '',
      priority: this.task?.priority ?? 'medium',
      status: this.task?.status ?? 'todo',
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
        .slice(0, 4),
    });
  }

  /** Adds an empty tag control while respecting the maximum number of tags. */
  addTag(): void {
    if (this.tags.length < 4) {
      this.tags.push(
        new FormControl('', { nonNullable: true, validators: [Validators.maxLength(24)] }),
      );
    }
  }

  /** Removes a tag control when at least one editable tag field remains. */
  removeTag(index: number): void {
    if (this.tags.length > 1) this.tags.removeAt(index);
  }

  /** Returns the display label for a task status. */
  statusLabel(status: TaskStatus): string {
    return status === 'todo' ? 'To do' : status === 'in_progress' ? 'In progress' : 'Done';
  }
}
