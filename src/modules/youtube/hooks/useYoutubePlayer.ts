import { useState, useCallback, useRef, useEffect } from 'react';
import { YoutubeVideoResult, PlayerState } from '../types/youtube.types';
import { getYoutubeVideo } from '../services/youtubeService';
import { isAbortError } from '../services/apiClient';

export interface UseYoutubePlayerState {
  activeVideo: YoutubeVideoResult | null;
  playerState: PlayerState;
  error: string | null;
  loadVideo: (video: YoutubeVideoResult) => void;
  loadVideoById: (videoId: string) => Promise<void>;
  closePlayer: () => void;
}

/**
 * Manages the embedded YouTube player lifecycle.
 *
 * Handles:
 * - Loading a video by full object (from search results)
 * - Loading a video by bare videoId (e.g. autoPlayVideoId prop)
 * - Cancelling in-flight fetches on unmount or when a new video is requested
 * - Consistent state transitions: idle → loading → ready | error
 */
export function useYoutubePlayer(
  onVideoSelect?: (video: YoutubeVideoResult) => void
): UseYoutubePlayerState {
  const [activeVideo, setActiveVideo] = useState<YoutubeVideoResult | null>(null);
  const [playerState, setPlayerState] = useState<PlayerState>('idle');
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  const loadVideo = useCallback(
    (video: YoutubeVideoResult) => {
      abortRef.current?.abort();
      setActiveVideo(video);
      setPlayerState('ready');
      setError(null);
      onVideoSelect?.(video);
    },
    [onVideoSelect]
  );

  const loadVideoById = useCallback(
    async (videoId: string): Promise<void> => {
      abortRef.current?.abort();
      abortRef.current = new AbortController();

      setPlayerState('loading');
      setError(null);

      try {
        const { video } = await getYoutubeVideo(videoId, abortRef.current.signal);
        setActiveVideo(video);
        setPlayerState('ready');
        onVideoSelect?.(video);
      } catch (err: unknown) {
        if (isAbortError(err)) {
          setPlayerState('idle');
          return;
        }
        const message = err instanceof Error ? err.message : 'Failed to load video';
        setError(message);
        setPlayerState('error');
      }
    },
    [onVideoSelect]
  );

  const closePlayer = useCallback(() => {
    abortRef.current?.abort();
    setActiveVideo(null);
    setPlayerState('idle');
    setError(null);
  }, []);

  return { activeVideo, playerState, error, loadVideo, loadVideoById, closePlayer };
}
