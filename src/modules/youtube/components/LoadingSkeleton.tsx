import React from 'react';

interface LoadingSkeletonProps {
  count?: number;
}

function SkeletonCard() {
  return (
    <div className="yt-skeleton-card" aria-hidden="true">
      <div className="yt-skeleton-thumb">
        <div className="yt-skeleton-shimmer" />
      </div>
      <div className="yt-skeleton-info">
        <div className="yt-skeleton-line" style={{ width: '90%' }}>
          <div className="yt-skeleton-shimmer" />
        </div>
        <div className="yt-skeleton-line" style={{ width: '70%' }}>
          <div className="yt-skeleton-shimmer" />
        </div>
        <div className="yt-skeleton-line" style={{ width: '45%' }}>
          <div className="yt-skeleton-shimmer" />
        </div>
      </div>
    </div>
  );
}

export const LoadingSkeleton = React.memo(function LoadingSkeleton({
  count = 4,
}: LoadingSkeletonProps) {
  return (
    <div role="status" aria-label="Loading search results">
      {Array.from({ length: count }, (_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
});
