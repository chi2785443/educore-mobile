/**
 * Errors thrown by `apiClient`. Both extend Error, so `err.message` handling
 * everywhere keeps working; the subclasses only add what callers need to
 * decide whether to retry.
 */

/** The server answered with an error status. Retrying the same request will not help (except 5xx). */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** No response at all: offline, DNS failure or timeout. Safe to retry later. */
export class NetworkError extends Error {
  constructor(message = "You're offline. Check your connection and try again.") {
    super(message);
    this.name = 'NetworkError';
  }
}

/** True when a retry later could succeed: no connection, or the server itself failed. */
export function isRetryableError(err: unknown): boolean {
  if (err instanceof NetworkError) return true;
  return err instanceof ApiError && err.status >= 500;
}
