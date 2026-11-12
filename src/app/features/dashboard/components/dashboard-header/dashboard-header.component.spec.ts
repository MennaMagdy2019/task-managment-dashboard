import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { I18nService } from '../../../../shared/i18n/i18n.service';
import { DashboardHeaderComponent } from './dashboard-header.component';

describe('DashboardHeaderComponent', () => {
  let fixture: ComponentFixture<DashboardHeaderComponent>;
  let i18n: I18nService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardHeaderComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardHeaderComponent);
    i18n = TestBed.inject(I18nService);
    i18n.language.set('en');
    fixture.detectChanges();
  });

  afterEach(() => {
    i18n.setLanguage('en');
  });

  it('shows a localized hover tooltip for the language switch', () => {
    const languageSwitch = fixture.nativeElement.querySelector(
      '.language-switch',
    ) as HTMLButtonElement;

    expect(languageSwitch.title).toBe('EN. Switch to German');

    languageSwitch.click();
    fixture.detectChanges();

    expect(languageSwitch.title).toBe('DE. Zu Englisch wechseln');
  });
});
