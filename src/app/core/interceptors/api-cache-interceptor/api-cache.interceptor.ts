import { HttpEvent, HttpHandlerFn, HttpRequest, HttpResponse } from '@angular/common/http';
import { Observable, catchError, map, shareReplay, tap, throwError } from 'rxjs';

const CACHE_DURATION_MS = 60_000;

interface CacheEntry {
  response$: Observable<HttpEvent<unknown>>;
  expiresAt: number | null;
}

const cache = new Map<string, CacheEntry>();
let cacheEpoch = 0;

/** Clears cached API responses and prevents older in-flight reads from repopulating them. */
export function resetApiCache(): void {
  cacheEpoch += 1;
  cache.clear();
}

/** Shares, clones, expires, and stores a GET result, including concurrent reads. */
export function cacheGetResponse(
  request: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> {
  const key = request.urlWithParams;
  const cached = cache.get(key);
  if (cached && (cached.expiresAt === null || cached.expiresAt > Date.now())) {
    return cached.response$.pipe(map(cloneEvent));
  }

  if (cached) cache.delete(key);
  const requestEpoch = cacheEpoch;
  // The observable closes over this entry before its single assignment below.
  // eslint-disable-next-line prefer-const
  let entry: CacheEntry;
  const response$ = next(request).pipe(
    tap((event) => {
      if (event instanceof HttpResponse) {
        if (event.status >= 200 && event.status < 300 && requestEpoch === cacheEpoch) {
          entry.expiresAt = Date.now() + CACHE_DURATION_MS;
        } else if (cache.get(key) === entry) {
          cache.delete(key);
        }
      }
    }),
    catchError((error: unknown) => {
      if (cache.get(key) === entry) cache.delete(key);
      return throwError(() => error);
    }),
    shareReplay({ bufferSize: 1, refCount: false }),
  );
  entry = { response$, expiresAt: null };
  cache.set(key, entry);
  return response$.pipe(map(cloneEvent));
}

/** Returns a detached response body so callers cannot mutate the cached value. */
function cloneEvent<T>(event: HttpEvent<T>): HttpEvent<T> {
  if (!(event instanceof HttpResponse)) return event;
  const body = event.body === null ? null : structuredClone(event.body);
  return event.clone({ body });
}
