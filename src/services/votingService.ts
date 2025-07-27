import { supabase } from '../lib/supabase/client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export interface Poll {
  id: string;
  title: string;
  description?: string;
  category: 'music' | 'artist' | 'genre' | 'general';
  poll_type: 'multiple_choice' | 'single_choice' | 'rating';
  is_active: boolean;
  is_featured: boolean;
  start_date: string;
  end_date?: string;
  created_by?: string;
  total_votes: number;
  max_votes_per_user: number;
  allow_anonymous: boolean;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface PollOption {
  id: string;
  poll_id: string;
  text: string;
  description?: string;
  image_url?: string;
  position: number;
  vote_count: number;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface PollVote {
  id: string;
  poll_id: string;
  option_id: string;
  user_id?: string;
  anonymous_id?: string;
  rating?: number;
  comment?: string;
  device_info?: Record<string, any>;
  ip_address?: string;
  voted_at: string;
}

export interface PollWithOptions extends Poll {
  options: PollOption[];
  user_vote?: PollVote;
  can_vote: boolean;
}

export interface PollResult {
  option_id: string;
  option_text: string;
  vote_count: number;
  percentage: number;
}

class VotingService {
  private anonymousId: string | null = null;

  constructor() {
    this.initializeAnonymousId();
  }

  private async initializeAnonymousId() {
    try {
      let id = await AsyncStorage.getItem('anonymous_voting_id');
      if (!id) {
        id = this.generateAnonymousId();
        await AsyncStorage.setItem('anonymous_voting_id', id);
      }
      this.anonymousId = id;
    } catch (error) {
      console.error('Failed to initialize anonymous ID:', error);
      this.anonymousId = this.generateAnonymousId();
    }
  }

  private generateAnonymousId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    const platform = Platform.OS;
    return `anon_${platform}_${timestamp}_${random}`;
  }

  private async getDeviceInfo() {
    return {
      platform: Platform.OS,
      version: Platform.Version,
      timestamp: new Date().toISOString(),
    };
  }

  async getActivePolls(limit = 10, category?: string): Promise<PollWithOptions[]> {
    try {
      let query = supabase
        .from('polls')
        .select(`
          *,
          poll_options (*)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (category) {
        query = query.eq('category', category);
      }

      const { data: polls, error } = await query;

      if (error) throw error;

      // Get user votes if authenticated
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;

      const pollsWithVotes = await Promise.all(
        polls?.map(async (poll) => {
          let userVote = null;
          let canVote = false;

          // Check if user has already voted
          if (userId) {
            const { data: vote } = await supabase
              .from('poll_votes')
              .select('*')
              .eq('poll_id', poll.id)
              .eq('user_id', userId)
              .single();
            userVote = vote;
          } else if (this.anonymousId) {
            const { data: vote } = await supabase
              .from('poll_votes')
              .select('*')
              .eq('poll_id', poll.id)
              .eq('anonymous_id', this.anonymousId)
              .single();
            userVote = vote;
          }

          // Check if user can vote (using database function)
          const { data: canVoteResult } = await supabase.rpc('can_user_vote', {
            poll_uuid: poll.id,
            user_uuid: userId || null,
            anon_id: this.anonymousId || null,
          });

          canVote = canVoteResult || false;

          return {
            ...poll,
            options: poll.poll_options.sort((a: PollOption, b: PollOption) => a.position - b.position),
            user_vote: userVote,
            can_vote: canVote,
          };
        }) || []
      );

      return pollsWithVotes;
    } catch (error) {
      console.error('Failed to fetch polls:', error);
      throw error;
    }
  }

  async getFeaturedPolls(): Promise<PollWithOptions[]> {
    try {
      const { data: polls, error } = await supabase
        .from('polls')
        .select(`
          *,
          poll_options (*)
        `)
        .eq('is_active', true)
        .eq('is_featured', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return polls?.map(poll => ({
        ...poll,
        options: poll.poll_options.sort((a: PollOption, b: PollOption) => a.position - b.position),
        user_vote: undefined,
        can_vote: true,
      })) || [];
    } catch (error) {
      console.error('Failed to fetch featured polls:', error);
      throw error;
    }
  }

  async getPollById(pollId: string): Promise<PollWithOptions | null> {
    try {
      const { data: poll, error } = await supabase
        .from('polls')
        .select(`
          *,
          poll_options (*)
        `)
        .eq('id', pollId)
        .single();

      if (error) throw error;
      if (!poll) return null;

      // Get user vote if authenticated
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;

      let userVote = null;
      if (userId) {
        const { data: vote } = await supabase
          .from('poll_votes')
          .select('*')
          .eq('poll_id', pollId)
          .eq('user_id', userId)
          .single();
        userVote = vote;
      } else if (this.anonymousId) {
        const { data: vote } = await supabase
          .from('poll_votes')
          .select('*')
          .eq('poll_id', pollId)
          .eq('anonymous_id', this.anonymousId)
          .single();
        userVote = vote;
      }

      // Check if user can vote
      const { data: canVoteResult } = await supabase.rpc('can_user_vote', {
        poll_uuid: pollId,
        user_uuid: userId || null,
        anon_id: this.anonymousId || null,
      });

      return {
        ...poll,
        options: poll.poll_options.sort((a: PollOption, b: PollOption) => a.position - b.position),
        user_vote: userVote,
        can_vote: canVoteResult || false,
      };
    } catch (error) {
      console.error('Failed to fetch poll:', error);
      throw error;
    }
  }

  async vote(pollId: string, optionId: string, rating?: number, comment?: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;

      if (!userId && !this.anonymousId) {
        throw new Error('Unable to identify user for voting');
      }

      // Ensure anonymous ID is available
      if (!this.anonymousId) {
        await this.initializeAnonymousId();
      }

      const deviceInfo = await this.getDeviceInfo();

      const voteData: any = {
        poll_id: pollId,
        option_id: optionId,
        device_info: deviceInfo,
        voted_at: new Date().toISOString(),
      };

      if (userId) {
        voteData.user_id = userId;
      } else {
        voteData.anonymous_id = this.anonymousId;
      }

      if (rating) {
        voteData.rating = rating;
      }

      if (comment) {
        voteData.comment = comment;
      }

      const { error } = await supabase
        .from('poll_votes')
        .insert(voteData);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Failed to vote:', error);
      throw error;
    }
  }

  async removeVote(pollId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;

      let query = supabase
        .from('poll_votes')
        .delete()
        .eq('poll_id', pollId);

      if (userId) {
        query = query.eq('user_id', userId);
      } else if (this.anonymousId) {
        query = query.eq('anonymous_id', this.anonymousId);
      } else {
        throw new Error('Unable to identify user for vote removal');
      }

      const { error } = await query;

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Failed to remove vote:', error);
      throw error;
    }
  }

  async getPollResults(pollId: string): Promise<PollResult[]> {
    try {
      const { data: results, error } = await supabase.rpc('get_poll_results', {
        poll_uuid: pollId,
      });

      if (error) throw error;

      return results || [];
    } catch (error) {
      console.error('Failed to fetch poll results:', error);
      throw error;
    }
  }

  async canUserVote(pollId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;

      const { data: canVote, error } = await supabase.rpc('can_user_vote', {
        poll_uuid: pollId,
        user_uuid: userId || null,
        anon_id: this.anonymousId || null,
      });

      if (error) throw error;

      return canVote || false;
    } catch (error) {
      console.error('Failed to check voting eligibility:', error);
      return false;
    }
  }

  // Utility method to get user's anonymous ID (for debugging)
  getAnonymousId(): string | null {
    return this.anonymousId;
  }

  // Method to reset anonymous ID (for testing)
  async resetAnonymousId(): Promise<void> {
    try {
      const newId = this.generateAnonymousId();
      await AsyncStorage.setItem('anonymous_voting_id', newId);
      this.anonymousId = newId;
    } catch (error) {
      console.error('Failed to reset anonymous ID:', error);
    }
  }
}

export const votingService = new VotingService();
export default votingService;
