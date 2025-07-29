import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { useTheme, colors } from '../context/ThemeContext';
import { useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Artist } from '../types/music';
import { sampleArtists } from '../data/sampleData'; // Placeholder data

interface ArtistDetailRouteParams {
  genre: string;
};

type ArtistDetailRouteProp = RouteProp<{ ArtistDetail: ArtistDetailRouteParams }, 'ArtistDetail'>;

export default function ArtistDetail() {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];
  const route = useRoute<ArtistDetailRouteProp>();
  const { genre } = route.params;

  const artists = sampleArtists.filter(artist => artist.genres.includes(genre));

  const renderArtistItem = ({ item }: { item: Artist }) => (
    <TouchableOpacity style={styles.artistItem}>
      <Image source={{ uri: item.coverUrl }} style={styles.artistImage} />
      <Text style={styles.artistName}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={artists}
        renderItem={renderArtistItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: themeColors.background,
  },
  list: {
    padding: 16,
  },
  artistItem: {
    width: '50%',
    padding: 8,
  },
  artistImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
  },
  artistName: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
    color: themeColors.text,
    textAlign: 'center',
  },
});

