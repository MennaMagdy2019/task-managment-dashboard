import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { cacheGetResponse, resetApiCache } from './api-cache.interceptor';

describe('task API response cache', () => {
  let http: HttpClient;
  let testing: HttpTestingController;

  beforeEach(() => {
    resetApiCache();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([(request, next) => cacheGetResponse(request, next)])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    testing = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    testing.verify();
    resetApiCache();
  });

  it('caches successful reads and shares concurrent requests', () => {
    const first = jasmine.createSpy('first');
    const second = jasmine.createSpy('second');
    http.get('/api/tasks').subscribe(first);
    http.get('/api/tasks').subscribe(second);
    testing.expectOne('/api/tasks').flush([{ id: 't1' }]);

    expect(first).toHaveBeenCalledOnceWith([{ id: 't1' }]);
    expect(second).toHaveBeenCalledOnceWith([{ id: 't1' }]);
    http.get('/api/tasks').subscribe(second);
    expect(second).toHaveBeenCalledTimes(2);
    testing.expectNone('/api/tasks');
  });

  it('clones cached response bodies before returning them to callers', () => {
    http.get<{ id: string }[]>('/api/tasks').subscribe((tasks) => (tasks[0].id = 'changed'));
    testing.expectOne('/api/tasks').flush([{ id: 'original' }]);

    const response = jasmine.createSpy('response');
    http.get('/api/tasks').subscribe(response);
    expect(response).toHaveBeenCalledOnceWith([{ id: 'original' }]);
  });

  it('expires responses after one minute', () => {
    jasmine.clock().install();
    try {
      const response = jasmine.createSpy('response');
      http.get('/api/tasks').subscribe(response);
      testing.expectOne('/api/tasks').flush([]);
      expect(response).toHaveBeenCalledOnceWith([]);

      jasmine.clock().mockDate(new Date(Date.now() + 60_001));
      http.get('/api/tasks').subscribe(response);
      testing.expectOne('/api/tasks').flush([]);
      expect(response).toHaveBeenCalledTimes(2);
    } finally {
      jasmine.clock().uninstall();
    }
  });
});
