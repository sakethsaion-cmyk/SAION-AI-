import React from 'react';

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export const ErrorState = React.memo(function ErrorState({
  message,
  onRetry,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
        gap: '12px',
        textAlign: 'center',
      }}
    >
      <svg
        width="48"
        height="48"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        style={{ color: 'var(--yt-text-error)', opacity: 0.7 }}
      >
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
        <path
          d="M12 8v4m0 4h.01"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
      <p
        style={{
          margin: 0,
          fontSize: 'var(--yt-text-base)',
          fontWeight: 500,
          color: 'var(--yt-text-primary)',
        }}
      >
        Something went wrong
      </p>
      <p style={{ margin: 0, fontSize: 'var(--yt-text-sm)', color: 'var(--yt-text-secondary)' }}>
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            marginTop: '8px',
            padding: '8px 20px',
            background: 'var(--yt-red)',
            color: '#fff',
            border: 'none',
            borderRadius: 'var(--yt-radius-full)',
            fontSize: 'var(--yt-text-sm)',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'background var(--yt-transition-fast)',
          }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.background = 'var(--yt-red-hover)')
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.background = 'var(--yt-red)')
          }
        >
          Try again
        </button>
      )}
    </div>
  );
});
