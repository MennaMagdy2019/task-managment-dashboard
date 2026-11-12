import { HttpEvent, HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { Observable, retry, tap, throwError, timer } from 'rxjs';
import { cacheGetResponse, resetApiCache } from '../api-cache-interceptor/api-cache.interceptor';
import { isTransientFailure, MAX_READ_RETRIES, retryDelay } from '../api-retry.policy';
import { isTaskApiRequest } from '../task-api-endpoints';

/**
 * Applies caching, retry, and cache-invalidation policies to task API requests.
 *
 * Requests outside the task API are passed to the next HTTP handler unchanged.
 * Task API GET requests go through the response cache. On a cache miss, the
 * request continues through downstream handlers. The resulting read stream
 * gets bounded retries for transient failures before it is stored by the cache.
 *
 * Non-GET requests continue downstream without retries. A successful 2xx
 * response clears cached API data so a later GET sees the latest state.
 *
 * @param request The outgoing Angular HTTP request.
 * @param next The next handler in the HTTP chain.
 * @returns A stream of HTTP events from the cache or a downstream handler.
 */
export const taskApiInterceptor: HttpInterceptorFn = (request, next) => {
  if (!isTaskApiRequest(request.url)) return next(request);

  if (request.method !== 'GET') {
    return next(request).pipe(
      tap((event) => {
        // Only successful HTTP responses can make the cached read data stale.
        if (event instanceof HttpResponse && event.status >= 200 && event.status < 300)
          resetApiCache();
      }),
    );
  }

  return cacheGetResponse(request, (cachedRequest) => {
    return withReadRetry(next(cachedRequest));
  });
};

/**
 * Retries a read stream only when its error appears temporary.
 *
 * The retry policy allows at most {@link MAX_READ_RETRIES} additional
 * subscriptions. Transient errors (network failures and HTTP 5xx responses)
 * wait according to {@link retryDelay}; all other errors are rethrown
 * immediately. Once retries are exhausted, the last error reaches the caller.
 *
 * This helper is called only from the GET path above, so mutations are never
 * replayed.
 *
 * @param response$ The HTTP event stream for a task API read.
 * @returns The original stream with bounded retries for transient failures.
 */
function withReadRetry(response$: Observable<HttpEvent<unknown>>): Observable<HttpEvent<unknown>> {
  return response$.pipe(
    retry({
      count: MAX_READ_RETRIES,
      delay: (error: unknown, retryCount) =>
        isTransientFailure(error) ? timer(retryDelay(retryCount)) : throwError(() => error),
    }),
  );
}
