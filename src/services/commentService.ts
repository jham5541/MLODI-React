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
  artistId: string;
  parentId?: string;
}

export interface CommentLike {
  userId: string;
  commentId: string;
  createdAt: number;
}

class CommentService {
  /**
   * Fetch comments for an artist
   */
  async fetchComments(artistId: string, userId?: string): Promise<Comment[]> {
    try {
      // Fetch top-level comments
      const { data: comments, error } = await supabase
        .from('track_comments')
        .select(`
          *,
          users (
            id,
            username,
            avatar_url
          ),
          comment_likes (
            user_id
          )
        `)
        .eq('artist_id', artistId)
        .is('parent_id', null)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching comments:', error);
        return [];
      }

      // Process comments and fetch replies
      const processedComments = await Promise.all(
        (comments || []).map(async (comment) => {
          // Fetch replies for this comment
          const { data: replies } = await supabase
            .from('track_comments')
            .select(`
              *,
              users (
                id,
                username,
                avatar_url
              ),
              comment_likes (
                user_id
              )
            `)
            .eq('parent_id', comment.id)
            .order('created_at', { ascending: true });

          return {
            id: comment.id,
            userId: comment.user_id,
            username: comment.users?.username || 'Anonymous',
            avatarUrl: comment.users?.avatar_url,
            content: comment.content,
            timestamp: new Date(comment.created_at).getTime(),
            likes: comment.comment_likes?.length || 0,
            isLiked: userId ? comment.comment_likes?.some((like: any) => like.user_id === userId) : false,
            artistId: comment.artist_id,
            replies: (replies || []).map((reply) => ({
              id: reply.id,
              userId: reply.user_id,
              username: reply.users?.username || 'Anonymous',
              avatarUrl: reply.users?.avatar_url,
              content: reply.content,
              timestamp: new Date(reply.created_at).getTime(),
              likes: reply.comment_likes?.length || 0,
              isLiked: userId ? reply.comment_likes?.some((like: any) => like.user_id === userId) : false,
              artistId: reply.artist_id,
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
    artistId: string,
    userId: string,
    content: string,
    parentId?: string
  ): Promise<Comment | null> {
    try {
      const { data: comment, error } = await supabase
        .from('track_comments')
        .insert({
          artist_id: artistId,
          user_id: userId,
          content: content,
          parent_id: parentId || null,
          created_at: new Date().toISOString(),
        })
        .select(`
          *,
          users (
            id,
            username,
            avatar_url
          )
        `)
        .single();

      if (error) {
        console.error('Error adding comment:', error);
        return null;
      }

      return {
        id: comment.id,
        userId: comment.user_id,
        username: comment.users?.username || 'Anonymous',
        avatarUrl: comment.users?.avatar_url,
        content: comment.content,
        timestamp: new Date(comment.created_at).getTime(),
        likes: 0,
        isLiked: false,
        artistId: comment.artist_id,
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
  async toggleCommentLike(commentId: string, userId: string): Promise<boolean> {
    try {
      // Check if like exists
      const { data: existingLike } = await supabase
        .from('comment_likes')
        .select('*')
        .eq('comment_id', commentId)
        .eq('user_id', userId)
        .single();

      if (existingLike) {
        // Unlike - remove the like
        const { error } = await supabase
          .from('comment_likes')
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
          .from('comment_likes')
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
  async deleteComment(commentId: string, userId: string): Promise<boolean> {
    try {
      // First verify the user owns the comment
      const { data: comment } = await supabase
        .from('track_comments')
        .select('user_id')
        .eq('id', commentId)
        .single();

      if (!comment || comment.user_id !== userId) {
        console.error('Unauthorized to delete comment');
        return false;
      }

      // Delete the comment (and cascade delete replies and likes)
      const { error } = await supabase
        .from('track_comments')
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
   * Get comment count for an artist
   */
  async getCommentCount(artistId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('track_comments')
        .select('*', { count: 'exact', head: true })
        .eq('artist_id', artistId);

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
