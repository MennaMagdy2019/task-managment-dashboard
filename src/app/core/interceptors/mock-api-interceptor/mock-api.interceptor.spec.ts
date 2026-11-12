import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { mockApiInterceptor } from './mock-api.interceptor';

describe('mock task API adapter', () => {
  let http: HttpClient;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withInterceptors([mockApiInterceptor]))],
    });
    http = TestBed.inject(HttpClient);
  });

  it('adapts supported reads into delayed HTTP responses', async () => {
    const response = await firstValueFrom(http.get('/api/tasks', { observe: 'response' }));
    expect(response.status).toBe(200);
  });

  it('serves statistics from the statistics feature API', async () => {
    const response = await firstValueFrom(http.get<{ statistics: unknown[] }>('/api/statistics'));
    expect(response.statistics.length).toBeGreaterThan(0);
  });

  it('converts mock API validation errors to HTTP errors', async () => {
    await expectAsync(firstValueFrom(http.post('/api/tasks', { title: '' }))).toBeRejectedWith(
      jasmine.objectContaining({ status: 400, error: { message: 'Invalid task details.' } }),
    );
  });

  it('preserves task not-found errors', async () => {
    await expectAsync(firstValueFrom(http.delete('/api/tasks/missing-task'))).toBeRejectedWith(
      jasmine.objectContaining({ status: 404 }),
    );
  });

  it('passes unrelated requests to the next HTTP handler', async () => {
    await expectAsync(firstValueFrom(http.get('/assets/tasks'))).toBeRejected();
  });
});
