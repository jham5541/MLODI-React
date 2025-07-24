import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, colors } from '../../context/ThemeContext';
import MetricsCard from './MetricsCard';
import AnalyticsChart from './AnalyticsChart';

interface AnalyticsDashboardProps {
  userType: 'artist' | 'listener' | 'admin';
  data?: {
    totalPlays?: number;
    totalListeners?: number;
    revenue?: number;
    followers?: number;
    engagement?: number;
    topTracks?: Array<{
      name: string;
      plays: number;
    }>;
    playsByRegion?: Array<{
      region: string;
      plays: number;
    }>;
    revenueOverTime?: Array<{
      date: string;
      revenue: number;
    }>;
  };
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export default function AnalyticsDashboard({
  userType,
  data,
  onRefresh,
  isRefreshing = false,
}: AnalyticsDashboardProps) {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];
  const [selectedTimeframe, setSelectedTimeframe] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  // Sample data if none provided
  const defaultData = {
    totalPlays: 125430,
    totalListeners: 8920,
    revenue: 2450.75,
    followers: 15200,
    engagement: 8.3,
    topTracks: [
      { name: 'Midnight Vibes', plays: 25430 },
      { name: 'Electric Dreams', plays: 18920 },
      { name: 'Ocean Waves', plays: 15200 },
      { name: 'City Lights', plays: 12100 },
      { name: 'Sunset Drive', plays: 9800 },
    ],
    playsByRegion: [
      { region: 'North America', plays: 45200 },
      { region: 'Europe', plays: 38100 },
      { region: 'Asia', plays: 28900 },
      { region: 'South America', plays: 8900 },
      { region: 'Africa', plays: 4330 },
    ],
    revenueOverTime: [
      { date: 'Week 1', revenue: 580 },
      { date: 'Week 2', revenue: 720 },
      { date: 'Week 3', revenue: 650 },
      { date: 'Week 4', revenue: 800 },
    ],
  };

  const analytics = { ...defaultData, ...data };

  const timeframeOptions = [
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
    { value: '90d', label: '90 Days' },
    { value: '1y', label: '1 Year' },
  ];

  const getMetricsForUserType = () => {
    switch (userType) {
      case 'artist':
        return [
          {
            title: 'Total Plays',
            value: analytics.totalPlays || 0,
            icon: 'play-circle' as const,
            color: themeColors.primary,
            trend: { value: 12.5, period: 'this month' },
          },
          {
            title: 'Unique Listeners',
            value: analytics.totalListeners || 0,
            icon: 'people' as const,
            color: themeColors.success,
            trend: { value: 8.3, period: 'this month' },
          },
          {
            title: 'Revenue',
            value: `$${analytics.revenue?.toFixed(2) || '0.00'}`,
            icon: 'card' as const,
            color: themeColors.warning,
            trend: { value: 15.2, period: 'this month' },
          },
          {
            title: 'Followers',
            value: analytics.followers || 0,
            icon: 'heart' as const,
            color: themeColors.error,
            trend: { value: 5.7, period: 'this month' },
          },
        ];
      case 'listener':
        return [
          {
            title: 'Songs Played',
            value: 1240,
            icon: 'musical-notes' as const,
            color: themeColors.primary,
            trend: { value: 3.2, period: 'this week' },
          },
          {
            title: 'Listening Time',
            value: '24h 32m',
            icon: 'time' as const,
            color: themeColors.success,
            trend: { value: -2.1, period: 'this week' },
          },
          {
            title: 'Playlists Created',
            value: 12,
            icon: 'list' as const,
            color: themeColors.warning,
            trend: { value: 0, period: 'this month' },
          },
          {
            title: 'Artists Followed',
            value: 45,
            icon: 'person-add' as const,
            color: themeColors.error,
            trend: { value: 8.9, period: 'this month' },
          },
        ];
      case 'admin':
        return [
          {
            title: 'Total Users',
            value: 54320,
            icon: 'people' as const,
            color: themeColors.primary,
            trend: { value: 18.7, period: 'this month' },
          },
          {
            title: 'Active Artists',
            value: 1240,
            icon: 'mic' as const,
            color: themeColors.success,
            trend: { value: 12.3, period: 'this month' },
          },
          {
            title: 'Platform Revenue',
            value: '$125,430',
            icon: 'trending-up' as const,
            color: themeColors.warning,
            trend: { value: 24.1, period: 'this month' },
          },
          {
            title: 'NFTs Minted',
            value: 2340,
            icon: 'diamond' as const,
            color: themeColors.error,
            trend: { value: 31.5, period: 'this month' },
          },
        ];
      default:
        return [];
    }
  };

  const metrics = getMetricsForUserType();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeColors.background,
    },
    header: {
      padding: 16,
      backgroundColor: themeColors.surface,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: themeColors.text,
      marginBottom: 8,
    },
    timeframeSelector: {
      flexDirection: 'row',
      backgroundColor: themeColors.background,
      borderRadius: 12,
      padding: 4,
    },
    timeframeButton: {
      flex: 1,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 8,
      alignItems: 'center',
    },
    activeTimeframeButton: {
      backgroundColor: themeColors.primary,
    },
    timeframeText: {
      fontSize: 12,
      fontWeight: '600',
      color: themeColors.textSecondary,
    },
    activeTimeframeText: {
      color: 'white',
    },
    content: {
      flex: 1,
    },
    section: {
      padding: 16,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: themeColors.text,
      marginBottom: 16,
    },
    metricsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    metricCard: {
      flex: 1,
      minWidth: '48%',
    },
    chartsSection: {
      gap: 16,
    },
  });

  const topTracksData = analytics.topTracks?.map(track => ({
    label: track.name,
    value: track.plays,
    color: `hsl(${Math.random() * 360}, 70%, 50%)`,
  })) || [];

  const regionData = analytics.playsByRegion?.map(region => ({
    label: region.region,
    value: region.plays,
  })) || [];

  const revenueData = analytics.revenueOverTime?.map(item => ({
    label: item.date,
    value: item.revenue,
  })) || [];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Analytics Dashboard</Text>
        
        <View style={styles.timeframeSelector}>
          {timeframeOptions.map(option => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.timeframeButton,
                selectedTimeframe === option.value && styles.activeTimeframeButton,
              ]}
              onPress={() => setSelectedTimeframe(option.value as any)}
            >
              <Text style={[
                styles.timeframeText,
                selectedTimeframe === option.value && styles.activeTimeframeText,
              ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor={themeColors.primary}
            />
          ) : undefined
        }
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key Metrics</Text>
          <View style={styles.metricsGrid}>
            {metrics.map((metric, index) => (
              <View key={index} style={styles.metricCard}>
                <MetricsCard {...metric} size="medium" />
              </View>
            ))}
          </View>
        </View>

        {userType === 'artist' && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Performance Charts</Text>
              <View style={styles.chartsSection}>
                <AnalyticsChart
                  title="Top Tracks"
                  data={topTracksData}
                  type="bar"
                  timeframe={`Last ${selectedTimeframe}`}
                  showTrend
                  trendPercentage={12.5}
                />
                
                <AnalyticsChart
                  title="Plays by Region"
                  data={regionData}
                  type="pie"
                  timeframe={`Last ${selectedTimeframe}`}
                />
                
                <AnalyticsChart
                  title="Revenue Trend"
                  data={revenueData}
                  type="line"
                  timeframe={`Last ${selectedTimeframe}`}
                  showTrend
                  trendPercentage={15.2}
                />
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}