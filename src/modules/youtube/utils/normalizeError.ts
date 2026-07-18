/**
 * Extracts a human-readable message from any thrown value.
 * Covers Error objects, API error shapes, and unknown primitives.
 */
export function normalizeError(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (
    err &&
    typeof err === 'object' &&
    'message' in err &&
    typeof (err as { message: unknown }).message === 'string'
  ) {
    return (err as { message: string }).message;
  }
  if (typeof err === 'string') return err;
  return 'An unexpected error occurred. Please try again.';
}
