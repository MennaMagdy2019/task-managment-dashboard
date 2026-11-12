import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { mockApiInterceptor } from '../mock-api-interceptor/mock-api.interceptor';
import { taskApiInterceptor } from './task-api.interceptor';

describe('taskApiInterceptor', () => {
  let http: HttpClient;
  let testing: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([taskApiInterceptor, mockApiInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    testing = TestBed.inject(HttpTestingController);
  });

  afterEach(() => testing.verify());

  it('retries transient GET failures with bounded backoff', fakeAsync(() => {
    const response = jasmine.createSpy('response');
    http.get('/api/tasks/retry-test').subscribe(response);
    testing
      .expectOne('/api/tasks/retry-test')
      .flush(null, { status: 503, statusText: 'Service Unavailable' });
    tick(250);
    testing
      .expectOne('/api/tasks/retry-test')
      .flush(null, { status: 503, statusText: 'Service Unavailable' });
    tick(500);
    testing.expectOne('/api/tasks/retry-test').flush([{ id: 'task-1' }]);
    expect(response).toHaveBeenCalledOnceWith([{ id: 'task-1' }]);
  }));

  it('does not retry client errors or mutations', fakeAsync(() => {
    const readError = jasmine.createSpy('readError');
    http.get('/api/tasks/client-error-test').subscribe({ error: readError });
    testing
      .expectOne('/api/tasks/client-error-test')
      .flush(null, { status: 404, statusText: 'Not Found' });
    expect(readError).toHaveBeenCalled();

    const writeError = jasmine.createSpy('writeError');
    http.post('/api/tasks', { title: '' }).subscribe({ error: writeError });
    tick(180);
    expect(writeError).toHaveBeenCalled();
  }));

  it('uses the in-memory backend for supported task API requests', fakeAsync(() => {
    let response: unknown;
    http.get('/api/tasks').subscribe((value) => (response = value));
    tick(180);
    expect(Array.isArray(response)).toBeTrue();
    testing.expectNone('/api/tasks');
  }));
});
