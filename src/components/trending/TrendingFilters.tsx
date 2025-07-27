import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme, colors } from '../../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

interface TrendingFiltersProps {
  genres: string[];
  selectedGenre?: string;
  onGenreSelect: (genre: string) => void;
}

export default function TrendingFilters({ genres, selectedGenre, onGenreSelect }: TrendingFiltersProps) {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];

  const styles = StyleSheet.create({
    container: {
      marginBottom: 16,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      marginBottom: 12,
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      color: themeColors.text,
      marginRight: 8,
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
    allFilterButton: {
      backgroundColor: selectedGenre === undefined ? themeColors.primary : themeColors.surface,
      borderColor: selectedGenre === undefined ? themeColors.primary : themeColors.border,
    },
  });

  const genreIcons: { [key: string]: string } = {
    'Electronic': 'radio',
    'Hip Hop': 'musical-note',
    'Synthwave': 'pulse',
    'Ambient': 'cloud',
    'Retrowave': 'storefront',
    'Experimental': 'flask',
    'Pop': 'heart',
    'Rock': 'thunderstorm',
    'Jazz': 'wine',
    'Classical': 'library',
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Genres</Text>
        <Ionicons name="filter" size={16} color={themeColors.textSecondary} />
      </View>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersList}
      >
        <TouchableOpacity
          style={[styles.filterButton, styles.allFilterButton]}
          onPress={() => onGenreSelect('')}
        >
          <Ionicons
            name="apps"
            size={16}
            color={selectedGenre === undefined ? 'white' : themeColors.text}
            style={styles.filterIcon}
          />
          <Text
            style={[
              styles.filterText,
              selectedGenre === undefined && styles.activeFilterText,
            ]}
          >
            All
          </Text>
        </TouchableOpacity>
        
        {genres.map((genre) => (
          <TouchableOpacity
            key={genre}
            style={[
              styles.filterButton,
              selectedGenre === genre && styles.activeFilterButton,
            ]}
            onPress={() => onGenreSelect(genre)}
          >
            <Ionicons
              name={genreIcons[genre] as any || 'musical-note'}
              size={16}
              color={selectedGenre === genre ? 'white' : themeColors.text}
              style={styles.filterIcon}
            />
            <Text
              style={[
                styles.filterText,
                selectedGenre === genre && styles.activeFilterText,
              ]}
            >
              {genre}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}
