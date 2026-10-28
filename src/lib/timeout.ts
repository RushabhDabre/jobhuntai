/**
 * Utility for robust timeouts across asynchronous operations, SDK calls, and fetch requests.
 * Prevents requests from hanging indefinitely.
 */

export class TimeoutError extends Error {
  constructor(message = 'Operation timed out') {
    super(message);
    this.name = 'TimeoutError';
  }
}

/**
 * Wraps any Promise in a strict timeout.
 * Cleans up the timer on fulfillment or rejection to avoid leaking event loop handles.
 */
export function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  timeoutErrorMessage = `Operation timed out after ${ms}ms`
): Promise<T> {
  let timer: NodeJS.Timeout | null = null;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new TimeoutError(timeoutErrorMessage));
    }, ms);
  });

  return Promise.race([
    promise.then(
      (result) => {
        if (timer) clearTimeout(timer);
        return result;
      },
      (error) => {
        if (timer) clearTimeout(timer);
        throw error;
      }
    ),
    timeoutPromise,
  ]);
}

/**
 * Standard fetch with an explicit timeout.
 */
export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init?: RequestInit & { timeoutMs?: number }
): Promise<Response> {
  const timeoutMs = init?.timeoutMs ?? 10000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(input, {
      ...init,
      signal: controller.signal,
    });
    return res;
  } finally {
    clearTimeout(timer);
  }
}
