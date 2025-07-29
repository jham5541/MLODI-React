import React, { useEffect, useCallback } from 'react';
import { View, Text, ScrollView, FlatList, TouchableOpacity, RefreshControl, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme, colors } from '../context/ThemeContext';
import { useSearch } from '../context/SearchContext';
import { usePlay } from '../context/PlayContext';
import AuthButton from '../components/auth/AuthButton';
import SongCard from '../components/common/SongCard';
import ArtistCard from '../components/common/ArtistCard';
import PlaylistCarousel from '../components/home/PlaylistCarousel';
import ArtistCarousel from '../components/home/ArtistCarousel';
import RadioCarousel from '../components/home/RadioCarousel';
import ChartCarousel from '../components/home/ChartCarousel';
import SongList from '../components/home/SongList';
import { SubscriptionStatusCard } from '../components/SubscriptionStatusCard';
import { useMusicStore } from '../store/musicStore';
import { usePlaylistStore } from '../store/playlistStore';
import Top10ArtistCard from '../components/home/Top10ArtistCard';
import { useMarketplaceStore } from '../store/marketplaceStore';
import { createCommonStyles, LoadingState, EmptyState } from '../utils/uiHelpers';
import { useBatchAsyncOperations } from '../hooks/useAsyncOperation';

export default function HomeScreen() {
  const { activeTheme, toggleTheme } = useTheme();
  const themeColors = colors[activeTheme];
  const { openSearch } = useSearch();
  const { playSong } = usePlay();
  const navigation = useNavigation();

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

  // Mock data for demonstration
  const mockTop10Artists = [
    { id: '1', name: 'Taylor Swift', coverUrl: 'https://picsum.photos/80/80?random=1', isVerified: true, genres: ['Pop'], followers: 100000000 },
    { id: '2', name: 'Drake', coverUrl: 'https://picsum.photos/80/80?random=2', isVerified: true, genres: ['Hip-Hop'], followers: 95000000 },
    { id: '3', name: 'Bad Bunny', coverUrl: 'https://picsum.photos/80/80?random=3', isVerified: true, genres: ['Reggaeton'], followers: 90000000 },
    { id: '4', name: 'The Weeknd', coverUrl: 'https://picsum.photos/80/80?random=4', isVerified: false, genres: ['R&B'], followers: 85000000 },
    { id: '5', name: 'Ariana Grande', coverUrl: 'https://picsum.photos/80/80?random=5', isVerified: false, genres: ['Pop'], followers: 80000000 },
    { id: '6', name: 'Post Malone', coverUrl: 'https://picsum.photos/80/80?random=6', isVerified: false, genres: ['Hip-Hop'], followers: 75000000 },
    { id: '7', name: 'Billie Eilish', coverUrl: 'https://picsum.photos/80/80?random=7', isVerified: false, genres: ['Pop'], followers: 70000000 },
    { id: '8', name: 'Ed Sheeran', coverUrl: 'https://picsum.photos/80/80?random=8', isVerified: false, genres: ['Pop'], followers: 65000000 },
    { id: '9', name: 'Olivia Rodrigo', coverUrl: 'https://picsum.photos/80/80?random=9', isVerified: false, genres: ['Pop'], followers: 60000000 },
    { id: '10', name: 'Dua Lipa', coverUrl: 'https://picsum.photos/80/80?random=10', isVerified: false, genres: ['Pop'], followers: 55000000 },
  ];

  const mockDailyMixes = [
    {
      id: '1',
      name: 'Daily Mix 1',
      description: 'Your favorite tracks mixed with new discoveries',
      coverUrl: 'https://via.placeholder.com/200x200?text=Daily+Mix+1',
      songs: [],
      isPrivate: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '2',
      name: 'Daily Mix 2',
      description: 'Electronic and dance hits',
      coverUrl: 'https://via.placeholder.com/200x200?text=Daily+Mix+2',
      songs: [],
      isPrivate: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const mockRadioStations = [
    {
      id: '1',
      name: 'Top Hits Radio',
      genre: 'Pop',
      description: 'The biggest hits right now',
      coverUrl: 'https://via.placeholder.com/160x120?text=Top+Hits',
      isLive: true,
    },
    {
      id: '2',
      name: 'Chill Vibes',
      genre: 'Ambient',
      description: 'Relaxing sounds for focus',
      coverUrl: 'https://via.placeholder.com/160x120?text=Chill+Vibes',
      isLive: true,
    },
  ];

  const mockCharts = [
    {
      id: '1',
      name: 'Global Top 50',
      category: 'Global',
      description: 'The most played songs worldwide',
      coverUrl: 'https://via.placeholder.com/180x140?text=Global+Top+50',
      position: 1,
      trending: 'up' as const,
      trackCount: 50,
    },
    {
      id: '2',
      name: 'Viral 50',
      category: 'Trending',
      description: 'Songs going viral right now',
      coverUrl: 'https://via.placeholder.com/180x140?text=Viral+50',
      position: 2,
      trending: 'up' as const,
      trackCount: 50,
    },
  ];

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
    playSong(song, queue);
  };

  const handleArtistPress = (artist: any) => {
    console.log('Navigate to artist:', artist.name);
    navigation.navigate('ArtistProfile', { artistId: artist.id });
  };

  const handlePlaylistPress = (playlist: any) => {
    console.log('Navigate to playlist:', playlist.name);
    // TODO: Navigate to playlist detail screen
  };

  const handleRadioPress = (station: any) => {
    console.log('Play radio station:', station.name);
    const radioSong = {
      id: `radio-${station.id}`,
      title: `${station.name} - Live Radio`,
      artist: station.genre,
      artistId: station.id,
      album: 'Live Radio',
      coverUrl: station.coverUrl,
      duration: 3600, // 1 hour for radio
      audioUrl: '',
      isRadio: true,
    };
    playSong(radioSong, [radioSong]);
  };

  const handleChartPress = (chart: any) => {
    console.log('Navigate to chart:', chart.name);
    // TODO: Navigate to chart detail screen
  };

  const commonStyles = createCommonStyles(themeColors);
  const styles = StyleSheet.create({
    ...commonStyles,
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    logo: {
      width: 40,
      height: 40,
      resizeMode: 'contain',
    },
    logoText: {
      fontSize: 24,
      fontWeight: 'bold',
      color: themeColors.primary,
      marginLeft: 8,
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
    themeButton: {
      padding: 8,
      borderRadius: 20,
      backgroundColor: themeColors.surface,
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
    songsList: {
      marginHorizontal: -4,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: themeColors.text,
      marginLeft: 16,
      marginBottom: 12,
    },
  });

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
          <View style={styles.headerLeft}>
            <Image source={require('../../assets/images/logo.png')} style={styles.logo} />
            <Text style={styles.logoText}>MLODI</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.searchButton} onPress={openSearch}>
              <Ionicons name="search" size={22} color={themeColors.text} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.themeButton} onPress={toggleTheme}>
              <Ionicons name={activeTheme === 'dark' ? 'sunny' : 'moon'} size={22} color={themeColors.text} />
            </TouchableOpacity>
            <AuthButton />
          </View>
        </View>
        
        {/* Subscription Status */}
        <SubscriptionStatusCard 
          onPress={() => navigation.navigate('Subscription' as never)}
          compact={true}
        />
        
        {/* Daily Mixes Carousel */}
        <PlaylistCarousel
          title="Daily Mixes"
          playlists={mockDailyMixes}
          onPlaylistPress={handlePlaylistPress}
          onPlayPress={(playlist) => console.log('Play daily mix:', playlist.name)}
        />

        {/* Popular Artists Carousel */}
        <ArtistCarousel
          title="Popular Artists"
          artists={followedArtists.length > 0 ? followedArtists : []}
          onArtistPress={handleArtistPress}
        />

        {/* Top 10 Artists Carousel */}
        <View style={{ marginVertical: 16 }}>
          <Text style={styles.sectionTitle}>Top 10 Artists</Text>
          <FlatList
            data={mockTop10Artists}
            renderItem={({ item, index }) => (
              <Top10ArtistCard
                artist={item}
                rank={index + 1}
                onPress={() => navigation.navigate('ArtistProfile', { artistId: item.id })}
              />
            )}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16 }}
          />
        </View>

        {/* Radio Stations Carousel */}
        <RadioCarousel
          title="Radio Stations"
          stations={mockRadioStations}
          onStationPress={handleRadioPress}
        />

        {/* Top Charts Carousel */}
        <ChartCarousel
          title="Top Charts"
          charts={mockCharts}
          onChartPress={handleChartPress}
        />

        {/* Popular Tracks List */}
        <SongList
          title="Popular Tracks"
          songs={trendingSongs.length > 0 ? trendingSongs : popularSongs}
          onSongPress={handleSongPress}
          maxItems={8}
        />
      </View>
    </ScrollView>
  );
}
