// ─── SAION AI — Media Backend Client ─────────────────────────────────────────
// This file is NEW. It does NOT modify mediaService.ts.
// It adds backend-powered Spotify search and YouTube search URL generation.
//
// Usage in ChatContext / ChatWindow:
//   import { detectMediaIntent, fetchSpotifyFromBackend, buildYouTubeResult } from './mediaBackend'
// ─────────────────────────────────────────────────────────────────────────────

// ── Config ────────────────────────────────────────────────────────────────────
// Change this to your deployed backend URL in production.
const BACKEND_URL = import.meta.env.VITE_MEDIA_BACKEND_URL || 'http://localhost:5000';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SpotifyMediaResult {
  type: 'spotify';
  trackId: string | null;
  title: string;
  artist: string;
  album: string;
  albumArt: string;
  embedUrl: string;   // Always valid — real track embed or search fallback
  openUrl: string;
  fallback: boolean;
}

export interface YouTubeMediaResult {
  type: 'youtube';
  mode: 'search';          // We use search URL — no API key needed, always works
  query: string;
  searchUrl: string;       // https://www.youtube.com/results?search_query=...
  title: string;
}

export type MediaResult = SpotifyMediaResult | YouTubeMediaResult;

// ── Intent Detection ──────────────────────────────────────────────────────────
// Call this BEFORE asking AI — intercept media requests at source.

export function detectMediaIntent(userMessage: string): {
  isMedia: boolean;
  mediaType: 'spotify' | 'youtube' | null;
  query: string;
} {
  const lower = userMessage.toLowerCase().trim();

  // ── Spotify / music intent ─────────────────────────────────────────────────
  const isMusicIntent =
    lower.includes('spotify') ||
    (lower.includes('play') && (
      lower.includes('song') ||
      lower.includes('music') ||
      lower.includes('track') ||
      lower.includes('album') ||
      lower.includes('artist') ||
      lower.includes('audio')
    ));

  if (isMusicIntent) {
    const query = userMessage
      .replace(/play|on spotify|spotify|song|music|track|the song|a song|album|artist|audio/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
    return { isMedia: true, mediaType: 'spotify', query: query || userMessage };
  }

  // ── YouTube / video intent ─────────────────────────────────────────────────
  const isVideoIntent =
    lower.includes('youtube') ||
    (lower.includes('play') && (
      lower.includes('video') ||
      lower.includes('watch') ||
      lower.includes('clip') ||
      lower.includes('episode') ||
      lower.includes('movie') ||
      lower.includes('trailer') ||
      lower.includes('fight') ||
      lower.includes('scene')
    )) ||
    (lower.includes('watch') && (
      lower.includes('video') ||
      lower.includes('on youtube') ||
      lower.includes('episode')
    ));

  if (isVideoIntent) {
    const query = userMessage
      .replace(/play|watch|on youtube|youtube|video|clip|episode|trailer/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
    return { isMedia: true, mediaType: 'youtube', query: query || userMessage };
  }

  return { isMedia: false, mediaType: null, query: '' };
}

// ── Spotify — fetch via backend (keeps Client Secret secure) ─────────────────
export async function fetchSpotifyFromBackend(query: string): Promise<SpotifyMediaResult> {
  try {
    const url = `${BACKEND_URL}/spotify?q=${encodeURIComponent(query)}`;
    const res = await fetch(url, {
      signal: AbortSignal.timeout(10_000),
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) throw new Error(`Backend returned ${res.status}`);

    const data = await res.json();

    return {
      type: 'spotify',
      trackId: data.trackId || null,
      title: data.title || query,
      artist: data.artist || '',
      album: data.album || '',
      albumArt: data.albumArt || '',
      embedUrl: data.embedUrl,
      openUrl: data.openUrl,
      fallback: data.fallback ?? true,
    };

  } catch (err) {
    console.warn('[mediaBackend] Spotify backend unreachable, using search fallback:', err);

    // Safe fallback: Spotify search embed always works, no 404
    const encoded = encodeURIComponent(query);
    return {
      type: 'spotify',
      trackId: null,
      title: query,
      artist: '',
      album: '',
      albumArt: '',
      embedUrl: `https://open.spotify.com/embed/search/${encoded}?utm_source=generator&theme=0&autoplay=1`,
      openUrl: `https://open.spotify.com/search/${encoded}`,
      fallback: true,
    };
  }
}

// ── YouTube — generate search URL (no API key, always works) ─────────────────
// We use YouTube search URL — guaranteed to be valid and show real results.
// No API key, no fake video IDs, no 404 risk.

export function buildYouTubeResult(query: string): YouTubeMediaResult {
  const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;

  return {
    type: 'youtube',
    mode: 'search',
    query,
    searchUrl,
    title: query,
  };
}

// ── Main entry — resolve any media request ────────────────────────────────────
// Use this in ChatContext to intercept and resolve media before calling AI.

export async function resolveMediaRequest(userMessage: string): Promise<MediaResult | null> {
  const { isMedia, mediaType, query } = detectMediaIntent(userMessage);

  if (!isMedia || !mediaType) return null;

  if (mediaType === 'spotify') {
    return await fetchSpotifyFromBackend(query);
  }

  if (mediaType === 'youtube') {
    return buildYouTubeResult(query);
  }

  return null;
}
