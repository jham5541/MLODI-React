import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { nftDropsService, MarketplaceStatistics } from '../../services/nftDropsService';

interface MarketplaceStatsViewProps {
  timeWindow?: 'day' | 'week' | 'month' | 'all';
  onTimeWindowChange?: (timeWindow: 'day' | 'week' | 'month' | 'all') => void;
}

export default function MarketplaceStatsView({ 
  timeWindow = 'all', 
  onTimeWindowChange 
}: MarketplaceStatsViewProps) {
  const { colors } = useTheme();
  const [statistics, setStatistics] = useState<MarketplaceStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadStatistics();
  }, [timeWindow]);

  const loadStatistics = async () => {
    try {
      setLoading(true);
      const stats = await nftDropsService.getMarketplaceStatistics(timeWindow);
      setStatistics(stats);
    } catch (error) {
      console.error('Failed to load marketplace statistics:', error);
      Alert.alert('Error', 'Failed to load marketplace statistics');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      const stats = await nftDropsService.getMarketplaceStatistics(timeWindow);
      setStatistics(stats);
    } catch (error) {
      console.error('Failed to refresh statistics:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const formatCurrency = (value: number): string => {
    return `$${value.toLocaleString()}`;
  };

  const formatETH = (value: number): string => {
    return `${value.toFixed(4)} ETH`;
  };

  const timeWindowOptions = [
    { key: 'day', label: '24h' },
    { key: 'week', label: '7d' },
    { key: 'month', label: '30d' },
    { key: 'all', label: 'All' },
  ];

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    title: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
    },
    refreshButton: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: colors.surface,
    },
    timeWindowContainer: {
      flexDirection: 'row',
      padding: 16,
      gap: 8,
    },
    timeWindowButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    activeTimeWindowButton: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    timeWindowText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.text,
    },
    activeTimeWindowText: {
      color: 'white',
    },
    statsContainer: {
      padding: 16,
    },
    statCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    statInfo: {
      flex: 1,
    },
    statName: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 4,
    },
    statValue: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
    },
    statIcon: {
      marginLeft: 12,
    },
    categorySection: {
      marginTop: 8,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 12,
    },
    categoryItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    categoryName: {
      fontSize: 14,
      color: colors.text,
      fontWeight: '500',
    },
    categoryCount: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 40,
    },
    loadingText: {
      fontSize: 16,
      color: colors.textSecondary,
      marginTop: 16,
    },
    generatedAt: {
      fontSize: 12,
      color: colors.textSecondary,
      textAlign: 'center',
      padding: 16,
    },
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading Statistics...</Text>
      </View>
    );
  }

  if (!statistics) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="stats-chart-outline" size={64} color={colors.textSecondary} />
        <Text style={styles.loadingText}>No statistics available</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Marketplace Statistics</Text>
        <TouchableOpacity 
          style={styles.refreshButton} 
          onPress={handleRefresh}
          disabled={refreshing}
        >
          <Ionicons 
            name={refreshing ? "refresh" : "refresh-outline"} 
            size={20} 
            color={colors.text} 
          />
        </TouchableOpacity>
      </View>

      {onTimeWindowChange && (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.timeWindowContainer}
        >
          {timeWindowOptions.map((option) => (
            <TouchableOpacity
              key={option.key}
              style={[
                styles.timeWindowButton,
                timeWindow === option.key && styles.activeTimeWindowButton,
              ]}
              onPress={() => onTimeWindowChange(option.key as any)}
            >
              <Text
                style={[
                  styles.timeWindowText,
                  timeWindow === option.key && styles.activeTimeWindowText,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <View style={styles.statInfo}>
            <Text style={styles.statName}>Total Volume</Text>
            <Text style={styles.statValue}>{formatETH(statistics.totalVolume)}</Text>
          </View>
          <Ionicons name="trending-up" size={24} color={colors.primary} style={styles.statIcon} />
        </View>

        <View style={styles.statCard}>
          <View style={styles.statInfo}>
            <Text style={styles.statName}>Floor Price</Text>
            <Text style={styles.statValue}>{formatETH(statistics.floorPrice)}</Text>
          </View>
          <Ionicons name="pricetag" size={24} color={colors.primary} style={styles.statIcon} />
        </View>

        <View style={styles.statCard}>
          <View style={styles.statInfo}>
            <Text style={styles.statName}>Average Price</Text>
            <Text style={styles.statValue}>{formatETH(statistics.averagePrice)}</Text>
          </View>
          <Ionicons name="analytics" size={24} color={colors.primary} style={styles.statIcon} />
        </View>

        <View style={styles.statCard}>
          <View style={styles.statInfo}>
            <Text style={styles.statName}>Listed Items</Text>
            <Text style={styles.statValue}>{statistics.listedItems.toLocaleString()}</Text>
          </View>
          <Ionicons name="list" size={24} color={colors.primary} style={styles.statIcon} />
        </View>

        <View style={styles.statCard}>
          <View style={styles.statInfo}>
            <Text style={styles.statName}>Unique Owners</Text>
            <Text style={styles.statValue}>{statistics.uniqueOwners.toLocaleString()}</Text>
          </View>
          <Ionicons name="people" size={24} color={colors.primary} style={styles.statIcon} />
        </View>

        <View style={styles.statCard}>
          <View style={styles.statInfo}>
            <Text style={styles.statName}>Total Sales</Text>
            <Text style={styles.statValue}>{statistics.totalSales.toLocaleString()}</Text>
          </View>
          <Ionicons name="checkmark-circle" size={24} color={colors.primary} style={styles.statIcon} />
        </View>

        {statistics.topCategories.length > 0 && (
          <View style={styles.categorySection}>
            <Text style={styles.sectionTitle}>Top Categories</Text>
            {statistics.topCategories.map((category, index) => (
              <View key={index} style={styles.categoryItem}>
                <Text style={styles.categoryName}>{category.name}</Text>
                <Text style={styles.categoryCount}>{category.count} items</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <Text style={styles.generatedAt}>
        Generated at {new Date(statistics.generatedAt).toLocaleString()}
      </Text>
    </ScrollView>
  );
}
