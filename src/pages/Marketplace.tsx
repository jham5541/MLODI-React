import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  Alert,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Modal,
  Animated,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, colors } from '../context/ThemeContext';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import ProductCard from '../components/marketplace/ProductCard';
import CartModal from '../components/marketplace/CartModal';
import MerchModal from '../components/marketplace/MerchModal';
import AuthModal from '../components/auth/AuthModal';
import MarketplaceHeader from '../components/marketplace/MarketplaceHeader';
import MarketplaceStats from '../components/marketplace/MarketplaceStats';
import MarketplaceStatsView from '../components/marketplace/MarketplaceStatsView';
import MarketplaceDropCard from '../components/marketplace/MarketplaceDropCard';
import { marketplaceService } from '../services/marketplaceService';
import { Product, ProductType } from '../types/marketplace';
import { allProducts, featuredProducts, onSaleProducts } from '../data/marketplaceData';

type FilterType = 'all' | 'featured' | 'sale' | 'drops' | ProductType;
type ViewMode = 'marketplace' | 'stats' | 'drops';

export default function MarketplaceScreen() {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];
  const { user } = useAuthStore();
  const { 
    cart, 
    initializeCart,
    loadLibrary,
    addToCart, 
    getCartItemCount, 
    isInCart, 
    isOwned,
    isLoading 
  } = useCartStore();

  const [viewMode, setViewMode] = useState<ViewMode>('marketplace');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [showListModal, setShowListModal] = useState(false);
  const [showMerchModal, setShowMerchModal] = useState(false);
  const [selectedMerchProduct, setSelectedMerchProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Cart count animation
  const cartCount = (cart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0);
  const cartCountPrevRef = React.useRef<number>(cartCount);
  const cartBadgeScale = React.useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const prev = cartCountPrevRef.current;
    if (cartCount > prev) {
      Animated.sequence([
        Animated.spring(cartBadgeScale, {
          toValue: 1.25,
          useNativeDriver: true,
          friction: 5,
          tension: 200,
        }),
        Animated.spring(cartBadgeScale, {
          toValue: 1,
          useNativeDriver: true,
          friction: 5,
          tension: 200,
        }),
      ]).start();
    }
    cartCountPrevRef.current = cartCount;
  }, [cartCount, cartBadgeScale]);

  // Sample upcoming drops data
  const upcomingDrops = [
    {
      id: 'drop-1',
      title: 'Genesis Collection - Digital Dreams',
      artist: 'Luna Nova',
      artistAvatar: 'https://picsum.photos/100/100?random=1',
      coverImage: 'https://picsum.photos/400/300?random=10',
      dropDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
      price: 0.5,
      currency: 'ETH',
      description: 'Limited edition NFT collection featuring exclusive tracks and digital artwork.',
      supply: 1000,
    },
    {
      id: 'drop-2',
      title: 'Cyberpunk Chronicles Vol. 1',
      artist: 'Neon Pulse',
      artistAvatar: 'https://picsum.photos/100/100?random=2',
      coverImage: 'https://picsum.photos/400/300?random=11',
      dropDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now
      price: 0.8,
      currency: 'ETH',
      description: 'A journey through futuristic soundscapes and electronic beats.',
      supply: 500,
    },
  ];

  // Sample marketplace statistics
  const marketplaceStats = [
    { id: '1', name: 'Total Volume', value: '1,234.5 ETH', trend: 'up' as const, change: 12.5 },
    { id: '2', name: 'Floor Price', value: '0.25 ETH', trend: 'up' as const, change: 8.2 },
    { id: '3', name: 'Listed Items', value: '8,234', trend: 'down' as const, change: -2.1 },
    { id: '4', name: 'Unique Owners', value: '3,456', trend: 'up' as const, change: 15.7 },
    { id: '5', name: '24h Sales', value: '156', trend: 'up' as const, change: 23.4 },
    { id: '6', name: 'Average Price', value: '1.2 ETH', trend: 'down' as const, change: -5.3 },
  ];

  useEffect(() => {
    if (user?.id) {
      initializeCart();
      loadLibrary();
    }
  }, [user?.id, initializeCart, loadLibrary]);

  useEffect(() => {
    loadProducts();
  }, [activeFilter, searchQuery]);

  useEffect(() => {
    // Load initial products from mock data
    const getInitialProducts = () => {
      if (activeFilter === 'featured') {
        return featuredProducts;
      } else if (activeFilter === 'sale') {
        return onSaleProducts;
      } else if (activeFilter !== 'all') {
        return allProducts.filter(p => p.type === activeFilter);
      }
      return allProducts;
    };
    setProducts(getInitialProducts());
    setLoading(false);
  }, [activeFilter]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      let products: Product[] = [];

      try {
        // Try to load from service first
        if (activeFilter === 'featured') {
          products = await marketplaceService.getFeaturedProducts();
        } else if (activeFilter === 'sale') {
          products = await marketplaceService.getProducts({ on_sale: true });
        } else if (activeFilter !== 'all') {
          products = await marketplaceService.getProductsByType(activeFilter as ProductType);
        } else {
          products = await marketplaceService.getProducts({
            search: searchQuery.trim() || undefined,
            limit: 50
          });
        }
      } catch (serviceError) {
        console.log('Service failed, using sample data:', serviceError);
        // Fallback to sample data
        if (activeFilter === 'featured') {
          products = featuredProducts;
        } else if (activeFilter === 'sale') {
          products = onSaleProducts;
        } else if (activeFilter === 'song') {
          products = allProducts.filter(p => p.type === 'song');
        } else if (activeFilter === 'album') {
          products = allProducts.filter(p => p.type === 'album');
        } else if (activeFilter === 'video') {
          products = allProducts.filter(p => p.type === 'video');
        } else if (activeFilter === 'merch') {
          products = allProducts.filter(p => p.type === 'merch');
        } else {
          products = allProducts;
        }

        // Apply search filter if specified
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase();
          products = products.filter(product => 
            product.title.toLowerCase().includes(query) ||
            product.artist.toLowerCase().includes(query) ||
            product.description?.toLowerCase().includes(query)
          );
        }
      }

      console.log('Loaded products:', products.length);
      setProducts(products);
    } catch (error) {
      console.error('Failed to load products:', error);
      // Even if everything fails, show sample data
      console.log('Using fallback sample data:', allProducts.length);
      setProducts(allProducts);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (product: Product, variantId?: string) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    if (isOwned(product.id)) {
      Alert.alert('Already Owned', 'You already own this item.');
      return;
    }

    try {
      await addToCart(product, variantId);
      Alert.alert('Added to Cart', `${product.title} has been added to your cart.`);
    } catch (error) {
      Alert.alert('Error', 'Failed to add item to cart. Please try again.');
    }
  };

  const handleBuyNow = (product: Product) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    setSelectedMerchProduct(product);
    setShowMerchModal(true);
  };

  const handlePlayPreview = async (product: Product) => {
    // Implement preview playback
    console.log('Playing preview for:', product.title);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadProducts();
    } finally {
      setRefreshing(false);
    }
  };

  const handleListNewSong = () => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to list a new song.');
      return;
    }
    setShowListModal(true);
  };

  const handleNotifyMe = (dropId: string) => {
    console.log('Setting notification for drop:', dropId);
    // Implement notification logic
  };

  const handleEndReached = () => {
    if (hasMore && !loading) {
      setPage((prevPage) => prevPage + 1);
    }
  };

  const filters = [
    { key: 'all', label: 'All', icon: 'grid' },
    { key: 'featured', label: 'Featured', icon: 'star' },
    { key: 'sale', label: 'Sale', icon: 'pricetag' },
    { key: 'song', label: 'Songs', icon: 'musical-note' },
    { key: 'album', label: 'Albums', icon: 'albums' },
    { key: 'video', label: 'Videos', icon: 'videocam' },
    { key: 'merch', label: 'Merch', icon: 'storefront' },
  ];

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeColors.background,
    },
    header: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.border,
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
    cartButton: {
      position: 'relative',
      padding: 8,
      borderRadius: 8,
      backgroundColor: themeColors.surface,
    },
    cartBadge: {
      position: 'absolute',
      top: -2,
      right: -2,
      backgroundColor: themeColors.error,
      borderRadius: 10,
      minWidth: 20,
      height: 20,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 4,
    },
    cartBadgeText: {
      color: 'white',
      fontSize: 12,
      fontWeight: 'bold',
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: themeColors.surface,
      borderRadius: 12,
      paddingHorizontal: 16,
      marginBottom: 16,
    },
    searchIcon: {
      marginRight: 8,
    },
    searchInput: {
      flex: 1,
      height: 44,
      fontSize: 16,
      color: themeColors.text,
    },
    filtersContainer: {
      marginBottom: 16,
    },
    filtersList: {
      paddingHorizontal: 16,
    },
    filterButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 8,
      marginRight: 8,
      borderRadius: 20,
      backgroundColor: themeColors.surface,
      borderWidth: 1,
      borderColor: themeColors.border,
    },
    activeFilterButton: {
      backgroundColor: themeColors.primary,
      borderColor: themeColors.primary,
    },
    filterIcon: {
      marginRight: 6,
    },
    filterText: {
      fontSize: 14,
      fontWeight: '500',
      color: themeColors.text,
    },
    activeFilterText: {
      color: 'white',
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
    sortButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 6,
      backgroundColor: themeColors.background,
    },
    sortText: {
      fontSize: 14,
      color: themeColors.textSecondary,
      marginRight: 4,
    },
    productsList: {
      padding: 8,
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
    navigationTabs: {
      flexDirection: 'row',
      backgroundColor: themeColors.surface,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.border,
    },
    navTab: {
      flex: 1,
      paddingVertical: 16,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
    },
    activeNavTab: {
      borderBottomWidth: 2,
      borderBottomColor: themeColors.primary,
    },
    navTabText: {
      fontSize: 14,
      fontWeight: '600',
      color: themeColors.textSecondary,
      marginLeft: 6,
    },
    activeNavTabText: {
      color: themeColors.primary,
    },
    listButton: {
      position: 'absolute',
      bottom: 20,
      right: 20,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: themeColors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: themeColors.background,
      borderRadius: 16,
      padding: 24,
      width: '90%',
      maxHeight: '80%',
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: themeColors.text,
      marginBottom: 16,
      textAlign: 'center',
    },
    modalText: {
      fontSize: 16,
      color: themeColors.textSecondary,
      textAlign: 'center',
      marginBottom: 24,
      lineHeight: 24,
    },
    modalButton: {
      backgroundColor: themeColors.primary,
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 8,
      alignItems: 'center',
    },
    modalButtonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '600',
    },
  });

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons
        name="search-outline"
        size={64}
        color={themeColors.textSecondary}
        style={styles.emptyIcon}
      />
      <Text style={styles.emptyTitle}>No Products Found</Text>
      <Text style={styles.emptySubtitle}>
        Try adjusting your search terms or filters to find what you're looking for.
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>Marketplace</Text>
          <TouchableOpacity style={styles.cartButton} onPress={() => setShowCart(true)}>
            <Ionicons name="cart" size={24} color={themeColors.text} />
            {cartCount > 0 && (
              <Animated.View style={[styles.cartBadge, { transform: [{ scale: cartBadgeScale }] }]}>
                <Text style={styles.cartBadgeText}>{cartCount}</Text>
              </Animated.View>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <Ionicons 
            name="search" 
            size={20} 
            color={themeColors.textSecondary} 
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search songs, albums, videos, merch..."
            placeholderTextColor={themeColors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <View style={styles.filtersContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersList}
          >
            {filters.map((filter) => (
              <TouchableOpacity
                key={filter.key}
                style={[
                  styles.filterButton,
                  activeFilter === filter.key && styles.activeFilterButton,
                ]}
                onPress={() => setActiveFilter(filter.key as FilterType)}
              >
                <Ionicons
                  name={filter.icon as any}
                  size={16}
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
        </View>
      </View>

      <View style={styles.resultsHeader}>
        <Text style={styles.resultsText}>
          {products.length} {products.length === 1 ? 'item' : 'items'}
        </Text>
        <TouchableOpacity style={styles.sortButton}>
          <Text style={styles.sortText}>Sort</Text>
          <Ionicons name="chevron-down" size={16} color={themeColors.textSecondary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={[styles.emptyContainer, { justifyContent: 'center' }]}>
          <ActivityIndicator size="large" color={themeColors.primary} />
          <Text style={[styles.emptyTitle, { marginTop: 16 }]}>Loading Products...</Text>
        </View>
      ) : (
        <FlatList
          data={products}
          renderItem={({ item: product }) => (
            <View style={{ flex: 1, paddingHorizontal: 4 }}>
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={handleAddToCart}
                onBuyNow={handleBuyNow}
                onPlayPreview={handlePlayPreview}
                showAddToCart={!isOwned(product.id)}
              />
            </View>
          )}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.productsList}
          onEndReachedThreshold={0.5}
          onEndReached={handleEndReached}
          ListFooterComponent={() => loading && (
            <View style={{ paddingVertical: 20 }}>
              <ActivityIndicator size="large" color={themeColors.primary} />
            </View>
          )}
          ListEmptyComponent={renderEmptyState}
        />
      )}

      <CartModal
        isVisible={showCart}
        onClose={() => setShowCart(false)}
      />
      <MerchModal
        visible={showMerchModal}
        product={selectedMerchProduct}
        onClose={() => {
          setShowMerchModal(false);
          setSelectedMerchProduct(null);
        }}
        onPurchaseComplete={() => {
          // Optionally refresh products or show success message
          loadProducts();
        }}
      />

      {/* Auth Modal for gating purchases */}
      <AuthModal isVisible={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </SafeAreaView>
  );
}
