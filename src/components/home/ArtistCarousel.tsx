import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useTheme, colors } from '../../context/ThemeContext';
import ArtistCard from '../common/ArtistCard';
import { Artist } from '../../types/music';

interface ArtistCarouselProps {
  title: string;
  artists: Artist[];
  onArtistPress?: (artist: Artist) => void;
}

export default function ArtistCarousel({ 
  title, 
  artists, 
  onArtistPress 
}: ArtistCarouselProps) {
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
    listContainer: {
      paddingHorizontal: 16,
    },
  });

  const renderArtist = ({ item }: { item: Artist }) => (
    <ArtistCard
      artist={item}
      onPress={() => onArtistPress?.(item)}
    />
  );

  if (!artists.length) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.seeAll}>See All</Text>
      </View>
      
      <FlatList
        data={artists}
        renderItem={renderArtist}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
}
