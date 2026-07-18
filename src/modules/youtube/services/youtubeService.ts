import { apiFetch } from './apiClient';
import {
  YoutubeSearchResponse,
  YoutubeVideoDetailsResponse,
} from '../types/youtube.types';

/**
 * Searches YouTube via the backend proxy.
 *
 * @param query   Natural-language or keyword search string
 * @param signal  Optional AbortSignal to cancel the request
 */
export async function searchYoutube(
  query: string,
  signal?: AbortSignal
): Promise<YoutubeSearchResponse> {
  const encoded = encodeURIComponent(query.trim());
  const response = await apiFetch<YoutubeSearchResponse>(
    `/api/v1/youtube/search?q=${encoded}`,
    { signal }
  );

  if (!response.success) {
    const err = (response as import('../types/youtube.types').ApiErrorResponse).error;
    throw Object.assign(
      new Error(err.message ?? 'Search failed'),
      { code: err.code, requestId: err.requestId }
    );
  }

  return (response as import('../types/youtube.types').ApiSuccessResponse<YoutubeSearchResponse>).data;
}

/**
 * Fetches full details for a single YouTube video.
 *
 * @param videoId  11-character YouTube video ID
 * @param signal   Optional AbortSignal to cancel the request
 */
export async function getYoutubeVideo(
  videoId: string,
  signal?: AbortSignal
): Promise<YoutubeVideoDetailsResponse> {
  const response = await apiFetch<YoutubeVideoDetailsResponse>(
    `/api/v1/youtube/video/${videoId}`,
    { signal }
  );

  if (!response.success) {
    const err = (response as import('../types/youtube.types').ApiErrorResponse).error;
    throw Object.assign(
      new Error(err.message ?? 'Video lookup failed'),
      { code: err.code, requestId: err.requestId }
    );
  }

  return (response as import('../types/youtube.types').ApiSuccessResponse<YoutubeVideoDetailsResponse>).data;
}
