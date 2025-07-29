import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Modal,
  FlatList,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { useTheme, colors } from '../../context/ThemeContext';

interface Album {
  id: string;
  title: string;
  releaseDate: string;
  coverUrl: string;
  trackCount: number;
  totalDuration: number;
  price?: number;
  tracks?: Track[];
}

interface Track {
  id: string;
  title: string;
  duration: number;
  trackNumber: number;
  price?: number;
}

interface DiscographyCarouselProps {
  artistId: string;
  artistName?: string;
}

type NavigationProp = StackNavigationProp<RootStackParamList>;

export default function DiscographyCarousel({
  artistId,
  artistName = 'Artist',
}: DiscographyCarouselProps) {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];
  const navigation = useNavigation<NavigationProp>();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    // Mock data - replace with actual API call
    const mockAlbums: Album[] = [
      {
        id: '1',
        title: 'Golden Hour',
        releaseDate: '2023-08-15',
        coverUrl: 'https://picsum.photos/300/300?random=10',
        trackCount: 12,
        totalDuration: 2880, // 48 minutes
        price: 9.99,
        tracks: [
          { id: '1-1', title: 'Sunrise', duration: 240, trackNumber: 1, price: 1.29 },
          { id: '1-2', title: 'Golden Hour', duration: 195, trackNumber: 2, price: 1.29 },
          { id: '1-3', title: 'Summer Nights', duration: 208, trackNumber: 3, price: 1.29 },
          { id: '1-4', title: 'Memories', duration: 223, trackNumber: 4 },
          { id: '1-5', title: 'Dancing Light', duration: 186, trackNumber: 5 },
        ],
      },
      {
        id: '2',
        title: 'Neon City',
        releaseDate: '2022-11-20',
        coverUrl: 'https://picsum.photos/300/300?random=11',
        trackCount: 10,
        totalDuration: 2400, // 40 minutes
        price: 8.99,
        tracks: [
          { id: '2-1', title: 'Electric Dreams', duration: 208, trackNumber: 1, price: 1.29 },
          { id: '2-2', title: 'City Lights', duration: 176, trackNumber: 2, price: 1.29 },
          { id: '2-3', title: 'Neon Nights', duration: 244, trackNumber: 3 },
          { id: '2-4', title: 'Digital Love', duration: 201, trackNumber: 4 },
        ],
      },
      {
        id: '3',
        title: 'Serenity',
        releaseDate: '2021-05-10',
        coverUrl: 'https://picsum.photos/300/300?random=12',
        trackCount: 8,
        totalDuration: 1920, // 32 minutes
        tracks: [
          { id: '3-1', title: 'Ocean Waves', duration: 222, trackNumber: 1 },
          { id: '3-2', title: 'Peaceful Mind', duration: 195, trackNumber: 2 },
          { id: '3-3', title: 'Mountain Air', duration: 267, trackNumber: 3 },
        ],
      },
    ];

    setAlbums(mockAlbums);
  }, [artistId]);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short' 
    });
  };

  const handleAlbumPress = (album: Album) => {
    navigation.navigate('AlbumPage', { albumId: album.id });
  };

  const handlePlayAlbum = (album: Album) => {
    Alert.alert('Play Album', `Playing "${album.title}" by ${artistName}`);
  };

  const handlePurchaseAlbum = (album: Album) => {
    if (album.price) {
      Alert.alert(
        'Purchase Album',
        `Purchase "${album.title}" for $${album.price}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Buy', onPress: () => console.log('Purchase album:', album.id) },
        ]
      );
    }
  };

  const handlePlayTrack = (track: Track) => {
    Alert.alert('Play Track', `Playing "${track.title}"`);
  };

  const handlePurchaseTrack = (track: Track) => {
    if (track.price) {
      Alert.alert(
        'Purchase Track',
        `Purchase "${track.title}" for $${track.price}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Buy', onPress: () => console.log('Purchase track:', track.id) },
        ]
      );
    }
  };

  const handleViewAll = () => {
    navigation.navigate('Discography', {
      artistId,
      artistName,
    });
  };

  const renderAlbumCard = (album: Album) => (
    <TouchableOpacity
      key={album.id}
      style={styles.albumCard}
      onPress={() => handleAlbumPress(album)}
    >
      <Image source={{ uri: album.coverUrl }} style={styles.albumCover} />
      
      <View style={styles.playButtonOverlay}>
        <TouchableOpacity
          style={styles.playButton}
          onPress={() => handlePlayAlbum(album)}
        >
          <Ionicons name="play" size={20} color={themeColors.background} />
        </TouchableOpacity>
      </View>

      <View style={styles.albumInfo}>
        <Text style={styles.albumTitle} numberOfLines={1}>
          {album.title}
        </Text>
        <Text style={styles.albumDetails}>
          {formatDate(album.releaseDate)} • {album.trackCount} tracks
        </Text>
        {album.price && (
          <TouchableOpacity
            style={styles.priceButton}
            onPress={() => handlePurchaseAlbum(album)}
          >
            <Text style={styles.priceText}>${album.price}</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderTrackItem = ({ item }: { item: Track }) => (
    <View style={styles.trackItem}>
      <View style={styles.trackInfo}>
        <Text style={styles.trackNumber}>{item.trackNumber}</Text>
        <View style={styles.trackDetails}>
          <Text style={styles.trackTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.trackDuration}>
            {formatDuration(item.duration)}
          </Text>
        </View>
      </View>
      
      <View style={styles.trackActions}>
        <TouchableOpacity
          style={styles.trackPlayButton}
          onPress={() => handlePlayTrack(item)}
        >
          <Ionicons name="play" size={16} color={themeColors.primary} />
        </TouchableOpacity>
        
        {item.price && (
          <TouchableOpacity
            style={styles.trackPriceButton}
            onPress={() => handlePurchaseTrack(item)}
          >
            <Text style={styles.trackPriceText}>${item.price}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const styles = StyleSheet.create({
    container: {
      backgroundColor: themeColors.surface,
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    title: {
      fontSize: 20,
      fontWeight: '800',
      color: themeColors.text,
    },
    viewAllButton: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 8,
      backgroundColor: themeColors.primary + '20',
    },
    viewAllText: {
      fontSize: 12,
      fontWeight: '600',
      color: themeColors.primary,
    },
    scrollContainer: {
      paddingLeft: 4,
    },
    albumCard: {
      width: 160,
      marginRight: 16,
      position: 'relative',
    },
    albumCover: {
      width: 160,
      height: 160,
      borderRadius: 12,
      marginBottom: 8,
    },
    playButtonOverlay: {
      position: 'absolute',
      top: 8,
      right: 8,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      borderRadius: 20,
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
    },
    playButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: themeColors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    albumInfo: {
      flex: 1,
    },
    albumTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: themeColors.text,
      marginBottom: 4,
    },
    albumDetails: {
      fontSize: 12,
      color: themeColors.textSecondary,
      marginBottom: 8,
    },
    priceButton: {
      backgroundColor: themeColors.success + '20',
      borderColor: themeColors.success,
      borderWidth: 1,
      borderRadius: 8,
      paddingVertical: 4,
      paddingHorizontal: 8,
      alignSelf: 'flex-start',
    },
    priceText: {
      fontSize: 12,
      fontWeight: '600',
      color: themeColors.success,
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: 40,
    },
    emptyText: {
      fontSize: 16,
      color: themeColors.textSecondary,
      textAlign: 'center',
    },
    // Modal styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: themeColors.background,
      borderRadius: 20,
      width: '90%',
      maxHeight: '80%',
      overflow: 'hidden',
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.border,
    },
    modalAlbumCover: {
      width: 80,
      height: 80,
      borderRadius: 12,
      marginRight: 16,
    },
    modalAlbumInfo: {
      flex: 1,
    },
    modalAlbumTitle: {
      fontSize: 20,
      fontWeight: '800',
      color: themeColors.text,
      marginBottom: 4,
    },
    modalAlbumDetails: {
      fontSize: 14,
      color: themeColors.textSecondary,
      marginBottom: 8,
    },
    modalActions: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 8,
    },
    modalPlayButton: {
      backgroundColor: themeColors.primary,
      borderRadius: 8,
      paddingVertical: 6,
      paddingHorizontal: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    modalPlayButtonText: {
      color: themeColors.background,
      fontSize: 12,
      fontWeight: '600',
    },
    modalPriceButton: {
      backgroundColor: themeColors.success + '20',
      borderColor: themeColors.success,
      borderWidth: 1,
      borderRadius: 8,
      paddingVertical: 6,
      paddingHorizontal: 12,
    },
    modalPriceButtonText: {
      color: themeColors.success,
      fontSize: 12,
      fontWeight: '600',
    },
    closeButton: {
      padding: 8,
    },
    tracksList: {
      flex: 1,
    },
    trackItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.border,
    },
    trackInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    trackNumber: {
      fontSize: 14,
      fontWeight: '600',
      color: themeColors.textSecondary,
      width: 24,
      textAlign: 'center',
      marginRight: 12,
    },
    trackDetails: {
      flex: 1,
    },
    trackTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: themeColors.text,
      marginBottom: 2,
    },
    trackDuration: {
      fontSize: 12,
      color: themeColors.textSecondary,
    },
    trackActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    trackPlayButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: themeColors.primary + '20',
      justifyContent: 'center',
      alignItems: 'center',
    },
    trackPriceButton: {
      backgroundColor: themeColors.success + '20',
      borderColor: themeColors.success,
      borderWidth: 1,
      borderRadius: 6,
      paddingVertical: 4,
      paddingHorizontal: 8,
    },
    trackPriceText: {
      fontSize: 10,
      fontWeight: '600',
      color: themeColors.success,
    },
  });

  if (albums.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Discography</Text>
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No albums available</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Discography</Text>
        <TouchableOpacity style={styles.viewAllButton} onPress={handleViewAll}>
          <Text style={styles.viewAllText}>View All</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        {albums.map(renderAlbumCard)}
      </ScrollView>

      {/* Album Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedAlbum && (
              <>
                <View style={styles.modalHeader}>
                  <Image
                    source={{ uri: selectedAlbum.coverUrl }}
                    style={styles.modalAlbumCover}
                  />
                  <View style={styles.modalAlbumInfo}>
                    <Text style={styles.modalAlbumTitle}>
                      {selectedAlbum.title}
                    </Text>
                    <Text style={styles.modalAlbumDetails}>
                      {formatDate(selectedAlbum.releaseDate)} • {selectedAlbum.trackCount} tracks
                    </Text>
                    <Text style={styles.modalAlbumDetails}>
                      {formatDuration(selectedAlbum.totalDuration)}
                    </Text>
                    
                    <View style={styles.modalActions}>
                      <TouchableOpacity
                        style={styles.modalPlayButton}
                        onPress={() => handlePlayAlbum(selectedAlbum)}
                      >
                        <Ionicons name="play" size={12} color={themeColors.background} />
                        <Text style={styles.modalPlayButtonText}>Play</Text>
                      </TouchableOpacity>
                      
                      {selectedAlbum.price && (
                        <TouchableOpacity
                          style={styles.modalPriceButton}
                          onPress={() => handlePurchaseAlbum(selectedAlbum)}
                        >
                          <Text style={styles.modalPriceButtonText}>
                            ${selectedAlbum.price}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                  
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => setModalVisible(false)}
                  >
                    <Ionicons name="close" size={24} color={themeColors.text} />
                  </TouchableOpacity>
                </View>

                <FlatList
                  data={selectedAlbum.tracks || []}
                  renderItem={renderTrackItem}
                  keyExtractor={(item) => item.id}
                  style={styles.tracksList}
                />
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}
