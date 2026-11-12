import {
  HttpErrorResponse,
  HttpInterceptorFn,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, defer, delay, of, throwError } from 'rxjs';
import {
  InMemoryTaskApiService,
  MockApiError,
} from '../../../features/tasks/data-access/in-memory-task-api/in-memory-task-api.service';
import { InMemoryStatisticsApiService } from '../../../features/statistics/data-access/in-memory-statistics-api/in-memory-statistics-api.service';
import { API_ENDPOINTS } from '../../../shared/constants/api.constants';
import type { ApiErrorResponse } from '../../../shared/models/api-error.model';
import { isTaskApiRequest, TASK_ITEM_ENDPOINT_PATTERN } from '../task-api-endpoints';

const RESPONSE_DELAY_MS = 180;

/** Wraps a mock payload in an HTTP response with the configured development latency. */
function response(body: unknown, status = 200): Observable<HttpResponse<unknown>> {
  return of(new HttpResponse({ status, body })).pipe(delay(RESPONSE_DELAY_MS));
}

/** Executes a backend action and converts expected mock API errors into HTTP errors. */
function handleMockRequest(action: () => unknown, status = 200): Observable<HttpResponse<unknown>> {
  return defer(() => {
    try {
      return response(action(), status);
    } catch (error: unknown) {
      if (error instanceof MockApiError) {
        return throwError(
          () =>
            new HttpErrorResponse({
              error: { message: error.message } satisfies ApiErrorResponse,
              status: error.status,
              statusText: error.status === 400 ? 'Bad Request' : 'Not Found',
            }),
        );
      }

      throw error;
    }
  });
}

/** Handles a supported task API request using the in-memory backend. */
export function handleMockApiRequest(
  request: HttpRequest<unknown>,
): Observable<HttpResponse<unknown>> | null {
  if (!isTaskApiRequest(request.url)) return null;

  const isTaskCollection = request.url === API_ENDPOINTS.tasks;
  const isStatistics = request.url === API_ENDPOINTS.statistics;
  const taskMatch = request.url.match(TASK_ITEM_ENDPOINT_PATTERN);
  if (!isTaskCollection && !isStatistics && !taskMatch) return null;

  if (isStatistics && request.method === 'GET') {
    const statisticsApi = inject(InMemoryStatisticsApiService);
    return handleMockRequest(() => statisticsApi.getStatistics());
  }

  const api = inject(InMemoryTaskApiService);
  if (isTaskCollection && request.method === 'GET') return handleMockRequest(() => api.getTasks());
  if (isTaskCollection && request.method === 'POST')
    return handleMockRequest(() => api.createTask(request.body), 201);
  if (taskMatch && request.method === 'PATCH')
    return handleMockRequest(() => api.updateTask(taskMatch[1], request.body));
  if (taskMatch && request.method === 'DELETE')
    return handleMockRequest(() => api.deleteTask(taskMatch[1]));
  return null;
}

/** Replaces supported API calls with the in-memory service. */
export const mockApiInterceptor: HttpInterceptorFn = (request, next) => {
  const response$ = handleMockApiRequest(request);
  return response$ ?? next(request);
};
