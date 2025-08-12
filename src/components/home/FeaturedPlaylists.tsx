import React, { useState, useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { LoadingState } from '../../utils/uiHelpers';
import PlaylistCarousel from './PlaylistCarousel';
import { usePlay } from '../../context/PlayContext';
import { sampleSongs } from '../../data/sampleData';
import { mockFeaturedPlaylists } from '../../data/mockFeaturedPlaylists';

export default function FeaturedPlaylists() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const { playSong } = usePlay();
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadFeaturedPlaylists = async () => {
      try {
        setIsLoading(true);
        setError(null);
        // TODO: replace with API call when backend is ready
        setPlaylists(mockFeaturedPlaylists);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    loadFeaturedPlaylists();
  }, []);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: 16,
      backgroundColor: colors.background,
    },
  });

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

  if (!playlists.length) {
    return (
      <LoadingState
        text="No Featured Playlists Available"
        themeColors={colors}
        size="large"
        iconName="musical-notes"
      />
    );
  }

  return (
    <PlaylistCarousel
      title="Featured Playlists"
      playlists={playlists as any}
      onPlaylistPress={(playlist) => {
        console.log('Opening featured playlist:', (playlist as any).name);
      }}
      onPlayPress={() => {
        try {
          const queue = sampleSongs.slice(0, 12);
          playSong(queue[0], queue);
        } catch (e) {
          const fallback = sampleSongs.slice(0, 8);
          playSong(fallback[0], fallback);
        }
      }}
      onSeeAllPress={() => navigation.navigate('FeaturedPlaylists' as never)}
    />
  );
}
