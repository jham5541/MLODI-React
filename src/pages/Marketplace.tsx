import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, colors } from '../context/ThemeContext';
import { useWeb3 } from '../context/Web3Context';
import NFTCard from '../components/marketplace/NFTCard';
import { sampleSongs } from '../data/sampleData';

type MarketplaceFilter = 'all' | 'music' | 'collectibles' | 'trending';

export default function MarketplaceScreen() {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];
  const { isConnected, address } = useWeb3();
  const [activeFilter, setActiveFilter] = useState<MarketplaceFilter>('all');

  // Filter songs that have NFT metadata
  const nftSongs = sampleSongs.filter(song => song.tokenMetadata);

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
  });

  const filters: { key: MarketplaceFilter; label: string }[] = [
    { key: 'all', label: 'All NFTs' },
    { key: 'music', label: 'Music' },
    { key: 'collectibles', label: 'Collectibles' },
    { key: 'trending', label: 'Trending' },
  ];

  const getFilteredData = () => {
    switch (activeFilter) {
      case 'trending':
        return nftSongs.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
      case 'music':
      case 'all':
      default:
        return nftSongs;
    }
  };

  const handlePurchase = (song: any) => {
    console.log('NFT purchased:', song.title);
    // Here you would typically update the user's collection
  };

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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>Marketplace</Text>
          <View style={styles.walletStatus}>
            <Ionicons name="wallet" size={14} color={themeColors.success} />
            <Text style={styles.walletStatusText}>Connected</Text>
          </View>
        </View>
        
        <Text style={styles.subtitle}>
          Discover and collect unique music NFTs from your favorite artists
        </Text>
        
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContainer}
        >
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterButton,
                activeFilter === filter.key && styles.activeFilterButton,
              ]}
              onPress={() => setActiveFilter(filter.key)}
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

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{nftSongs.length}</Text>
            <Text style={styles.statLabel}>Available NFTs</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {nftSongs.reduce((sum, song) => sum + (song.supply?.available || 0), 0)}
            </Text>
            <Text style={styles.statLabel}>Total Supply</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {Math.round(nftSongs.reduce((sum, song) => sum + (song.popularity || 0), 0) / nftSongs.length)}%
            </Text>
            <Text style={styles.statLabel}>Avg. Popularity</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>
          {activeFilter === 'all' ? 'All Music NFTs' : 
           activeFilter === 'trending' ? 'Trending NFTs' : 'Music NFTs'}
        </Text>

        {getFilteredData().map((song) => (
          <NFTCard
            key={song.id}
            song={song}
            onPress={() => console.log('View NFT details:', song.title)}
            onPurchase={handlePurchase}
          />
        ))}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}