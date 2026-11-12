import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import type { ConfirmDeleteDialogData } from '../../models/confirm-delete-dialog.model';

@Component({
  selector: 'app-confirm-delete-dialog',
  standalone: true,
  imports: [MatButtonModule, MatDialogModule],
  templateUrl: './confirm-delete-dialog.component.html',
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
