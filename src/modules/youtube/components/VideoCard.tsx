import React, { memo, useCallback } from 'react';
import { YoutubeVideoResult } from '../types/youtube.types';
import { formatPublishDate } from '../utils/formatters';

interface VideoCardProps {
  video: YoutubeVideoResult;
  onSelect: (video: YoutubeVideoResult) => void;
}

export const VideoCard = memo(function VideoCard({ video, onSelect }: VideoCardProps) {
  const handleClick = useCallback(() => onSelect(video), [onSelect, video]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onSelect(video);
      }
    },
    [onSelect, video]
  );

  return (
    <button
      className="yt-video-card"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-label={`Play ${video.title} by ${video.channelTitle}`}
    >
      <div className="yt-video-thumb">
        <img
          src={video.thumbnail}
          alt=""
          aria-hidden="true"
          loading="lazy"
          decoding="async"
          width={168}
          height={94}
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.visibility = 'hidden';
          }}
        />
        {video.duration && (
          <span className="yt-video-duration" aria-label={`Duration: ${video.duration}`}>
            {video.duration}
          </span>
        )}
      </div>

      <div className="yt-video-info">
        <h3 className="yt-video-title">{video.title}</h3>
        <p className="yt-video-channel">{video.channelTitle}</p>
        {video.publishDate && (
          <p className="yt-video-meta">
            <time dateTime={video.publishDate}>
              {formatPublishDate(video.publishDate)}
            </time>
          </p>
        )}
        {video.description && (
          <p className="yt-video-desc">{video.description}</p>
        )}
      </div>
    </button>
  );
});
