import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme, colors } from '../context/ThemeContext';
import { usePlay } from '../context/PlayContext';

interface Chart {
  id: string;
  name: string;
  category: string;
  description: string;
  coverUrl: string;
  position?: number;
  trending?: 'up' | 'down' | 'stable';
  trackCount?: number;
  isFeatured?: boolean;
}

export default function ChartsAllScreen() {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];
  const { playSong } = usePlay();
  const navigation = useNavigation();

  // Create a mock song for chart playback
  const createChartSong = (chart: Chart) => ({
    id: `chart-${chart.id}`,
    title: `${chart.name} - Top Song`,
    artist: chart.category,
    artistId: chart.id,
    album: chart.name,
    coverUrl: chart.coverUrl,
    duration: 210, // 3:30 average song length
    audioUrl: '',
  });

  // Mock data for featured charts in carousel
  const featuredCharts: Chart[] = [
    {
      id: '1',
      name: 'Global Top 50',
      category: 'Global',
      description: 'The most played songs worldwide',
      coverUrl: 'https://via.placeholder.com/300x200?text=Global+Top+50',
      position: 1,
      trending: 'up',
      trackCount: 50,
      isFeatured: true,
    },
    {
      id: '2',
      name: 'Viral 50',
      category: 'Trending',
      description: 'Songs going viral right now',
      coverUrl: 'https://via.placeholder.com/300x200?text=Viral+50',
      position: 2,
      trending: 'up',
      trackCount: 50,
      isFeatured: true,
    },
    {
      id: '3',
      name: 'New Music Friday',
      category: 'New Releases',
      description: 'Fresh tracks every Friday',
      coverUrl: 'https://via.placeholder.com/300x200?text=New+Music+Friday',
      position: 3,
      trending: 'stable',
      trackCount: 100,
      isFeatured: true,
    },
  ];

  // Mock data for all charts in grid
  const allCharts: Chart[] = [
    ...featuredCharts,
    {
      id: '4',
      name: 'Hip Hop Central',
      category: 'Hip Hop',
      description: 'Top hip hop and rap tracks',
      coverUrl: 'https://via.placeholder.com/120x120?text=Hip+Hop+Charts',
      position: 4,
      trending: 'up',
      trackCount: 40,
    },
    {
      id: '5',
      name: 'Rock Anthems',
      category: 'Rock',
      description: 'Classic and modern rock hits',
      coverUrl: 'https://via.placeholder.com/120x120?text=Rock+Charts',
      position: 5,
      trending: 'down',
      trackCount: 35,
    },
    {
      id: '6',
      name: 'Electronic Pulse',
      category: 'Electronic',
      description: 'Electronic dance music charts',
      coverUrl: 'https://via.placeholder.com/120x120?text=Electronic+Charts',
      position: 6,
      trending: 'up',
      trackCount: 45,
    },
    {
      id: '7',
      name: 'Country Heat',
      category: 'Country',
      description: 'Top country music hits',
      coverUrl: 'https://via.placeholder.com/120x120?text=Country+Charts',
      position: 7,
      trending: 'stable',
      trackCount: 30,
    },
    {
      id: '8',
      name: 'R&B Soul',
      category: 'R&B',
      description: 'Best R&B and soul tracks',
      coverUrl: 'https://via.placeholder.com/120x120?text=RnB+Charts',
      position: 8,
      trending: 'up',
      trackCount: 25,
    },
    {
      id: '9',
      name: 'Latin Fuego',
      category: 'Latin',
      description: 'Hottest Latin music',
      coverUrl: 'https://via.placeholder.com/120x120?text=Latin+Charts',
      position: 9,
      trending: 'up',
      trackCount: 40,
    },
  ];

  const handlePlayChart = (chart: Chart) => {
    const chartSong = createChartSong(chart);
    playSong(chartSong, [chartSong]);
  };

  const getTrendingIcon = (trending?: 'up' | 'down' | 'stable') => {
    switch (trending) {
      case 'up':
        return 'trending-up';
      case 'down':
        return 'trending-down';
      default:
        return 'remove';
    }
  };

  const getTrendingColor = (trending?: 'up' | 'down' | 'stable') => {
    switch (trending) {
      case 'up':
        return '#4CAF50';
      case 'down':
        return '#F44336';
      default:
        return themeColors.textSecondary;
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeColors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
      paddingTop: 60,
      backgroundColor: themeColors.surface,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: themeColors.background,
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: themeColors.text,
    },
    searchButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: themeColors.background,
      justifyContent: 'center',
      alignItems: 'center',
    },
    content: {
      flex: 1,
    },
    showcaseSection: {
      marginBottom: 24,
    },
    showcaseTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: themeColors.text,
      marginHorizontal: 16,
      marginBottom: 16,
    },
    carouselContainer: {
      paddingHorizontal: 16,
    },
    featuredCard: {
      width: 280,
      marginRight: 16,
      backgroundColor: themeColors.surface,
      borderRadius: 16,
      overflow: 'hidden',
    },
    featuredImage: {
      width: '100%',
      height: 160,
    },
    featuredContent: {
      padding: 16,
    },
    featuredHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    positionBadge: {
      backgroundColor: themeColors.primary,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
      minWidth: 32,
      alignItems: 'center',
    },
    positionText: {
      fontSize: 12,
      color: 'white',
      fontWeight: 'bold',
    },
    trendingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    featuredName: {
      fontSize: 16,
      fontWeight: 'bold',
      color: themeColors.text,
      marginBottom: 4,
    },
    featuredCategory: {
      fontSize: 14,
      color: themeColors.textSecondary,
      marginBottom: 6,
    },
    featuredDescription: {
      fontSize: 12,
      color: themeColors.textSecondary,
      lineHeight: 16,
      marginBottom: 12,
    },
    featuredFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    trackCount: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    trackCountText: {
      fontSize: 12,
      color: themeColors.textSecondary,
      marginLeft: 4,
    },
    playButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: themeColors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    gridSection: {
      flex: 1,
      paddingHorizontal: 16,
    },
    gridTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: themeColors.text,
      marginBottom: 16,
    },
    gridContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    gridItem: {
      width: '31%',
      marginBottom: 16,
      backgroundColor: themeColors.surface,
      borderRadius: 12,
      padding: 12,
    },
    gridImage: {
      width: '100%',
      height: 80,
      borderRadius: 8,
      marginBottom: 8,
    },
    gridHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 4,
    },
    gridPositionBadge: {
      backgroundColor: themeColors.primary,
      paddingHorizontal: 6,
      paddingVertical: 3,
      borderRadius: 6,
      minWidth: 20,
      alignItems: 'center',
    },
    gridPositionText: {
      fontSize: 10,
      color: 'white',
      fontWeight: 'bold',
    },
    gridTrendingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    gridName: {
      fontSize: 12,
      fontWeight: '600',
      color: themeColors.text,
      marginBottom: 2,
      numberOfLines: 1,
    },
    gridCategory: {
      fontSize: 10,
      color: themeColors.textSecondary,
      marginBottom: 6,
    },
    gridFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    gridTrackCount: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    gridTrackCountText: {
      fontSize: 10,
      color: themeColors.textSecondary,
      marginLeft: 2,
    },
    gridPlayButton: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: themeColors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

  const renderFeaturedChart = ({ item }: { item: Chart }) => (
    <TouchableOpacity style={styles.featuredCard}>
      <Image
        source={{ uri: item.coverUrl }}
        style={styles.featuredImage}
        defaultSource={{ uri: 'https://via.placeholder.com/280x160?text=📊' }}
      />
      <View style={styles.featuredContent}>
        <View style={styles.featuredHeader}>
          {item.position && (
            <View style={styles.positionBadge}>
              <Text style={styles.positionText}>#{item.position}</Text>
            </View>
          )}
          
          {item.trending && (
            <View style={styles.trendingContainer}>
              <Ionicons 
                name={getTrendingIcon(item.trending)} 
                size={16} 
                color={getTrendingColor(item.trending)} 
              />
            </View>
          )}
        </View>
        
        <Text style={styles.featuredName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.featuredCategory}>{item.category}</Text>
        <Text style={styles.featuredDescription} numberOfLines={2}>
          {item.description}
        </Text>
        
        <View style={styles.featuredFooter}>
          <View style={styles.trackCount}>
            <Ionicons name="musical-notes" size={14} color={themeColors.textSecondary} />
            <Text style={styles.trackCountText}>
              {item.trackCount || 0} tracks
            </Text>
          </View>
          
          <TouchableOpacity 
            style={styles.playButton}
            onPress={() => handlePlayChart(item)}
          >
            <Ionicons name="play" size={16} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderGridChart = (chart: Chart) => (
    <TouchableOpacity key={chart.id} style={styles.gridItem}>
      <Image
        source={{ uri: chart.coverUrl }}
        style={styles.gridImage}
        defaultSource={{ uri: 'https://via.placeholder.com/80x80?text=📊' }}
      />
      
      <View style={styles.gridHeader}>
        {chart.position && (
          <View style={styles.gridPositionBadge}>
            <Text style={styles.gridPositionText}>#{chart.position}</Text>
          </View>
        )}
        
        {chart.trending && (
          <View style={styles.gridTrendingContainer}>
            <Ionicons 
              name={getTrendingIcon(chart.trending)} 
              size={12} 
              color={getTrendingColor(chart.trending)} 
            />
          </View>
        )}
      </View>
      
      <Text style={styles.gridName} numberOfLines={1}>
        {chart.name}
      </Text>
      
      <Text style={styles.gridCategory} numberOfLines={1}>
        {chart.category}
      </Text>
      
      <View style={styles.gridFooter}>
        <View style={styles.gridTrackCount}>
          <Ionicons name="musical-notes" size={10} color={themeColors.textSecondary} />
          <Text style={styles.gridTrackCountText}>
            {chart.trackCount || 0}
          </Text>
        </View>
        
        <TouchableOpacity 
          style={styles.gridPlayButton}
          onPress={() => handlePlayChart(chart)}
        >
          <Ionicons name="play" size={10} color="white" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={themeColors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Top Charts</Text>
        <TouchableOpacity style={styles.searchButton}>
          <Ionicons name="search" size={24} color={themeColors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Showcase Carousel */}
        <View style={styles.showcaseSection}>
          <Text style={styles.showcaseTitle}>Featured Charts</Text>
          <FlatList
            data={featuredCharts}
            renderItem={renderFeaturedChart}
            keyExtractor={(item) => `featured-${item.id}`}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.carouselContainer}
          />
        </View>

        {/* 3-Column Grid */}
        <View style={styles.gridSection}>
          <Text style={styles.gridTitle}>All Charts</Text>
          <View style={styles.gridContainer}>
            {allCharts.map(renderGridChart)}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
