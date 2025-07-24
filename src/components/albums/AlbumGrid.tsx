import React from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import AlbumCard from './AlbumCard';
import { Album, Song } from '../../types/music';

interface AlbumGridProps {
  albums: Album[];
  viewMode?: 'grid' | 'list';
  onSongSelect?: (song: Song) => void;
  onAlbumPress?: (album: Album) => void;
}

export default function AlbumGrid({ 
  albums, 
  viewMode = 'grid', 
  onSongSelect, 
  onAlbumPress 
}: AlbumGridProps) {
  const handleAlbumPress = (album: Album) => {
    if (onAlbumPress) {
      onAlbumPress(album);
    } else if (onSongSelect && album.songs.length > 0) {
      // Play first song if no album press handler
      onSongSelect(album.songs[0]);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    gridContainer: {
      paddingHorizontal: 4,
    },
    listContainer: {
      paddingHorizontal: 0,
    },
  });

  if (viewMode === 'grid') {
    return (
      <FlatList
        data={albums}
        renderItem={({ item }) => (
          <AlbumCard
            album={item}
            viewMode="grid"
            onPress={() => handleAlbumPress(item)}
          />
        )}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: 'space-between' }}
        contentContainerStyle={styles.gridContainer}
        showsVerticalScrollIndicator={false}
      />
    );
  }

  return (
    <FlatList
      data={albums}
      renderItem={({ item }) => (
        <AlbumCard
          album={item}
          viewMode="list"
          onPress={() => handleAlbumPress(item)}
        />
      )}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContainer}
      showsVerticalScrollIndicator={false}
    />
  );
}