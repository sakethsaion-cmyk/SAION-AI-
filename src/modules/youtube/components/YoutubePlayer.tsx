import React, { memo, useState, useCallback } from 'react';
import { YoutubeVideoResult } from '../types/youtube.types';
import { buildEmbedUrl } from '../utils/urlHelpers';

interface YoutubePlayerProps {
  video: YoutubeVideoResult;
  onClose: () => void;
}

export const YoutubePlayer = memo(function YoutubePlayer({
  video,
  onClose,
}: YoutubePlayerProps) {
  const [iframeReady, setIframeReady] = useState(false);

  const handleLoad = useCallback(() => setIframeReady(true), []);

  const embedUrl = buildEmbedUrl(video.videoId, true);

  return (
    <section aria-label={`Now playing: ${video.title}`}>
      {/* Header */}
      <div className="yt-player-header">
        <h2 className="yt-player-title">{video.title}</h2>
        <button
          className="yt-player-close-btn"
          onClick={onClose}
          aria-label="Close player"
          title="Close player"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M18 6L6 18M6 6l12 12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      {/* Meta */}
      <div className="yt-player-meta">
        <span className="yt-player-channel">{video.channelTitle}</span>
        {video.duration && (
          <>
            <span className="yt-player-dot" aria-hidden="true">·</span>
            <span>{video.duration}</span>
          </>
        )}
        <a
          href={video.videoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="yt-player-external-link"
          aria-label={`Watch ${video.title} on YouTube (opens in new tab)`}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6m0 0v6m0-6L10 14"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Watch on YouTube
        </a>
      </div>

      {/* Player */}
      <div className="yt-player-wrapper">
        <div className="yt-player-aspect">
          {!iframeReady && (
            <div className="yt-player-skeleton" aria-hidden="true">
              <div className="yt-player-spinner" />
            </div>
          )}
          <iframe
            className="yt-player-iframe"
            src={embedUrl}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            loading="eager"
            onLoad={handleLoad}
            style={{ opacity: iframeReady ? 1 : 0, transition: 'opacity 0.3s ease' }}
          />
        </div>
      </div>
    </section>
  );
});
