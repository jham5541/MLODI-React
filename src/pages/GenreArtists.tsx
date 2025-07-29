import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity,
  RefreshControl,
  Animated,
  Image,
  Dimensions
} from 'react-native';
import { useTheme, colors } from '../context/ThemeContext';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Artist } from '../types/music';
import { sampleArtists } from '../data/sampleData';
import ArtistCard from '../components/common/ArtistCard';

interface GenreArtistsRouteParams {
  genre: string;
};

type GenreArtistsRouteProp = RouteProp<{ GenreArtists: GenreArtistsRouteParams }, 'GenreArtists'>;

export default function GenreArtists() {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];
  const route = useRoute<GenreArtistsRouteProp>();
  const navigation = useNavigation();
  const { genre } = route.params;

  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Filter artists by genre
  const genreArtists = sampleArtists.filter(artist => 
    artist.genres.includes(genre)
  ).sort((a, b) => b.followers - a.followers); // Sort by popularity

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      setRefreshKey(prev => prev + 1);
    }, 1000);
  };

  const handleArtistPress = (artist: Artist) => {
    navigation.navigate('ArtistProfile', { artistId: artist.id });
  };

  const scrollX = useRef(new Animated.Value(0)).current;

  const renderScrollingHeader = () => {
    return (
      <Animated.ScrollView
        horizontal
        snapToInterval={120}
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        style={styles.scrollingHeader}
        contentContainerStyle={{ paddingVertical: 10 }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: true }
        )}
      >
        {[...sampleArtists, ...sampleArtists].map((artist, index) => (
          <Image
            key={`${artist.id}-${index}`}
            source={{ uri: artist.image }}
            style={styles.artistShowcaseImage}
            resizeMode="cover"
          />
        ))}
      </Animated.ScrollView>
    );
  };

  const renderArtistItem = ({ item, index }: { item: Artist; index: number }) => (
    <View style={styles.artistItem}>
      <ArtistCard
        artist={item}
        onPress={() => handleArtistPress(item)}
      />
    </View>
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeColors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: themeColors.surface,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.border,
    },
    backButton: {
      padding: 8,
      marginRight: 8,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: themeColors.text,
      flex: 1,
    },
    statsText: {
      fontSize: 14,
      color: themeColors.textSecondary,
    },
    content: {
      flex: 1,
      paddingTop: 16,
    },
    artistItem: {
      marginBottom: 16,
      paddingHorizontal: 16,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 40,
    },
    emptyIcon: {
      marginBottom: 16,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: themeColors.text,
      marginBottom: 8,
      textAlign: 'center',
    },
    emptyDescription: {
      fontSize: 14,
      color: themeColors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
    },
    scrollingHeader: {
      height: 80,
      backgroundColor: themeColors.surface,
    },
    artistShowcaseImage: {
      width: 80,
      height: 60,
      marginHorizontal: 5,
      borderRadius: 8,
    },
  });

  if (genreArtists.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={themeColors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{genre} Artists</Text>
        </View>
        
        <View style={styles.emptyContainer}>
          <Ionicons 
            name="person-outline" 
            size={64} 
            color={themeColors.textSecondary}
            style={styles.emptyIcon}
          />
          <Text style={styles.emptyTitle}>No {genre} Artists</Text>
          <Text style={styles.emptyDescription}>
            We couldn't find any artists in this genre. Try exploring other genres.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={themeColors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{genre} Artists</Text>
        <Text style={styles.statsText}>{genreArtists.length} artists</Text>
      </View>
      
      {renderScrollingHeader()}
      
      <View style={styles.content}>
        <FlatList
          key={`${genre}-artists-${refreshKey}`}
          data={genreArtists}
          renderItem={renderArtistItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[themeColors.primary]}
              tintColor={themeColors.primary}
            />
          }
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      </View>
    </View>
  );
}
