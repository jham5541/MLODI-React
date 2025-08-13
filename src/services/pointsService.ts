import { supabase } from '../lib/supabase/client';
import { fanEngagementService } from './fanEngagementService';

/**
 * Artist-specific points helper.
 * Rules:
 * - 50 for listen/watch completions
 * - 100 for purchases (songs, videos, merch)
 * Uses server-side RPC when available; falls back to client update if RPC missing.
 */
import { events, FAN_POINTS_AWARDED } from './events';

export async function awardArtistPoints(params: {
  artistId: string;
  points: number; // 50 or 100 (informational)
  refType: 'song_listen' | 'song_purchase' | 'video_watch' | 'video_purchase' | 'merch_order' | 'other';
  refId?: string;
}) {
  // Map refType to server activity types used by award_artist_fan_points
  const activityType = (
    params.refType === 'song_listen' ? 'listen' :
    params.refType === 'video_watch' ? 'watch' :
    (params.refType === 'song_purchase' || params.refType === 'video_purchase' || params.refType === 'merch_order') ? 'purchase' :
    'listen'
  );

  try {
    // Use new RPC that calculates points server-side and writes audit trail
    const { error } = await supabase.rpc('award_artist_fan_points', {
      p_artist_id: params.artistId,
      p_activity_type: activityType,
      p_reference_id: params.refId || null,
    });
    if (error) throw error;
    // Emit refresh event for leaderboards
    events.emit(FAN_POINTS_AWARDED, { artistId: params.artistId, refType: params.refType, refId: params.refId });
  } catch (_e) {
    // Fallback to client-side points update (legacy tiers store)
    try {
      await fanEngagementService.updateFanPoints(params.artistId, params.points, params.refType);
      events.emit(FAN_POINTS_AWARDED, { artistId: params.artistId, refType: params.refType, refId: params.refId });
    } catch {}
  }
}
