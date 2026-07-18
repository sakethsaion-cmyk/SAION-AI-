import React, { useRef, useCallback, memo } from 'react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  isLoading?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
}

export const SearchBar = memo(function SearchBar({
  value,
  onChange,
  onClear,
  isLoading = false,
  placeholder = 'Search YouTube…',
  autoFocus = false,
}: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value),
    [onChange]
  );

  const handleClear = useCallback(() => {
    onClear();
    inputRef.current?.focus();
  }, [onClear]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Escape') handleClear();
    },
    [handleClear]
  );

  return (
    <div role="search" aria-label="YouTube search">
      <div className="yt-search-bar">
        {/* Search icon */}
        <span className="yt-search-icon" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
              d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </span>

        <input
          ref={inputRef}
          type="search"
          className="yt-search-input"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoFocus={autoFocus}
          autoComplete="off"
          spellCheck={false}
          aria-label="Search YouTube"
          aria-busy={isLoading}
        />

        {/* Clear button */}
        <button
          type="button"
          className={`yt-search-clear-btn${value ? ' visible' : ''}`}
          onClick={handleClear}
          aria-label="Clear search"
          tabIndex={value ? 0 : -1}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M18 6L6 18M6 6l12 12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      {/* Animated progress bar */}
      {isLoading && <div className="yt-search-progress" aria-hidden="true" />}
    </div>
  );
});
