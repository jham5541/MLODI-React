import React, { useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, colors } from '../context/ThemeContext';
import { useSearch } from '../context/SearchContext';
import AuthButton from '../components/auth/AuthButton';
import SongCard from '../components/common/SongCard';
import ArtistCard from '../components/common/ArtistCard';

// Import our optimized query hooks
import {
  useTrendingSongs,
  usePopularSongs,
  useFollowedArtists,
  useSongRecommendations,
  useUserPlaylists,
  useMarketplaceListings,
  usePrefetchQueries,
  useBackgroundRefresh,
} from '../hooks/useQueryCache';

export default function HomeOptimizedScreen() {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];
  const { openSearch } = useSearch();
  
  // Get user ID from auth context (you'll need to implement this)
  const userId = 'current-user-id'; // Replace with actual user ID from auth
  
  // Optimized queries with React Query
  const {
    data: trendingSongs = [],
    isLoading: isLoadingTrending,
    error: trendingError,
    refetch: refetchTrending,
  } = useTrendingSongs();
  
  const {
    data: popularSongs = [],
    isLoading: isLoadingPopular,
    refetch: refetchPopular,
  } = usePopularSongs();
  
  const {
    data: followedArtists = [],
    isLoading: isLoadingFollowed,
    refetch: refetchFollowed,
  } = useFollowedArtists(userId);
  
  const {
    data: recommendedSongs = [],
    isLoading: isLoadingRecommended,
    refetch: refetchRecommended,
  } = useSongRecommendations(userId);
  
  const {
    data: userPlaylists = [],
    isLoading: isLoadingPlaylists,
    refetch: refetchPlaylists,
  } = useUserPlaylists(userId);
  
  const {
    data: featuredListings = [],
    refetch: refetchMarketplace,
  } = useMarketplaceListings(
    { verified_only: true, sort_by: 'price_desc', limit: 3 },
    { enabled: true }
  );
  
  // Prefetch utilities for better UX
  const { prefetchTrendingSongs, prefetchArtistDetail } = usePrefetchQueries();
  const { refreshTrendingData, refreshUserData } = useBackgroundRefresh();
  
  // Optimized refresh handler
  const handleRefresh = useCallback(async () => {
    try {
      await Promise.all([
        refetchTrending(),
        refetchPopular(),
        refetchFollowed(),
        refetchRecommended(),
        refetchPlaylists(),
        refetchMarketplace(),
      ]);
      
      // Also refresh real-time data
      refreshTrendingData();
      refreshUserData(userId);
    } catch (error) {
      console.error('Failed to refresh data:', error);
    }
  }, [
    refetchTrending,
    refetchPopular,
    refetchFollowed,
    refetchRecommended,
    refetchPlaylists,
    refetchMarketplace,
    refreshTrendingData,
    refreshUserData,
    userId,
  ]);
  
  // Optimized handlers with prefetching
  const handleSongPress = useCallback((song: any) => {
    console.log('Play song:', song.title);
    // TODO: Implement play logic
  }, []);
  
  const handleArtistPress = useCallback((artist: any) => {
    // Prefetch artist data for better UX
    prefetchArtistDetail(artist.id);
    console.log('Navigate to artist:', artist.name);
    // TODO: Navigate to artist detail screen
  }, [prefetchArtistDetail]);
  
  const handlePlaylistPress = useCallback((playlist: any) => {
    console.log('Navigate to playlist:', playlist.name);
    // TODO: Navigate to playlist detail screen
  }, []);
  
  // Check if we're currently refreshing any data
  const isRefreshing = isLoadingTrending || isLoadingPopular || isLoadingFollowed || isLoadingRecommended;
  
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeColors.background,
    },
    content: {
      padding: 16,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    searchButton: {
      padding: 8,
      borderRadius: 20,
      backgroundColor: themeColors.surface,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: themeColors.text,
    },
    subtitle: {
      fontSize: 18,
      color: themeColors.textSecondary,
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: themeColors.text,
      marginBottom: 12,
      marginTop: 24,
    },
    loadingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    },
    loadingText: {
      marginLeft: 8,
      color: themeColors.textSecondary,
    },
    emptyState: {
      padding: 20,
      alignItems: 'center',
    },
    emptyText: {
      color: themeColors.textSecondary,
      textAlign: 'center',
      fontSize: 14,
    },
    errorContainer: {
      padding: 20,
      alignItems: 'center',
      backgroundColor: themeColors.error + '20',
      borderRadius: 8,
      margin: 16,
    },
    errorText: {
      color: themeColors.error,
      textAlign: 'center',
      marginBottom: 8,
    },
    retryButton: {
      backgroundColor: themeColors.primary,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 6,
    },
    retryButtonText: {
      color: 'white',
      fontWeight: '600',
    },
    horizontalList: {
      paddingLeft: 16,
    },
    songsList: {
      marginHorizontal: -4,
    },
    placeholder: {
      padding: 20,
      backgroundColor: themeColors.surface,
      borderRadius: 12,
      marginBottom: 16,
    },
    placeholderText: {
      color: themeColors.textSecondary,
      textAlign: 'center',
    },
  });
  
  // Error handler component
  const ErrorState = ({ error, onRetry, title }: { error: any; onRetry: () => void; title: string }) => (
    <View style={styles.errorContainer}>
      <Text style={styles.errorText}>Failed to load {title}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
        <Text style={styles.retryButtonText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );
  
  // Loading state component
  const LoadingState = ({ text }: { text: string }) => (
    <View style={styles.loadingContainer}>
      <Ionicons name="musical-note" size={24} color={themeColors.primary} />
      <Text style={styles.loadingText}>{text}</Text>
    </View>
  );
  
  // Empty state component
  const EmptyState = ({ text }: { text: string }) => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
  
  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          colors={[themeColors.primary]}
          tintColor={themeColors.primary}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Welcome to M3lodi</Text>
            <Text style={styles.subtitle}>Your Web3 Music Platform</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.searchButton} onPress={openSearch}>
              <Ionicons name="search" size={20} color={themeColors.text} />
            </TouchableOpacity>
            <AuthButton />
          </View>
        </View>

        {/* Followed Artists Section */}
        <Text style={styles.sectionTitle}>Following</Text>
        {isLoadingFollowed ? (
          <LoadingState text="Loading followed artists..." />
        ) : followedArtists.length > 0 ? (
          <FlatList
            data={followedArtists}
            renderItem={({ item }) => (
              <ArtistCard
                artist={item}
                onPress={() => handleArtistPress(item)}
              />
            )}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          />
        ) : (
          <EmptyState text="Follow some artists to see them here!" />
        )}
        
        {/* Trending Tracks Section */}
        <Text style={styles.sectionTitle}>Trending Tracks</Text>
        {trendingError ? (
          <ErrorState 
            error={trendingError} 
            onRetry={refetchTrending} 
            title="trending songs" 
          />
        ) : isLoadingTrending ? (
          <LoadingState text="Loading trending songs..." />
        ) : trendingSongs.length > 0 ? (
          <View style={styles.songsList}>
            {trendingSongs.slice(0, 3).map((song) => (
              <SongCard
                key={song.id}
                song={song}
                onPress={() => handleSongPress(song)}
              />
            ))}
          </View>
        ) : (
          <EmptyState text="No trending songs available" />
        )}

        {/* Recommended For You Section */}
        {recommendedSongs.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Recommended for You</Text>
            {isLoadingRecommended ? (
              <LoadingState text="Loading recommendations..." />
            ) : (
              <View style={styles.songsList}>
                {recommendedSongs.slice(0, 3).map((song) => (
                  <SongCard
                    key={song.id}
                    song={song}
                    onPress={() => handleSongPress(song)}
                  />
                ))}
              </View>
            )}
          </>
        )}
        
        {/* Your Playlists Section */}
        <Text style={styles.sectionTitle}>Your Playlists</Text>
        {isLoadingPlaylists ? (
          <LoadingState text="Loading playlists..." />
        ) : userPlaylists.length > 0 ? (
          <FlatList
            data={userPlaylists.slice(0, 5)}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={styles.placeholder}
                onPress={() => handlePlaylistPress(item)}
              >
                <Text style={styles.placeholderText}>
                  {item.name} • {item.total_tracks} tracks
                </Text>
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          />
        ) : (
          <EmptyState text="Create your first playlist to get started!" />
        )}
        
        {/* Featured NFTs Section */}
        <Text style={styles.sectionTitle}>Featured Music NFTs</Text>
        {featuredListings.length > 0 ? (
          <FlatList
            data={featuredListings.slice(0, 3)}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.placeholder}>
                <Text style={styles.placeholderText}>
                  {item.song?.title || 'Music NFT'} • {item.price} {item.currency}
                </Text>
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>Browse the marketplace for exclusive music NFTs</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}