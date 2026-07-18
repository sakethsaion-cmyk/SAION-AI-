/**
 * Normalised video shape returned from the backend.
 */
export interface YoutubeVideoResult {
  videoId: string;
  title: string;
  channelTitle: string;
  description: string;
  thumbnail: string;
  publishDate: string;
  duration: string;
  videoUrl: string;
}

export interface YoutubeSearchResponse {
  query: string;
  results: YoutubeVideoResult[];
  totalResults: number;
  cached: boolean;
}

export interface YoutubeVideoDetailsResponse {
  video: YoutubeVideoResult;
  cached: boolean;
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  requestId?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    message: string;
    code: string;
    statusCode: number;
    requestId?: string;
  };
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export type PlayerState = 'idle' | 'loading' | 'ready' | 'error';

export type IntentType = 'PLAY_SPECIFIC' | 'PLAY_CATEGORY' | 'OPEN_YOUTUBE' | 'SEARCH_GENERIC';

export interface ParsedIntent {
  type: IntentType;
  query: string;
  rawText: string;
}

export interface YoutubeModuleProps {
  initialQuery?: string;
  autoPlayVideoId?: string;
  className?: string;
  onVideoSelect?: (video: YoutubeVideoResult) => void;
}
