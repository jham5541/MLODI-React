import { supabase } from '../lib/supabase/client';

export interface Video {
  id: string;
  title: string;
  description?: string;
  thumbnailUrl: string;
  videoUrl?: string;
  duration: number;
  views: number;
  likes: number;
  releaseDate: string;
  price?: number;
  isPremium?: boolean;
  artistId: string;
  artistName?: string;
  badgeRequired?: string;
}

export interface VideoMetrics {
  viewCount: number;
  likeCount: number;
  commentCount: number;
  shareCount: number;
}

class VideoService {
  /**
   * Get videos for an artist
   */
  async getArtistVideos(artistId: string): Promise<Video[]> {
    try {
      const { data: videos, error } = await supabase
        .from('videos')
        .select(`
          id,
          title,
          description,
          video_url,
          thumbnail_url,
          duration,
          view_count,
          price,
          is_premium,
          created_at,
          artist_id,
          artists!inner (
            id,
            name
          )
        `)
        .eq('artist_id', artistId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching artist videos:', error);
        return this.getMockVideos(artistId);
      }

      if (!videos || videos.length === 0) {
        return this.getMockVideos(artistId);
      }

      // Get like counts for videos
      const videoIds = videos.map(v => v.id);
      const likeCounts = await this.getVideoLikeCounts(videoIds);

      return videos.map(video => ({
        id: video.id,
        title: video.title,
        description: video.description,
        thumbnailUrl: video.thumbnail_url || `https://picsum.photos/400/225?random=${video.id}`,
        videoUrl: video.video_url,
        duration: video.duration || 180,
        views: video.view_count || 0,
        likes: likeCounts[video.id] || 0,
        releaseDate: video.created_at,
        price: video.price ? parseFloat(video.price) : undefined,
        isPremium: video.is_premium,
        artistId: video.artist_id,
        artistName: video.artists?.name,
      }));
    } catch (error) {
      console.error('Error in getArtistVideos:', error);
      return this.getMockVideos(artistId);
    }
  }

  /**
   * Get a single video by ID
   */
  async getVideo(videoId: string): Promise<Video | null> {
    try {
      const { data: video, error } = await supabase
        .from('videos')
        .select(`
          id,
          title,
          description,
          video_url,
          thumbnail_url,
          duration,
          view_count,
          price,
          is_premium,
          created_at,
          artist_id,
          artists!inner (
            id,
            name
          )
        `)
        .eq('id', videoId)
        .single();

      if (error) {
        console.error('Error fetching video:', error);
        return this.getMockVideo(videoId);
      }

      // Get like count
      const likeCount = await this.getVideoLikeCount(videoId);

      return {
        id: video.id,
        title: video.title,
        description: video.description || 'Experience this amazing video content.',
        thumbnailUrl: video.thumbnail_url || `https://picsum.photos/400/225?random=${video.id}`,
        videoUrl: video.video_url || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        duration: video.duration || 180,
        views: video.view_count || 0,
        likes: likeCount,
        releaseDate: video.created_at,
        price: video.price ? parseFloat(video.price) : undefined,
        isPremium: video.is_premium,
        artistId: video.artist_id,
        artistName: video.artists?.name || 'Unknown Artist',
      };
    } catch (error) {
      console.error('Error in getVideo:', error);
      return this.getMockVideo(videoId);
    }
  }

  /**
   * Get detailed metrics for a video
   */
  async getVideoMetrics(videoId: string): Promise<VideoMetrics> {
    try {
      // Get view count
      const { data: video } = await supabase
        .from('videos')
        .select('view_count')
        .eq('id', videoId)
        .single();

      // Get like count
      const { count: likeCount } = await supabase
        .from('user_likes')
        .select('*', { count: 'exact', head: true })
        .eq('liked_type', 'video')
        .eq('liked_id', videoId);

      // Get comment count (if video comments table exists)
      const { count: commentCount } = await supabase
        .from('video_comments')
        .select('*', { count: 'exact', head: true })
        .eq('video_id', videoId);

      // Calculate share count (mock for now)
      const shareCount = Math.floor((video?.view_count || 0) * 0.05);

      return {
        viewCount: video?.view_count || 0,
        likeCount: likeCount || 0,
        commentCount: commentCount || 0,
        shareCount: shareCount,
      };
    } catch (error) {
      console.error('Error fetching video metrics:', error);
      return {
        viewCount: 0,
        likeCount: 0,
        commentCount: 0,
        shareCount: 0,
      };
    }
  }

  /**
   * Increment view count for a video
   */
  async incrementViewCount(videoId: string): Promise<void> {
    try {
      // First get current view count
      const { data: video } = await supabase
        .from('videos')
        .select('view_count')
        .eq('id', videoId)
        .single();

      const currentCount = video?.view_count || 0;

      // Update with incremented count
      await supabase
        .from('videos')
        .update({ view_count: currentCount + 1 })
        .eq('id', videoId);
    } catch (error) {
      console.error('Error incrementing view count:', error);
    }
  }

  /**
   * Like or unlike a video
   */
  async toggleVideoLike(videoId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Check if already liked
      const { data: existingLike } = await supabase
        .from('user_likes')
        .select('id')
        .eq('user_id', user.id)
        .eq('liked_type', 'video')
        .eq('liked_id', videoId)
        .maybeSingle();

      if (existingLike) {
        // Unlike
        await supabase
          .from('user_likes')
          .delete()
          .eq('id', existingLike.id);
        return false;
      } else {
        // Like
        await supabase
          .from('user_likes')
          .insert({
            user_id: user.id,
            liked_type: 'video',
            liked_id: videoId,
          });
        return true;
      }
    } catch (error) {
      console.error('Error toggling video like:', error);
      throw error;
    }
  }

  /**
   * Check if user has liked a video
   */
  async isVideoLiked(videoId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data } = await supabase
        .from('user_likes')
        .select('id')
        .eq('user_id', user.id)
        .eq('liked_type', 'video')
        .eq('liked_id', videoId)
        .maybeSingle();

      return !!data;
    } catch (error) {
      console.error('Error checking video like status:', error);
      return false;
    }
  }

  /**
   * Get like count for a video
   */
  private async getVideoLikeCount(videoId: string): Promise<number> {
    try {
      const { count } = await supabase
        .from('user_likes')
        .select('*', { count: 'exact', head: true })
        .eq('liked_type', 'video')
        .eq('liked_id', videoId);

      return count || 0;
    } catch (error) {
      console.error('Error getting video like count:', error);
      return 0;
    }
  }

  /**
   * Get like counts for multiple videos
   */
  private async getVideoLikeCounts(videoIds: string[]): Promise<Record<string, number>> {
    try {
      const counts: Record<string, number> = {};
      
      // Get all likes for these videos in one query
      const { data: likes } = await supabase
        .from('user_likes')
        .select('liked_id')
        .eq('liked_type', 'video')
        .in('liked_id', videoIds);

      if (likes) {
        // Count likes per video
        likes.forEach(like => {
          counts[like.liked_id] = (counts[like.liked_id] || 0) + 1;
        });
      }

      // Initialize counts for videos with no likes
      videoIds.forEach(id => {
        if (!counts[id]) {
          counts[id] = 0;
        }
      });

      return counts;
    } catch (error) {
      console.error('Error getting video like counts:', error);
      return {};
    }
  }

  /**
   * Get mock videos for fallback
   */
  private getMockVideos(artistId: string): Video[] {
    return [
      {
        id: '1',
        title: 'Summer Nights - Official Music Video',
        thumbnailUrl: 'https://picsum.photos/400/225?random=20',
        duration: 195,
        views: 2500000,
        likes: 125000,
        releaseDate: '2023-08-20',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        artistId,
        artistName: 'Artist',
      },
      {
        id: '2',
        title: 'Electric Dreams (Live Performance)',
        thumbnailUrl: 'https://picsum.photos/400/225?random=21',
        duration: 208,
        views: 1800000,
        likes: 89000,
        releaseDate: '2023-07-15',
        price: 2.99,
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
        artistId,
        artistName: 'Artist',
      },
      {
        id: '3',
        title: 'Behind the Scenes - Golden Hour',
        thumbnailUrl: 'https://picsum.photos/400/225?random=22',
        duration: 360,
        views: 750000,
        likes: 32000,
        releaseDate: '2023-06-10',
        badgeRequired: 'Gold Fan',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        artistId,
        artistName: 'Artist',
      },
    ];
  }

  /**
   * Get mock video for fallback
   */
  private getMockVideo(videoId: string): Video {
    return {
      id: videoId,
      title: 'Summer Nights - Official Music Video',
      description: 'Experience the magic of summer nights in this official music video.',
      thumbnailUrl: 'https://picsum.photos/400/225?random=20',
      duration: 195,
      views: 2500000,
      likes: 125000,
      releaseDate: '2023-08-20',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      artistId: '1',
      artistName: 'Artist Name',
    };
  }
}

export const videoService = new VideoService();
export default videoService;
