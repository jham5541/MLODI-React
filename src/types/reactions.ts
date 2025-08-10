export type ReactionType = 'like' | 'love' | 'fire' | 'wow' | 'sad' | 'angry';

export interface ReactionCount {
  reaction_type: ReactionType;
  count: number;
}

export interface TrackReaction {
  id: string;
  track_id: string;
  user_id: string;
  reaction_type: ReactionType;
  created_at: string;
}
