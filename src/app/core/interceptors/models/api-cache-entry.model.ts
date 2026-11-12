import type { HttpEvent } from '@angular/common/http';
import type { Observable } from 'rxjs';

/** Cached HTTP event stream and its expiration timestamp. */
export interface ApiCacheEntry {
  response$: Observable<HttpEvent<unknown>>;
  expiresAt: number | null;
}
