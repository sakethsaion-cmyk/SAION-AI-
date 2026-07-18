import { useState, useEffect } from 'react';

/**
 * Debounces a value: the returned value only updates after `delayMs`
 * milliseconds of inactivity.
 *
 * Useful for preventing a search API call on every keystroke.
 */
export function useDebounce<T>(value: T, delayMs = 400): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debouncedValue;
}
