export interface ArtistFanScore {
  userId: string;
  artistId: string;
  totalScore: number;
  engagementBreakdown: {
    streaming: number;
    purchases: number;
    social: number;
    videos: number;
    events: number;
  };
  lastUpdated: Date;
  consecutiveDays: number;
  fanSince: Date;
}

export interface ArtistEngagement {
  id: string;
  userId: string;
  artistId: string;
  engagementType: EngagementType;
  points: number;
  timestamp: Date;
  metadata?: {
    songId?: string;
    albumId?: string;
    videoId?: string;
    playlistId?: string;
    duration?: number;
    completionRate?: number;
    purchaseAmount?: number;
    eventId?: string;
    postId?: string;
  };
}

export interface FanLeaderboard {
  userId: string;
  artistId: string;
  username: string;
  profilePicture?: string;
  fanScore: number;
  rank: number;
  badges: FanBadge[];
  percentile: number;
}

export interface FanBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockedAt: Date;
}

export enum EngagementType {
  // Music Streaming
  SONG_PLAY = 'SONG_PLAY',
  SONG_COMPLETE = 'SONG_COMPLETE',
  ALBUM_PLAY = 'ALBUM_PLAY',
  PLAYLIST_ADD = 'PLAYLIST_ADD',
  SONG_SHARE = 'SONG_SHARE',
  SONG_REPEAT = 'SONG_REPEAT',

  // Purchases
  SONG_PURCHASE = 'SONG_PURCHASE',
  ALBUM_PURCHASE = 'ALBUM_PURCHASE',
  MERCHANDISE = 'MERCHANDISE',
  CONCERT_TICKET = 'CONCERT_TICKET',

  // Video Content
  VIDEO_VIEW = 'VIDEO_VIEW',
  VIDEO_COMPLETE = 'VIDEO_COMPLETE',
  VIDEO_LIKE = 'VIDEO_LIKE',
  VIDEO_SHARE = 'VIDEO_SHARE',
  VIDEO_COMMENT = 'VIDEO_COMMENT',

  // Social Engagement
  ARTIST_FOLLOW = 'ARTIST_FOLLOW',
  POST_LIKE = 'POST_LIKE',
  POST_COMMENT = 'POST_COMMENT',
  POST_SHARE = 'POST_SHARE',
  
  // Special Events
  CONCERT_ATTENDANCE = 'CONCERT_ATTENDANCE',
  MEET_GREET = 'MEET_GREET',
  VIP_EXPERIENCE = 'VIP_EXPERIENCE',
  NEW_RELEASE_EARLY_ACCESS = 'NEW_RELEASE_EARLY_ACCESS',
}

export enum LeaderboardType {
  ALL_TIME = 'all_time',
  MONTHLY = 'monthly',
  WEEKLY = 'weekly',
  DAILY = 'daily',
  NEW_FANS = 'new_fans',
  SUPERFANS = 'superfans',
  LOCAL = 'local',
  GENRE = 'genre',
}

export interface LeaderboardQuery {
  artistId: string;
  type: LeaderboardType;
  limit?: number;
  offset?: number;
  timeframe?: {
    start: Date;
    end: Date;
  };
  location?: {
    country?: string;
    city?: string;
  };
}

export interface FanRankInfo {
  userId: string;
  artistId: string;
  currentRank: number;
  totalFans: number;
  percentile: number;
  pointsToNextRank: number;
  recentActivity: ArtistEngagement[];
}
