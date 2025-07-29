/**
 * Example usage of the Fan Scoring System
 * 
 * This file demonstrates how to integrate the fan scoring system
 * into your existing music app components.
 */

import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useFanScoring, useFanLeaderboard, useUserFanRank } from '../hooks/useFanScoring';
import FanLeaderboard from '../components/fan/FanLeaderboard';
import UserRankCard from '../components/fan/UserRankCard';
import { EngagementType, LeaderboardType } from '../types/fanScoring';

// Example: Music Player Component Integration
export const MusicPlayerExample = ({ 
  userId, 
  songId, 
  artistId, 
  duration 
}: {
  userId: string;
  songId: string;
  artistId: string;
  duration: number;
}) => {
  const { trackSongPlay, trackSongComplete } = useFanScoring();

  // Track when song starts playing
  const handleSongPlay = () => {
    trackSongPlay(userId, songId, artistId, duration);
  };

  // Track when song is completed (80%+ listened)
  const handleSongComplete = (completionRate: number) => {
    if (completionRate >= 0.8) {
      trackSongComplete(userId, songId, artistId, completionRate);
    }
  };

  return (
    <View>
      <TouchableOpacity onPress={handleSongPlay}>
        <Text>Play Song</Text>
      </TouchableOpacity>
      {/* Your music player UI */}
    </View>
  );
};

// Example: Artist Profile Page Integration
export const ArtistProfileExample = ({ 
  artistId, 
  artistName, 
  currentUserId 
}: {
  artistId: string;
  artistName: string;
  currentUserId: string;
}) => {
  const { trackArtistFollow } = useFanScoring();

  const handleFollowArtist = () => {
    trackArtistFollow(currentUserId, artistId);
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Artist info */}
      <View>
        <Text>{artistName}</Text>
        <TouchableOpacity onPress={handleFollowArtist}>
          <Text>Follow Artist</Text>
        </TouchableOpacity>
      </View>

      {/* User's rank for this artist */}
      <UserRankCard
        userId={currentUserId}
        artistId={artistId}
        artistName={artistName}
        onPress={() => {
          // Navigate to full leaderboard
          console.log('Navigate to leaderboard');
        }}
      />

      {/* Artist's fan leaderboard */}
      <FanLeaderboard
        artistId={artistId}
        currentUserId={currentUserId}
        onUserPress={(userId) => {
          // Navigate to user profile
          console.log('Navigate to user:', userId);
        }}
      />
    </View>
  );
};

// Example: Purchase Flow Integration
export const PurchaseFlowExample = ({ 
  userId, 
  artistId, 
  productType 
}: {
  userId: string;
  artistId: string;
  productType: 'song' | 'album' | 'merchandise' | 'ticket';
}) => {
  const { 
    trackSongPurchase, 
    trackAlbumPurchase, 
    trackMerchandisePurchase, 
    trackConcertTicketPurchase 
  } = useFanScoring();

  const handlePurchaseComplete = (productId: string, amount: number) => {
    switch (productType) {
      case 'song':
        trackSongPurchase(userId, productId, artistId, amount);
        break;
      case 'album':
        trackAlbumPurchase(userId, productId, artistId, amount);
        break;
      case 'merchandise':
        trackMerchandisePurchase(userId, artistId, amount);
        break;
      case 'ticket':
        trackConcertTicketPurchase(userId, artistId, productId, amount);
        break;
    }
  };

  return (
    <View>
      <TouchableOpacity onPress={() => handlePurchaseComplete('product-123', 9.99)}>
        <Text>Complete Purchase</Text>
      </TouchableOpacity>
    </View>
  );
};

// Example: Video Player Integration
export const VideoPlayerExample = ({ 
  userId, 
  videoId, 
  artistId 
}: {
  userId: string;
  videoId: string;
  artistId: string;
}) => {
  const { trackVideoView, trackVideoComplete, trackVideoLike, trackVideoShare } = useFanScoring();

  useEffect(() => {
    // Track video view when component mounts
    trackVideoView(userId, videoId, artistId);
  }, []);

  const handleVideoComplete = (completionRate: number) => {
    trackVideoComplete(userId, videoId, artistId, completionRate);
  };

  const handleVideoLike = () => {
    trackVideoLike(userId, videoId, artistId);
  };

  const handleVideoShare = () => {
    trackVideoShare(userId, videoId, artistId);
  };

  return (
    <View>
      {/* Video player UI */}
      <View style={{ height: 200, backgroundColor: '#000' }}>
        <Text style={{ color: 'white' }}>Video Player</Text>
      </View>
      
      {/* Video controls */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: 10 }}>
        <TouchableOpacity onPress={handleVideoLike}>
          <Text>Like</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleVideoShare}>
          <Text>Share</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Example: Social Feed Integration
export const SocialFeedExample = ({ 
  userId, 
  artistId, 
  postId 
}: {
  userId: string;
  artistId: string;
  postId: string;
}) => {
  const { trackPostLike, trackPostComment, trackPostShare } = useFanScoring();

  const handlePostLike = () => {
    trackPostLike(userId, artistId, postId);
  };

  const handlePostComment = () => {
    trackPostComment(userId, artistId, postId);
  };

  const handlePostShare = () => {
    trackPostShare(userId, artistId, postId);
  };

  return (
    <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee' }}>
      {/* Post content */}
      <Text>Artist post content...</Text>
      
      {/* Engagement buttons */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: 12 }}>
        <TouchableOpacity onPress={handlePostLike}>
          <Text>❤️ Like</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handlePostComment}>
          <Text>💬 Comment</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handlePostShare}>
          <Text>🔄 Share</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Example: Concert/Event Integration
export const ConcertEventExample = ({ 
  userId, 
  artistId, 
  eventId 
}: {
  userId: string;
  artistId: string;
  eventId: string;
}) => {
  const { trackConcertAttendance, trackMeetGreet, trackVipExperience } = useFanScoring();

  const handleConcertCheckIn = () => {
    // Track when user checks in at concert venue
    trackConcertAttendance(userId, artistId, eventId);
  };

  const handleMeetGreet = () => {
    // Track meet & greet participation
    trackMeetGreet(userId, artistId, eventId);
  };

  const handleVipExperience = () => {
    // Track VIP experience participation
    trackVipExperience(userId, artistId, eventId);
  };

  return (
    <View>
      <Text>Concert Event</Text>
      <TouchableOpacity onPress={handleConcertCheckIn}>
        <Text>Check In at Venue</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={handleMeetGreet}>
        <Text>Meet & Greet</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={handleVipExperience}>
        <Text>VIP Experience</Text>
      </TouchableOpacity>
    </View>
  );
};

// Example: Dashboard Integration
export const FanDashboardExample = ({ userId }: { userId: string }) => {
  const { rankInfo } = useUserFanRank(userId, 'artist-123');
  const { leaderboard } = useFanLeaderboard('artist-123', LeaderboardType.ALL_TIME);

  return (
    <View style={{ flex: 1 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', margin: 20 }}>
        Fan Dashboard
      </Text>
      
      {/* User's top artists */}
      <View style={{ margin: 20 }}>
        <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 10 }}>
          Your Top Artists
        </Text>
        {/* List user's top artists and their ranks */}
      </View>

      {/* Current rank info */}
      {rankInfo && (
        <View style={{ margin: 20 }}>
          <Text>Your Rank: #{rankInfo.currentRank}</Text>
          <Text>Points to Next Rank: {rankInfo.pointsToNextRank}</Text>
        </View>
      )}

      {/* Recent leaderboard */}
      <View style={{ flex: 1, margin: 20 }}>
        <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 10 }}>
          Top Fans
        </Text>
        {leaderboard.slice(0, 5).map((fan, index) => (
          <View key={fan.userId} style={{ flexDirection: 'row', padding: 8 }}>
            <Text>#{fan.rank} {fan.username} - {fan.fanScore} pts</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

/**
 * INTEGRATION CHECKLIST:
 * 
 * 1. Install and import the fan scoring system:
 *    - Import hooks: useFanScoring, useFanLeaderboard, useUserFanRank
 *    - Import components: FanLeaderboard, UserRankCard
 *    - Import types: EngagementType, LeaderboardType
 * 
 * 2. Add tracking to existing components:
 *    - Music player: trackSongPlay, trackSongComplete
 *    - Video player: trackVideoView, trackVideoComplete, trackVideoLike
 *    - Social features: trackPostLike, trackPostComment, trackPostShare
 *    - Purchase flows: trackSongPurchase, trackAlbumPurchase, etc.
 *    - Artist interactions: trackArtistFollow
 * 
 * 3. Add leaderboard displays:
 *    - Artist profile pages: FanLeaderboard component
 *    - User dashboards: UserRankCard component
 *    - Fan-specific pages: Full leaderboard with filtering
 * 
 * 4. Configure database/storage:
 *    - Implement actual storage methods in services
 *    - Set up database tables for engagements and scores
 *    - Configure caching for leaderboards
 * 
 * 5. Customize scoring:
 *    - Adjust point values in fanScoringConfig.ts
 *    - Modify multipliers and bonuses
 *    - Add custom engagement types if needed
 * 
 * 6. Add real-time updates:
 *    - WebSocket integration for live leaderboard updates
 *    - Push notifications for rank changes
 *    - Badge unlock notifications
 */
