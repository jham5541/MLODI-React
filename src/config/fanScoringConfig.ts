import { EngagementType } from '../types/fanScoring';

export const ENGAGEMENT_POINTS: Record<EngagementType, number> = {
  // Music Streaming
  [EngagementType.SONG_PLAY]: 1,
  [EngagementType.SONG_COMPLETE]: 3,
  [EngagementType.ALBUM_PLAY]: 5,
  [EngagementType.PLAYLIST_ADD]: 8,
  [EngagementType.SONG_SHARE]: 10,
  [EngagementType.SONG_REPEAT]: 2,

  // Purchases
  [EngagementType.SONG_PURCHASE]: 50,
  [EngagementType.ALBUM_PURCHASE]: 100,
  [EngagementType.MERCHANDISE]: 75,
  [EngagementType.CONCERT_TICKET]: 150,

  // Video Content
  [EngagementType.VIDEO_VIEW]: 2,
  [EngagementType.VIDEO_COMPLETE]: 5,
  [EngagementType.VIDEO_LIKE]: 8,
  [EngagementType.VIDEO_SHARE]: 12,
  [EngagementType.VIDEO_COMMENT]: 10,

  // Social Engagement
  [EngagementType.ARTIST_FOLLOW]: 25,
  [EngagementType.POST_LIKE]: 3,
  [EngagementType.POST_COMMENT]: 5,
  [EngagementType.POST_SHARE]: 10,

  // Special Events
  [EngagementType.CONCERT_ATTENDANCE]: 200,
  [EngagementType.MEET_GREET]: 300,
  [EngagementType.VIP_EXPERIENCE]: 500,
  [EngagementType.NEW_RELEASE_EARLY_ACCESS]: 100,
};

export const TIME_MULTIPLIERS = {
  LAST_24_HOURS: 3.0,
  LAST_7_DAYS: 2.0,
  LAST_30_DAYS: 1.5,
  LAST_90_DAYS: 1.2,
  OLDER: 1.0,
};

export const LOYALTY_BONUSES = {
  CONSECUTIVE_DAYS: {
    7: 1.1,    // 10% bonus for 7 days straight
    14: 1.15,  // 15% bonus for 14 days
    30: 1.2,   // 20% bonus for 30 days
    60: 1.25,  // 25% bonus for 60 days
    90: 1.3,   // 30% bonus for 90 days
    180: 1.4,  // 40% bonus for 180 days
    365: 1.5,  // 50% bonus for 365 days
  },
  FAN_SINCE: {
    NEW_RELEASE_SUPPORT: 50,     // Engaged within 24hrs of new release
    EARLY_ADOPTER: 100,          // Fan since before artist had 10k followers
    DAY_ONE: 200,                // Fan since artist's first release
    BETA_TESTER: 300,            // Fan during app beta period
  }
};

export const QUALITY_MULTIPLIERS = {
  LISTENING_DEPTH: {
    SKIP_RATE_VERY_LOW: 1.3,     // <5% skip rate
    SKIP_RATE_LOW: 1.2,          // 5-10% skip rate
    SKIP_RATE_MEDIUM: 1.0,       // 10-30% skip rate  
    SKIP_RATE_HIGH: 0.8,         // 30-50% skip rate
    SKIP_RATE_VERY_HIGH: 0.6,    // >50% skip rate
  },
  ENGAGEMENT_CONSISTENCY: {
    DAILY: 1.3,
    WEEKLY: 1.1,
    MONTHLY: 1.0,
    SPORADIC: 0.9,
  },
  COMPLETION_RATE: {
    COMPLETE_LISTEN: 1.5,        // 90%+ completion
    MOSTLY_COMPLETE: 1.2,        // 70-90% completion
    PARTIAL: 1.0,                // 30-70% completion
    BRIEF: 0.7,                  // <30% completion
  }
};

export const DAILY_CAPS = {
  [EngagementType.SONG_PLAY]: 100,         // Max 100 song plays counted per day
  [EngagementType.VIDEO_VIEW]: 50,         // Max 50 video views counted per day
  [EngagementType.POST_LIKE]: 20,          // Max 20 post likes counted per day
  [EngagementType.POST_COMMENT]: 10,       // Max 10 comments counted per day
  [EngagementType.SONG_SHARE]: 5,          // Max 5 shares counted per day
};

export const ANTI_GAMING = {
  MIN_PLAY_DURATION: 10,           // Minimum 10 seconds for a play to count
  MAX_RAPID_ACTIONS: 10,           // Max 10 rapid actions per minute
  COOLDOWN_PERIOD: 60000,          // 1 minute cooldown for rapid actions
  SUSPICIOUS_THRESHOLD: 1000,       // Flag accounts with >1000 points/hour
};

export const BADGE_THRESHOLDS = {
  BRONZE_FAN: 100,
  SILVER_FAN: 500,
  GOLD_FAN: 1000,
  PLATINUM_FAN: 2500,
  DIAMOND_FAN: 5000,
  LEGENDARY_FAN: 10000,
};

export const LEADERBOARD_LIMITS = {
  DEFAULT: 50,
  MAX: 500,
  SUPERFANS: 100,
  NEW_FANS: 25,
};
