import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ImageBackground, TouchableOpacity, Dimensions, ScrollView, Image, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, colors } from '../context/ThemeContext';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';

interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: string;
  price: string;
  isPlaying?: boolean;
}

interface Album {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
  year: number;
  trackCount: number;
  genre: string;
  duration: string;
  price: string;
  songs: Song[];
  bannerMedia: string;
  description: string;
}

interface AnalyticsItem {
  id: string;
  title: string;
  value: string;
  icon: string;
  color: string;
  change?: string;
  changeType?: 'up' | 'down';
}

// Dummy album data
const albumData: Album = {
  id: '1',
  title: 'Midnight Synthwave',
  artist: 'The Midnight',
  coverUrl: 'https://picsum.photos/400/400?random=album1',
  year: 2023,
  trackCount: 12,
  genre: 'Synthwave',
  duration: '47:32',
  price: '$12.99',
  description: 'A mesmerizing journey through neon-lit nights and retro-futuristic soundscapes.',
  songs: [
    { id: '1', title: 'Neon Dreams', artist: 'The Midnight', album: 'Midnight Synthwave', duration: '4:23', price: '$1.99' },
    { id: '2', title: 'City Lights', artist: 'The Midnight', album: 'Midnight Synthwave', duration: '3:45', price: '$1.99' },
    { id: '3', title: 'Drive', artist: 'The Midnight', album: 'Midnight Synthwave', duration: '5:12', price: '$1.99' },
    { id: '4', title: 'Sunset', artist: 'The Midnight', album: 'Midnight Synthwave', duration: '4:01', price: '$1.99' },
    { id: '5', title: 'Retro Funk', artist: 'The Midnight', album: 'Midnight Synthwave', duration: '3:33', price: '$1.99' },
    { id: '6', title: 'Digital Love', artist: 'The Midnight', album: 'Midnight Synthwave', duration: '4:45', price: '$1.99' },
    { id: '7', title: 'Cyber Nights', artist: 'The Midnight', album: 'Midnight Synthwave', duration: '3:28', price: '$1.99' },
    { id: '8', title: 'Electric Pulse', artist: 'The Midnight', album: 'Midnight Synthwave', duration: '4:56', price: '$1.99' },
  ],
  bannerMedia: 'https://picsum.photos/800/400?random=banner1',
};

// Analytics data
const analyticsData: AnalyticsItem[] = [
  {
    id: '1',
    title: 'Total Streams',
    value: '2.4M',
    icon: 'play-circle',
    color: '#1DB954',
    change: '+12%',
    changeType: 'up'
  },
  {
    id: '2',
    title: 'NFT Sales',
    value: '1,247',
    icon: 'diamond',
    color: '#FF6B6B',
    change: '+8%',
    changeType: 'up'
  },
  {
    id: '3',
    title: 'Revenue',
    value: '$18.2K',
    icon: 'cash',
    color: '#4ECDC4',
    change: '+15%',
    changeType: 'up'
  },
  {
    id: '4',
    title: 'Rating',
    value: '4.8/5',
    icon: 'mic',
    color: '#FFD93D',
    change: '+0.2',
    changeType: 'up'
  },
  {
    id: '5',
    title: 'Downloads',
    value: '892',
    icon: 'download',
    color: '#6C5CE7',
    change: '+5%',
    changeType: 'up'
  },
];

type Props = StackScreenProps<RootStackParamList, 'AlbumPage'>;

const AlbumPage = ({ route, navigation }: Props) => {
  const { albumId } = route.params;
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];
  const { width, height } = Dimensions.get('window');
  const [currentPlayingSong, setCurrentPlayingSong] = useState<string | null>(null);
  const [album, setAlbum] = useState<Album | null>(null);
  const [userRating, setUserRating] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Load album data based on albumId
  useEffect(() => {
    // In a real app, you would fetch album data from an API
    // For now, we'll use the dummy data
    setAlbum(albumData);
  }, [albumId]);
  
  const handleBuyAlbum = () => {
    console.log('Buy album:', albumData.title);
  };

  const handleBuySong = (song: Song) => {
    console.log('Buy song:', song.title);
  };

  const handlePlaySong = (songId: string) => {
    setCurrentPlayingSong(currentPlayingSong === songId ? null : songId);
  };

  const renderSongItem = ({ item, index }: { item: Song; index: number }) => {
    const isPlaying = currentPlayingSong === item.id;
    
    return (
      <View style={[styles.songItem, { backgroundColor: themeColors.surface }]}>
        <TouchableOpacity 
          style={styles.songPlayButton}
          onPress={() => handlePlaySong(item.id)}
        >
          <Ionicons 
            name={isPlaying ? 'pause' : 'play'} 
            size={20} 
            color={themeColors.primary} 
          />
        </TouchableOpacity>
        
        <View style={styles.songInfo}>
          <Text style={[styles.songTitle, { color: themeColors.text }]} numberOfLines={1}>
            {index + 1}. {item.title}
          </Text>
          <Text style={[styles.songArtist, { color: themeColors.textSecondary }]} numberOfLines={1}>
            {item.artist}
          </Text>
        </View>
        
        <View style={styles.songActions}>
          <Text style={[styles.songDuration, { color: themeColors.textSecondary }]}>
            {item.duration}
          </Text>
          <TouchableOpacity 
            style={[styles.buyButton, { backgroundColor: themeColors.primary }]}
            onPress={() => handleBuySong(item)}
          >
            <Ionicons name="card" size={14} color="white" />
            <Text style={styles.buyButtonText}>{item.price}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderAnalyticsCard = ({ item }: { item: AnalyticsItem }) => (
    <View style={[styles.analyticsCard, { backgroundColor: themeColors.surface }]}>
      <View style={[styles.analyticsIcon, { backgroundColor: item.color + '15' }]}>
        <Ionicons name={item.icon as any} size={24} color={item.color} />
      </View>
      <Text style={[styles.analyticsTitle, { color: themeColors.textSecondary }]}>
        {item.title}
      </Text>
      <Text style={[styles.analyticsValue, { color: themeColors.text }]}>
        {item.value}
      </Text>
      {item.change && (
        <View style={styles.analyticsChange}>
          <Ionicons 
            name={item.changeType === 'up' ? 'trending-up' : 'trending-down'} 
            size={12} 
            color={item.changeType === 'up' ? '#00C851' : '#FF4444'} 
          />
          <Text style={[styles.changeText, { 
            color: item.changeType === 'up' ? '#00C851' : '#FF4444' 
          }]}>
            {item.change}
          </Text>
        </View>
      )}
    </View>
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeColors.background,
    },
    banner: {
      width: '100%',
      height: 280,
      justifyContent: 'flex-end',
      alignItems: 'center',
    },
    backButton: {
      position: 'absolute',
      top: 50,
      left: 20,
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 10,
    },
    bannerOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.4)',
      justifyContent: 'flex-end',
      alignItems: 'center',
      paddingBottom: 20,
    },
    bannerBuyButton: {
      backgroundColor: themeColors.primary,
      paddingVertical: 12,
      paddingHorizontal: 32,
      borderRadius: 25,
      flexDirection: 'row',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    bannerBuyButtonText: {
      color: 'white',
      fontWeight: '700',
      fontSize: 16,
      marginLeft: 8,
    },
    albumInfoSection: {
      flexDirection: 'row',
      padding: 20,
      alignItems: 'flex-start',
      backgroundColor: themeColors.surface,
      marginHorizontal: 16,
      marginTop: -40,
      borderRadius: 16,
      shadowColor: themeColors.text,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    albumCoverSection: {
      alignItems: 'center',
      marginRight: 16,
    },
    albumCover: {
      width: 120,
      height: 120,
      borderRadius: 12,
      marginBottom: 12,
      overflow: 'hidden',
    },
    albumBuyButton: {
      backgroundColor: themeColors.primary,
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 20,
      flexDirection: 'row',
      alignItems: 'center',
      width: 120,
      justifyContent: 'center',
      shadowColor: themeColors.text,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    albumBuyButtonText: {
      color: 'white',
      fontWeight: '600',
      fontSize: 12,
      marginLeft: 4,
    },
    albumInfo: {
      flex: 1,
      paddingTop: 8,
    },
    albumTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: themeColors.text,
      marginBottom: 4,
    },
    albumArtist: {
      fontSize: 18,
      color: themeColors.textSecondary,
      marginBottom: 8,
    },
    albumDetails: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    albumDetailItem: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    albumDetailText: {
      fontSize: 14,
      color: themeColors.textSecondary,
      marginLeft: 4,
    },
    albumDescription: {
      fontSize: 14,
      color: themeColors.textSecondary,
      lineHeight: 20,
      marginTop: 8,
    },
    analyticsContainer: {
      paddingVertical: 16,
    },
    analyticsTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: themeColors.text,
      paddingHorizontal: 20,
      marginBottom: 16,
    },
    analyticsCard: {
      width: 140,
      padding: 16,
      borderRadius: 16,
      marginLeft: 16,
      shadowColor: themeColors.text,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    analyticsIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
    },
    analyticsTitle: {
      fontSize: 12,
      fontWeight: '500',
      marginBottom: 4,
    },
    analyticsValue: {
      fontSize: 20,
      fontWeight: '700',
      marginBottom: 8,
    },
    analyticsChange: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    changeText: {
      fontSize: 12,
      fontWeight: '600',
      marginLeft: 4,
    },
    songsSection: {
      flex: 1,
      marginTop: 16,
    },
    songsHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      marginBottom: 16,
    },
    songsTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: themeColors.text,
    },
    shuffleButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: themeColors.primary,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
    },
    shuffleButtonText: {
      color: 'white',
      fontWeight: '600',
      marginLeft: 6,
    },
    songItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 20,
      marginHorizontal: 16,
      marginBottom: 8,
      borderRadius: 12,
      shadowColor: themeColors.text,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    songPlayButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: themeColors.primary + '15',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    songInfo: {
      flex: 1,
      marginRight: 12,
    },
    songTitle: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 2,
    },
    songArtist: {
      fontSize: 14,
    },
    songActions: {
      alignItems: 'flex-end',
    },
    songDuration: {
      fontSize: 12,
      marginBottom: 8,
    },
    buyButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 16,
    },
    buyButtonText: {
      color: 'white',
      fontWeight: '600',
      fontSize: 12,
      marginLeft: 4,
    },
    ratingSection: {
      paddingHorizontal: 20,
      paddingVertical: 16,
      backgroundColor: themeColors.surface,
      marginHorizontal: 16,
      marginTop: 16,
      borderRadius: 16,
      shadowColor: themeColors.text,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    ratingTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: themeColors.text,
      marginBottom: 12,
      textAlign: 'center',
    },
    ratingContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
    },
    ratingMic: {
      marginHorizontal: 8,
    },
  });

  const handleRating = (rating: number) => {
    setUserRating(rating);
  };

  const renderRatingMics = () => {
    const mics = [];
    for (let i = 1; i <= 5; i++) {
      mics.push(
        <TouchableOpacity 
          key={i}
          style={styles.ratingMic}
          onPress={() => handleRating(i)}
        >
          <Ionicons 
            name={i <= userRating ? 'mic' : 'mic-outline'} 
            size={32} 
            color={i <= userRating ? themeColors.primary : themeColors.textSecondary}
          />
        </TouchableOpacity>
      );
    }
    return mics;
  };

  return (
    <ScrollView 
      ref={scrollViewRef}
      style={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Banner Section */}
      <ImageBackground source={{ uri: albumData.bannerMedia }} style={styles.banner}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color="white" />
        </TouchableOpacity>
      </ImageBackground>

      {/* Album Info Section */}
      <View style={styles.albumInfoSection}>
        <View style={styles.albumCoverSection}>
          <Image source={{ uri: albumData.coverUrl }} style={styles.albumCover} />
          <TouchableOpacity style={styles.albumBuyButton} onPress={handleBuyAlbum}>
            <Ionicons name="card" size={16} color="white" />
            <Text style={styles.albumBuyButtonText}>Buy Album {albumData.price}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.albumInfo}>
          <Text style={styles.albumTitle}>{albumData.title}</Text>
          <Text style={styles.albumArtist}>{albumData.artist}</Text>
          
          <View style={styles.albumDetails}>
            <View style={styles.albumDetailItem}>
              <Ionicons name="calendar" size={14} color={themeColors.textSecondary} />
              <Text style={styles.albumDetailText}>{albumData.year}</Text>
            </View>
            <View style={styles.albumDetailItem}>
              <Ionicons name="musical-notes" size={14} color={themeColors.textSecondary} />
              <Text style={styles.albumDetailText}>{albumData.trackCount} tracks</Text>
            </View>
            <View style={styles.albumDetailItem}>
              <Ionicons name="time" size={14} color={themeColors.textSecondary} />
              <Text style={styles.albumDetailText}>{albumData.duration}</Text>
            </View>
            <View style={styles.albumDetailItem}>
              <Ionicons name="pricetag" size={14} color={themeColors.textSecondary} />
              <Text style={styles.albumDetailText}>{albumData.genre}</Text>
            </View>
          </View>
          
          <Text style={styles.albumDescription}>{albumData.description}</Text>
        </View>
      </View>

      {/* Analytics Section */}
      <View style={styles.analyticsContainer}>
        <Text style={styles.analyticsTitle}>Analytics</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingRight: 20 }}
        >
          {analyticsData.map((item) => (
            <View key={item.id}>{renderAnalyticsCard({ item })}</View>
          ))}
        </ScrollView>
      </View>

      {/* Songs Section */}
      <View style={styles.songsSection}>
        <View style={styles.songsHeader}>
          <Text style={styles.songsTitle}>Tracks</Text>
          <TouchableOpacity style={styles.shuffleButton}>
            <Ionicons name="shuffle" size={16} color="white" />
            <Text style={styles.shuffleButtonText}>Shuffle</Text>
          </TouchableOpacity>
        </View>
        
        {albumData.songs.map((song, index) => (
          <View key={song.id}>{renderSongItem({ item: song, index })}</View>
        ))}
      </View>

      {/* Rating Section */}
      <View style={styles.ratingSection}>
        <Text style={styles.ratingTitle}>Rate this Album</Text>
        <View style={styles.ratingContainer}>
          {renderRatingMics()}
        </View>
      </View>
      
      <View style={{ height: 100 }} />
    </ScrollView>
  );
};

export default AlbumPage;
