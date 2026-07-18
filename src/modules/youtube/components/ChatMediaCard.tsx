import React, { memo } from 'react';
import { YoutubeVideoResult } from '../types/youtube.types';

interface ChatMediaCardProps {
  video: YoutubeVideoResult;
  onSelect: (video: YoutubeVideoResult) => void;
}

/**
 * Compact card designed for use inside AI chat bubbles.
 * Shows thumbnail + title + channel in a minimal footprint.
 */
export const ChatMediaCard = memo(function ChatMediaCard({
  video,
  onSelect,
}: ChatMediaCardProps) {
  return (
    <button
      className="yt-chat-card"
      onClick={() => onSelect(video)}
      aria-label={`Play ${video.title} by ${video.channelTitle}`}
    >
      <div className="yt-chat-thumb">
        <img
          src={video.thumbnail}
          alt=""
          aria-hidden="true"
          loading="lazy"
          decoding="async"
          width={80}
          height={45}
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.visibility = 'hidden';
          }}
        />
        {video.duration && (
          <span className="yt-chat-duration">{video.duration}</span>
        )}
      </div>
      <div className="yt-chat-info">
        <p className="yt-chat-title">{video.title}</p>
        <p className="yt-chat-channel">{video.channelTitle}</p>
      </div>
    </button>
  );
});
