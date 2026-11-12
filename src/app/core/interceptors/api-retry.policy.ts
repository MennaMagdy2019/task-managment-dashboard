import { HttpErrorResponse } from '@angular/common/http';

/** Returns whether an API error is temporary enough to retry. */
export function isTransientFailure(error: unknown): boolean {
  return error instanceof HttpErrorResponse && (error.status === 0 || error.status >= 500);
}

/** Maximum retry count for idempotent API reads. */
export const MAX_READ_RETRIES = 2;

/** Uses a linear 250 ms delay for each retry attempt. */
export function retryDelay(retryCount: number): number {
  return retryCount * 250;
}
