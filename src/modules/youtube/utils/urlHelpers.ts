/**
 * Builds a privacy-enhanced YouTube embed URL.
 * Uses youtube-nocookie.com to minimize tracking.
 *
 * @param videoId   11-character YouTube video ID
 * @param autoplay  Whether to start playing immediately (default: true)
 */
export function buildEmbedUrl(videoId: string, autoplay = true): string {
  const params = new URLSearchParams({
    autoplay: autoplay ? '1' : '0',
    rel: '0',          // Don't show related videos from other channels
    modestbranding: '1',
    enablejsapi: '1',
    origin: window.location.origin,
  });
  return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;
}

/**
 * Extracts a YouTube video ID from a standard watch URL or short URL.
 * Returns null if the URL is not a recognisable YouTube URL.
 *
 * Supports:
 *   https://www.youtube.com/watch?v=<id>
 *   https://youtu.be/<id>
 *   https://www.youtube.com/embed/<id>
 */
export function extractVideoId(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (
      parsed.hostname === 'www.youtube.com' ||
      parsed.hostname === 'youtube.com'
    ) {
      if (parsed.pathname === '/watch') return parsed.searchParams.get('v');
      const embedMatch = parsed.pathname.match(/^\/embed\/([a-zA-Z0-9_-]{11})/);
      if (embedMatch) return embedMatch[1] ?? null;
    }
    if (parsed.hostname === 'youtu.be') {
      return parsed.pathname.slice(1).slice(0, 11) || null;
    }
  } catch {
    // Not a valid URL
  }
  return null;
}
