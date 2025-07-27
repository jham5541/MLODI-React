import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Dimensions } from 'react-native';
import { useTheme, colors } from '../../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

interface GenreGridProps {
  genres: string[];
  onGenrePress: (genre: string) => void;
}

const { width } = Dimensions.get('window');
const numColumns = 2;
const itemMargin = 8;
const itemWidth = (width - 32 - itemMargin * (numColumns - 1)) / numColumns;

export default function GenreGrid({ genres, onGenrePress }: GenreGridProps) {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];

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

  const genreColors: { [key: string]: string } = {
    'Electronic': '#6366f1',
    'Hip Hop': '#f59e0b',
    'Synthwave': '#ec4899',
    'Ambient': '#10b981',
    'Retrowave': '#8b5cf6',
    'Experimental': '#ef4444',
    'Pop': '#f97316',
    'Rock': '#64748b',
    'Jazz': '#a855f7',
    'Classical': '#0ea5e9',
  };

  const styles = StyleSheet.create({
    container: {
      paddingHorizontal: 16,
      marginBottom: 16,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      color: themeColors.text,
    },
    seeAllText: {
      fontSize: 14,
      color: themeColors.primary,
      fontWeight: '500',
    },
    genreItem: {
      width: itemWidth,
      height: 100,
      marginRight: itemMargin,
      marginBottom: itemMargin,
      borderRadius: 12,
      padding: 16,
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
      overflow: 'hidden',
    },
    genreOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      borderRadius: 12,
    },
    genreIcon: {
      marginBottom: 8,
    },
    genreText: {
      fontSize: 16,
      fontWeight: '600',
      color: 'white',
      textAlign: 'center',
    },
    gridContainer: {
      justifyContent: 'space-between',
    },
  });

  const renderGenreItem = ({ item, index }: { item: string; index: number }) => {
    const backgroundColor = genreColors[item] || themeColors.primary;
    const iconName = genreIcons[item] || 'musical-note';

    return (
      <TouchableOpacity
        style={[styles.genreItem, { backgroundColor, marginRight: index % 2 === 0 ? itemMargin : 0 }]}
        onPress={() => onGenrePress(item)}
      >
        <View style={styles.genreOverlay} />
        <Ionicons
          name={iconName as any}
          size={32}
          color="white"
          style={styles.genreIcon}
        />
        <Text style={styles.genreText}>{item}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Browse by Genre</Text>
        <TouchableOpacity>
          <Text style={styles.seeAllText}>See All</Text>
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={genres}
        renderItem={renderGenreItem}
        keyExtractor={(item) => item}
        numColumns={numColumns}
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}
