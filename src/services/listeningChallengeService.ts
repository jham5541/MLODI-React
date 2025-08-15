import { supabase } from '../lib/supabase';
import { challengeProgressService } from './challengeProgressService';
import { fanEngagementService } from './fanEngagementService';
import { Song } from './musicService';

interface ListeningSession {
  songId: string;
  artistId: string;
  startTime: number;
  duration: number;
  completionPercentage: number;
}

class ListeningChallengeService {
  private activeListeningSessions: Map<string, ListeningSession> = new Map();
  private artistSongCounts: Map<string, Set<string>> = new Map(); // Track unique songs per artist

  /**
   * Start tracking a song play
   */
  async startSongPlay(song: Song) {
    if (!song || !song.id || !song.artist_id) return;

    const sessionId = `${song.id}-${Date.now()}`;
    this.activeListeningSessions.set(sessionId, {
      songId: song.id,
      artistId: song.artist_id,
      startTime: Date.now(),
      duration: song.duration_ms || 0,
      completionPercentage: 0
    });

    return sessionId;
  }

  /**
   * Update song play progress
   */
  async updateSongProgress(sessionId: string, currentPositionMs: number) {
    const session = this.activeListeningSessions.get(sessionId);
    if (!session) return;

    const completionPercentage = session.duration > 0 
      ? (currentPositionMs / session.duration) * 100 
      : 0;

    session.completionPercentage = completionPercentage;
  }

  /**
   * Complete a song play and check challenges
   */
  async completeSongPlay(sessionId: string, finalPositionMs?: number) {
    const session = this.activeListeningSessions.get(sessionId);
    if (!session) return;

    // Calculate final completion percentage
    const completionPercentage = finalPositionMs && session.duration > 0
      ? (finalPositionMs / session.duration) * 100
      : session.completionPercentage;

    // Only count as a valid play if listened to at least 80% of the song
    if (completionPercentage >= 80) {
      await this.processSongListenForChallenges(session);
    }

    // Clean up session
    this.activeListeningSessions.delete(sessionId);
  }

  /**
   * Process song listen for challenge progress
   */
  private async processSongListenForChallenges(session: ListeningSession) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      // Track unique song for artist
      if (!this.artistSongCounts.has(session.artistId)) {
        this.artistSongCounts.set(session.artistId, new Set());
      }
      this.artistSongCounts.get(session.artistId)!.add(session.songId);

      // Get all active listening challenges
      const { data: activeChallenges, error } = await supabase
        .from('challenge_progress')
        .select(`
          *,
          challenges!inner(
            id,
            category,
            title,
            points_reward
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .eq('challenges.category', 'listening');

      if (error) {
        console.error('Error fetching active challenges:', error);
        return;
      }

      // Process each active listening challenge
      for (const progressRecord of activeChallenges || []) {
        await this.updateChallengeProgress(progressRecord, session);
      }

      // Check for artist-specific challenges
      await this.checkArtistSpecificChallenges(user.id, session.artistId);

    } catch (error) {
      console.error('Error processing song listen for challenges:', error);
    }
  }

  /**
   * Update progress for a specific challenge
   */
  private async updateChallengeProgress(progressRecord: any, session: ListeningSession) {
    const challenge = progressRecord.challenges;
    
    // Check if this is an artist-specific challenge
    const metadata = progressRecord.metadata || {};
    if (metadata.artistId && metadata.artistId !== session.artistId) {
      return; // Skip if not for the right artist
    }

    // Record the action
    const updatedProgress = await challengeProgressService.recordAction(
      challenge.id,
      'LISTEN_SONG',
      1
    );

    // If challenge is completed, award points
    if (updatedProgress?.status === 'completed') {
      await this.awardChallengePoints(progressRecord, challenge.points_reward);
    }
  }

  /**
   * Check for artist-specific challenges (like "Listen to 5 songs by this artist")
   */
  private async checkArtistSpecificChallenges(userId: string, artistId: string) {
    // Get count of unique songs listened to for this artist
    const uniqueSongsCount = this.artistSongCounts.get(artistId)?.size || 0;

    // Check if there's an artist-specific listening challenge
    const { data: artistChallenge } = await supabase
      .from('challenge_progress')
      .select(`
        *,
        challenges!inner(
          id,
          title,
          points_reward,
          target_value
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .like('challenges.title', `%artist%`)
      .single();

    if (artistChallenge && artistChallenge.metadata?.artistId === artistId) {
      // Update progress based on unique songs count
      if (uniqueSongsCount !== artistChallenge.current_value) {
        const { error } = await supabase
          .from('challenge_progress')
          .update({
            current_value: uniqueSongsCount,
            updated_at: new Date().toISOString(),
            status: uniqueSongsCount >= artistChallenge.challenges.target_value ? 'completed' : 'active'
          })
          .eq('id', artistChallenge.id);

        if (!error && uniqueSongsCount >= artistChallenge.challenges.target_value) {
          await this.awardChallengePoints(artistChallenge, artistChallenge.challenges.points_reward);
        }
      }
    }
  }

  /**
   * Award points for completing a challenge
   */
  private async awardChallengePoints(challengeProgress: any, pointsReward: number) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      // Award points to user's wallet
      const { error: walletError } = await supabase
        .from('user_wallets')
        .upsert({
          user_id: user.id,
          points_balance: pointsReward,
          total_points_earned: pointsReward,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id',
          ignoreDuplicates: false
        });

      if (walletError) {
        // If wallet doesn't exist, create it
        if (walletError.code === '23505') {
          await supabase
            .from('user_wallets')
            .insert({
              user_id: user.id,
              points_balance: pointsReward,
              total_points_earned: pointsReward
            });
        } else {
          // Update existing wallet
          const { data: currentWallet } = await supabase
            .from('user_wallets')
            .select('points_balance, total_points_earned')
            .eq('user_id', user.id)
            .single();

          if (currentWallet) {
            await supabase
              .from('user_wallets')
              .update({
                points_balance: (currentWallet.points_balance || 0) + pointsReward,
                total_points_earned: (currentWallet.total_points_earned || 0) + pointsReward,
                updated_at: new Date().toISOString()
              })
              .eq('user_id', user.id);
          }
        }
      }

      // If artist-specific, also update fan engagement points
      const artistId = challengeProgress.metadata?.artistId;
      if (artistId) {
        await fanEngagementService.updateFanPoints(
          artistId,
          pointsReward,
          'challenge_completed'
        );
      }

      // Log the reward
      await supabase
        .from('point_transactions')
        .insert({
          user_id: user.id,
          points: pointsReward,
          transaction_type: 'challenge_reward',
          description: `Completed challenge: ${challengeProgress.challenges?.title || 'Challenge'}`,
          metadata: {
            challenge_id: challengeProgress.challenge_id,
            artist_id: artistId
          }
        });

      console.log(`Awarded ${pointsReward} points for completing challenge`);
    } catch (error) {
      console.error('Error awarding challenge points:', error);
    }
  }

  /**
   * Get artist song listen count for current session
   */
  getArtistSongCount(artistId: string): number {
    return this.artistSongCounts.get(artistId)?.size || 0;
  }

  /**
   * Reset artist song counts (e.g., for daily challenges)
   */
  resetArtistCounts() {
    this.artistSongCounts.clear();
  }
}

export const listeningChallengeService = new ListeningChallengeService();
