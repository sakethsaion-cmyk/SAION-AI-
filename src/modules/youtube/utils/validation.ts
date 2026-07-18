const VIDEO_ID_RE = /^[a-zA-Z0-9_-]{11}$/;

/** Returns true when `id` is a valid 11-character YouTube video ID. */
export function isValidVideoId(id: string): boolean {
  return VIDEO_ID_RE.test(id);
}

/** Returns true when `query` is a non-empty, non-whitespace-only search string. */
export function isValidSearchQuery(query: string): boolean {
  return query.trim().length >= 2;
}
