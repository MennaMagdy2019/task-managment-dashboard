import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

interface ConfirmDeleteDialogData {
  taskTitle: string;
}

@Component({
  selector: 'app-confirm-delete-dialog',
  standalone: true,
  imports: [MatButtonModule, MatDialogModule],
  template: `
    <h2 mat-dialog-title>Delete this task?</h2>
    <mat-dialog-content>
      “{{ data.taskTitle }}” will be permanently removed from your task board.
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" mat-dialog-close>Cancel</button>
      <button mat-flat-button type="button" color="warn" (click)="confirm()">Delete task</button>
    </mat-dialog-actions>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmDeleteDialogComponent {
  readonly data = inject<ConfirmDeleteDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<ConfirmDeleteDialogComponent, boolean>);

  /** Closes the dialog with confirmation so the caller can delete the task. */
  confirm(): void {
    this.dialogRef.close(true);
  }
}
