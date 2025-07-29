import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Animated,
  RefreshControl,
  Image,
  Dimensions
} from 'react-native';
import { useTheme, colors } from '../context/ThemeContext';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Song } from '../types/music';
import { trendingSongs, sampleArtists } from '../data/sampleData';
import { purchaseService } from '../services/purchaseService';
import { useMusicStore } from '../store/musicStore';
import SongItem from '../components/common/SongItem';

interface GenreSongsRouteParams {
  genre: string;
};

type GenreSongsRouteProp = RouteProp<{ GenreSongs: GenreSongsRouteParams }, 'GenreSongs'>;

export default function GenreSongs() {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];
  const route = useRoute<GenreSongsRouteProp>();
  const navigation = useNavigation();
  const { playSong } = useMusicStore();
  const { genre } = route.params;

  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Filter songs by genre (checking artist genres)
  const genreSongs = trendingSongs.filter(song => {
    const artist = sampleArtists.find(a => a.id === song.artistId);
    return artist?.genres.includes(genre);
  }).sort((a, b) => (b.popularity || 0) - (a.popularity || 0));

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      setRefreshKey(prev => prev + 1);
    }, 1000);
  };

  const handleSongPress = (song: Song) => {
    const songIndex = genreSongs.findIndex(s => s.id === song.id);
    playSong(song, genreSongs, songIndex);
  };

  const handlePurchaseComplete = () => {
    setRefreshKey(prev => prev + 1);
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

  const renderSongItem = ({ item, index }: { item: Song; index: number }) => {
    const isPurchased = purchaseService.isPurchased(item.id);
    const purchaseCount = purchaseService.getPurchaseCount(item.id);
    
    return (
      <View style={[styles.songItemContainer, isPurchased && styles.purchasedSong]}>
        <SongItem
          song={item}
          onPress={handleSongPress}
          showArtist={true}
          onPurchaseComplete={handlePurchaseComplete}
          showRank={true}
          rank={index + 1}
        />
        {purchaseCount > 0 && (
          <View style={styles.purchaseBadge}>
            <Text style={styles.purchaseCount}>{purchaseCount}</Text>
          </View>
        )}
      </View>
    );
  };

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
    songItemContainer: {
      position: 'relative',
      marginBottom: 12,
      borderRadius: 12,
      overflow: 'hidden',
    },
    purchasedSong: {
      backgroundColor: `${themeColors.primary}15`,
    },
    purchaseBadge: {
      position: 'absolute',
      top: 8,
      right: 8,
      backgroundColor: themeColors.primary,
      borderRadius: 12,
      minWidth: 24,
      height: 24,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 8,
    },
    purchaseCount: {
      fontSize: 12,
      fontWeight: 'bold',
      color: '#ffffff',
    },
    content: {
      flex: 1,
      paddingHorizontal: 16,
      paddingTop: 16,
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

  if (genreSongs.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={themeColors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{genre} Songs</Text>
        </View>
        
        <View style={styles.emptyContainer}>
          <Ionicons 
            name="musical-notes-outline" 
            size={64} 
            color={themeColors.textSecondary}
            style={styles.emptyIcon}
          />
          <Text style={styles.emptyTitle}>No {genre} Songs</Text>
          <Text style={styles.emptyDescription}>
            We couldn't find any songs in this genre. Try exploring other genres.
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
        <Text style={styles.headerTitle}>{genre} Songs</Text>
        <Text style={styles.statsText}>{genreSongs.length} songs</Text>
      </View>
      
      {renderScrollingHeader()}
      
      <View style={styles.content}>
        <FlatList
          key={`${genre}-songs-${refreshKey}`}
          data={genreSongs}
          renderItem={renderSongItem}
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
