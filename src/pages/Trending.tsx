import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme, colors } from '../context/ThemeContext';
import { useMusicStore } from '../store/musicStore';
import TrendingHero from '../components/trending/TrendingHero';
import TrendingFilters from '../components/trending/TrendingFilters';
import TrendingList from '../components/trending/TrendingList';
import TrendingPoll from '../components/trending/TrendingPoll';
import GenreGrid from '../components/trending/GenreGrid';
import GenreSongsView from '../components/trending/GenreSongsView';
import { Song, Artist } from '../types/music';
import { sampleArtists, trendingSongs } from '../data/sampleData';
import votingService, { PollWithOptions } from '../services/votingService';

type ViewMode = 'trending' | 'genre';

export default function TrendingScreen() {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];
  const {
    trendingSongs: storeTrendingSongs,
    isLoadingTrending,
    loadTrendingSongs,
    playSong,
  } = useMusicStore();

  const navigation = useNavigation();
  const [viewMode, setViewMode] = useState<ViewMode>('trending');
  const [selectedGenre, setSelectedGenre] = useState<string>();
  const [refreshing, setRefreshing] = useState(false);
  const [featuredPoll, setFeaturedPoll] = useState<PollWithOptions | null>(null);
  const [pollLoading, setPollLoading] = useState(true);
  const [pollError, setPollError] = useState(false);

  // Extract genres from sample data
  const allGenres = Array.from(
    new Set(
      sampleArtists.flatMap(artist => artist.genres)
    )
  ).slice(0, 8); // Limit to 8 genres for grid

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      await Promise.all([
        loadTrendingSongs(),
        loadFeaturedPoll(),
      ]);
    } catch (error) {
      console.error('Failed to load trending data:', error);
    }
  };

  const loadFeaturedPoll = async () => {
    try {
      setPollLoading(true);
      setPollError(false);
      const featuredPolls = await votingService.getFeaturedPolls();
      
      if (featuredPolls && featuredPolls.length > 0) {
        setFeaturedPoll(featuredPolls[0]);
      } else {
        // Fallback to a sample poll if no polls are found
        setFeaturedPoll(createSamplePoll());
      }
    } catch (error) {
      console.error('Failed to load featured poll:', error);
      setPollError(true);
      // Show sample poll as fallback
      setFeaturedPoll(createSamplePoll());
    } finally {
      setPollLoading(false);
    }
  };

  const createSamplePoll = (): PollWithOptions => {
    return {
      id: 'sample-poll-1',
      title: "What's your favorite music genre this month?",
      description: 'Help us understand the trending genres in our community',
      category: 'genre',
      poll_type: 'single_choice',
      is_active: true,
      is_featured: true,
      start_date: new Date().toISOString(),
      end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      total_votes: 677,
      max_votes_per_user: 1,
      allow_anonymous: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      options: [
        {
          id: 'option-1',
          poll_id: 'sample-poll-1',
          text: 'Electronic',
          description: 'EDM, House, Techno, and electronic beats',
          position: 0,
          vote_count: 234,
          created_at: new Date().toISOString(),
        },
        {
          id: 'option-2',
          poll_id: 'sample-poll-1',
          text: 'Hip Hop',
          description: 'Rap, trap, and hip hop culture',
          position: 1,
          vote_count: 189,
          created_at: new Date().toISOString(),
        },
        {
          id: 'option-3',
          poll_id: 'sample-poll-1',
          text: 'Synthwave',
          description: 'Retro-futuristic synth music',
          position: 2,
          vote_count: 156,
          created_at: new Date().toISOString(),
        },
        {
          id: 'option-4',
          poll_id: 'sample-poll-1',
          text: 'Ambient',
          description: 'Atmospheric and chillout music',
          position: 3,
          vote_count: 98,
          created_at: new Date().toISOString(),
        },
      ],
      can_vote: true,
    };
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadInitialData();
    setRefreshing(false);
  };

  const handleGenreSelect = (genre: string) => {
    if (genre === '') {
      setSelectedGenre(undefined);
    } else {
      setSelectedGenre(genre);
    }
  };

  const handleGenrePress = (genre: string) => {
    setSelectedGenre(genre);
    setViewMode('genre');
  };

  const handleBackPress = () => {
    setViewMode('trending');
    setSelectedGenre(undefined);
  };

  const handleSongPress = (song: Song) => {
    const currentSongs = getFilteredSongs();
    const songIndex = currentSongs.findIndex(s => s.id === song.id);
    playSong(song, currentSongs, songIndex);
  };

  const handleArtistPress = (artist: Artist) => {
    // Navigate to artist profile
    navigation.navigate('ArtistProfile', { artistId: artist.id });
  };

  const handlePollVoteComplete = (updatedPoll: PollWithOptions) => {
    setFeaturedPoll(updatedPoll);
    console.log('Poll vote completed:', updatedPoll.title);
  };

  const getFilteredSongs = (): Song[] => {
    const songs = storeTrendingSongs.length > 0 ? storeTrendingSongs : trendingSongs;
    
    if (!selectedGenre) {
      return songs;
    }
    
    // Filter songs by genre (checking artist genres)
    return songs.filter(song => {
      const artist = sampleArtists.find(a => a.id === song.artistId);
      return artist?.genres.includes(selectedGenre);
    });
  };

  const getFilteredArtists = (): Artist[] => {
    if (!selectedGenre) {
      return sampleArtists;
    }
    
    return sampleArtists.filter(artist => 
      artist.genres.includes(selectedGenre)
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeColors.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 40,
    },
    loadingText: {
      fontSize: 16,
      color: themeColors.textSecondary,
      marginTop: 16,
    },
    scrollContent: {
      paddingBottom: 100,
    },
    heroContainer: {
      paddingHorizontal: 16,
      marginTop: 8,
    },
    pollLoadingContainer: {
      padding: 16,
      backgroundColor: themeColors.surface,
      borderRadius: 12,
      marginBottom: 16,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 100,
    },
    pollLoadingText: {
      fontSize: 14,
      color: themeColors.textSecondary,
      marginTop: 8,
    },
  });

  if (viewMode === 'genre' && selectedGenre) {
    return (
      <GenreSongsView
        genre={selectedGenre}
        songs={getFilteredSongs()}
        onSongPress={handleSongPress}
        onBackPress={handleBackPress}
      />
    );
  }

  return (
    <View style={styles.container}>
      {isLoadingTrending ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={themeColors.primary} />
          <Text style={styles.loadingText}>Loading trending content...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[themeColors.primary]}
              tintColor={themeColors.primary}
            />
          }
        >
          <View style={styles.heroContainer}>
            <TrendingHero
              title="What's Hot Right Now"
              imageUri="https://picsum.photos/400/200?random=trending"
            />
          </View>

          <TrendingFilters
            genres={allGenres}
            selectedGenre={selectedGenre}
            onGenreSelect={handleGenreSelect}
          />

          <TrendingList
            songs={getFilteredSongs()}
            artists={getFilteredArtists()}
            onSongPress={handleSongPress}
            onArtistPress={handleArtistPress}
            showType="both"
          />

          <View style={{ paddingHorizontal: 16 }}>
            {!pollLoading && featuredPoll ? (
              <TrendingPoll
                poll={featuredPoll}
                onVoteComplete={handlePollVoteComplete}
              />
            ) : pollLoading ? (
              <View style={styles.pollLoadingContainer}>
                <ActivityIndicator size="small" color={themeColors.primary} />
                <Text style={styles.pollLoadingText}>Loading poll...</Text>
              </View>
            ) : pollError ? (
              <View style={styles.pollLoadingContainer}>
                <Text style={styles.pollLoadingText}>Unable to load poll. Please try again later.</Text>
              </View>
            ) : null}
          </View>

          <GenreGrid
            genres={allGenres}
            onGenrePress={handleGenrePress}
          />
        </ScrollView>
      )}
    </View>
  );
}
