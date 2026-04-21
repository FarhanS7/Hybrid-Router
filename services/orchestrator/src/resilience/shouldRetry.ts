import { ErrorType } from "@har/shared";

const TRANSIENT_ERRORS: ErrorType[] = [
  "TIMEOUT",
  "RATE_LIMIT",
  "PROVIDER_DOWN",
  "NETWORK_ERROR",
];

const MAX_RETRIES = 1;

/**
 * Determines if a request should be retried based on error type and count.
 */
export function shouldRetry(errorType: ErrorType, retryCount: number): boolean {
  if (retryCount >= MAX_RETRIES) {
    return false;
  }

  return TRANSIENT_ERRORS.includes(errorType);
}
