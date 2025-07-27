import React from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import DiscoverCard from './DiscoverCard';
import { Song } from '../../types/music';

interface DiscoverGridProps {
  songs: Song[];
  onSongPress?: (song: Song) => void;
  onPlayPreview?: (song: Song) => void;
}

export default function DiscoverGrid({ songs, onSongPress, onPlayPreview }: DiscoverGridProps) {
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      paddingHorizontal: 16,
    },
    gridContainer: {
      justifyContent: 'space-between',
    },
  });

  return (
    <FlatList
      data={songs}
      renderItem={({ item }) => (
        <DiscoverCard
          song={item}
          onPress={() => onSongPress ? onSongPress(item) : undefined}
          onPlayPreview={onPlayPreview}
        />
      )}
      keyExtractor={(item) => item.id}
      numColumns={2}
      columnWrapperStyle={styles.gridContainer}
      showsVerticalScrollIndicator={false}
    />
  );
}
