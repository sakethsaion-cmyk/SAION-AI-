import React from 'react';

interface EmptyStateProps {
  query?: string;
}

export const EmptyState = React.memo(function EmptyState({ query }: EmptyStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
        gap: '12px',
        textAlign: 'center',
        color: 'var(--yt-text-muted)',
      }}
    >
      <svg
        width="48"
        height="48"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        style={{ opacity: 0.4 }}
      >
        <path
          d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
      <p style={{ margin: 0, fontSize: 'var(--yt-text-base)', fontWeight: 500 }}>
        {query ? `No results for "${query}"` : 'No results found'}
      </p>
      <p style={{ margin: 0, fontSize: 'var(--yt-text-sm)' }}>
        Try different keywords or check your spelling.
      </p>
    </div>
  );
});
