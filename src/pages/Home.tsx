import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, colors } from '../context/ThemeContext';
import { useSearch } from '../context/SearchContext';
import AuthButton from '../components/auth/AuthButton';
import SongCard from '../components/common/SongCard';
import ArtistCard from '../components/common/ArtistCard';
import { useMusicStore } from '../store/musicStore';
import { usePlaylistStore } from '../store/playlistStore';
import { useMarketplaceStore } from '../store/marketplaceStore';

export default function HomeScreen() {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];
  const { openSearch } = useSearch();

  // Music store
  const {
    trendingSongs,
    popularSongs,
    followedArtists,
    recommendedSongs,
    isLoadingTrending,
    isLoadingPopular,
    isLoadingFollowed,
    isLoadingRecommended,
    loadTrendingSongs,
    loadPopularSongs,
    loadFollowedArtists,
    loadRecommendations,
    playSong,
  } = useMusicStore();

  // Playlist store
  const {
    userPlaylists,
    isLoadingPlaylists,
    loadUserPlaylists,
  } = usePlaylistStore();

  // Marketplace store
  const {
    featuredListings,
    loadFeaturedListings,
  } = useMarketplaceStore();

  const [refreshing, setRefreshing] = React.useState(false);

  // Load data on component mount
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      await Promise.all([
        loadTrendingSongs(),
        loadPopularSongs(),
        loadFollowedArtists(),
        loadRecommendations(),
        loadUserPlaylists(),
        loadFeaturedListings(),
      ]);
    } catch (error) {
      console.error('Failed to load initial data:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadInitialData();
    setRefreshing(false);
  };

  const handleSongPress = (song: any) => {
    // Play the song and set up queue
    const queue = trendingSongs.length > 0 ? trendingSongs : [song];
    const startIndex = queue.findIndex(s => s.id === song.id);
    playSong(song, queue, startIndex);
  };

  const handleArtistPress = (artist: any) => {
    console.log('Navigate to artist:', artist.name);
    // TODO: Navigate to artist detail screen
  };

  const handlePlaylistPress = (playlist: any) => {
    console.log('Navigate to playlist:', playlist.name);
    // TODO: Navigate to playlist detail screen
  };

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
    horizontalList: {
      paddingLeft: 16,
    },
    songsList: {
      marginHorizontal: -4,
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
  });

  const renderLoadingState = (text: string) => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="small" color={themeColors.primary} />
      <Text style={styles.loadingText}>{text}</Text>
    </View>
  );

  const renderEmptyState = (text: string) => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={[themeColors.primary]}
          tintColor={themeColors.primary}
        />
      }
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
          renderLoadingState('Loading followed artists...')
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
          renderEmptyState('Follow some artists to see them here!')
        )}
        
        {/* Trending Tracks Section */}
        <Text style={styles.sectionTitle}>Trending Tracks</Text>
        {isLoadingTrending ? (
          renderLoadingState('Loading trending songs...')
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
          renderEmptyState('No trending songs available')
        )}

        {/* Recommended For You Section */}
        {recommendedSongs.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Recommended for You</Text>
            {isLoadingRecommended ? (
              renderLoadingState('Loading recommendations...')
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
          renderLoadingState('Loading playlists...')
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
          renderEmptyState('Create your first playlist to get started!')
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