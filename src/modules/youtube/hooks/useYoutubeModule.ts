import { useYoutubeSearch, UseYoutubeSearchState } from './useYoutubeSearch';
import { useYoutubePlayer, UseYoutubePlayerState } from './useYoutubePlayer';
import { YoutubeVideoResult } from '../types/youtube.types';

export interface UseYoutubeModuleState
  extends UseYoutubeSearchState,
    Omit<UseYoutubePlayerState, 'error'> {
  playerError: string | null;
  isPlayerActive: boolean;
  handleVideoSelect: (video: YoutubeVideoResult) => void;
}

/**
 * Composite hook that combines search + player state into a single interface.
 *
 * Designed for AI chat integration scenarios where the host application wants
 * a single hook to wire into its UI without managing two separate hooks.
 *
 * Usage:
 * ```tsx
 * const yt = useYoutubeModule({ initialQuery: 'lo-fi music' });
 * // yt.query, yt.results, yt.activeVideo, yt.loadVideo, etc.
 * ```
 */
export function useYoutubeModule(options: {
  initialQuery?: string;
  onVideoSelect?: (video: YoutubeVideoResult) => void;
} = {}): UseYoutubeModuleState {
  const { initialQuery = '', onVideoSelect } = options;

  const search = useYoutubeSearch(initialQuery);
  const player = useYoutubePlayer(onVideoSelect);

  // When a video is selected from results: load it and clear search UI
  function handleVideoSelect(video: YoutubeVideoResult): void {
    player.loadVideo(video);
  }

  return {
    // Search state
    ...search,
    // Player state
    activeVideo: player.activeVideo,
    playerState: player.playerState,
    playerError: player.error,
    loadVideo: player.loadVideo,
    loadVideoById: player.loadVideoById,
    closePlayer: player.closePlayer,
    // Derived
    isPlayerActive: player.activeVideo !== null,
    handleVideoSelect,
  };
}
