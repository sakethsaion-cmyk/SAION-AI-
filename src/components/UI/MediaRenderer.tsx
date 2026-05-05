// ─── SAION AI — MediaRenderer Component ──────────────────────────────────────
// NEW FILE — does NOT modify MessageBubble.tsx or any existing component.
//
// How to use inside MessageBubble or ChatWindow:
//   import MediaRenderer from '../UI/MediaRenderer'
//   <MediaRenderer result={spotifyResult} />    // SpotifyMediaResult
//   <MediaRenderer result={youtubeResult} />    // YouTubeMediaResult
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState } from 'react';
import { ExternalLink, Music, Play } from 'lucide-react';
import type { SpotifyMediaResult, YouTubeMediaResult } from '../../services/mediaBackend';

type MediaResult = SpotifyMediaResult | YouTubeMediaResult;

interface Props {
  result: MediaResult;
}

// ── Main router ───────────────────────────────────────────────────────────────
export default function MediaRenderer({ result }: Props) {
  if (result.type === 'spotify') return <SpotifyEmbed result={result} />;
  if (result.type === 'youtube') return <YouTubeSearchCard result={result} />;
  return null;
}

// ── Spotify Embed Player ──────────────────────────────────────────────────────
// Uses official Spotify embed — plays 30s preview, full song if user is logged in
function SpotifyEmbed({ result }: { result: SpotifyMediaResult }) {
  return (
    <div
      className="mb-2 rounded-2xl overflow-hidden border border-[#1e1e1e] bg-[#0a0a0a]"
      style={{ width: 400, maxWidth: '100%' }}
    >
      {/* Header bar */}
      <div className="flex items-center gap-2.5 px-3 py-2.5 bg-[#0d0d0d] border-b border-[#1a1a1a]">
        {/* Spotify icon */}
        <svg viewBox="0 0 24 24" width="18" height="18" fill="#1DB954" aria-hidden="true">
          <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
        </svg>

        <div className="flex flex-col flex-1 min-w-0">
          <span className="text-white text-xs font-semibold truncate">
            {result.title}
          </span>
          {result.artist && (
            <span className="text-gray-500 text-[10px] truncate">{result.artist}</span>
          )}
        </div>

        <a
          href={result.openUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#1DB954] hover:text-green-400 shrink-0 flex items-center gap-0.5 text-[11px]"
          title="Open in Spotify"
        >
          <ExternalLink size={11} />
        </a>
      </div>

      {/* Official Spotify embed — real track or search fallback, never 404 */}
      <iframe
        src={result.embedUrl}
        width="100%"
        height="152"
        frameBorder="0"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="eager"
        style={{ display: 'block' }}
        title={`Spotify: ${result.title}`}
      />

      {/* Footer note */}
      <div className="px-3 py-2 bg-[#0a0a0a]">
        <p className="text-[11px] text-gray-600">
          🎵 Playing inside chat ·{' '}
          <span className="text-green-500">Log in to Spotify for full songs</span>
        </p>
      </div>
    </div>
  );
}

// ── YouTube Search Card ───────────────────────────────────────────────────────
// No API key needed. Always shows a real working YouTube search link.
// Uses Invidious if available (from existing mediaService.ts) or falls back here.
function YouTubeSearchCard({ result }: { result: YouTubeMediaResult }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="mb-2 rounded-2xl overflow-hidden border border-[#1e1e1e] bg-[#0a0a0a]"
      style={{ width: 400, maxWidth: '100%' }}
    >
      {/* Header bar */}
      <div className="flex items-center gap-2.5 px-3 py-2.5 bg-[#0d0d0d] border-b border-[#1a1a1a]">
        {/* YouTube icon */}
        <svg viewBox="0 0 24 24" width="18" height="18" fill="#FF0000" aria-hidden="true">
          <path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.54 3.5 12 3.5 12 3.5s-7.54 0-9.38.55A3.02 3.02 0 0 0 .5 6.19C0 8.04 0 12 0 12s0 3.96.5 5.81a3.02 3.02 0 0 0 2.12 2.14C4.46 20.5 12 20.5 12 20.5s7.54 0 9.38-.55a3.02 3.02 0 0 0 2.12-2.14C24 15.96 24 12 24 12s0-3.96-.5-5.81z" />
          <polygon fill="white" points="9.75,15.02 15.5,12 9.75,8.98" />
        </svg>

        <span className="text-white text-xs font-semibold truncate flex-1">
          {result.title}
        </span>
      </div>

      {/* Search link card */}
      <a
        href={result.searchUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 px-4 py-4 hover:bg-[#111] transition-colors group"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Play button */}
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-all ${
            hovered
              ? 'bg-red-600 shadow-[0_0_20px_rgba(239,68,68,0.5)]'
              : 'bg-[#1a1a1a] border border-[#2a2a2a]'
          }`}
        >
          <Play
            size={20}
            fill={hovered ? 'white' : '#888'}
            className={`ml-0.5 ${hovered ? 'text-white' : 'text-gray-500'}`}
          />
        </div>

        <div className="flex flex-col min-w-0">
          <span className="text-white text-sm font-medium truncate">
            Search: "{result.query}"
          </span>
          <span className="text-gray-500 text-xs mt-0.5 flex items-center gap-1">
            <ExternalLink size={10} />
            Opens YouTube search — click to watch
          </span>
        </div>
      </a>

      {/* Footer */}
      <div className="px-3 py-2 bg-[#0a0a0a] border-t border-[#1a1a1a]">
        <p className="text-[11px] text-gray-600">
          🎬 Click to watch on YouTube
        </p>
      </div>
    </div>
  );
}

// ── Loading skeleton — show while resolving media ─────────────────────────────
export function MediaLoadingSkeleton() {
  return (
    <div
      className="mb-2 rounded-2xl overflow-hidden border border-[#1e1e1e] bg-[#0a0a0a] animate-pulse"
      style={{ width: 400, maxWidth: '100%', height: 90 }}
    >
      <div className="flex items-center gap-3 px-4 py-4">
        <div className="w-10 h-10 rounded-full bg-[#1a1a1a]" />
        <div className="flex flex-col gap-2 flex-1">
          <div className="h-3 bg-[#1a1a1a] rounded w-3/4" />
          <div className="h-2 bg-[#1a1a1a] rounded w-1/2" />
        </div>
      </div>
    </div>
  );
}
