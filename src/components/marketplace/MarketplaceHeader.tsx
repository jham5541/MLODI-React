import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

interface FilterOptions {
  priceRange: {
    min: number;
    max: number;
  };
  verified: boolean | null;
  category: string | null;
  sortBy: 'price' | 'volume' | 'recent' | 'ending';
  sortDirection: 'asc' | 'desc';
}

interface MarketplaceHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  totalItems: number;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
}

export default function MarketplaceHeader({
  searchQuery,
  onSearchChange,
  filters,
  onFiltersChange,
  totalItems,
  viewMode,
  onViewModeChange,
}: MarketplaceHeaderProps) {
  const { colors } = useTheme();
  const [showFilters, setShowFilters] = useState(false);
  const [showSort, setShowSort] = useState(false);

  const categories = [
    'All Categories',
    'Electronic',
    'Hip Hop',
    'Rock',
    'Pop',
    'Jazz',
    'Classical',
    'Indie',
    'R&B',
  ];

  const sortOptions = [
    { key: 'recent', label: 'Recently Listed', icon: 'time-outline' },
    { key: 'price', label: 'Price', icon: 'pricetag-outline' },
    { key: 'volume', label: 'Volume', icon: 'trending-up-outline' },
    { key: 'ending', label: 'Ending Soon', icon: 'hourglass-outline' },
  ];

  const applyFilters = (newFilters: Partial<FilterOptions>) => {
    onFiltersChange({ ...filters, ...newFilters });
  };

  const clearFilters = () => {
    onFiltersChange({
      priceRange: { min: 0, max: 100 },
      verified: null,
      category: null,
      sortBy: 'recent',
      sortDirection: 'desc',
    });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.verified !== null) count++;
    if (filters.category !== null) count++;
    if (filters.priceRange.min > 0 || filters.priceRange.max < 100) count++;
    return count;
  };

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.background,
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 8,
      marginBottom: 16,
    },
    searchInput: {
      flex: 1,
      fontSize: 16,
      color: colors.text,
      marginLeft: 8,
    },
    controlsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    leftControls: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    rightControls: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    controlButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      backgroundColor: colors.surface,
      gap: 6,
    },
    controlButtonActive: {
      backgroundColor: colors.primary,
    },
    controlButtonText: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.text,
    },
    controlButtonTextActive: {
      color: colors.background,
    },
    badge: {
      backgroundColor: colors.error,
      borderRadius: 10,
      minWidth: 20,
      height: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: 4,
    },
    badgeText: {
      fontSize: 12,
      fontWeight: 'bold',
      color: colors.background,
    },
    resultsText: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    viewToggle: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderRadius: 8,
      padding: 2,
    },
    viewButton: {
      padding: 8,
      borderRadius: 6,
    },
    viewButtonActive: {
      backgroundColor: colors.primary,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: colors.background,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 20,
      maxHeight: '80%',
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 20,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
    },
    closeButton: {
      padding: 8,
    },
    filterSection: {
      marginBottom: 24,
    },
    filterTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 12,
    },
    filterRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    filterChip: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    filterChipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    filterChipText: {
      fontSize: 14,
      color: colors.text,
    },
    filterChipTextActive: {
      color: colors.background,
    },
    priceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    priceInput: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
      fontSize: 16,
      color: colors.text,
    },
    priceLabel: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    actionButtons: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 20,
    },
    actionButton: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center',
    },
    clearButton: {
      backgroundColor: colors.surface,
    },
    applyButton: {
      backgroundColor: colors.primary,
    },
    actionButtonText: {
      fontSize: 16,
      fontWeight: '600',
    },
    clearButtonText: {
      color: colors.text,
    },
    applyButtonText: {
      color: colors.background,
    },
    sortOption: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 16,
      paddingHorizontal: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    sortOptionText: {
      fontSize: 16,
      color: colors.text,
      marginLeft: 12,
      flex: 1,
    },
    sortOptionActive: {
      backgroundColor: colors.surface,
      borderRadius: 8,
    },
  });

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search NFTs, artists, collections..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={onSearchChange}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => onSearchChange('')}>
            <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Controls Row */}
      <View style={styles.controlsRow}>
        <View style={styles.leftControls}>
          <TouchableOpacity
            style={[styles.controlButton, getActiveFiltersCount() > 0 && styles.controlButtonActive]}
            onPress={() => setShowFilters(true)}
          >
            <Ionicons
              name="filter"
              size={16}
              color={getActiveFiltersCount() > 0 ? colors.background : colors.text}
            />
            <Text style={[
              styles.controlButtonText,
              getActiveFiltersCount() > 0 && styles.controlButtonTextActive,
            ]}>
              Filters
            </Text>
            {getActiveFiltersCount() > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{getActiveFiltersCount()}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => setShowSort(true)}
          >
            <Ionicons name="swap-vertical" size={16} color={colors.text} />
            <Text style={styles.controlButtonText}>Sort</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.rightControls}>
          <Text style={styles.resultsText}>{totalItems} items</Text>
          
          <View style={styles.viewToggle}>
            <TouchableOpacity
              style={[styles.viewButton, viewMode === 'grid' && styles.viewButtonActive]}
              onPress={() => onViewModeChange('grid')}
            >
              <Ionicons
                name="grid"
                size={16}
                color={viewMode === 'grid' ? colors.background : colors.text}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.viewButton, viewMode === 'list' && styles.viewButtonActive]}
              onPress={() => onViewModeChange('list')}
            >
              <Ionicons
                name="list"
                size={16}
                color={viewMode === 'list' ? colors.background : colors.text}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Filters Modal */}
      <Modal
        visible={showFilters}
        animationType="slide"
        transparent
        onRequestClose={() => setShowFilters(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filters</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowFilters(false)}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Category Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterTitle}>Category</Text>
                <View style={styles.filterRow}>
                  {categories.map((category) => (
                    <TouchableOpacity
                      key={category}
                      style={[
                        styles.filterChip,
                        (filters.category === category || (category === 'All Categories' && !filters.category)) &&
                        styles.filterChipActive,
                      ]}
                      onPress={() => applyFilters({
                        category: category === 'All Categories' ? null : category,
                      })}
                    >
                      <Text style={[
                        styles.filterChipText,
                        (filters.category === category || (category === 'All Categories' && !filters.category)) &&
                        styles.filterChipTextActive,
                      ]}>
                        {category}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Verification Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterTitle}>Verification</Text>
                <View style={styles.filterRow}>
                  <TouchableOpacity
                    style={[styles.filterChip, filters.verified === null && styles.filterChipActive]}
                    onPress={() => applyFilters({ verified: null })}
                  >
                    <Text style={[
                      styles.filterChipText,
                      filters.verified === null && styles.filterChipTextActive,
                    ]}>
                      All
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.filterChip, filters.verified === true && styles.filterChipActive]}
                    onPress={() => applyFilters({ verified: true })}
                  >
                    <Text style={[
                      styles.filterChipText,
                      filters.verified === true && styles.filterChipTextActive,
                    ]}>
                      Verified Only
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Price Range */}
              <View style={styles.filterSection}>
                <Text style={styles.filterTitle}>Price Range (ETH)</Text>
                <View style={styles.priceRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.priceLabel}>Min</Text>
                    <TextInput
                      style={styles.priceInput}
                      placeholder="0"
                      placeholderTextColor={colors.textSecondary}
                      value={filters.priceRange.min.toString()}
                      onChangeText={(text) => applyFilters({
                        priceRange: { ...filters.priceRange, min: parseFloat(text) || 0 },
                      })}
                      keyboardType="numeric"
                    />
                  </View>
                  <Text style={[styles.priceLabel, { marginTop: 20 }]}>to</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.priceLabel}>Max</Text>
                    <TextInput
                      style={styles.priceInput}
                      placeholder="100"
                      placeholderTextColor={colors.textSecondary}
                      value={filters.priceRange.max.toString()}
                      onChangeText={(text) => applyFilters({
                        priceRange: { ...filters.priceRange, max: parseFloat(text) || 100 },
                      })}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
              </View>
            </ScrollView>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, styles.clearButton]}
                onPress={clearFilters}
              >
                <Text style={[styles.actionButtonText, styles.clearButtonText]}>
                  Clear All
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.applyButton]}
                onPress={() => setShowFilters(false)}
              >
                <Text style={[styles.actionButtonText, styles.applyButtonText]}>
                  Apply Filters
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Sort Modal */}
      <Modal
        visible={showSort}
        animationType="slide"
        transparent
        onRequestClose={() => setShowSort(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sort By</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowSort(false)}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {sortOptions.map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.sortOption,
                  filters.sortBy === option.key && styles.sortOptionActive,
                ]}
                onPress={() => {
                  applyFilters({ sortBy: option.key as any });
                  setShowSort(false);
                }}
              >
                <Ionicons
                  name={option.icon as any}
                  size={20}
                  color={filters.sortBy === option.key ? colors.primary : colors.text}
                />
                <Text style={styles.sortOptionText}>{option.label}</Text>
                {filters.sortBy === option.key && (
                  <Ionicons name="checkmark" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </View>
  );
}