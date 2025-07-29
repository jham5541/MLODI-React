import { useCallback, useEffect, useState } from 'react';
import { fanScoringService } from '../services/fanScoringService';
import { leaderboardService } from '../services/leaderboardService';
import { 
  EngagementType, 
  ArtistFanScore, 
  FanLeaderboard, 
  LeaderboardType,
  FanRankInfo
} from '../types/fanScoring';

/**
 * Hook for tracking fan engagement with artists
 */
export const useFanScoring = () => {
  const trackEngagement = useCallback(async (
    userId: string,
    artistId: string,
    engagementType: EngagementType,
    metadata?: any
  ) => {
    try {
      await fanScoringService.trackEngagement(userId, artistId, engagementType, metadata);
    } catch (error) {
      console.error('Failed to track engagement:', error);
    }
  }, []);

  // Music streaming engagement tracking
  const trackSongPlay = useCallback((userId: string, songId: string, artistId: string, duration: number = 0) => {
    trackEngagement(userId, artistId, EngagementType.SONG_PLAY, { songId, duration });
  }, [trackEngagement]);

  const trackSongComplete = useCallback((userId: string, songId: string, artistId: string, completionRate: number) => {
    trackEngagement(userId, artistId, EngagementType.SONG_COMPLETE, { songId, completionRate });
  }, [trackEngagement]);

  const trackAlbumPlay = useCallback((userId: string, albumId: string, artistId: string) => {
    trackEngagement(userId, artistId, EngagementType.ALBUM_PLAY, { albumId });
  }, [trackEngagement]);

  const trackPlaylistAdd = useCallback((userId: string, songId: string, artistId: string, playlistId: string) => {
    trackEngagement(userId, artistId, EngagementType.PLAYLIST_ADD, { songId, playlistId });
  }, [trackEngagement]);

  const trackSongShare = useCallback((userId: string, songId: string, artistId: string) => {
    trackEngagement(userId, artistId, EngagementType.SONG_SHARE, { songId });
  }, [trackEngagement]);

  // Purchase tracking
  const trackSongPurchase = useCallback((userId: string, songId: string, artistId: string, amount: number) => {
    trackEngagement(userId, artistId, EngagementType.SONG_PURCHASE, { songId, purchaseAmount: amount });
  }, [trackEngagement]);

  const trackAlbumPurchase = useCallback((userId: string, albumId: string, artistId: string, amount: number) => {
    trackEngagement(userId, artistId, EngagementType.ALBUM_PURCHASE, { albumId, purchaseAmount: amount });
  }, [trackEngagement]);

  const trackMerchandisePurchase = useCallback((userId: string, artistId: string, amount: number) => {
    trackEngagement(userId, artistId, EngagementType.MERCHANDISE, { purchaseAmount: amount });
  }, [trackEngagement]);

  const trackConcertTicketPurchase = useCallback((userId: string, artistId: string, eventId: string, amount: number) => {
    trackEngagement(userId, artistId, EngagementType.CONCERT_TICKET, { eventId, purchaseAmount: amount });
  }, [trackEngagement]);

  // Video engagement tracking
  const trackVideoView = useCallback((userId: string, videoId: string, artistId: string, duration: number = 0) => {
    trackEngagement(userId, artistId, EngagementType.VIDEO_VIEW, { videoId, duration });
  }, [trackEngagement]);

  const trackVideoComplete = useCallback((userId: string, videoId: string, artistId: string, completionRate: number) => {
    trackEngagement(userId, artistId, EngagementType.VIDEO_COMPLETE, { videoId, completionRate });
  }, [trackEngagement]);

  const trackVideoLike = useCallback((userId: string, videoId: string, artistId: string) => {
    trackEngagement(userId, artistId, EngagementType.VIDEO_LIKE, { videoId });
  }, [trackEngagement]);

  const trackVideoShare = useCallback((userId: string, videoId: string, artistId: string) => {
    trackEngagement(userId, artistId, EngagementType.VIDEO_SHARE, { videoId });
  }, [trackEngagement]);

  // Social engagement tracking
  const trackArtistFollow = useCallback((userId: string, artistId: string) => {
    trackEngagement(userId, artistId, EngagementType.ARTIST_FOLLOW);
  }, [trackEngagement]);

  const trackPostLike = useCallback((userId: string, artistId: string, postId: string) => {
    trackEngagement(userId, artistId, EngagementType.POST_LIKE, { postId });
  }, [trackEngagement]);

  const trackPostComment = useCallback((userId: string, artistId: string, postId: string) => {
    trackEngagement(userId, artistId, EngagementType.POST_COMMENT, { postId });
  }, [trackEngagement]);

  const trackPostShare = useCallback((userId: string, artistId: string, postId: string) => {
    trackEngagement(userId, artistId, EngagementType.POST_SHARE, { postId });
  }, [trackEngagement]);

  // Event tracking
  const trackConcertAttendance = useCallback((userId: string, artistId: string, eventId: string) => {
    trackEngagement(userId, artistId, EngagementType.CONCERT_ATTENDANCE, { eventId });
  }, [trackEngagement]);

  const trackMeetGreet = useCallback((userId: string, artistId: string, eventId: string) => {
    trackEngagement(userId, artistId, EngagementType.MEET_GREET, { eventId });
  }, [trackEngagement]);

  const trackVipExperience = useCallback((userId: string, artistId: string, eventId: string) => {
    trackEngagement(userId, artistId, EngagementType.VIP_EXPERIENCE, { eventId });
  }, [trackEngagement]);

  return {
    trackEngagement,
    // Music streaming
    trackSongPlay,
    trackSongComplete,
    trackAlbumPlay,
    trackPlaylistAdd,
    trackSongShare,
    // Purchases
    trackSongPurchase,
    trackAlbumPurchase,
    trackMerchandisePurchase,
    trackConcertTicketPurchase,
    // Video engagement
    trackVideoView,
    trackVideoComplete,
    trackVideoLike,
    trackVideoShare,
    // Social engagement
    trackArtistFollow,
    trackPostLike,
    trackPostComment,
    trackPostShare,
    // Events
    trackConcertAttendance,
    trackMeetGreet,
    trackVipExperience,
  };
};

/**
 * Hook for getting fan scores and leaderboards
 */
export const useFanLeaderboard = (artistId: string, type: LeaderboardType = LeaderboardType.ALL_TIME) => {
  const [leaderboard, setLeaderboard] = useState<FanLeaderboard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = useCallback(async (limit?: number, offset?: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await leaderboardService.generateArtistLeaderboard({
        artistId,
        type,
        limit,
        offset
      });
      setLeaderboard(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch leaderboard');
    } finally {
      setLoading(false);
    }
  }, [artistId, type]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  return {
    leaderboard,
    loading,
    error,
    refetch: fetchLeaderboard
  };
};

/**
 * Hook for getting user's fan rank for an artist
 */
export const useUserFanRank = (userId: string, artistId: string, type: LeaderboardType = LeaderboardType.ALL_TIME) => {
  const [rankInfo, setRankInfo] = useState<FanRankInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRank = useCallback(async () => {
    if (!userId || !artistId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await leaderboardService.getUserRank(userId, artistId, type);
      setRankInfo(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch rank');
    } finally {
      setLoading(false);
    }
  }, [userId, artistId, type]);

  useEffect(() => {
    fetchRank();
  }, [fetchRank]);

  return {
    rankInfo,
    loading,
    error,
    refetch: fetchRank
  };
};

/**
 * Hook for getting user's fan score for an artist
 */
export const useArtistFanScore = (userId: string, artistId: string) => {
  const [fanScore, setFanScore] = useState<ArtistFanScore | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchScore = useCallback(async () => {
    if (!userId || !artistId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const score = await fanScoringService.getFanScore(userId, artistId);
      setFanScore(score);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch fan score');
    } finally {
      setLoading(false);
    }
  }, [userId, artistId]);

  useEffect(() => {
    fetchScore();
  }, [fetchScore]);

  return {
    fanScore,
    loading,
    error,
    refetch: fetchScore
  };
};

/**
 * Hook for getting user's top artists by fan score
 */
export const useUserTopArtists = (userId: string) => {
  const [topArtists, setTopArtists] = useState<ArtistFanScore[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTopArtists = useCallback(async () => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const scores = await fanScoringService.getUserFanScores(userId);
      setTopArtists(scores);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch top artists');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchTopArtists();
  }, [fetchTopArtists]);

  return {
    topArtists,
    loading,
    error,
    refetch: fetchTopArtists
  };
};
