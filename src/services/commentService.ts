import { supabase } from '../lib/supabase/client';

export interface Comment {
  id: string;
  userId: string;
  username: string;
  avatarUrl?: string;
  content: string;
  timestamp: number;
  likes: number;
  isLiked: boolean;
  replies?: Comment[];
  trackId: string;
  parentId?: string;
}

export interface CommentLike {
  userId: string;
  commentId: string;
  createdAt: number;
}

class CommentService {
  private getTables(scope: 'track' | 'artist') {
    if (scope === 'artist') {
      return {
        commentsTable: 'artist_comments',
        likesTable: 'artist_comment_likes',
        foreignIdColumn: 'artist_id',
        fkProfilesAlias: 'artist_comments_user_fk',
      } as const;
    }
    return {
      commentsTable: 'track_comments',
      likesTable: 'comment_likes',
      foreignIdColumn: 'track_id',
      fkProfilesAlias: 'fk_track_comments_user' as const,
    } as const;
  }

  /**
   * Fetch comments for a target (track or artist)
   */
  async fetchComments(targetId: string, userId?: string, scope: 'track' | 'artist' = 'track'): Promise<Comment[]> {
    try {
      const { commentsTable, likesTable, foreignIdColumn, fkProfilesAlias } = this.getTables(scope);
      const profilesEmbed = `profiles!${fkProfilesAlias} (id, username, avatar_url)`;
      // Fetch top-level comments
      const { data: comments, error } = await supabase
        .from(commentsTable)
        .select(`
          *,
          ${profilesEmbed},
          ${likesTable} (user_id)
        `)
        .eq(foreignIdColumn, targetId)
        .is('parent_id', null)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching comments:', error);
        return [];
      }

      // Process comments and fetch replies
      const processedComments = await Promise.all(
        (comments || []).map(async (comment) => {
          // Fetch replies for this comment (if you use threaded replies)
          const { data: replies } = await supabase
            .from(commentsTable)
            .select(`
              *,
              ${profilesEmbed},
              ${likesTable} (user_id)
            `)
            .eq('parent_id', comment.id)
            .order('created_at', { ascending: true });

          return {
            id: comment.id,
            userId: comment.user_id,
            username: comment.profiles?.username || 'Anonymous',
            avatarUrl: comment.profiles?.avatar_url,
            content: comment.content ?? comment.body,
            timestamp: new Date(comment.created_at).getTime(),
            likes: (comment as any)[likesTable]?.length || 0,
            isLiked: userId ? ((comment as any)[likesTable]?.some((like: any) => like.user_id === userId)) : false,
            trackId: comment.track_id,
            replies: (replies || []).map((reply) => ({
              id: reply.id,
              userId: reply.user_id,
              username: reply.profiles?.username || 'Anonymous',
              avatarUrl: reply.profiles?.avatar_url,
              content: reply.content ?? reply.body,
              timestamp: new Date(reply.created_at).getTime(),
              likes: (reply as any)[likesTable]?.length || 0,
              isLiked: userId ? ((reply as any)[likesTable]?.some((like: any) => like.user_id === userId)) : false,
              trackId: reply.track_id,
              parentId: reply.parent_id,
            })),
          };
        })
      );

      return processedComments;
    } catch (error) {
      console.error('Error in fetchComments:', error);
      return [];
    }
  }

  /**
   * Add a new comment
   */
  async addComment(
    targetId: string,
    userId: string,
    content: string,
    parentId?: string,
    scope: 'track' | 'artist' = 'track'
  ): Promise<Comment | null> {
    try {
      const { commentsTable, foreignIdColumn, fkProfilesAlias } = this.getTables(scope);
      const profilesEmbed = fkProfilesAlias
        ? `profiles!${fkProfilesAlias} (id, username, avatar_url)`
        : `profiles (id, username, avatar_url)`;
      const { data: comment, error } = await supabase
        .from(commentsTable)
        .insert({
          [foreignIdColumn]: targetId,
          user_id: userId,
          content: content,
          parent_id: parentId || null,
        } as any)
        .select(`
          *,
          ${profilesEmbed}
        `)
        .single();

      if (error) {
        console.error('Error adding comment:', error);
        return null;
      }

      return {
        id: comment.id,
        userId: comment.user_id,
        username: comment.profiles?.username || 'Anonymous',
        avatarUrl: comment.profiles?.avatar_url,
        content: comment.content ?? comment.body,
        timestamp: new Date(comment.created_at).getTime(),
        likes: 0,
        isLiked: false,
        trackId: comment.track_id,
        parentId: comment.parent_id,
      };
    } catch (error) {
      console.error('Error in addComment:', error);
      return null;
    }
  }

  /**
   * Like or unlike a comment
   */
  async toggleCommentLike(commentId: string, userId: string, scope: 'track' | 'artist' = 'track'): Promise<boolean> {
    try {
      const { likesTable } = this.getTables(scope);
      // Check if like exists
      const { data: existingLike } = await supabase
        .from(likesTable)
        .select('*')
        .eq('comment_id', commentId)
        .eq('user_id', userId)
        .maybeSingle();

      if (existingLike) {
        // Unlike - remove the like
        const { error } = await supabase
          .from(likesTable)
          .delete()
          .eq('comment_id', commentId)
          .eq('user_id', userId);

        if (error) {
          console.error('Error removing like:', error);
          return false;
        }
      } else {
        // Like - add the like
        const { error } = await supabase
          .from(likesTable)
          .insert({
            comment_id: commentId,
            user_id: userId,
            created_at: new Date().toISOString(),
          });

        if (error) {
          console.error('Error adding like:', error);
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Error in toggleCommentLike:', error);
      return false;
    }
  }

  /**
   * Delete a comment (only by the author)
   */
  async deleteComment(commentId: string, userId: string, scope: 'track' | 'artist' = 'track'): Promise<boolean> {
    try {
      const { commentsTable } = this.getTables(scope);
      // First verify the user owns the comment
      const { data: comment } = await supabase
        .from(commentsTable)
        .select('user_id')
        .eq('id', commentId)
        .single();

      if (!comment || comment.user_id !== userId) {
        console.error('Unauthorized to delete comment');
        return false;
      }

      // Delete the comment (and cascade delete replies and likes)
      const { error } = await supabase
        .from(commentsTable)
        .delete()
        .eq('id', commentId);

      if (error) {
        console.error('Error deleting comment:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteComment:', error);
      return false;
    }
  }

  /**
   * Get comment count for a track
   */
  async getCommentCount(targetId: string, scope: 'track' | 'artist' = 'track'): Promise<number> {
    try {
      const { commentsTable, foreignIdColumn } = this.getTables(scope);
      const { count, error } = await supabase
        .from(commentsTable)
        .select('*', { count: 'exact', head: true })
        .eq(foreignIdColumn, targetId);

      if (error) {
        console.error('Error getting comment count:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('Error in getCommentCount:', error);
      return 0;
    }
  }
}

export default new CommentService();
