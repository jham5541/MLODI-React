import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, colors } from '../context/ThemeContext';
import { useWeb3 } from '../context/Web3Context';
import NFTCard from '../components/marketplace/NFTCard';
import MarketplaceHeader from '../components/marketplace/MarketplaceHeader';
import MarketplaceStats from '../components/marketplace/MarketplaceStats';
import MarketplaceCard from '../components/marketplace/MarketplaceCard';
import { useMarketplaceStore } from '../store/marketplaceStore';
import { MarketplaceFilters } from '../services/marketplaceService';

type MarketplaceFilter = 'all' | 'music' | 'collectibles' | 'trending';

export default function MarketplaceScreen() {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];
  const { isConnected, address } = useWeb3();
  
  // Marketplace store
  const {
    listings,
    featuredListings,
    collections,
    trendingCollections,
    marketplaceStats,
    currentFilters,
    searchQuery,
    searchResults,
    isLoadingListings,
    isLoadingStats,
    isSearching,
    isPurchasing,
    hasMoreListings,
    loadListings,
    loadMoreListings,
    loadFeaturedListings,
    loadCollections,
    loadTrendingCollections,
    loadMarketplaceStats,
    updateFilters,
    clearFilters,
    searchMarketplace,
    clearSearch,
    purchaseNFT,
  } = useMarketplaceStore();

  const [activeFilter, setActiveFilter] = useState<MarketplaceFilter>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [refreshing, setRefreshing] = useState(false);

  // Load data on component mount
  useEffect(() => {
    loadInitialData();
  }, []);

  // Update listings when filters change
  useEffect(() => {
    if (activeFilter === 'trending') {
      loadTrendingCollections();
    } else {
      loadListings(getFiltersForActiveFilter(), true);
    }
  }, [activeFilter]);

  const loadInitialData = async () => {
    try {
      await Promise.all([
        loadListings(),
        loadFeaturedListings(),
        loadCollections(),
        loadTrendingCollections(),
        loadMarketplaceStats(),
      ]);
    } catch (error) {
      console.error('Failed to load marketplace data:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadInitialData();
    setRefreshing(false);
  };

  const getFiltersForActiveFilter = (): Partial<MarketplaceFilters> => {
    const baseFilters = { ...currentFilters };
    
    switch (activeFilter) {
      case 'music':
        return { ...baseFilters, search: undefined };
      case 'trending':
        return { ...baseFilters, sort_by: 'recent' as const };
      case 'collectibles':
        return { ...baseFilters, verified_only: true };
      default:
        return baseFilters;
    }
  };

  const handleSearch = (query: string) => {
    if (query.trim()) {
      searchMarketplace(query);
    } else {
      clearSearch();
    }
  };

  const handleFiltersChange = (newFilters: Partial<MarketplaceFilters>) => {
    updateFilters(newFilters);
  };

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
    walletStatus: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      backgroundColor: isConnected ? themeColors.success + '20' : themeColors.error + '20',
    },
    walletStatusText: {
      fontSize: 12,
      color: isConnected ? themeColors.success : themeColors.error,
      marginLeft: 4,
      fontWeight: '500',
    },
    subtitle: {
      fontSize: 16,
      color: themeColors.textSecondary,
      marginBottom: 16,
    },
    filterContainer: {
      flexDirection: 'row',
      gap: 8,
    },
    filterButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: themeColors.surface,
      borderWidth: 1,
      borderColor: themeColors.border,
    },
    activeFilterButton: {
      backgroundColor: themeColors.primary,
      borderColor: themeColors.primary,
    },
    filterButtonText: {
      fontSize: 14,
      fontWeight: '500',
      color: themeColors.text,
    },
    activeFilterButtonText: {
      color: 'white',
    },
    content: {
      flex: 1,
      padding: 16,
    },
    statsContainer: {
      flexDirection: 'row',
      marginBottom: 24,
      gap: 16,
    },
    statCard: {
      flex: 1,
      backgroundColor: themeColors.surface,
      padding: 16,
      borderRadius: 12,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: themeColors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    statValue: {
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
    sectionTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: themeColors.text,
      marginBottom: 16,
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
      fontWeight: '600',
      color: themeColors.text,
      marginBottom: 8,
      textAlign: 'center',
    },
    emptySubtitle: {
      fontSize: 14,
      color: themeColors.textSecondary,
      textAlign: 'center',
    },
    resultsHeader: {
      paddingHorizontal: 16,
      marginBottom: 16,
    },
    gridContainer: {
      paddingHorizontal: 16,
    },
    gridItem: {
      marginBottom: 16,
    },
    filterContainer: {
      marginBottom: 16,
    },
  });

  const handleSort = (sortBy: string, direction: 'asc' | 'desc') => {
    const sortMapping: Record<string, MarketplaceFilters['sort_by']> = {
      'price': direction === 'asc' ? 'price_asc' : 'price_desc',
      'rarity': direction === 'asc' ? 'rarity_asc' : 'rarity_desc',
      'recent': 'recent',
    };
    
    updateFilters({ sort_by: sortMapping[sortBy] || 'recent' });
  };

  const handlePurchase = async (listing: any) => {
    if (!isConnected) {
      Alert.alert('Wallet Required', 'Please connect your wallet to purchase NFTs');
      return;
    }

    try {
      const transaction = await purchaseNFT(listing.id);
      Alert.alert(
        'Purchase Successful!',
        `You have successfully purchased "${listing.song?.title || 'Music NFT'}" for ${listing.price} ${listing.currency}`
      );
    } catch (error) {
      console.error('Purchase failed:', error);
      Alert.alert('Purchase Failed', 'There was an error processing your purchase. Please try again.');
    }
  };

  const handleListingPress = (listing: any) => {
    console.log('View NFT details:', listing.song?.title || listing.id);
    // TODO: Navigate to listing detail screen
  };

  const getCurrentListings = () => {
    if (searchQuery && searchResults.length > 0) {
      return searchResults;
    }
    
    switch (activeFilter) {
      case 'trending':
        return listings.filter(l => l.collection?.is_verified);
      case 'collectibles':
        return listings.filter(l => l.collection?.is_verified);
      case 'music':
        return listings.filter(l => l.song_id);
      default:
        return listings;
    }
  };

  const renderLoadingState = () => (
    <View style={styles.emptyContainer}>
      <ActivityIndicator size="large" color={themeColors.primary} />
      <Text style={[styles.emptySubtitle, { marginTop: 16 }]}>
        Loading marketplace data...
      </Text>
    </View>
  );

  if (!isConnected) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.title}>Marketplace</Text>
            <View style={styles.walletStatus}>
              <Ionicons name="wallet-outline" size={14} color={themeColors.error} />
              <Text style={styles.walletStatusText}>Not Connected</Text>
            </View>
          </View>
          <Text style={styles.subtitle}>
            Discover and collect unique music NFTs from your favorite artists
          </Text>
        </View>
        
        <View style={styles.emptyContainer}>
          <Ionicons
            name="wallet-outline"
            size={64}
            color={themeColors.textSecondary}
            style={styles.emptyIcon}
          />
          <Text style={styles.emptyTitle}>Connect Your Wallet</Text>
          <Text style={styles.emptySubtitle}>
            Connect your Web3 wallet to browse and purchase music NFTs on the marketplace
          </Text>
        </View>
      </View>
    );
  }

  const currentListings = getCurrentListings();

  return (
    <View style={styles.container}>
      {/* Enhanced Header with Search and Filters */}
      <MarketplaceHeader
        searchQuery={searchQuery}
        onSearchChange={handleSearch}
        filters={currentFilters}
        onFiltersChange={handleFiltersChange}
        totalItems={currentListings.length}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[themeColors.primary]}
            tintColor={themeColors.primary}
          />
        }
      >
        {/* Marketplace Statistics */}
        <MarketplaceStats onSort={handleSort} />

        {/* Category Filters */}
        <View style={styles.filterContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
          >
            {[
              { key: 'all', label: 'All NFTs' },
              { key: 'music', label: 'Music' },
              { key: 'collectibles', label: 'Collectibles' },
              { key: 'trending', label: 'Trending' },
            ].map((filter) => (
              <TouchableOpacity
                key={filter.key}
                style={[
                  styles.filterButton,
                  activeFilter === filter.key && styles.activeFilterButton,
                ]}
                onPress={() => setActiveFilter(filter.key as MarketplaceFilter)}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    activeFilter === filter.key && styles.activeFilterButtonText,
                  ]}
                >
                  {filter.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Enhanced Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="cube-outline" size={24} color={themeColors.primary} />
            <Text style={styles.statValue}>
              {marketplaceStats?.total_sales || listings.length}
            </Text>
            <Text style={styles.statLabel}>Total Items</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="trending-up" size={24} color={themeColors.success} />
            <Text style={styles.statValue}>
              {marketplaceStats?.average_price?.toFixed(2) || '0.00'}
            </Text>
            <Text style={styles.statLabel}>Avg. Price (ETH)</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="people-outline" size={24} color={themeColors.warning} />
            <Text style={styles.statValue}>
              {marketplaceStats?.unique_buyers ? `${(marketplaceStats.unique_buyers / 1000).toFixed(1)}K` : '0'}
            </Text>
            <Text style={styles.statLabel}>Total Buyers</Text>
          </View>
        </View>

        {/* Results Section */}
        <View style={styles.resultsHeader}>
          <Text style={styles.sectionTitle}>
            {isLoadingListings ? 'Loading...' :
             currentListings.length === 0 ? 'No Results Found' :
             activeFilter === 'all' ? `All Music NFTs (${currentListings.length})` : 
             activeFilter === 'trending' ? `Trending NFTs (${currentListings.length})` : 
             `Music NFTs (${currentListings.length})`}
          </Text>
        </View>

        {/* Loading State */}
        {isLoadingListings && currentListings.length === 0 ? (
          renderLoadingState()
        ) : currentListings.length > 0 ? (
          /* Enhanced NFT Grid/List */
          viewMode === 'grid' ? (
            <View style={styles.gridContainer}>
              {currentListings.map((item) => (
                <View key={item.id} style={styles.gridItem}>
                  <MarketplaceCard
                    item={item}
                    onPress={() => handleListingPress(item)}
                    onPurchase={() => handlePurchase(item)}
                    viewMode="grid"
                    isPurchasing={isPurchasing}
                  />
                </View>
              ))}
              
              {/* Load More Button */}
              {hasMoreListings && !isLoadingListings && (
                <TouchableOpacity
                  style={[styles.filterButton, { marginTop: 16, alignSelf: 'center' }]}
                  onPress={loadMoreListings}
                >
                  <Text style={styles.filterButtonText}>Load More</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View>
              {currentListings.map((item) => (
                <MarketplaceCard
                  key={item.id}
                  item={item}
                  onPress={() => handleListingPress(item)}
                  onPurchase={() => handlePurchase(item)}
                  viewMode="list"
                  isPurchasing={isPurchasing}
                />
              ))}
              
              {/* Load More Button */}
              {hasMoreListings && !isLoadingListings && (
                <TouchableOpacity
                  style={[styles.filterButton, { marginTop: 16, alignSelf: 'center' }]}
                  onPress={loadMoreListings}
                >
                  <Text style={styles.filterButtonText}>Load More</Text>
                </TouchableOpacity>
              )}
            </View>
          )
        ) : (
          /* Empty State */
          <View style={styles.emptyContainer}>
            <Ionicons
              name="search-outline"
              size={64}
              color={themeColors.textSecondary}
              style={styles.emptyIcon}
            />
            <Text style={styles.emptyTitle}>No Items Found</Text>
            <Text style={styles.emptySubtitle}>
              Try adjusting your filters or search terms to find what you're looking for
            </Text>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}