import { supabase } from '../lib/supabase/client';

export type TrackRights = {
  is_full_access: boolean;
  allowed_seconds: number | null;
  reason: string | null;
};

export type VideoRights = TrackRights;

class PlaybackRightsService {
  private static instance: PlaybackRightsService;

  private constructor() {}

  static getInstance(): PlaybackRightsService {
    if (!PlaybackRightsService.instance) {
      PlaybackRightsService.instance = new PlaybackRightsService();
    }
    return PlaybackRightsService.instance;
  }

  async getUserId(): Promise<string | null> {
    try {
      const { data } = await supabase.auth.getUser();
      return data?.user?.id ?? null;
    } catch (e) {
      console.error('Failed to get user id:', e);
      return null;
    }
  }

  async getTrackRights(trackId: string, userId?: string | null): Promise<TrackRights> {
    try {
      const uid = userId ?? (await this.getUserId());
      if (!uid) {
        return { is_full_access: false, allowed_seconds: 30, reason: 'unauthenticated' };
      }
      const { data, error } = await supabase.rpc('get_playback_rights_for_track', {
        p_user_id: uid,
        p_track_id: trackId,
      });
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      return {
        is_full_access: !!row?.is_full_access,
        allowed_seconds: row?.allowed_seconds ?? 30,
        reason: row?.reason ?? null,
      } as TrackRights;
    } catch (e) {
      console.error('getTrackRights error:', e);
      return { is_full_access: false, allowed_seconds: 30, reason: 'error' };
    }
  }

  async getVideoRights(videoId: string, userId?: string | null): Promise<VideoRights> {
    try {
      const uid = userId ?? (await this.getUserId());
      if (!uid) {
        return { is_full_access: false, allowed_seconds: 30, reason: 'unauthenticated' };
      }
      const { data, error } = await supabase.rpc('get_playback_rights_for_video', {
        p_user_id: uid,
        p_video_id: videoId,
      });
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      return {
        is_full_access: !!row?.is_full_access,
        allowed_seconds: row?.allowed_seconds ?? 30,
        reason: row?.reason ?? null,
      } as VideoRights;
    } catch (e) {
      console.error('getVideoRights error:', e);
      return { is_full_access: false, allowed_seconds: 30, reason: 'error' };
    }
  }

  // Helper to create signed URL for full content if you store media in Supabase Storage
  async createSignedUrl(bucket: string, path: string, expiresInSec = 3600): Promise<string | null> {
    try {
      const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresInSec);
      if (error) throw error;
      return data?.signedUrl ?? null;
    } catch (e) {
      console.error('createSignedUrl error:', e);
      return null;
    }
  }
}

export default PlaybackRightsService.getInstance();
