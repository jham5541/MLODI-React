import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useTheme, colors } from '../../context/ThemeContext';
import { usePlayTracking } from '../../context/PlayTrackingContext';

interface Metric {
  label: string;
  value: number;
  trend: 'up' | 'down' | 'steady';
}

interface EngagementMetricsProps {
  artistId: string;
  artistName?: string;
}

export default function EngagementMetrics({
  artistId,
  artistName = 'Artist',
}: EngagementMetricsProps) {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];
  const { getArtistTotalPlays, getArtistSongPlays, getArtistVideoPlays, artistPlayStats } = usePlayTracking();
  const [metrics, setMetrics] = useState<Metric[]>([]);

  useEffect(() => {
    const totalPlays = getArtistTotalPlays(artistId);
    const songPlays = getArtistSongPlays(artistId);
    const videoPlays = getArtistVideoPlays(artistId);
    const uniqueListeners = artistPlayStats[artistId]?.uniqueListeners?.size || 0;
    
    // Calculate average listen time (mock calculation based on total plays)
    const avgListenTime = totalPlays > 0 ? 2.5 + (totalPlays * 0.1) : 0;
    
    const liveMetrics: Metric[] = [
      { 
        label: 'Total Plays', 
        value: totalPlays,
        trend: totalPlays > 0 ? 'up' : 'steady' 
      },
      { 
        label: 'Song Plays', 
        value: songPlays,
        trend: songPlays > 0 ? 'up' : 'steady' 
      },
      { 
        label: 'Video Plays', 
        value: videoPlays,
        trend: videoPlays > 0 ? 'up' : 'steady' 
      },
      { 
        label: 'Unique Listeners', 
        value: uniqueListeners,
        trend: uniqueListeners > 0 ? 'up' : 'steady' 
      },
      { 
        label: 'Avg Listen Time', 
        value: parseFloat(avgListenTime.toFixed(1)),
        trend: 'up' 
      },
    ];

    setMetrics(liveMetrics);
    console.log('EngagementMetrics: Updated metrics for artist', artistId, liveMetrics);
  }, [artistId, artistPlayStats, getArtistTotalPlays, getArtistSongPlays, getArtistVideoPlays]);

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const renderTrendIcon = (trend: 'up' | 'down' | 'steady') => {
    switch (trend) {
      case 'up':
        return <Text style={{ color: '#10B981', fontSize: 16 }}>↑</Text>;
      case 'down':
        return <Text style={{ color: '#EF4444', fontSize: 16 }}>↓</Text>;
      default:
        return <Text style={{ color: themeColors.textSecondary, fontSize: 16 }}>→</Text>;
    }
  };

  const styles = StyleSheet.create({
    container: {
      backgroundColor: themeColors.surface,
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
    },
    title: {
      fontSize: 20,
      fontWeight: '800',
      color: themeColors.text,
      marginBottom: 16,
    },
    metricCard: {
      backgroundColor: themeColors.background,
      borderRadius: 12,
      padding: 16,
      marginRight: 12,
      alignItems: 'center',
      minWidth: 120,
    },
    metricLabel: {
      fontSize: 12,
      color: themeColors.textSecondary,
      marginBottom: 8,
      textAlign: 'center',
    },
    metricValue: {
      fontSize: 20,
      fontWeight: '700',
      color: themeColors.text,
      marginBottom: 4,
    },
  });

  if (metrics.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Engagement Metrics</Text>
        <View style={{ alignItems: 'center', paddingVertical: 20 }}>
          <Text style={{ fontSize: 14, color: themeColors.textSecondary }}>
            No metrics available
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Engagement Metrics</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {metrics.map((metric) => (
          <View key={metric.label} style={styles.metricCard}>
            <Text style={styles.metricLabel}>{metric.label}</Text>
            <Text style={styles.metricValue}>{formatNumber(metric.value)}</Text>
            {renderTrendIcon(metric.trend)}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

