import { useState, useEffect, useRef, useCallback } from 'react';
import { searchYoutube } from '../services/youtubeService';
import { YoutubeVideoResult } from '../types/youtube.types';
import { useDebounce } from './useDebounce';
import { isAbortError } from '../services/apiClient';

export interface UseYoutubeSearchState {
  results: YoutubeVideoResult[];
  totalResults: number;
  isLoading: boolean;
  error: string | null;
  query: string;
  cached: boolean;
  setQuery: (q: string) => void;
  retry: () => void;
  clear: () => void;
}

const DEBOUNCE_MS = 450;
const MIN_QUERY_LENGTH = 2;

/**
 * Manages YouTube search state.
 *
 * - Debounces input to avoid hammering the API on every keystroke
 * - Cancels in-flight requests when query changes (AbortController)
 * - Resets isLoading correctly on abort (fixes stale loading state)
 * - Exposes retry() and clear() helpers
 */
export function useYoutubeSearch(initialQuery = ''): UseYoutubeSearchState {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<YoutubeVideoResult[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cached, setCached] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const debouncedQuery = useDebounce(query, DEBOUNCE_MS);
  const abortRef = useRef<AbortController | null>(null);

  const executeSearch = useCallback(async (q: string) => {
    if (!q || q.trim().length < MIN_QUERY_LENGTH) {
      setResults([]);
      setTotalResults(0);
      setError(null);
      setIsLoading(false);
      return;
    }

    // Cancel any in-flight request before starting a new one
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setIsLoading(true);
    setError(null);

    try {
      const data = await searchYoutube(q.trim(), abortRef.current.signal);
      setResults(data.results);
      setTotalResults(data.totalResults);
      setCached(data.cached);
    } catch (err: unknown) {
      // Intentional aborts must reset isLoading — otherwise the UI spins forever
      if (isAbortError(err)) {
        setIsLoading(false);
        return;
      }
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(message);
      setResults([]);
      setTotalResults(0);
    } finally {
      // Only clear loading if this controller is still the active one
      // (i.e. a newer search hasn't already taken over)
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void executeSearch(debouncedQuery);
    return () => {
      abortRef.current?.abort();
    };
  }, [debouncedQuery, retryCount, executeSearch]);

  const retry = useCallback(() => setRetryCount((c) => c + 1), []);

  const clear = useCallback(() => {
    abortRef.current?.abort();
    setQuery('');
    setResults([]);
    setError(null);
    setTotalResults(0);
    setIsLoading(false);
    setCached(false);
  }, []);

  return {
    results,
    totalResults,
    isLoading,
    error,
    query,
    cached,
    setQuery,
    retry,
    clear,
  };
}
