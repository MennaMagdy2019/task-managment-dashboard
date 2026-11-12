import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardInsightsComponent } from './dashboard-insights.component';

describe('DashboardInsightsComponent', () => {
  let fixture: ComponentFixture<DashboardInsightsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardInsightsComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(DashboardInsightsComponent);
    fixture.detectChanges();
  });

  it('renders analytics as a dedicated view', () => {
    expect(fixture.nativeElement.querySelector('#analytics-title')?.textContent).toContain(
      'Analytics',
    );
    expect(fixture.nativeElement.querySelector('app-task-analytics')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('mat-expansion-panel')).toBeNull();
  });
});
