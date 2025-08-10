import React, { useEffect, useCallback, useState } from 'react';
import { View, Text, ScrollView, FlatList, TouchableOpacity, RefreshControl, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme, colors } from '../context/ThemeContext';
import { useSearch } from '../context/SearchContext';
import { usePlay } from '../context/PlayContext';
import { useAuthStore } from '../store/authStore';
import AuthButton from '../components/auth/AuthButton';
import SongCard from '../components/common/SongCard';
import ArtistCard from '../components/common/ArtistCard';
import PlaylistCarousel from '../components/home/PlaylistCarousel';
import ArtistCarousel from '../components/home/ArtistCarousel';
import RadioCarousel from '../components/home/RadioCarousel';
import ChartCarousel from '../components/home/ChartCarousel';
import SongList from '../components/home/SongList';
import FeaturedPlaylists from '../components/home/FeaturedPlaylists';
import { SubscriptionStatusCard } from '../components/SubscriptionStatusCard';
import { useMusicStore } from '../store/musicStore';
import { usePlaylistStore } from '../store/playlistStore';
import Top10ArtistCard from '../components/home/Top10ArtistCard';
import { useMarketplaceStore } from '../store/marketplaceStore';
import { createCommonStyles, LoadingState, EmptyState } from '../utils/uiHelpers';
import { useBatchAsyncOperations } from '../hooks/useAsyncOperation';
import MLService from '../services/ml/MLServiceLite';
import { TrackRecommendation, EmergingArtist } from '../services/ml/types';

export default function HomeScreen() {
  const { activeTheme, toggleTheme } = useTheme();
  const themeColors = colors[activeTheme];
  const { openSearch } = useSearch();
  const { playSong } = usePlay();
  const navigation = useNavigation();
  const { user } = useAuthStore();
  
  // ML-powered states
  const [mlRecommendations, setMlRecommendations] = useState<TrackRecommendation[]>([]);
  const [emergingArtists, setEmergingArtists] = useState<EmergingArtist[]>([]);
  const [topPerformingArtists, setTopPerformingArtists] = useState<any[]>([]);
  const [userMood, setUserMood] = useState<'happy' | 'sad' | 'energetic' | 'calm' | null>(null);
  const [isLoadingML, setIsLoadingML] = useState(false);
  const [isLoadingTop10, setIsLoadingTop10] = useState(false);

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
  
  // Initialize ML Service
  useEffect(() => {
    MLService.initialize();
    if (user) {
      loadMLRecommendations();
      loadEmergingArtists();
    }
  }, [user]);
  
  const loadMLRecommendations = async () => {
    if (!user) return;
    
    setIsLoadingML(true);
    try {
      const recommendations = await MLService.getRecommendations(
        user.id,
        20,
        { moodFilter: userMood || undefined }
      );
      setMlRecommendations(recommendations);
    } catch (error) {
      console.error('Error loading ML recommendations:', error);
    } finally {
      setIsLoadingML(false);
    }
  };
  
  const loadEmergingArtists = async () => {
    try {
      const artists = await MLService.getEmergingArtists(5);
      setEmergingArtists(artists);
    } catch (error) {
      console.error('Error loading emerging artists:', error);
    }
  };

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

  const mockEmergingArtists = [
    { artistId: 'e1', name: 'Rina Sawayama', viralPotential: 0.92, growthRate: 0.75, metrics: { weeklyListenerGrowth: 1200, playlistAdditions: 300, shareRate: 0.15, completionRate: 0.88 } },
    { artistId: 'e2', name: 'beabadoobee', viralPotential: 0.88, growthRate: 0.81, metrics: { weeklyListenerGrowth: 1500, playlistAdditions: 450, shareRate: 0.22, completionRate: 0.91 } },
    { artistId: 'e3', name: 'Arlo Parks', viralPotential: 0.85, growthRate: 0.65, metrics: { weeklyListenerGrowth: 950, playlistAdditions: 250, shareRate: 0.18, completionRate: 0.93 } },
    { artistId: 'e4', name: 'Holly Humberstone', viralPotential: 0.91, growthRate: 0.89, metrics: { weeklyListenerGrowth: 1800, playlistAdditions: 500, shareRate: 0.25, completionRate: 0.89 } },
    { artistId: 'e5', name: 'Glass Animals', viralPotential: 0.89, growthRate: 0.72, metrics: { weeklyListenerGrowth: 1100, playlistAdditions: 320, shareRate: 0.19, completionRate: 0.90 } },
  ];

  const mockDailyMixes = [
    {
      id: '1',
      name: 'Daily Mix 1',
      description: 'Your favorite tracks mixed with new discoveries',
      coverUrl: 'https://images.unsplash.com/photo-1571609073887-38dc9b063f59?w=400&h=400&fit=crop',
      songs: [],
      isPrivate: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '2',
      name: 'Daily Mix 2',
      description: 'Electronic and dance hits',
      coverUrl: 'https://images.unsplash.com/photo-1619983081593-e2ba5b543168?w=400&h=400&fit=crop',
      songs: [],
      isPrivate: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '3',
      name: 'Daily Mix 3',
      description: 'Acoustic and indie favorites',
      coverUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop',
      songs: [],
      isPrivate: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '4',
      name: 'Workout Mix',
      description: 'High energy tracks for your workout',
      coverUrl: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=400&h=400&fit=crop',
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
      coverUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop',
      isLive: true,
    },
    {
      id: '2',
      name: 'Chill Vibes',
      genre: 'Ambient',
      description: 'Relaxing sounds for focus',
      coverUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop',
      isLive: true,
    },
    {
      id: '3',
      name: 'Hip Hop Central',
      genre: 'Hip Hop',
      description: 'Latest hip hop and rap hits',
      coverUrl: 'https://images.unsplash.com/photo-1577648188599-291bb8b831c3?w=400&h=300&fit=crop',
      isLive: true,
    },
    {
      id: '4',
      name: 'Jazz & Blues',
      genre: 'Jazz',
      description: 'Smooth jazz and soulful blues',
      coverUrl: 'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=400&h=300&fit=crop',
      isLive: false,
    },
    {
      id: '5',
      name: 'Electronic Beats',
      genre: 'Electronic',
      description: 'EDM, house, and techno',
      coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=300&fit=crop',
      isLive: true,
    },
    {
      id: '6',
      name: 'Rock Classics',
      genre: 'Rock',
      description: 'Timeless rock anthems',
      coverUrl: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=400&h=300&fit=crop',
      isLive: false,
    },
  ];

  const mockCharts = [
    {
      id: '1',
      name: 'Global Top 50',
      category: 'Global',
      description: 'The most played songs worldwide',
      coverUrl: 'https://images.unsplash.com/photo-1614680376593-902f74cf0d41?w=450&h=350&fit=crop',
      position: 1,
      trending: 'up' as const,
      trackCount: 50,
    },
    {
      id: '2',
      name: 'Viral 50',
      category: 'Trending',
      description: 'Songs going viral right now',
      coverUrl: 'https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=450&h=350&fit=crop',
      position: 2,
      trending: 'up' as const,
      trackCount: 50,
    },
    {
      id: '3',
      name: 'New Music Friday',
      category: 'New',
      description: 'Fresh releases every Friday',
      coverUrl: 'https://images.unsplash.com/photo-1594623930572-300a3011d9ae?w=450&h=350&fit=crop',
      position: 3,
      trending: 'up' as const,
      trackCount: 75,
    },
    {
      id: '4',
      name: 'Summer Hits',
      category: 'Seasonal',
      description: 'Hot tracks for the summer',
      coverUrl: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=450&h=350&fit=crop',
      position: 4,
      trending: 'stable' as const,
      trackCount: 60,
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
        loadTopPerformingArtists(), // Load top performing artists
      ]);
    } catch (error) {
      console.error('Failed to load initial data:', error);
    }
  };

  const loadTopPerformingArtists = async () => {
    setIsLoadingTop10(true);
    try {
      const artists = await MLService.getTopPerformingArtists();
      setTopPerformingArtists(artists);
    } catch (error) {
      console.error('Error loading top performing artists:', error);
    } finally {
      setIsLoadingTop10(false);
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
    },
    moodSelector: {
      flexDirection: 'row',
      padding: 16,
      gap: 8,
      marginBottom: 16,
    },
    moodButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: themeColors.surface,
      borderWidth: 1,
      borderColor: themeColors.border,
    },
    moodButtonActive: {
      backgroundColor: themeColors.primary,
      borderColor: themeColors.primary,
    },
    moodButtonText: {
      fontSize: 14,
      color: themeColors.text,
    },
    moodButtonTextActive: {
      color: 'white',
    },
    emergingArtistCard: {
      width: 150,
      marginRight: 12,
      backgroundColor: themeColors.surface,
      borderRadius: 12,
      padding: 12,
    },
    emergingArtistImage: {
      width: '100%',
      height: 120,
      borderRadius: 8,
      marginBottom: 8,
    },
    emergingArtistName: {
      fontSize: 16,
      fontWeight: '600',
      color: themeColors.text,
      marginBottom: 4,
    },
    emergingArtistMetric: {
      fontSize: 12,
      color: themeColors.textSecondary,
    },
    mlBadge: {
      backgroundColor: themeColors.primary,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 14,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginLeft: 8,
    },
    mlBadgeText: {
      fontSize: 11,
      color: 'white',
      fontWeight: '600',
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
      paddingHorizontal: 16,
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
        
        
        {/* ML-Powered Recommendations */}
        {user && mlRecommendations.length > 0 && (
          <View style={{ marginBottom: 24 }}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recommended for You</Text>
              <View style={styles.mlBadge}>
                <Ionicons name="sparkles" size={12} color="white" />
                <Text style={styles.mlBadgeText}>AI Powered</Text>
              </View>
            </View>
            <FlatList
              data={recommendedSongs.slice(0, 10)}
              renderItem={({ item }) => (
                <SongCard
                  song={item}
                  onPress={() => handleSongPress(item)}
                />
              )}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16 }}
            />
          </View>
        )}
        
        {/* Daily Mixes Carousel */}
        <PlaylistCarousel
          title="Daily Mixes"
          playlists={mockDailyMixes}
          onPlaylistPress={handlePlaylistPress}
          onPlayPress={(playlist) => console.log('Play daily mix:', playlist.name)}
        />

        
        {/* Featured Playlists */}
        <FeaturedPlaylists />

        {/* Popular Artists Carousel */}
        <ArtistCarousel
          title="Popular Artists"
          artists={followedArtists.length > 0 ? followedArtists : []}
          onArtistPress={handleArtistPress}
        />

        {/* Top 10 Artists Carousel - ML Powered */}
        <View style={{ marginVertical: 16 }}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Top 10 Artists</Text>
            <View style={styles.mlBadge}>
              <Ionicons name="trophy" size={12} color="white" />
              <Text style={styles.mlBadgeText}>Top 1%</Text>
            </View>
          </View>
          {isLoadingTop10 ? (
            <LoadingState text="Loading top artists..." themeColors={themeColors} />
          ) : topPerformingArtists.length > 0 ? (
            <FlatList
              data={topPerformingArtists.slice(0, 10)}
              renderItem={({ item, index }) => (
                <Top10ArtistCard
                  artist={{
                    id: item.artistId,
                    name: `Artist ${item.artistId.slice(-4)}`,
                    coverUrl: `https://picsum.photos/80/80?random=${item.artistId}`,
                    isVerified: item.engagementScore > 0.8,
                    genres: ['Genre'],
                    followers: Math.round(item.metrics.weeklyListenerGrowth * 10000)
                  }}
                  rank={index + 1}
                  onPress={() => navigation.navigate('ArtistProfile', { artistId: item.artistId })}
                />
              )}
              keyExtractor={(item) => item.artistId}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16 }}
            />
          ) : (
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
          )}
        </View>

        {/* Emerging Artists Carousel */}
        <View style={{ marginVertical: 16 }}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Emerging Artists</Text>
            <View style={styles.mlBadge}>
              <Ionicons name="rocket" size={12} color="white" />
              <Text style={styles.mlBadgeText}>AI Discovered</Text>
            </View>
          </View>
          <FlatList
            data={emergingArtists.length > 0 ? emergingArtists : mockEmergingArtists}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.emergingArtistCard}
                onPress={() => navigation.navigate('ArtistProfile', { artistId: item.artistId })}
              >
                <Image
                  source={{ uri: `https://picsum.photos/150/120?random=${item.artistId}` }}
                  style={styles.emergingArtistImage}
                />
                <Text style={styles.emergingArtistName} numberOfLines={1}>
                  {item.name || `Artist ${item.artistId.slice(-4)}`}
                </Text>
                <Text style={styles.emergingArtistMetric}>
                  {Math.round(item.viralPotential * 100)}% Viral Potential
                </Text>
                <Text style={styles.emergingArtistMetric}>
                  +{Math.round(item.growthRate * 100)}% Growth
                </Text>
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item.artistId}
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
