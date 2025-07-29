import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Dimensions } from 'react-native';
import { useTheme, colors } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');
const numColumns = 2;
const itemMargin = 8;
const itemWidth = (width - 32 - itemMargin * (numColumns - 1)) / numColumns;

export default function GenresAll() {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];
  const navigation = useNavigation();

  const allGenres = [
    'Electronic', 'Hip Hop', 'Synthwave', 'Ambient', 'Retrowave', 'Experimental',
    'Pop', 'Rock', 'Jazz', 'Classical', 'Country', 'Blues', 'Reggae', 'Folk',
    'Metal', 'Punk', 'Alternative', 'Indie', 'R&B', 'Soul', 'Funk', 'Disco',
    'House', 'Techno', 'Dubstep', 'Trance', 'Drum & Bass', 'Garage'
  ];

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
    'Country': 'leaf',
    'Blues': 'musical-notes',
    'Reggae': 'sunny',
    'Folk': 'flower',
    'Metal': 'flame',
    'Punk': 'skull',
    'Alternative': 'prism',
    'Indie': 'diamond',
    'R&B': 'microphone',
    'Soul': 'heart-circle',
    'Funk': 'musical-note',
    'Disco': 'star',
    'House': 'home',
    'Techno': 'hardware-chip',
    'Dubstep': 'pulse',
    'Trance': 'infinite',
    'Drum & Bass': 'volume-high',
    'Garage': 'car-sport',
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
    'Country': '#84cc16',
    'Blues': '#06b6d4',
    'Reggae': '#eab308',
    'Folk': '#22c55e',
    'Metal': '#dc2626',
    'Punk': '#7c2d12',
    'Alternative': '#9333ea',
    'Indie': '#059669',
    'R&B': '#e11d48',
    'Soul': '#be185d',
    'Funk': '#0891b2',
    'Disco': '#7c3aed',
    'House': '#db2777',
    'Techno': '#0d9488',
    'Dubstep': '#7c2d12',
    'Trance': '#4338ca',
    'Drum & Bass': '#b91c1c',
    'Garage': '#374151',
  };

  const handleGenrePress = (genre: string) => {
    // Navigate to the tabbed genre detail page
    navigation.navigate('GenreDetail', { genre });
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeColors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: themeColors.surface,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.border,
    },
    backButton: {
      padding: 8,
      marginRight: 8,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: themeColors.text,
      flex: 1,
    },
    genreItem: {
      width: itemWidth,
      height: 120,
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
      paddingHorizontal: 16,
      paddingTop: 16,
    },
  });

  const renderGenreItem = ({ item, index }: { item: string; index: number }) => {
    const backgroundColor = genreColors[item] || themeColors.primary;
    const iconName = genreIcons[item] || 'musical-note';

    return (
      <TouchableOpacity
        style={[
          styles.genreItem, 
          { 
            backgroundColor, 
            marginRight: index % 2 === 0 ? itemMargin : 0 
          }
        ]}
        onPress={() => handleGenrePress(item)}
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
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={themeColors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>All Genres</Text>
      </View>
      
      <FlatList
        data={allGenres}
        renderItem={renderGenreItem}
        keyExtractor={(item) => item}
        numColumns={numColumns}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.gridContainer}
      />
    </View>
  );
}
