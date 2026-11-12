import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ConfirmDeleteDialogComponent } from './confirm-delete-dialog.component';

describe('ConfirmDeleteDialogComponent', () => {
  let fixture: ComponentFixture<ConfirmDeleteDialogComponent>;
  let close: jasmine.Spy;

  beforeEach(async () => {
    close = jasmine.createSpy('close');
    await TestBed.configureTestingModule({
      imports: [ConfirmDeleteDialogComponent],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: { taskTitle: 'Review release notes' } },
        { provide: MatDialogRef, useValue: { close } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmDeleteDialogComponent);
    fixture.detectChanges();
  });

  it('shows the task title and closes with confirmation when Delete is clicked', () => {
    expect(fixture.nativeElement.textContent).toContain('Review release notes');

    const deleteButton = Array.from(
      fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>,
    ).find((button) => button.textContent?.includes('Delete task'));
    expect(deleteButton).toBeTruthy();

    deleteButton?.click();

    expect(close).toHaveBeenCalledOnceWith(true);
  });
});
