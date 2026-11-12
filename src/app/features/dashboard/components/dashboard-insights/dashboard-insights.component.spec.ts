import { ComponentFixture, TestBed } from '@angular/core/testing';
import { I18nService } from '../../../../shared/i18n/i18n.service';
import { DashboardInsightsComponent } from './dashboard-insights.component';

describe('DashboardInsightsComponent', () => {
  let fixture: ComponentFixture<DashboardInsightsComponent>;

  beforeEach(async () => {
    localStorage.removeItem('taskflow.language');
    await TestBed.configureTestingModule({
      imports: [DashboardInsightsComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(DashboardInsightsComponent);
    fixture.detectChanges();
  });

  afterEach(() => {
    TestBed.inject(I18nService).setLanguage('en');
    localStorage.removeItem('taskflow.language');
  });

  it('renders analytics as a dedicated view', () => {
    expect(fixture.nativeElement.querySelector('#analytics-title')?.textContent).toContain(
      'Analytics',
    );
    expect(fixture.nativeElement.querySelector('.insights-content')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('mat-expansion-panel')).toBeNull();
  });

  it('updates analytics labels when switching to German', () => {
    TestBed.inject(I18nService).setLanguage('de');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('#analytics-title')?.textContent).toContain(
      'Analysen',
    );
    expect(document.documentElement.lang).toBe('de');
  });
});
