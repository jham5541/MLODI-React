// ML Service Types and Interfaces

export interface AudioFeatures {
  tempo: number;
  energy: number;
  danceability: number;
  valence: number; // Musical positivity
  acousticness: number;
  instrumentalness: number;
  loudness: number;
  speechiness: number;
  key: number;
  mode: number; // Major or minor
  duration_ms: number;
}

export interface UserListeningProfile {
  userId: string;
  topGenres: string[];
  topArtists: string[];
  avgTempo: number;
  avgEnergy: number;
  avgValence: number;
  listeningTimeDistribution: Record<string, number>; // hour -> count
  totalListeningTime: number;
  uniqueTracks: number;
  repeatListens: Record<string, number>; // trackId -> count
}

export interface TrackRecommendation {
  trackId: string;
  score: number;
  reason: RecommendationReason;
  confidence: number;
}

export enum RecommendationReason {
  SIMILAR_AUDIO_FEATURES = 'similar_audio_features',
  COLLABORATIVE_FILTERING = 'collaborative_filtering',
  TRENDING_IN_NETWORK = 'trending_in_network',
  ARTIST_SIMILARITY = 'artist_similarity',
  PLAYLIST_COMPATIBILITY = 'playlist_compatibility',
  NFT_HOLDER_PREFERENCE = 'nft_holder_preference'
}

export interface UserCluster {
  clusterId: string;
  clusterType: UserClusterType;
  characteristics: {
    avgListeningHours: number;
    topGenres: string[];
    engagementLevel: 'low' | 'medium' | 'high' | 'power';
    regionality?: string;
    artistLoyalty?: string[];
  };
  userCount: number;
}

export enum UserClusterType {
  CASUAL_LISTENER = 'casual_listener',
  POWER_USER = 'power_user',
  GENRE_SPECIALIST = 'genre_specialist',
  ARTIST_LOYALIST = 'artist_loyalist',
  DISCOVERY_SEEKER = 'discovery_seeker',
  REGIONAL_FAN = 'regional_fan'
}

export interface StreamAnomaly {
  userId?: string;
  trackId: string;
  anomalyType: AnomalyType;
  confidence: number;
  timestamp: Date;
  metadata: Record<string, any>;
}

export enum AnomalyType {
  BOT_BEHAVIOR = 'bot_behavior',
  STREAM_FARMING = 'stream_farming',
  VPN_SPOOFING = 'vpn_spoofing',
  UNUSUAL_REPEAT_PATTERN = 'unusual_repeat_pattern',
  DEVICE_ANOMALY = 'device_anomaly'
}

export interface EmergingArtist {
  artistId: string;
  growthRate: number;
  engagementScore: number;
  viralPotential: number;
  predictedBreakoutDate?: Date;
  similarToTrending: string[]; // Artist IDs
  metrics: {
    weeklyListenerGrowth: number;
    playlistAdditions: number;
    shareRate: number;
    completionRate: number;
  };
}

export interface MLModelConfig {
  recommendationModel: {
    version: string;
    updateFrequency: 'daily' | 'weekly' | 'realtime';
    minDataPoints: number;
  };
  clusteringModel: {
    version: string;
    numClusters: number;
    features: string[];
  };
  anomalyDetectionModel: {
    version: string;
    sensitivity: number;
    windowSize: number;
  };
  talentDiscoveryModel: {
    version: string;
    breakoutThreshold: number;
    trendingWindow: number; // days
  };
}
