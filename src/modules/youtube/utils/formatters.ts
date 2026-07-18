/**
 * Frontend formatter utilities.
 * Mirrors the backend formatters — kept separate to avoid a server/client
 * bundle coupling.
 */

export function formatPublishDate(isoDate: string, locale = 'en-US'): string {
  if (!isoDate) return '';
  try {
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(isoDate));
  } catch {
    return isoDate;
  }
}

export function truncate(str: string, maxLength: number): string {
  if (!str || str.length <= maxLength) return str;
  return `${str.slice(0, maxLength - 1)}\u2026`;
}
