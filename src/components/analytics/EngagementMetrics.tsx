import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useTheme, colors } from '../../context/ThemeContext';

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
  const [metrics, setMetrics] = useState<Metric[]>([]);

  useEffect(() => {
    // Mock data - replace with actual API call
    const mockMetrics: Metric[] = [
      { label: 'Total Plays', value: 680000, trend: 'up' },
      { label: 'Unique Listeners', value: 150000, trend: 'steady' },
      { label: 'Average Listen Time', value: 4.5, trend: 'up' },
    ];

    setMetrics(mockMetrics);
  }, [artistId]);

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

