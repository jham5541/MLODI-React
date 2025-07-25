import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { musicService } from '../services/musicService';
import { playlistService } from '../services/playlistService';
import { marketplaceService } from '../services/marketplaceService';
import { fanEngagementService } from '../services/fanEngagementService';

// Query Keys - Centralized for consistency
export const queryKeys = {
  // Music queries
  songs: {
    all: ['songs'] as const,
    trending: () => [...queryKeys.songs.all, 'trending'] as const,
    popular: () => [...queryKeys.songs.all, 'popular'] as const,
    recent: () => [...queryKeys.songs.all, 'recent'] as const,
    byId: (id: string) => [...queryKeys.songs.all, 'detail', id] as const,
    search: (query: string) => [...queryKeys.songs.all, 'search', query] as const,
    recommendations: (userId: string) => [...queryKeys.songs.all, 'recommendations', userId] as const,
  },
  
  artists: {
    all: ['artists'] as const,
    byId: (id: string) => [...queryKeys.artists.all, 'detail', id] as const,
    followed: (userId: string) => [...queryKeys.artists.all, 'followed', userId] as const,
    trending: () => [...queryKeys.artists.all, 'trending'] as const,
  },
  
  albums: {
    all: ['albums'] as const,
    byId: (id: string) => [...queryKeys.albums.all, 'detail', id] as const,
    byArtist: (artistId: string) => [...queryKeys.albums.all, 'artist', artistId] as const,
  },
  
  // Playlist queries
  playlists: {
    all: ['playlists'] as const,
    user: (userId: string) => [...queryKeys.playlists.all, 'user', userId] as const,
    liked: (userId: string) => [...queryKeys.playlists.all, 'liked', userId] as const,
    collaborative: (userId: string) => [...queryKeys.playlists.all, 'collaborative', userId] as const,
    byId: (id: string) => [...queryKeys.playlists.all, 'detail', id] as const,
    songs: (playlistId: string) => [...queryKeys.playlists.all, 'songs', playlistId] as const,
  },
  
  // Marketplace queries
  marketplace: {
    all: ['marketplace'] as const,
    listings: (filters?: any) => [...queryKeys.marketplace.all, 'listings', filters] as const,
    collections: () => [...queryKeys.marketplace.all, 'collections'] as const,
    trending: () => [...queryKeys.marketplace.all, 'trending'] as const,
    stats: () => [...queryKeys.marketplace.all, 'stats'] as const,
  },
  
  // Fan engagement queries
  fanEngagement: {
    all: ['fanEngagement'] as const,
    tier: (userId: string, artistId: string) => [...queryKeys.fanEngagement.all, 'tier', userId, artistId] as const,
    achievements: (userId: string, artistId?: string) => [...queryKeys.fanEngagement.all, 'achievements', userId, artistId] as const,
    challenges: (userId: string, artistId: string) => [...queryKeys.fanEngagement.all, 'challenges', userId, artistId] as const,
  },
} as const;

// Default query options
const defaultQueryOptions = {
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 30 * 60 * 1000, // 30 minutes
  retry: 2,
  refetchOnWindowFocus: false,
};

// Music Hooks
export const useTrendingSongs = (options?: UseQueryOptions) => {
  return useQuery({
    queryKey: queryKeys.songs.trending(),
    queryFn: () => musicService.getTrendingSongs(),
    ...defaultQueryOptions,
    staleTime: 2 * 60 * 1000, // 2 minutes for trending (more frequent updates)
    ...options,
  });
};

export const usePopularSongs = (options?: UseQueryOptions) => {
  return useQuery({
    queryKey: queryKeys.songs.popular(),
    queryFn: () => musicService.getPopularSongs(),
    ...defaultQueryOptions,
    ...options,
  });
};

export const useRecentSongs = (userId: string, options?: UseQueryOptions) => {
  return useQuery({
    queryKey: queryKeys.songs.recent(),
    queryFn: () => musicService.getRecentSongs({ limit: 20 }),
    ...defaultQueryOptions,
    enabled: !!userId,
    ...options,
  });
};

export const useSongRecommendations = (userId: string, options?: UseQueryOptions) => {
  return useQuery({
    queryKey: queryKeys.songs.recommendations(userId),
    queryFn: () => musicService.getRecommendations({ limit: 30 }),
    ...defaultQueryOptions,
    staleTime: 10 * 60 * 1000, // 10 minutes for recommendations
    enabled: !!userId,
    ...options,
  });
};

export const useFollowedArtists = (userId: string, options?: UseQueryOptions) => {
  return useQuery({
    queryKey: queryKeys.artists.followed(userId),
    queryFn: () => musicService.getFollowedArtists({ limit: 50 }),
    ...defaultQueryOptions,
    enabled: !!userId,
    ...options,
  });
};

export const useArtistDetail = (artistId: string, options?: UseQueryOptions) => {
  return useQuery({
    queryKey: queryKeys.artists.byId(artistId),
    queryFn: () => musicService.getArtist(artistId),
    ...defaultQueryOptions,
    staleTime: 15 * 60 * 1000, // 15 minutes for artist details
    enabled: !!artistId,
    ...options,
  });
};

// Playlist Hooks
export const useUserPlaylists = (userId: string, options?: UseQueryOptions) => {
  return useQuery({
    queryKey: queryKeys.playlists.user(userId),
    queryFn: () => playlistService.getPlaylists({ include_owner: true, limit: 50 }),
    ...defaultQueryOptions,
    enabled: !!userId,
    ...options,
  });
};

export const useLikedPlaylists = (userId: string, options?: UseQueryOptions) => {
  return useQuery({
    queryKey: queryKeys.playlists.liked(userId),
    queryFn: () => playlistService.getLikedPlaylists(),
    ...defaultQueryOptions,
    enabled: !!userId,
    ...options,
  });
};

export const usePlaylistDetail = (playlistId: string, options?: UseQueryOptions) => {
  return useQuery({
    queryKey: queryKeys.playlists.byId(playlistId),
    queryFn: () => playlistService.getPlaylist(playlistId, true),
    ...defaultQueryOptions,
    enabled: !!playlistId,
    ...options,
  });
};

export const usePlaylistSongs = (playlistId: string, options?: UseQueryOptions) => {
  return useQuery({
    queryKey: queryKeys.playlists.songs(playlistId),
    queryFn: () => playlistService.getPlaylistSongs(playlistId),
    ...defaultQueryOptions,
    enabled: !!playlistId,
    ...options,
  });
};

// Marketplace Hooks
export const useMarketplaceListings = (filters?: any, options?: UseQueryOptions) => {
  return useQuery({
    queryKey: queryKeys.marketplace.listings(filters),
    queryFn: () => marketplaceService.getListings(filters),
    ...defaultQueryOptions,
    staleTime: 1 * 60 * 1000, // 1 minute for marketplace (fast-changing)
    ...options,
  });
};

export const useMarketplaceCollections = (options?: UseQueryOptions) => {
  return useQuery({
    queryKey: queryKeys.marketplace.collections(),
    queryFn: () => marketplaceService.getCollections({ include_artist: true, limit: 20 }),
    ...defaultQueryOptions,
    ...options,
  });
};

export const useMarketplaceStats = (options?: UseQueryOptions) => {
  return useQuery({
    queryKey: queryKeys.marketplace.stats(),
    queryFn: () => marketplaceService.getMarketplaceStats(),
    ...defaultQueryOptions,
    staleTime: 5 * 60 * 1000, // 5 minutes for stats
    ...options,
  });
};

// Fan Engagement Hooks
export const useFanTier = (userId: string, artistId: string, options?: UseQueryOptions) => {
  return useQuery({
    queryKey: queryKeys.fanEngagement.tier(userId, artistId),
    queryFn: () => fanEngagementService.getFanTier(artistId),
    ...defaultQueryOptions,
    enabled: !!userId && !!artistId,
    ...options,
  });
};

export const useUserAchievements = (userId: string, artistId?: string, options?: UseQueryOptions) => {
  return useQuery({
    queryKey: queryKeys.fanEngagement.achievements(userId, artistId),
    queryFn: () => fanEngagementService.getUserAchievements(artistId),
    ...defaultQueryOptions,
    enabled: !!userId,
    ...options,
  });
};

// Mutation Hooks for write operations
export const useLikeSong = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (songId: string) => musicService.likeSong(songId),
    onSuccess: (_, songId) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.songs.all });
      
      // Optimistically update song data
      queryClient.setQueryData(queryKeys.songs.byId(songId), (old: any) => {
        if (old) {
          return { ...old, isLiked: true, like_count: (old.like_count || 0) + 1 };
        }
        return old;
      });
    },
  });
};

export const useFollowArtist = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (artistId: string) => musicService.followArtist(artistId),
    onSuccess: (_, artistId) => {
      // Invalidate followed artists query
      queryClient.invalidateQueries({ queryKey: queryKeys.artists.all });
      
      // Update artist data optimistically
      queryClient.setQueryData(queryKeys.artists.byId(artistId), (old: any) => {
        if (old) {
          return { ...old, isFollowed: true, followers_count: (old.followers_count || 0) + 1 };
        }
        return old;
      });
    },
  });
};

export const useCreatePlaylist = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: any) => playlistService.createPlaylist(data),
    onSuccess: (newPlaylist, _, { userId }) => {
      // Add to user playlists cache
      queryClient.setQueryData(queryKeys.playlists.user(userId), (old: any[]) => {
        return old ? [newPlaylist, ...old] : [newPlaylist];
      });
      
      // Invalidate all playlist queries
      queryClient.invalidateQueries({ queryKey: queryKeys.playlists.all });
    },
  });
};

// Search with debouncing
export const useSearchMusic = (query: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: queryKeys.songs.search(query),
    queryFn: () => musicService.searchMusic(query, {
      include_artists: true,
      include_albums: true,
      include_songs: true,
      limit: 20,
    }),
    ...defaultQueryOptions,
    staleTime: 10 * 60 * 1000, // 10 minutes for search results
    enabled: enabled && query.length > 2, // Only search if query is long enough
  });
};

// Prefetch helpers for better UX
export const usePrefetchQueries = () => {
  const queryClient = useQueryClient();
  
  const prefetchTrendingSongs = () => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.songs.trending(),
      queryFn: () => musicService.getTrendingSongs(),
      staleTime: 5 * 60 * 1000,
    });
  };
  
  const prefetchArtistDetail = (artistId: string) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.artists.byId(artistId),
      queryFn: () => musicService.getArtist(artistId),
      staleTime: 15 * 60 * 1000,
    });
  };
  
  const prefetchPlaylistSongs = (playlistId: string) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.playlists.songs(playlistId),
      queryFn: () => playlistService.getPlaylistSongs(playlistId),
      staleTime: 5 * 60 * 1000,
    });
  };
  
  return {
    prefetchTrendingSongs,
    prefetchArtistDetail,
    prefetchPlaylistSongs,
  };
};

// Background refresh for real-time data
export const useBackgroundRefresh = () => {
  const queryClient = useQueryClient();
  
  const refreshTrendingData = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.songs.trending() });
    queryClient.invalidateQueries({ queryKey: queryKeys.marketplace.listings() });
  };
  
  const refreshUserData = (userId: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.playlists.user(userId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.artists.followed(userId) });
  };
  
  return {
    refreshTrendingData,
    refreshUserData,
  };
};