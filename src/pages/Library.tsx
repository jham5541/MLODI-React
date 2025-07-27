import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, colors } from '../context/ThemeContext';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import ProductCard from '../components/marketplace/ProductCard';
import { UserLibrary, Product } from '../types/marketplace';

type LibraryFilter = 'all' | 'songs' | 'albums' | 'videos';

export default function LibraryScreen() {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];
  const { user } = useAuthStore();
  const { userLibrary, loadLibrary, isLoading } = useCartStore();

  const [activeFilter, setActiveFilter] = useState<LibraryFilter>('all');

  useEffect(() => {
    if (user?.id) {
      loadLibrary();
    }
  }, [user?.id, loadLibrary]);

  const getFilteredItems = (): Product[] => {
    if (!userLibrary || userLibrary.length === 0) return [];
    
    const products = userLibrary.map(item => item.products).filter(Boolean) as Product[];
    
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
    subtitle: {
      fontSize: 16,
      color: themeColors.textSecondary,
      marginBottom: 16,
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
      <TouchableOpacity style={styles.emptyButton}>
        <Text style={styles.emptyButtonText}>Browse Marketplace</Text>
      </TouchableOpacity>
    </View>
  );

  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>My Library</Text>
          <Text style={styles.subtitle}>Your personal collection</Text>
        </View>
        
        <View style={styles.emptyContainer}>
          <Ionicons
            name="person-outline"
            size={64}
            color={themeColors.textSecondary}
            style={styles.emptyIcon}
          />
          <Text style={styles.emptyTitle}>Sign In Required</Text>
          <Text style={styles.emptySubtitle}>
            Please sign in to view your personal library and purchased items.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>My Library</Text>
        </View>
        
        <Text style={styles.subtitle}>Your personal collection</Text>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {userLibrary?.filter(item => item.products?.type === 'song').length || 0}
            </Text>
            <Text style={styles.statLabel}>Songs</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {userLibrary?.filter(item => item.products?.type === 'album').length || 0}
            </Text>
            <Text style={styles.statLabel}>Albums</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {userLibrary?.filter(item => item.products?.type === 'video').length || 0}
            </Text>
            <Text style={styles.statLabel}>Videos</Text>
          </View>
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
                onPress={() => setActiveFilter(filter.key as LibraryFilter)}
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
          {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'}
        </Text>
      </View>

      <View style={styles.content}>
        {isLoading ? (
          <View style={[styles.emptyContainer, { justifyContent: 'center' }]}>
            <ActivityIndicator size="large" color={themeColors.primary} />
            <Text style={[styles.emptyTitle, { marginTop: 16 }]}>Loading Your Library...</Text>
          </View>
        ) : filteredItems.length === 0 ? (
          renderEmptyState()
        ) : (
          <ScrollView>
            <View style={styles.itemsList}>
              {filteredItems.map((item: Product) => (
                <ProductCard
                  key={item.id}
                  product={item}
                  onPlayPreview={item.type === 'song' ? handlePlayPreview : undefined}
                  showAddToCart={false}
                />
              ))}
            </View>
            <View style={{ height: 100 }} />
          </ScrollView>
        )}
      </View>
    </View>
  );
}