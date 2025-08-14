import { supabase } from '../lib/supabase/client';
import { awardArtistPoints } from './pointsService';
import { events, FAN_POINTS_AWARDED } from './events';

interface ListeningSession {
  trackId: string;
  artistId: string;
  startTime: number;
  lastProgressTime: number;
  isRewarded: boolean;
}

class ListeningRewardsService {
  private sessions: Map<string, ListeningSession> = new Map();
  private COMPLETION_THRESHOLD = 0.8; // 80% to award points
  private POINTS_PER_LISTEN = 50;

  // Start tracking a listening session
  startSession(trackId: string, artistId: string) {
    const sessionKey = this.getSessionKey(trackId);
    this.sessions.set(sessionKey, {
      trackId,
      artistId,
      startTime: Date.now(),
      lastProgressTime: Date.now(),
      isRewarded: false,
    });
    console.log('[ListeningRewards] Started session for track:', trackId);
  }

  // Update progress and check if points should be awarded
  async updateProgress(trackId: string, progressPercentage: number, duration: number) {
    const sessionKey = this.getSessionKey(trackId);
    const session = this.sessions.get(sessionKey);

    if (!session) {
      console.warn('[ListeningRewards] No session found for track:', trackId);
      return;
    }

    session.lastProgressTime = Date.now();

    // Check if we've reached the completion threshold and haven't awarded points yet
    if (progressPercentage >= this.COMPLETION_THRESHOLD && !session.isRewarded) {
      await this.awardListeningPoints(session);
    }
  }

  // Award points using the RPC function
  private async awardListeningPoints(session: ListeningSession) {
    try {
      console.log('[ListeningRewards] Awarding points for track:', session.trackId);

      // Calculate listening duration in seconds
      const durationSeconds = Math.floor((Date.now() - session.startTime) / 1000);

      // Call the RPC function to award points
      const { data, error } = await supabase.rpc('award_listening_points', {
        p_song_id: session.trackId,
        p_artist_id: session.artistId,
        p_duration_listened_seconds: durationSeconds,
      });

      if (error) {
        console.error('[ListeningRewards] Error awarding points:', error);
        
        // If RPC fails, try the fallback method
        if (error.message.includes('function') || error.code === '42883') {
          console.log('[ListeningRewards] Falling back to client-side points');
          await this.fallbackAwardPoints(session);
        }
        return;
      }

      if (data?.success) {
        session.isRewarded = true;
        console.log('[ListeningRewards] Points awarded successfully:', data);
        
        // Emit event for UI updates
        events.emit(FAN_POINTS_AWARDED, {
          artistId: session.artistId,
          points: data.points_awarded || this.POINTS_PER_LISTEN,
          refType: 'song_listen',
          refId: session.trackId,
        });
      } else if (data?.error?.includes('Already rewarded')) {
        console.log('[ListeningRewards] Already rewarded for this song today');
        session.isRewarded = true;
      }
    } catch (error) {
      console.error('[ListeningRewards] Unexpected error:', error);
      // Try fallback method
      await this.fallbackAwardPoints(session);
    }
  }

  // Fallback method using the pointsService
  private async fallbackAwardPoints(session: ListeningSession) {
    try {
      await awardArtistPoints({
        artistId: session.artistId,
        points: this.POINTS_PER_LISTEN,
        refType: 'song_listen',
        refId: session.trackId,
      });
      session.isRewarded = true;
      console.log('[ListeningRewards] Points awarded via fallback method');
    } catch (error) {
      console.error('[ListeningRewards] Fallback also failed:', error);
    }
  }

  // End a listening session
  endSession(trackId: string) {
    const sessionKey = this.getSessionKey(trackId);
    this.sessions.delete(sessionKey);
    console.log('[ListeningRewards] Ended session for track:', trackId);
  }

  // Get current session status
  getSessionStatus(trackId: string): ListeningSession | undefined {
    const sessionKey = this.getSessionKey(trackId);
    return this.sessions.get(sessionKey);
  }

  // Helper to generate session key
  private getSessionKey(trackId: string): string {
    return `track_${trackId}`;
  }

  // Clean up old sessions (call periodically)
  cleanupOldSessions() {
    const now = Date.now();
    const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

    for (const [key, session] of this.sessions.entries()) {
      if (now - session.lastProgressTime > SESSION_TIMEOUT) {
        this.sessions.delete(key);
        console.log('[ListeningRewards] Cleaned up old session:', key);
      }
    }
  }
}

export const listeningRewardsService = new ListeningRewardsService();
