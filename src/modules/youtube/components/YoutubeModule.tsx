import React, { useEffect } from 'react';
import { useYoutubeSearch } from '../hooks/useYoutubeSearch';
import { useYoutubePlayer } from '../hooks/useYoutubePlayer';
import { SearchBar } from './SearchBar';
import { SearchResults } from './SearchResults';
import { YoutubePlayer } from './YoutubePlayer';
import { YoutubeModuleProps } from '../types/youtube.types';

/**
 * Top-level YouTube module component.
 *
 * Drop this into any React application to get a fully-featured, AI-ready
 * YouTube search + embedded player experience.
 *
 * Props:
 *   initialQuery    – Pre-populate the search input and trigger a search on mount.
 *   autoPlayVideoId – Load and immediately play a specific video on mount.
 *   className       – Extra CSS class(es) applied to the root element.
 *   onVideoSelect   – Callback fired when the user selects a video.
 */
export function YoutubeModule({
  initialQuery = '',
  autoPlayVideoId,
  className = '',
  onVideoSelect,
}: YoutubeModuleProps) {
  const {
    results,
    totalResults,
    isLoading,
    error,
    query,
    setQuery,
    retry,
    clear,
  } = useYoutubeSearch(initialQuery);

  const {
    activeVideo,
    playerState,
    error: playerError,
    loadVideo,
    loadVideoById,
    closePlayer,
  } = useYoutubePlayer(onVideoSelect);

  // Auto-load a video by ID if provided as a prop
  useEffect(() => {
    if (autoPlayVideoId) {
      void loadVideoById(autoPlayVideoId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPlayVideoId]);

  const showResults = !activeVideo && (query.length >= 2 || isLoading || error);

  return (
    <div className={`yt-module ${className}`.trim()}>
      {/* Search bar – always visible */}
      <div style={{ marginBottom: 'var(--yt-space-4)' }}>
        <SearchBar
          value={query}
          onChange={setQuery}
          onClear={() => { clear(); closePlayer(); }}
          isLoading={isLoading}
          autoFocus={!autoPlayVideoId}
        />
      </div>

      {/* Player (takes priority over results) */}
      {activeVideo && playerState === 'ready' && (
        <YoutubePlayer video={activeVideo} onClose={closePlayer} />
      )}

      {/* Player loading / error states */}
      {playerState === 'loading' && (
        <div
          role="status"
          aria-label="Loading video"
          style={{
            textAlign: 'center',
            padding: 'var(--yt-space-12)',
            color: 'var(--yt-text-secondary)',
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              border: '3px solid rgba(255,255,255,0.1)',
              borderTopColor: 'var(--yt-red)',
              borderRadius: '50%',
              animation: 'yt-spin 0.8s linear infinite',
              margin: '0 auto',
            }}
          />
        </div>
      )}

      {playerError && (
        <div role="alert" style={{ padding: 'var(--yt-space-4)', color: 'var(--yt-text-error)', textAlign: 'center' }}>
          {playerError}
        </div>
      )}

      {/* Search results (hidden while player is active) */}
      {showResults && (
        <SearchResults
          results={results}
          isLoading={isLoading}
          error={error}
          query={query}
          onVideoSelect={loadVideo}
          onRetry={retry}
        />
      )}

      {/* Result count */}
      {!isLoading && !error && !activeVideo && results.length > 0 && (
        <p
          aria-live="polite"
          style={{
            fontSize: 'var(--yt-text-xs)',
            color: 'var(--yt-text-muted)',
            textAlign: 'center',
            padding: 'var(--yt-space-3) 0 0',
            margin: 0,
          }}
        >
          Showing {results.length} of {totalResults.toLocaleString()} results
        </p>
      )}
    </div>
  );
}
