import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter, Router } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { DashboardPageComponent } from './features/dashboard/pages/dashboard-page/dashboard-page.component';
import { routes } from './app.routes';
import { mockApiInterceptor } from './core/interceptors/mock-api-interceptor/mock-api.interceptor';
import { taskApiInterceptor } from './core/interceptors/task-api-interceptor/task-api.interceptor';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent, DashboardPageComponent],
      providers: [
        provideRouter(routes),
        provideHttpClient(withInterceptors([taskApiInterceptor, mockApiInterceptor])),
      ],
    }).compileComponents();
  });

  it('creates the dashboard', () => {
    const fixture = TestBed.createComponent(AppComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('loads the dashboard page through its lazy route', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    const router = TestBed.inject(Router);
    fixture.detectChanges();

    await router.navigateByUrl('/');
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('app-dashboard-page')).toBeTruthy();
  });

  it('renders the dashboard navigation, task board, and summary', () => {
    const fixture = TestBed.createComponent(DashboardPageComponent);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.topbar-brand')?.textContent).toContain(
      'Task Management Dashboard',
    );
    expect(compiled.querySelector('.primary-nav')?.textContent).toContain('Dashboard');
    expect(compiled.querySelector('.primary-nav')?.textContent).toContain('Analytics');
    expect(compiled.querySelector('.primary-nav')?.textContent).not.toContain('Calendar');
    expect(compiled.querySelector('.primary-nav')?.textContent).toContain('Settings');
    expect(compiled.querySelector('.summary-grid')).toBeTruthy();
    expect(compiled.querySelectorAll('.board-column').length).toBe(0);
    expect(compiled.querySelector('app-dashboard-insights')).toBeNull();
  });

  it('connects routed views and search controls to dashboard state', async () => {
    const router = TestBed.inject(Router);
    const fixture = TestBed.createComponent(DashboardPageComponent);
    fixture.detectChanges();

    const navigateToView = async (href: string): Promise<void> => {
      const link = fixture.nativeElement.querySelector(
        `.primary-nav a[href$="${href}"]`,
      ) as HTMLAnchorElement | null;
      expect(link).withContext(`Expected a sidebar link to ${href}`).not.toBeNull();
      await router.navigateByUrl(href);
      fixture.detectChanges();
    };

    const search = fixture.nativeElement.querySelector(
      'input[aria-label="Search tasks"]',
    ) as HTMLInputElement;
    search.value = 'campaign';
    search.dispatchEvent(new Event('input'));
    expect(fixture.componentInstance.query()).toBe('campaign');

    await navigateToView('/tasks');
    expect(router.url).toBe('/tasks');
    expect(fixture.componentInstance.view()).toBe('my-tasks');
    expect(fixture.nativeElement.querySelector('.primary-nav a.active')?.textContent).toContain(
      'Tasks',
    );
    expect(fixture.nativeElement.querySelector('.summary-grid')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('app-dashboard-insights')).toBeNull();

    await navigateToView('/analytics');
    expect(router.url).toBe('/analytics');
    expect(fixture.componentInstance.view()).toBe('analytics');
    expect(fixture.nativeElement.querySelector('.primary-nav a.active')?.textContent).toContain(
      'Analytics',
    );
    expect(fixture.nativeElement.querySelector('.summary-grid')).toBeNull();
    expect(fixture.nativeElement.querySelector('app-dashboard-insights')).toBeTruthy();

    await navigateToView('/tasks');
    expect(fixture.componentInstance.view()).toBe('my-tasks');
    expect(fixture.nativeElement.querySelector('app-dashboard-insights')).toBeNull();

    await navigateToView('/analytics');
    await fixture.whenStable();
    fixture.detectChanges();
    const teamButton = Array.from(
      fixture.nativeElement.querySelectorAll(
        '.primary-nav > button',
      ) as NodeListOf<HTMLButtonElement>,
    ).find((button) => button.textContent?.includes('Team'));
    teamButton?.click();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(router.url).toBe('/team/u1');
    expect(fixture.componentInstance.view()).toBe('dashboard');
    expect(fixture.componentInstance.assigneeFilter()).toBe('u1');
    expect(fixture.componentInstance.teamExpanded()).toBeTrue();
    expect(fixture.nativeElement.querySelectorAll('.primary-nav a.active').length).toBe(0);
    expect(fixture.nativeElement.querySelector('.primary-nav > button.active')).toBeTruthy();

    const navigateLegacyCalendar = router.navigateByUrl('/calendar');
    fixture.detectChanges();
    await expectAsync(navigateLegacyCalendar).toBeResolved();
    fixture.detectChanges();
    expect(router.url).toBe('/dashboard');
    expect(fixture.nativeElement.querySelectorAll('.primary-nav > a').length).toBe(3);
    expect(fixture.nativeElement.querySelector('.primary-nav a[href="/calendar"]')).toBeNull();
  });
});
