import { supabase } from '../lib/supabase';

interface ChallengeProgress {
  id: string;
  userId: string;
  challengeId: string;
  currentValue: number;
  targetValue: number;
  startedAt: string;
  updatedAt: string;
  status: 'active' | 'completed' | 'expired';
}

interface ChallengeActionLog {
  id: string;
  userId: string;
  challengeId: string;
  actionType: string;
  actionValue: number;
  timestamp: string;
}

class ChallengeProgressService {
  private activeProgress: Map<string, ChallengeProgress> = new Map();
  private actionListeners: Map<string, ((action: any) => void)[]> = new Map();
  private initialized = false;

  private async ensureInitialized() {
    if (!initialized) {
      await this.loadActiveProgress();
      this.initialized = true;
    }
  }

  private async loadActiveProgress() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: progress, error } = await supabase
      .from('challenge_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active');

    if (error) {
      console.error('Error loading challenge progress:', error);
      return;
    }

    progress?.forEach(p => {
      this.activeProgress.set(p.challenge_id, {
        id: p.id,
        userId: p.user_id,
        challengeId: p.challenge_id,
        currentValue: p.current_value,
        targetValue: p.target_value,
        startedAt: p.started_at,
        updatedAt: p.updated_at,
        status: p.status
      });
    });
  }

  async startChallenge(challengeId: string, targetValue: number) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User must be authenticated to start a challenge');
    }

    // Reset existing progress if it exists
    this.activeProgress.delete(challengeId);

    // Create new progress record
    const progress: ChallengeProgress = {
      id: `prog_${Date.now()}`,
      userId: user.id,
      challengeId,
      currentValue: 0,
      targetValue,
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'active'
    };

    // Save to database
    const { error } = await supabase
      .from('challenge_progress')
      .insert({
        user_id: user.id,
        challenge_id: challengeId,
        current_value: 0,
        target_value: targetValue,
        started_at: progress.startedAt,
        updated_at: progress.updatedAt,
        status: 'active'
      });

    if (error) {
      console.error('Error starting challenge:', error);
      throw error;
    }

    this.activeProgress.set(challengeId, progress);
    return progress;
  }

  async recordAction(challengeId: string, actionType: string, value: number = 1) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await this.ensureInitialized();

    const progress = this.activeProgress.get(challengeId);
    if (!progress || progress.status !== 'active') return;

    // Log the action
    const { error: logError } = await supabase
      .from('challenge_action_logs')
      .insert({
        user_id: user.id,
        challenge_id: challengeId,
        action_type: actionType,
        action_value: value,
        timestamp: new Date().toISOString()
      });

    if (logError) {
      console.error('Error logging challenge action:', logError);
      return;
    }

    // Update progress
    const newValue = progress.currentValue + value;
    progress.currentValue = newValue;
    progress.updatedAt = new Date().toISOString();

    if (newValue >= progress.targetValue) {
      progress.status = 'completed';
    }

    // Update database
    const { error: updateError } = await supabase
      .from('challenge_progress')
      .update({
        current_value: newValue,
        updated_at: progress.updatedAt,
        status: progress.status
      })
      .eq('challenge_id', challengeId)
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Error updating challenge progress:', updateError);
      return;
    }

    // Notify listeners
    const listeners = this.actionListeners.get(challengeId);
    if (listeners) {
      listeners.forEach(listener => listener({
        type: actionType,
        value,
        progress
      }));
    }

    return progress;
  }

  addActionListener(challengeId: string, listener: (action: any) => void) {
    const listeners = this.actionListeners.get(challengeId) || [];
    listeners.push(listener);
    this.actionListeners.set(challengeId, listeners);
  }

  removeActionListener(challengeId: string, listener: (action: any) => void) {
    const listeners = this.actionListeners.get(challengeId);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
      if (listeners.length === 0) {
        this.actionListeners.delete(challengeId);
      }
    }
  }

  async getProgress(challengeId: string): Promise<ChallengeProgress | null> {
    await this.ensureInitialized();
    return this.activeProgress.get(challengeId) || null;
  }

  // Rules for different action types
  readonly CHALLENGE_RULES = {
    LISTEN_SONG: {
      // Must listen to at least 80% of song duration
      minDuration: 0.8,
      // No more than 3 skips per song
      maxSkips: 3,
      // Maximum of 2 simultaneous streams
      maxSimultaneousStreams: 2
    },
    SHARE_CONTENT: {
      // Minimum 30 minutes between shares
      minTimeBetweenShares: 30 * 60 * 1000,
      // Must be different content each time
      requireUnique: true
    },
    CREATE_PLAYLIST: {
      // Minimum songs in playlist
      minSongs: 5,
      // Maximum songs in playlist
      maxSongs: 50,
      // Must have description
      requireDescription: true
    },
    ENGAGE_COMMUNITY: {
      // Minimum comment length
      minCommentLength: 10,
      // Maximum comments per hour
      maxCommentsPerHour: 10,
      // Must wait between likes
      minTimeBetweenLikes: 5 * 60 * 1000
    }
  };

  // Validate action based on rules
  validateAction(actionType: string, params: any): boolean {
    const rules = this.CHALLENGE_RULES[actionType];
    if (!rules) return true; // No rules defined

    switch (actionType) {
      case 'LISTEN_SONG':
        return (
          params.duration >= params.totalDuration * rules.minDuration &&
          params.skips <= rules.maxSkips &&
          params.simultaneousStreams <= rules.maxSimultaneousStreams
        );

      case 'SHARE_CONTENT':
        const lastShare = params.lastShareTime;
        const timeSinceLastShare = Date.now() - lastShare;
        return (
          timeSinceLastShare >= rules.minTimeBetweenShares &&
          (!rules.requireUnique || !params.sharedContentIds.includes(params.contentId))
        );

      case 'CREATE_PLAYLIST':
        return (
          params.songCount >= rules.minSongs &&
          params.songCount <= rules.maxSongs &&
          (!rules.requireDescription || params.description?.trim().length > 0)
        );

      case 'ENGAGE_COMMUNITY':
        return (
          params.commentLength >= rules.minCommentLength &&
          params.commentsInLastHour <= rules.maxCommentsPerHour &&
          params.timeSinceLastLike >= rules.minTimeBetweenLikes
        );

      default:
        return true;
    }
  }
}

export const challengeProgressService = new ChallengeProgressService();
