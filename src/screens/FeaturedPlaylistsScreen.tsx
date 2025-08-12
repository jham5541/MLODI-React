import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, FlatList, StyleSheet, RefreshControl, Animated } from 'react-native';
import { useGlowAnimation } from '../hooks/useGlowAnimation';
import { usePlay } from '../context/PlayContext';
import { useTheme } from '../context/ThemeContext';
import PlaylistCard from '../components/playlists/PlaylistCard';
import { LoadingState } from '../utils/uiHelpers';
import { mockFeaturedPlaylists } from '../data/mockFeaturedPlaylists';
import { playlistService } from '../services/playlistService';
import { sampleSongs } from '../data/sampleData';
import { Playlist, Song } from '../types/music';

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  playlistContainer: {
    width: '48%',
    padding: 0,
    marginVertical: 8,
    borderRadius: 12,
    backgroundColor: 'transparent',
    overflow: 'hidden',
    // Android elevation
    elevation: 5,
    // iOS shadow base (will be animated)
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
  },
  gridContent: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
});

export default function FeaturedPlaylistsScreen() {
  const { colors } = useTheme();
  const { playSong } = usePlay();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFeaturedPlaylists = async (showRefresh = false) => {
    try {
      if (!showRefresh) {
        setIsLoading(true);
      }
      setError(null);
      // TODO: Replace with actual API call when ready
      // const { data } = await playlistService.getFeaturedPlaylists({
      //   limit: 50,
      //   timeWindow: '7 days'
      // });
      // setPlaylists(data || []);
      setPlaylists(mockFeaturedPlaylists);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
      if (showRefresh) {
        setIsRefreshing(false);
      }
    }
  };

  useEffect(() => {
    loadFeaturedPlaylists();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadFeaturedPlaylists(true);
  };


  const styles = useMemo(() => createStyles(colors), [colors]);

  const handlePlaylistPress = useCallback((playlist: Playlist) => {
    // TODO: Navigate to playlist details
    console.log('Opening playlist:', playlist.name);
  }, []);

  const handlePlayPress = useCallback(async (playlist: Playlist) => {
    try {
      // Fetch playlist songs from backend
      const rows = await playlistService.getPlaylistSongs(playlist.id as unknown as string);
      let songs: Song[] = [];

      if (rows && rows.length > 0) {
        songs = rows
          .map((r: any) => r.songs)
          .filter(Boolean)
          .map((s: any): Song => ({
            id: s.id,
            title: s.title || s.name || 'Untitled',
            artist: s.artists?.name || s.artist || 'Unknown',
            artistId: s.artists?.id || s.artistId || s.artist_id || 'unknown',
            album: s.album || s.album_name || 'Single',
            coverUrl: s.cover_url || s.coverUrl || s.album_cover || sampleSongs[0].coverUrl,
            duration: s.duration || s.duration_seconds || 180,
            audioUrl: s.audio_url || s.audioUrl || '',
          }));
      }

      // Fallback to sample data if no songs
      if (songs.length === 0) {
        songs = sampleSongs.slice(0, 10);
      }

      // Start playback and show playbar
      playSong(songs[0], songs);
    } catch (error) {
      console.error('Failed to play playlist:', error);
      // Fallback: play from sample songs
      const songs = sampleSongs.slice(0, 10);
      playSong(songs[0], songs);
    }
  }, [playSong]);

  const GlowPlaylistItem = ({ item }: { item: Playlist }) => {
    const glowStyle = useGlowAnimation({
      color: colors.primary,
      duration: 2000,
      minOpacity: 0.3,
      maxOpacity: 0.7,
      minRadius: 8,
      maxRadius: 16,
    });

    return (
      <Animated.View style={[styles.playlistContainer, glowStyle]}>
        <PlaylistCard
          playlist={item}
          onPress={() => handlePlaylistPress(item)}
          onPlay={() => handlePlayPress(item)}
          showCollaborators={false}
        />
      </Animated.View>
    );
  };

  const renderPlaylist = useCallback(({ item }: { item: Playlist }) => (
    <GlowPlaylistItem item={item} />
  ), [handlePlaylistPress, handlePlayPress]);

  if (isLoading) {
    return (
      <LoadingState
        text="Loading Featured Playlists..."
        themeColors={colors}
        size="large"
      />
    );
  }

  if (error) {
    return (
      <LoadingState
        text={`Error: ${error}`}
        themeColors={colors}
        size="large"
        iconName="alert-circle"
      />
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={playlists}
        renderItem={renderPlaylist}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.gridContent}
        columnWrapperStyle={{ justifyContent: 'space-between' }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.text}
          />
        }
      />
    </View>
  );
}
