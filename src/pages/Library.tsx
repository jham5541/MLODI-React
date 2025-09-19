import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image, Animated, Dimensions, FlatList, Modal, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useTheme, colors } from '../context/ThemeContext';
import { useSearch } from '../context/SearchContext';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import ProductCard from '../components/marketplace/ProductCard';
import { UserLibrary, Product } from '../types/marketplace';
import MLService from '../services/ml/MLService';
import { purchaseService } from '../services/purchaseService';
import { currentMusicService as musicService } from '../services/serviceProvider';
import NFTService from '../services/web3/nftService';

type LibraryFilter = 'all' | 'songs' | 'albums' | 'videos';

export default function LibraryScreen() {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];
  const { user } = useAuthStore();
  const { userLibrary, loadLibrary, isLoading } = useCartStore();
  const { openSearch } = useSearch();
  const navigation = useNavigation();

  const [activeFilter, setActiveFilter] = useState<LibraryFilter>('all');

  // Sample library data for demo purposes when not authenticated
  const sampleLibraryData: Product[] = [
    {
      id: 'demo-1',
      type: 'song',
      title: 'Midnight Dreams',
      artist: 'Luna Echo',
      artistId: 'artist-1',
      albumId: 'album-demo-1',
      description: 'A dreamy electronic track',
      price: 0.99,
      image: 'https://picsum.photos/300/300?random=1',
      previewUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
      isOwned: true,
    },
    {
      id: 'demo-2',
      type: 'album',
      title: 'Electric Nights',
      artist: 'Neon Pulse',
      artistId: 'artist-2',
      description: 'Full album with 12 tracks',
      price: 9.99,
      image: 'https://picsum.photos/300/300?random=2',
      trackCount: 12,
      isOwned: true,
    },
    {
      id: 'demo-3',
      type: 'video',
      title: 'Live at Madison Square',
      artist: 'The Vibes',
      artistId: 'artist-3',
      description: 'Full concert recording',
      price: 14.99,
      image: 'https://picsum.photos/300/300?random=3',
      duration: '1:45:00',
      isOwned: true,
    },
    {
      id: 'demo-4',
      type: 'song',
      title: 'Summer Breeze',
      artist: 'Coastal Rhythm',
      artistId: 'artist-4',
      albumId: 'album-demo-2',
      description: 'Tropical house vibes',
      price: 0.99,
      image: 'https://picsum.photos/300/300?random=4',
      previewUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
      isOwned: true,
    },
    {
      id: 'demo-5',
      type: 'song',
      title: 'Urban Jungle',
      artist: 'City Lights',
      artistId: 'artist-5',
      albumId: 'album-demo-3',
      description: 'Hip-hop meets electronic',
      price: 0.99,
      image: 'https://picsum.photos/300/300?random=5',
      previewUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
      isOwned: true,
    },
  ];

  useEffect(() => {
    const loadData = async () => {
      try {
        // Only try to load library if user is authenticated
        if (user) {
          await loadLibrary().catch(error => {
            console.log('Library loading failed:', error.message);
          });
        }

        // Load NFT-owned songs from the user's wallet
        const nftService = NFTService.getInstance();
        const ownedNFTs = await nftService.getOwnedTokens();
        
        // Convert NFTs to Product format
        const nftProducts = ownedNFTs.map(nft => ({
          id: nft.id,
          type: 'song',
          title: nft.name,
          artist: nft.artist,
          artistId: nft.artistId,
          albumId: nft.albumId,
          description: nft.description,
          price: 0, // Already owned
          image: nft.image,
          previewUrl: nft.audio_url,
          isOwned: true,
        }));

        // Add NFT products to purchasedProducts
        setPurchasedProducts(prev => [...prev, ...nftProducts]);
      } catch (error) {
        console.log('Error loading data:', error.message);
        // On error, we'll still show sample data
      } finally {
        setLoadingPurchased(false);
      }
    };

    loadData();
  }, [loadLibrary, user]);

  const [purchasedProducts, setPurchasedProducts] = useState<Product[]>([]);
  const [loadingPurchased, setLoadingPurchased] = useState(true);

  const [recommendedSongs, setRecommendedSongs] = useState<Product[]>([]);

  useEffect(() => {
    const loadRecommendedSongs = async () => {
      try {
        const recommendations = await MLService.fetchRecommendedSongs();
        if (recommendations.length) {
          setRecommendedSongs(recommendations.map(song => ({
            id: song.id,
            type: 'song',
            title: song.title,
            artist: song.artistName,
            artistId: song.artistId,
            albumId: song.albumId,
            description: 'AI-powered recommendation',
            price: song.price,
            image: song.coverUrl,
            previewUrl: song.previewUrl,
            isOwned: false,
          })));
        }
      } catch (error) {
        console.log('Error loading recommended songs:', error);
      }
    };

    loadRecommendedSongs();
  }, []);
  useEffect(() => {
    const loadPurchasedItems = async () => {
      try {
        const songs = await purchaseService.getPurchasedSongs();
        const songIds = Array.from(songs.keys());
        
        const products: Product[] = [];
        
        // Fetch actual song data for purchased songs
        if (songIds.length > 0) {
          try {
            // For now, use the song IDs to find matching items from sample data
            // In a real app, you would fetch from musicService.getSong(id)
            const purchasedSongs = sampleLibraryData.filter(
              item => item.type === 'song' && songIds.includes(item.id)
            );
            products.push(...purchasedSongs);
          } catch (error) {
            console.log('Error fetching song data:', error);
          }
        }
        
        setPurchasedProducts(products);
      } catch (error) {
        console.log('Error loading purchased items:', error);
      } finally {
        setLoadingPurchased(false);
      }
    };
    
    loadPurchasedItems();
  }, []);

  const getFilteredItems = (): Product[] => {
    // Get items from userLibrary
    const libraryProducts = userLibrary?.map(item => item.products).filter(Boolean) as Product[] || [];
    
    // Combine all products (avoid duplicates)
    const allProducts = [...libraryProducts];
    
    // Add purchased products
    purchasedProducts.forEach(item => {
      if (!allProducts.find(p => p.id === item.id)) {
        allProducts.push(item);
      }
    });
    
    // If no products and not loading, show sample data for demo
    const products = (allProducts.length > 0 || loadingPurchased) ? allProducts : sampleLibraryData;
    
    switch (activeFilter) {
      case 'songs':
        return products.filter(product => product.type === 'song');
      case 'albums':
        return products.filter(product => product.type === 'album');
      case 'videos':
        return products.filter(product => product.type === 'video');
      default:
        return products;
    }
  };

  const handlePlayPreview = async (product: Product) => {
    // Implement full song playback for owned items
    console.log('Playing full song:', product.title);
  };

  const filteredItems = getFilteredItems();

  const filters = [
    { key: 'all', label: 'All', icon: 'library' },
    { key: 'songs', label: 'Songs', icon: 'musical-note' },
    { key: 'albums', label: 'Albums', icon: 'albums' },
    { key: 'videos', label: 'Videos', icon: 'videocam' },
  ];

  const { width: screenWidth } = Dimensions.get('window');
  const fadeAnim = new Animated.Value(0);
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const [creditsVisible, setCreditsVisible] = useState(false);
  const [creditsData, setCreditsData] = useState<any>(null);

  const showViewCreditsModal = (item: Product) => {
    // For demo purposes, create sample metadata
    const sampleMetadata = {
      title: item.title,
      artist: item.artist,
      performers: item.artist,
      producers: "John Doe Productions",
      writers: "Jane Smith, John Doe",
      engineers: "Mike Johnson",
      label: "Independent",
      release_date: "2024-01-15",
      unique_token_number: item.id || "N/A"
    };

    setCreditsData(sampleMetadata);
    setCreditsVisible(true);
  };

  // Create a separate component for library items to properly use hooks
  const LibraryItem = React.memo(({ item, index }: { item: Product; index: number }) => {
    const animatedValue = React.useRef(new Animated.Value(0)).current;
    
    React.useEffect(() => {
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 300,
        delay: index * 30,
        useNativeDriver: true,
      }).start();
    }, [animatedValue, index]);

    const translateX = animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [50, 0],
    });

    return (
      <Animated.View
        style={[
          {
            opacity: animatedValue,
            transform: [{ translateX }],
          },
        ]}
      >
        <TouchableOpacity style={styles.libraryItem} activeOpacity={0.7}>
          <View style={styles.itemImageContainer}>
            <Image
              source={{ uri: item.image }}
              style={styles.itemImage}
            />
            {item.type === 'song' && (
              <View style={styles.playButton}>
                <Ionicons name="play" size={14} color="white" />
              </View>
            )}
          </View>
          
          <View style={styles.itemContent}>
            <Text style={styles.itemTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <View style={styles.itemSubInfo}>
              <Text style={styles.itemArtist} numberOfLines={1}>
                {item.artist}
              </Text>
              <Text style={styles.itemDot}>•</Text>
              <Text style={styles.itemType}>
                {item.type === 'song' ? 'Song' : item.type === 'album' ? 'Album' : 'Video'}
              </Text>
              {item.duration && (
                <>
                  <Text style={styles.itemDot}>•</Text>
                  <Text style={styles.itemDuration}>{item.duration}</Text>
                </>
              )}
            </View>
          </View>

          <TouchableOpacity style={styles.moreButton} onPress={() => handleMenuOpen(item)}>
            <Ionicons
              name="ellipsis-horizontal"
              size={18}
              color={themeColors.textSecondary}
            />
          </TouchableOpacity>
        </TouchableOpacity>
      </Animated.View>
    );
  });

  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Product | null>(null);

  const handleMenuOpen = (item: Product) => {
    setSelectedItem(item);
    setMenuVisible(true);
  };

  const handleMenuClose = () => {
    setMenuVisible(false);
    setSelectedItem(null);
  };

  const handleMenuOptionSelect = (option: string) => {
    switch (option) {
      case 'View Credits':
        if (selectedItem) {
          showViewCreditsModal(selectedItem);
        }
        break;
      case 'Add to Playlist':
        console.log(`Adding ${selectedItem?.title} to playlist`);
        // Open playlist selection modal
        break;
      case 'Add to Queue':
        console.log(`Adding ${selectedItem?.title} to queue`);
        // Add to playback queue
        break;
      case 'Go to Artist':
        if (selectedItem?.artistId) {
          navigation.navigate('ArtistProfile', { artistId: selectedItem.artistId });
        }
        break;
      case 'Go to Album':
        if (selectedItem?.type === 'song' && selectedItem?.albumId) {
          navigation.navigate('AlbumPage', { albumId: selectedItem.albumId });
        } else if (selectedItem?.type === 'album') {
          navigation.navigate('AlbumPage', { albumId: selectedItem.id });
        }
        break;
      case 'DJ a Set':
        console.log(`Starting DJ set with ${selectedItem?.title}`);
        // Navigate to DJ mode or start DJ functionality
        break;
    }
    
    handleMenuClose();
  };

  const LibraryAlbumItem = React.memo(({ item, index }: { item: Product; index: number }) => {
    const navigation = useNavigation();
    const animatedValue = React.useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 300,
        delay: index * 30,
        useNativeDriver: true,
      }).start();
    }, [animatedValue, index]);

    const scale = animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0.8, 1],
    });

    const goToAlbum = () => {
      navigation.navigate('AlbumPage', { albumId: item.id });
    };

    return (
      <Animated.View
        style={[
          styles.albumGridItem,
          {
            opacity: animatedValue,
            transform: [{ scale }],
          },
        ]}
      >
        <TouchableOpacity onPress={goToAlbum} style={styles.albumItem} activeOpacity={0.7}>
          <Image
            source={{ uri: item.image }}
            style={styles.albumImage}
          />
          <View style={styles.albumContent}>
            <Text style={styles.albumTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.albumArtist} numberOfLines={1}>
              {item.artist}
            </Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  });

  const renderLibraryItem = ({ item, index }: { item: Product; index: number }) => {
    if (activeFilter === 'albums') {
      return <LibraryAlbumItem item={item} index={index} />;
    }
    return <LibraryItem item={item} index={index} />;
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeColors.background,
    },
    header: {
      paddingTop: 16,
      paddingHorizontal: 16,
      paddingBottom: 8,
    },
    headerTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: themeColors.text,
    },
    subtitle: {
      fontSize: 14,
      color: themeColors.textSecondary,
      marginTop: 2,
    },
    searchButton: {
      padding: 8,
      borderRadius: 20,
      backgroundColor: themeColors.surface,
    },
    filtersContainer: {
      marginTop: 12,
    },
    filtersList: {
      paddingBottom: 8,
    },
    filterButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14,
      paddingVertical: 6,
      marginRight: 8,
      borderRadius: 16,
      backgroundColor: themeColors.surface + '80',
      borderWidth: 1,
      borderColor: themeColors.border + '40',
    },
    activeFilterButton: {
      backgroundColor: themeColors.primary,
      borderColor: themeColors.primary,
    },
    filterIcon: {
      marginRight: 6,
    },
    filterText: {
      fontSize: 13,
      fontWeight: '500',
      color: themeColors.text,
    },
    activeFilterText: {
      color: 'white',
    },
    statsContainer: {
      flexDirection: 'row',
      gap: 16,
      marginBottom: 16,
    },
    statCard: {
      flex: 1,
      backgroundColor: themeColors.surface,
      padding: 16,
      borderRadius: 12,
      alignItems: 'center',
    },
    statNumber: {
      fontSize: 20,
      fontWeight: 'bold',
      color: themeColors.primary,
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 12,
      color: themeColors.textSecondary,
      textAlign: 'center',
    },
    content: {
      flex: 1,
    },
    resultsHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: themeColors.surface,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.border,
    },
    resultsText: {
      fontSize: 16,
      fontWeight: '600',
      color: themeColors.text,
    },
    itemsList: {
      padding: 16,
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
      fontSize: 20,
      fontWeight: '600',
      color: themeColors.text,
      marginBottom: 8,
      textAlign: 'center',
    },
    emptySubtitle: {
      fontSize: 16,
      color: themeColors.textSecondary,
      textAlign: 'center',
      lineHeight: 24,
    },
    emptyButton: {
      backgroundColor: themeColors.primary,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
      marginTop: 20,
    },
    emptyButtonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '600',
    },
    libraryItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
      paddingHorizontal: 16,
      backgroundColor: themeColors.background,
    },
    itemImageContainer: {
      position: 'relative',
      marginRight: 12,
    },
    itemImage: {
      width: 44,
      height: 44,
      borderRadius: 4,
    },
    playButton: {
      position: 'absolute',
      bottom: 2,
      right: 2,
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: themeColors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.3,
      shadowRadius: 2,
      elevation: 3,
    },
    itemContent: {
      flex: 1,
      justifyContent: 'center',
    },
    itemTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: themeColors.text,
      marginBottom: 2,
    },
    itemSubInfo: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    itemArtist: {
      fontSize: 13,
      color: themeColors.textSecondary,
    },
    itemDot: {
      fontSize: 12,
      color: themeColors.textSecondary,
      marginHorizontal: 4,
    },
    itemType: {
      fontSize: 13,
      color: themeColors.textSecondary,
      textTransform: 'capitalize',
    },
    itemDuration: {
      fontSize: 13,
      color: themeColors.textSecondary,
    },
    moreButton: {
      padding: 8,
    },
    flatListContent: {
      paddingBottom: 100,
    },
    albumGridItem: {
      width: (screenWidth - 48) / 2,
      marginHorizontal: 8,
      marginBottom: 16,
    },
    albumItem: {
      backgroundColor: themeColors.surface,
      borderRadius: 8,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    albumImage: {
      width: '100%',
      aspectRatio: 1,
    },
    albumContent: {
      padding: 12,
    },
    albumTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: themeColors.text,
      marginBottom: 4,
    },
    albumArtist: {
      fontSize: 12,
      color: themeColors.textSecondary,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    menuContainer: {
      backgroundColor: themeColors.surface,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingTop: 8,
      paddingBottom: 34, // Safe area padding
    },
    handle: {
      width: 40,
      height: 4,
      backgroundColor: themeColors.textSecondary,
      borderRadius: 2,
      alignSelf: 'center',
      marginBottom: 16,
      opacity: 0.3,
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
    },
    menuIcon: {
      marginRight: 16,
      width: 24,
    },
    menuText: {
      fontSize: 16,
      fontWeight: '500',
      color: themeColors.text,
      flex: 1,
    },
    creditsItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.border + '20',
    },
    creditsLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: themeColors.textSecondary,
      textTransform: 'capitalize',
    },
    creditsText: {
      fontSize: 14,
      fontWeight: '400',
      color: themeColors.text,
      flex: 1,
      textAlign: 'right',
      marginLeft: 16,
    },
    creditsHeader: {
      fontSize: 24,
      fontWeight: '700',
      color: themeColors.text,
      textAlign: 'center',
      marginBottom: 8,
    },
    creditsSongTitle: {
      fontSize: 16,
      fontWeight: '500',
      color: themeColors.textSecondary,
      textAlign: 'center',
      marginBottom: 24,
    },
    creditsContent: {
      width: '100%',
      maxHeight: 400,
    },
    creditsContainer: {
      backgroundColor: themeColors.surface,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 40,
      maxHeight: '80%',
    },
    closeButton: {
      backgroundColor: themeColors.primary,
      paddingVertical: 12,
      paddingHorizontal: 32,
      borderRadius: 25,
      alignSelf: 'center',
      marginTop: 20,
    },
    closeButtonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '600',
    },
  });

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons
        name="library-outline"
        size={64}
        color={themeColors.textSecondary}
        style={styles.emptyIcon}
      />
      <Text style={styles.emptyTitle}>Your Library is Empty</Text>
      <Text style={styles.emptySubtitle}>
        Purchase songs, albums, and videos from the marketplace to build your personal library.
      </Text>
    </View>
  );

  // Remove authentication check - show library UI even without login
  // if (!user) {
  //   return (
  //     <View style={styles.container}>
  //       <View style={styles.header}>
  //         <Text style={styles.title}>My Library</Text>
  //         <Text style={styles.subtitle}>Your personal collection</Text>
  //       </View>
  //       
  //       <View style={styles.emptyContainer}>
  //         <Ionicons
  //           name="person-outline"
  //           size={64}
  //           color={themeColors.textSecondary}
  //           style={styles.emptyIcon}
  //         />
  //         <Text style={styles.emptyTitle}>Sign In Required</Text>
  //         <Text style={styles.emptySubtitle}>
  //           Please sign in to view your personal library and purchased items.
  //         </Text>
  //       </View>
  //     </View>
  //   );
  // }

  const creditsModal = creditsData && (
    <Modal
      visible={creditsVisible}
      transparent
      animationType="slide"
      onRequestClose={() => setCreditsVisible(false)}
    >
      <TouchableOpacity 
        style={styles.modalOverlay} 
        activeOpacity={1} 
        onPress={() => setCreditsVisible(false)}
      >
        <TouchableOpacity activeOpacity={1}>
          <View style={styles.creditsContainer}>
            <View style={styles.handle} />
            <Text style={styles.creditsHeader}>Song Credits</Text>
            <Text style={styles.creditsSongTitle}>{creditsData.title}</Text>
            <ScrollView style={styles.creditsContent} showsVerticalScrollIndicator={false}>
              {Object.entries(creditsData).map(([key, value]) => {
                if (key === 'title') return null;
                return (
                  <View style={styles.creditsItem} key={key}>
                    <Text style={styles.creditsLabel}>
                      {key.replace(/_/g, ' ')}
                    </Text>
                    <Text style={styles.creditsText}>{value || 'N/A'}</Text>
                  </View>
                );
              })}
            </ScrollView>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setCreditsVisible(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      {creditsModal}
      <LinearGradient
        colors={[themeColors.primary + '10', themeColors.background]}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.title}>Library</Text>
            <Text style={styles.subtitle}>
              {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'}
            </Text>
          </View>
          <TouchableOpacity style={styles.searchButton} onPress={openSearch}>
            <Ionicons name="search" size={24} color={themeColors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersList}
          style={styles.filtersContainer}
        >
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterButton,
                activeFilter === filter.key && styles.activeFilterButton,
              ]}
              onPress={() => setActiveFilter(filter.key as LibraryFilter)}
            >
              <Ionicons
                name={filter.icon as any}
                size={14}
                color={activeFilter === filter.key ? 'white' : themeColors.text}
                style={styles.filterIcon}
              />
              <Text
                style={[
                  styles.filterText,
                  activeFilter === filter.key && styles.activeFilterText,
                ]}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </LinearGradient>


      <View style={styles.content}>
        {isLoading ? (
          <View style={[styles.emptyContainer, { justifyContent: 'center' }]}>
            <ActivityIndicator size="large" color={themeColors.primary} />
            <Text style={[styles.emptyTitle, { marginTop: 16 }]}>Loading Your Library...</Text>
          </View>
        ) : filteredItems.length === 0 ? (
          renderEmptyState()
        ) : (
          <FlatList
            data={filteredItems}
            keyExtractor={(item) => item.id}
            renderItem={renderLibraryItem}
            contentContainerStyle={[
              styles.flatListContent,
              activeFilter === 'albums' && { paddingHorizontal: 16 }
            ]}
            numColumns={activeFilter === 'albums' ? 2 : 1}
            key={activeFilter}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
      {selectedItem && (
        <Modal
          visible={menuVisible}
          transparent
          animationType="slide"
          onRequestClose={handleMenuClose}
        >
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={handleMenuClose}>
            <TouchableOpacity activeOpacity={1}>
            <View style={styles.menuContainer}>
              <View style={styles.handle} />
              <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuOptionSelect('View Credits')}>
                <Ionicons name="document-text-outline" size={18} color={themeColors.text} style={styles.menuIcon}/>
                <Text style={styles.menuText}>View Credits</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuOptionSelect('Add to Playlist')}>
                <Ionicons name="list-outline" size={18} color={themeColors.text} style={styles.menuIcon}/>
                <Text style={styles.menuText}>Add to Playlist</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuOptionSelect('Add to Queue')}>
                <Ionicons name="play-outline" size={18} color={themeColors.text} style={styles.menuIcon}/>
                <Text style={styles.menuText}>Add to Queue</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuOptionSelect('Go to Artist')}>
                <Ionicons name="person-outline" size={18} color={themeColors.text} style={styles.menuIcon}/>
                <Text style={styles.menuText}>Go to Artist</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuOptionSelect('Go to Album')}>
                <Ionicons name="albums-outline" size={18} color={themeColors.text} style={styles.menuIcon}/>
                <Text style={styles.menuText}>Go to Album</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuOptionSelect('DJ a Set')}>
                <Ionicons name="headset-outline" size={18} color={themeColors.text} style={styles.menuIcon}/>
                <Text style={styles.menuText}>DJ a Set</Text>
              </TouchableOpacity>
            </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      )}
    </SafeAreaView>
  );
}