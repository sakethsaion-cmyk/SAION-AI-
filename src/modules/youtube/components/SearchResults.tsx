import React, { memo } from 'react';
import { YoutubeVideoResult } from '../types/youtube.types';
import { VideoCard } from './VideoCard';
import { LoadingSkeleton } from './LoadingSkeleton';
import { EmptyState } from './EmptyState';
import { ErrorState } from './ErrorState';

interface SearchResultsProps {
  results: YoutubeVideoResult[];
  isLoading: boolean;
  error: string | null;
  query: string;
  onVideoSelect: (video: YoutubeVideoResult) => void;
  onRetry: () => void;
}

export const SearchResults = memo(function SearchResults({
  results,
  isLoading,
  error,
  query,
  onVideoSelect,
  onRetry,
}: SearchResultsProps) {
  if (isLoading) return <LoadingSkeleton count={4} />;
  if (error) return <ErrorState message={error} onRetry={onRetry} />;
  if (query.length >= 2 && results.length === 0) return <EmptyState query={query} />;

  return (
    <section aria-label="Search results" aria-live="polite">
      {results.length > 0 && (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {results.map((video) => (
            <li key={video.videoId}>
              <VideoCard video={video} onSelect={onVideoSelect} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
});
