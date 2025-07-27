import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme, colors } from '../../context/ThemeContext';
import SongCard from '../common/SongCard';
import { Song } from '../../types/music';

interface SongListProps {
  title: string;
  songs: Song[];
  onSongPress?: (song: Song) => void;
  showArtwork?: boolean;
  maxItems?: number;
}

export default function SongList({ 
  title, 
  songs, 
  onSongPress,
  showArtwork = true,
  maxItems = 5
}: SongListProps) {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];

  const styles = StyleSheet.create({
    container: {
      marginBottom: 24,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
      paddingHorizontal: 16,
    },
    title: {
      fontSize: 18,
      fontWeight: 'bold',
      color: themeColors.text,
    },
    seeAll: {
      fontSize: 14,
      color: themeColors.primary,
      fontWeight: '600',
    },
    songsList: {
      paddingHorizontal: 16,
    },
    songContainer: {
      backgroundColor: themeColors.surface,
      borderRadius: 12,
      marginBottom: 8,
      overflow: 'hidden',
    },
  });

  if (!songs.length) {
    return null;
  }

  const displaySongs = songs.slice(0, maxItems);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.seeAll}>See All</Text>
      </View>
      
      <View style={styles.songsList}>
        {displaySongs.map((song, index) => (
          <View key={song.id} style={styles.songContainer}>
            <SongCard
              song={song}
              onPress={() => onSongPress?.(song)}
              showArtwork={showArtwork}
            />
          </View>
        ))}
      </View>
    </View>
  );
}
