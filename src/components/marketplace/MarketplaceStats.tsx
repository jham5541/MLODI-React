import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

interface MarketplaceStatItem {
  id: string;
  name: string;
  floorPrice: number;
  volume: number;
  change24h: number;
  listedCount: number;
  totalCount: number;
  verified: boolean;
}

interface MarketplaceStatsProps {
  onSort?: (sortBy: string, direction: 'asc' | 'desc') => void;
}

export default function MarketplaceStats({ onSort }: MarketplaceStatsProps) {
  const { colors } = useTheme();
  const [sortBy, setSortBy] = useState<string>('volume');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [stats, setStats] = useState<MarketplaceStatItem[]>([]);

  useEffect(() => {
    // Mock data - replace with real API call
    setStats([
      {
        id: '1',
        name: 'Electronic Vibes',
        floorPrice: 0.5,
        volume: 12.5,
        change24h: 15.2,
        listedCount: 45,
        totalCount: 100,
        verified: true,
      },
      {
        id: '2',
        name: 'Hip Hop Classics',
        floorPrice: 0.8,
        volume: 8.3,
        change24h: -5.1,
        listedCount: 23,
        totalCount: 200,
        verified: true,
      },
      {
        id: '3',
        name: 'Indie Beats',
        floorPrice: 0.3,
        volume: 15.7,
        change24h: 23.8,
        listedCount: 67,
        totalCount: 150,
        verified: false,
      },
    ]);
  }, []);

  const handleSort = (field: string) => {
    const newDirection = sortBy === field && sortDirection === 'desc' ? 'asc' : 'desc';
    setSortBy(field);
    setSortDirection(newDirection);
    onSort?.(field, newDirection);
  };

  const formatPrice = (price: number) => `${price} ETH`;
  const formatVolume = (volume: number) => `${volume.toFixed(1)} ETH`;
  const formatChange = (change: number) => {
    const isPositive = change >= 0;
    return {
      text: `${isPositive ? '+' : ''}${change.toFixed(1)}%`,
      color: isPositive ? colors.success : colors.error,
    };
  };

  const SortButton = ({ field, title }: { field: string; title: string }) => (
    <TouchableOpacity
      style={[styles.sortButton, { backgroundColor: colors.surface }]}
      onPress={() => handleSort(field)}
    >
      <Text style={[styles.sortButtonText, { color: colors.text }]}>{title}</Text>
      {sortBy === field && (
        <Ionicons
          name={sortDirection === 'desc' ? 'chevron-down' : 'chevron-up'}
          size={16}
          color={colors.text}
        />
      )}
    </TouchableOpacity>
  );

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.background,
      padding: 16,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    title: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
      flex: 1,
    },
    refreshButton: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: colors.surface,
    },
    sortContainer: {
      flexDirection: 'row',
      marginBottom: 16,
      flexWrap: 'wrap',
      gap: 8,
    },
    sortButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      gap: 4,
    },
    sortButtonText: {
      fontSize: 14,
      fontWeight: '500',
    },
    tableHeader: {
      flexDirection: 'row',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    tableHeaderText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      flex: 1,
      textAlign: 'center',
    },
    tableRow: {
      flexDirection: 'row',
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      alignItems: 'center',
    },
    nameCell: {
      flex: 2,
      flexDirection: 'row',
      alignItems: 'center',
    },
    nameText: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.text,
      marginLeft: 8,
    },
    verifiedIcon: {
      marginLeft: 4,
    },
    cell: {
      flex: 1,
      alignItems: 'center',
    },
    cellText: {
      fontSize: 14,
      color: colors.text,
    },
    listedText: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: 40,
    },
    emptyText: {
      fontSize: 16,
      color: colors.textSecondary,
      marginTop: 12,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Collection Stats</Text>
        <TouchableOpacity style={styles.refreshButton}>
          <Ionicons name="refresh" size={20} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.sortContainer}>
          <SortButton field="volume" title="Volume" />
          <SortButton field="floorPrice" title="Floor Price" />
          <SortButton field="change24h" title="24h Change" />
          <SortButton field="listedCount" title="Listed" />
        </View>
      </ScrollView>

      <View style={styles.tableHeader}>
        <Text style={[styles.tableHeaderText, { flex: 2 }]}>Collection</Text>
        <Text style={styles.tableHeaderText}>Floor</Text>
        <Text style={styles.tableHeaderText}>Volume</Text>
        <Text style={styles.tableHeaderText}>24h</Text>
        <Text style={styles.tableHeaderText}>Listed</Text>
      </View>

      <ScrollView>
        {stats.length > 0 ? (
          stats.map((item) => {
            const change = formatChange(item.change24h);
            const listedPercentage = ((item.listedCount / item.totalCount) * 100).toFixed(1);

            return (
              <View key={item.id} style={styles.tableRow}>
                <View style={styles.nameCell}>
                  <View style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: colors.primary,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}>
                    <Ionicons name="musical-notes" size={16} color={colors.background} />
                  </View>
                  <Text style={styles.nameText}>{item.name}</Text>
                  {item.verified && (
                    <Ionicons
                      name="checkmark-circle"
                      size={16}
                      color={colors.primary}
                      style={styles.verifiedIcon}
                    />
                  )}
                </View>

                <View style={styles.cell}>
                  <Text style={styles.cellText}>{formatPrice(item.floorPrice)}</Text>
                </View>

                <View style={styles.cell}>
                  <Text style={styles.cellText}>{formatVolume(item.volume)}</Text>
                </View>

                <View style={styles.cell}>
                  <Text style={[styles.cellText, { color: change.color }]}>
                    {change.text}
                  </Text>
                </View>

                <View style={styles.cell}>
                  <Text style={styles.cellText}>{item.listedCount}</Text>
                  <Text style={styles.listedText}>{listedPercentage}%</Text>
                </View>
              </View>
            );
          })
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="bar-chart-outline" size={48} color={colors.textSecondary} />
            <Text style={styles.emptyText}>No marketplace data available</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}