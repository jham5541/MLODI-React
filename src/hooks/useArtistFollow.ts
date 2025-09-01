import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase/client';
import { musicService } from '../services/musicService';

/**
 * Hook to manage artist follow state with database integration
 */
export function useArtistFollow(artistId: string) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is following the artist
  const checkFollowStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsFollowing(false);
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('user_follows')
        .select('id')
        .eq('user_id', user.id)
        .eq('followed_type', 'artist')
        .eq('followed_id', artistId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        console.error('Error checking follow status:', error);
      }

      setIsFollowing(!!data);
    } catch (error) {
      console.error('Failed to check follow status:', error);
      setIsFollowing(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Follow the artist
  const followArtist = async () => {
    try {
      await musicService.followArtist(artistId);
      setIsFollowing(true);
      return true;
    } catch (error) {
      console.error('Failed to follow artist:', error);
      return false;
    }
  };

  // Unfollow the artist
  const unfollowArtist = async () => {
    try {
      await musicService.unfollowArtist(artistId);
      setIsFollowing(false);
      return true;
    } catch (error) {
      console.error('Failed to unfollow artist:', error);
      return false;
    }
  };

  // Toggle follow status
  const toggleFollow = async () => {
    if (isFollowing) {
      return await unfollowArtist();
    } else {
      return await followArtist();
    }
  };

  // Check follow status on mount and when artistId changes
  useEffect(() => {
    if (artistId) {
      checkFollowStatus();
    }
  }, [artistId]);

  // Subscribe to realtime changes
  useEffect(() => {
    if (!artistId) return;

    const subscription = supabase
      .channel(`artist-follow-${artistId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_follows',
          filter: `followed_id=eq.${artistId}`,
        },
        () => {
          // Refresh follow status when changes occur
          checkFollowStatus();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [artistId]);

  return {
    isFollowing,
    isLoading,
    followArtist,
    unfollowArtist,
    toggleFollow,
    refetch: checkFollowStatus,
  };
}
