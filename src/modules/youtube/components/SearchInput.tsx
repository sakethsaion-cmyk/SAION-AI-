import { ChangeEvent, KeyboardEvent, memo } from 'react';

export interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  disabled?: boolean;
  autoFocus?: boolean;
}

/**
 * Minimal, reusable controlled text input for search bars.
 * Kept separate from SearchBar so it can be composed into other
 * layouts (e.g. a chat input bar) without pulling in the submit button UI.
 */
function SearchInputComponent({
  value,
  onChange,
  onSubmit,
  placeholder = 'Search YouTube...',
  disabled = false,
  autoFocus = false,
}: SearchInputProps) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      onSubmit();
    }
  };

  return (
    <input
      type="text"
      className="yt-search-bar__input"
      value={value}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      disabled={disabled}
      autoFocus={autoFocus}
      aria-label="Search YouTube"
    />
  );
}

export const SearchInput = memo(SearchInputComponent);
