import { ApiResponse } from '../types/youtube.types';

const BASE_URL = (import.meta.env.VITE_BACKEND_URL as string | undefined) ?? 'http://localhost:5000';

/** Module-level sequence counter for generating correlation IDs */
let _seq = 0;

function nextRequestId(): string {
  return `fe-${Date.now()}-${++_seq}`;
}

/** Returns true for any abort-related error regardless of which API threw it */
export function isAbortError(err: unknown): boolean {
  if (err instanceof DOMException && err.name === 'AbortError') return true;
  if (err instanceof Error && err.name === 'AbortError') return true;
  if (err && typeof err === 'object' && (err as { code?: string }).code === 'ABORTED') return true;
  return false;
}

/**
 * Typed fetch wrapper.
 *
 * - Injects a correlation X-Request-Id header on every outbound request
 * - Automatically times out after `timeoutMs` milliseconds (default 15 s)
 * - Combines caller-supplied AbortSignal with the internal timeout signal
 * - Throws a structured AbortError on cancellation so callers can detect it
 *   with `isAbortError(err)` regardless of which signal fired
 * - Returns the typed `ApiResponse<T>` union — callers check `response.success`
 */
export async function apiFetch<T>(
  path: string,
  options?: { signal?: AbortSignal; timeoutMs?: number }
): Promise<ApiResponse<T>> {
  const requestId = nextRequestId();
  const timeoutMs = options?.timeoutMs ?? 15_000;

  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => timeoutController.abort(), timeoutMs);

  const signal = options?.signal
    ? combineSignals(options.signal, timeoutController.signal)
    : timeoutController.signal;

  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        'X-Request-Id': requestId,
      },
      signal,
    });

    const json = (await response.json()) as ApiResponse<T>;
    return json;
  } catch (err) {
    // Normalise all abort/timeout errors to a consistent AbortError shape
    if (isAbortError(err) || (err instanceof DOMException)) {
      const abortErr = new DOMException('Request was cancelled', 'AbortError');
      Object.assign(abortErr, { code: 'ABORTED', requestId });
      throw abortErr;
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Combines two AbortSignals so that aborting either one aborts the request.
 * This is needed until `AbortSignal.any()` has broader browser support.
 */
function combineSignals(a: AbortSignal, b: AbortSignal): AbortSignal {
  const controller = new AbortController();
  const abort = (): void => controller.abort();

  if (a.aborted || b.aborted) {
    controller.abort();
    return controller.signal;
  }

  a.addEventListener('abort', abort, { once: true });
  b.addEventListener('abort', abort, { once: true });

  // Clean up listeners once either fires to prevent memory leak
  controller.signal.addEventListener('abort', () => {
    a.removeEventListener('abort', abort);
    b.removeEventListener('abort', abort);
  }, { once: true });

  return controller.signal;
}
