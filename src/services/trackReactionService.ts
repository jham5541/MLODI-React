import { supabase } from '../lib/supabase';
import { ReactionType } from '../types/reactions';

interface TrackReaction {
  id: string;
  track_id: string;
  user_id: string;
  reaction_type: ReactionType;
  created_at: string;
}

interface ReactionCount {
  reaction_type: ReactionType;
  count: number;
}

export const trackReactionService = {
  async getReactions(trackId: string): Promise<ReactionCount[]> {
    const { data, error } = await supabase
      .rpc('get_track_reaction_counts', { p_track_id: trackId });
    
    if (error) throw error;
    return data || [];
  },

  async getUserReactions(trackId: string, userId: string): Promise<ReactionType[]> {
    const { data, error } = await supabase
      .from('track_reactions')
      .select('reaction_type')
      .eq('track_id', trackId)
      .eq('user_id', userId);
    
    if (error) throw error;
    return data?.map(r => r.reaction_type) || [];
  },

  async addReaction(trackId: string, userId: string, reactionType: ReactionType): Promise<void> {
    const { error } = await supabase
      .from('track_reactions')
      .upsert({
        track_id: trackId,
        user_id: userId,
        reaction_type: reactionType
      }, {
        onConflict: 'track_id,user_id,reaction_type'
      });
    
    if (error) throw error;
  },

  async removeReaction(trackId: string, userId: string, reactionType: ReactionType): Promise<void> {
    const { error } = await supabase
      .from('track_reactions')
      .delete()
      .eq('track_id', trackId)
      .eq('user_id', userId)
      .eq('reaction_type', reactionType);
    
    if (error) throw error;
  },

  subscribeToReactions(trackId: string, callback: () => void) {
    return supabase
      .channel(`track_reactions:${trackId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'track_reactions',
        filter: `track_id=eq.${trackId}`
      }, callback)
      .subscribe();
  }
};

export default trackReactionService;
