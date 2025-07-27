import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme, colors } from '../../context/ThemeContext';
import { usePlay } from '../../context/PlayContext';

interface Chart {
  id: string;
  name: string;
  category: string;
  description: string;
  coverUrl: string;
  position?: number;
  trending?: 'up' | 'down' | 'stable';
  trackCount?: number;
}

interface ChartCarouselProps {
  title: string;
  charts: Chart[];
  onChartPress?: (chart: Chart) => void;
  onSeeAllPress?: () => void;
}

export default function ChartCarousel({ 
  title, 
  charts, 
  onChartPress,
  onSeeAllPress 
}: ChartCarouselProps) {
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

  const styles = StyleSheet.create({
    container: {
      marginBottom: 24,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
      paddingHorizontal: 16,
    },
    title: {
      fontSize: 18,
      fontWeight: 'bold',
      color: themeColors.text,
    },
    seeAll: {
      fontSize: 14,
      color: themeColors.primary,
      fontWeight: '600',
    },
    listContainer: {
      paddingHorizontal: 16,
    },
    chartCard: {
      width: 180,
      marginRight: 12,
      backgroundColor: themeColors.surface,
      borderRadius: 12,
      padding: 12,
    },
    chartImage: {
      width: '100%',
      height: 140,
      borderRadius: 8,
      marginBottom: 12,
    },
    chartHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 4,
    },
    positionBadge: {
      backgroundColor: themeColors.primary,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
      minWidth: 24,
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
    chartName: {
      fontSize: 14,
      fontWeight: '600',
      color: themeColors.text,
      marginBottom: 2,
      flex: 1,
    },
    category: {
      fontSize: 12,
      color: themeColors.textSecondary,
      marginBottom: 6,
    },
    description: {
      fontSize: 11,
      color: themeColors.textSecondary,
      lineHeight: 14,
      marginBottom: 8,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    trackCount: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    trackCountText: {
      fontSize: 11,
      color: themeColors.textSecondary,
      marginLeft: 4,
    },
    playButton: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: themeColors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

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

  const renderChart = ({ item }: { item: Chart }) => (
    <TouchableOpacity 
      style={styles.chartCard}
      onPress={() => onChartPress?.(item)}
    >
      <Image
        source={{ uri: item.coverUrl }}
        style={styles.chartImage}
        defaultSource={{ uri: 'https://via.placeholder.com/180x140?text=📊' }}
      />
      
      <View style={styles.chartHeader}>
        {item.position && (
          <View style={styles.positionBadge}>
            <Text style={styles.positionText}>#{item.position}</Text>
          </View>
        )}
        
        {item.trending && (
          <View style={styles.trendingContainer}>
            <Ionicons 
              name={getTrendingIcon(item.trending)} 
              size={14} 
              color={getTrendingColor(item.trending)} 
            />
          </View>
        )}
      </View>
      
      <Text style={styles.chartName} numberOfLines={1}>
        {item.name}
      </Text>
      
      <Text style={styles.category} numberOfLines={1}>
        {item.category}
      </Text>
      
      <Text style={styles.description} numberOfLines={2}>
        {item.description}
      </Text>
      
      <View style={styles.footer}>
        <View style={styles.trackCount}>
          <Ionicons name="musical-notes" size={12} color={themeColors.textSecondary} />
          <Text style={styles.trackCountText}>
            {item.trackCount || 0} tracks
          </Text>
        </View>
        
        <TouchableOpacity 
          style={styles.playButton}
          onPress={(e) => {
            e.stopPropagation();
            const chartSong = createChartSong(item);
            playSong(chartSong, [chartSong]);
          }}
        >
          <Ionicons name="play" size={12} color="white" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (!charts.length) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <TouchableOpacity onPress={onSeeAllPress || (() => navigation.navigate('ChartsAll' as never))}>
          <Text style={styles.seeAll}>See All</Text>
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={charts}
        renderItem={renderChart}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
}
