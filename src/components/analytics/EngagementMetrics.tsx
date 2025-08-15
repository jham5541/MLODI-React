import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Dimensions,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, colors } from '../../context/ThemeContext';
import { usePlayTracking } from '../../context/PlayTrackingContext';
import MLService from '../../services/ml/MLService';
import { useArtistMLAnalytics } from '../../hooks/useArtistMLAnalytics';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase/client';
import { getCommonContainerStyle, getCommonTitleStyle } from '../../styles/artistProfileStyles';
import { useMockSubscriptionStore } from '../../store/mockSubscriptionStore';

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
  const { user } = useAuth();
  const { getArtistTotalPlays, getArtistSongPlays, getArtistVideoPlays, artistPlayStats } = usePlayTracking();
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const animatedHeight = useState(new Animated.Value(0))[0];
  const rotateAnim = useState(new Animated.Value(0))[0];
  const screenWidth = Dimensions.get('window').width;
  
  // Use comprehensive ML analytics hook
  const { metrics: mlMetrics, anomalies, isEmergingTalent, loading: mlLoading } = useArtistMLAnalytics(artistId);
  
  // Check if user has a paid subscription
  const [userProfile, setUserProfile] = useState<any>(null);
  
  // Use mock subscription in development
  const mockSubscription = __DEV__ ? useMockSubscriptionStore(state => state.subscription) : null;
  const mockTier = mockSubscription?.tier || mockSubscription?.metadata?.tier;
  
  const isPaidTier = __DEV__ 
    ? mockTier === 'superfan'
    : userProfile?.subscription_tier === 'superfan';
  
  useEffect(() => {
    const loadUserProfile = async () => {
      if (user?.id) {
        const { data } = await supabase
          .from('profiles')
          .select('subscription_tier')
          .eq('id', user.id)
          .single();
        setUserProfile(data);
      }
    };
    loadUserProfile();
  }, [user]);
  
  const toggleExpanded = () => {
    if (!isPaidTier) {
      Alert.alert(
        'Premium Feature',
        'Engagement metrics are available for Superfan subscribers. Upgrade to Superfan to unlock detailed analytics.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upgrade', onPress: () => {
            // Navigate to subscription screen
            // navigation.navigate('SubscriptionManagement');
          }}
        ]
      );
      return;
    }
    
    setIsExpanded(!isExpanded);
    
    // Animate arrow rotation
    Animated.timing(rotateAnim, {
      toValue: isExpanded ? 0 : 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
    
    // Animate content height
    Animated.timing(animatedHeight, {
      toValue: isExpanded ? 0 : 1,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  useEffect(() => {
    const totalPlays = getArtistTotalPlays(artistId);
    const songPlays = getArtistSongPlays(artistId);
    const videoPlays = getArtistVideoPlays(artistId);
    const uniqueListeners = artistPlayStats[artistId]?.uniqueListeners?.size || 0;
    
    // Calculate average listen time (mock calculation based on total plays)
    const avgListenTime = totalPlays > 0 ? 2.5 + (totalPlays * 0.1) : 0;
    
    // Calculate engagement rate based on unique listeners and total plays
    const engagementRate = uniqueListeners > 0 ? Math.min((totalPlays / uniqueListeners / 10) * 100, 100) : 0;
    
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
      {
        label: 'Engagement Rate',
        value: parseFloat(engagementRate.toFixed(1)),
        trend: engagementRate > 50 ? 'up' : engagementRate > 20 ? 'steady' : 'down'
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

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg']
  });
  
  const commonStyles = getCommonContainerStyle(themeColors);
  const titleStyles = getCommonTitleStyle(themeColors);

  const styles = StyleSheet.create({
    container: {
      ...commonStyles.container,
      overflow: 'hidden',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 12,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    title: {
      fontSize: 18,
      fontWeight: '700',
      color: themeColors.text,
    },
    lockIcon: {
      marginLeft: 8,
    },
    arrowIcon: {
      marginLeft: 12,
    },
    expandedContent: {
      paddingHorizontal: 20,
      paddingBottom: 20,
    },
    metricsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginHorizontal: -4,
      justifyContent: 'space-between',
    },
    metricCard: {
      backgroundColor: themeColors.background,
      borderRadius: 12,
      padding: 12,
      alignItems: 'center',
      width: (screenWidth - 40 - 16) / 3, // 3 columns: screen width - padding (20*2) - gaps (8*2)
      marginHorizontal: 4,
      marginBottom: 12,
    },
    metricLabel: {
      fontSize: 11,
      color: themeColors.textSecondary,
      marginBottom: 8,
      textAlign: 'center',
    },
    metricValue: {
      fontSize: 18,
      fontWeight: '700',
      color: themeColors.text,
      marginBottom: 4,
    },
    mlInsightsContainer: {
      backgroundColor: themeColors.primary + '15',
      borderRadius: 12,
      padding: 16,
      marginTop: 16,
      borderWidth: 1,
      borderColor: themeColors.primary + '30',
    },
    mlInsightsTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: themeColors.primary,
      marginBottom: 12,
    },
    mlInsightRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    mlInsightLabel: {
      fontSize: 14,
      color: themeColors.textSecondary,
    },
    mlInsightValue: {
      fontSize: 14,
      fontWeight: '600',
      color: themeColors.text,
    },
    lockedCard: {
      opacity: 0.5,
    },
    lockedOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: themeColors.background + '80',
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 12,
    },
    premiumBadge: {
      backgroundColor: themeColors.primary,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      marginLeft: 8,
    },
    premiumText: {
      color: 'white',
      fontSize: 9,
      fontWeight: '600',
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
      <TouchableOpacity onPress={toggleExpanded} activeOpacity={0.7}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>Engagement Metrics</Text>
            {!isPaidTier && (
              <View style={styles.premiumBadge}>
                <Text style={styles.premiumText}>SUPERFAN</Text>
              </View>
            )}
            {!isPaidTier && (
              <Ionicons 
                name="lock-closed" 
                size={16} 
                color={themeColors.textSecondary} 
                style={styles.lockIcon}
              />
            )}
          </View>
          <Animated.View style={{ transform: [{ rotate: spin }] }}>
            <Ionicons 
              name="chevron-down" 
              size={20} 
              color={themeColors.textSecondary}
            />
          </Animated.View>
        </View>
      </TouchableOpacity>
      
      {isExpanded && (
        <Animated.View 
          style={[
            styles.expandedContent,
            {
              opacity: animatedHeight,
              maxHeight: animatedHeight.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 1000]
              })
            }
          ]}
        >
          <View style={styles.metricsGrid}>
            {metrics.map((metric) => (
              <View key={metric.label} style={[styles.metricCard, !isPaidTier && styles.lockedCard]}>
                <Text style={styles.metricLabel}>{metric.label}</Text>
                <Text style={styles.metricValue}>
                  {metric.label === 'Avg Listen Time' 
                    ? `${metric.value}m` 
                    : metric.label === 'Engagement Rate'
                    ? `${metric.value}%`
                    : formatNumber(metric.value)
                  }
                </Text>
                {renderTrendIcon(metric.trend)}
                {!isPaidTier && (
                  <View style={styles.lockedOverlay}>
                    <Ionicons name="lock-closed" size={20} color={themeColors.textSecondary} />
                  </View>
                )}
              </View>
            ))}
          </View>
          
          {mlMetrics && (
            <View style={[styles.mlInsightsContainer, !isPaidTier && { opacity: 0.5 }]}>
              <Text style={styles.mlInsightsTitle}>
                AI-Powered Insights {isEmergingTalent && '🚀'}
              </Text>
              
              <View style={styles.mlInsightRow}>
                <Text style={styles.mlInsightLabel}>Viral Potential</Text>
                <Text style={styles.mlInsightValue}>
                  {isPaidTier ? `${Math.round(mlMetrics.viralPotential * 100)}%` : '---'}
                </Text>
              </View>
              
              <View style={styles.mlInsightRow}>
                <Text style={styles.mlInsightLabel}>Growth Rate</Text>
                <Text style={styles.mlInsightValue}>
                  {isPaidTier 
                    ? `${mlMetrics.growthRate > 0 ? '+' : ''}${(mlMetrics.growthRate * 100).toFixed(1)}%`
                    : '---'
                  }
                </Text>
              </View>
              
              <View style={styles.mlInsightRow}>
                <Text style={styles.mlInsightLabel}>ML Engagement Score</Text>
                <Text style={styles.mlInsightValue}>
                  {isPaidTier ? mlMetrics.engagementScore.toFixed(2) : '---'}
                </Text>
              </View>
              
              <View style={styles.mlInsightRow}>
                <Text style={styles.mlInsightLabel}>Predicted Monthly Growth</Text>
                <Text style={styles.mlInsightValue}>
                  {isPaidTier 
                    ? `${mlMetrics.predictedMonthlyGrowth > 0 ? '+' : ''}${(mlMetrics.predictedMonthlyGrowth * 100).toFixed(1)}%`
                    : '---'
                  }
                </Text>
              </View>
              
              <View style={styles.mlInsightRow}>
                <Text style={styles.mlInsightLabel}>Audience Retention</Text>
                <Text style={styles.mlInsightValue}>
                  {isPaidTier ? `${(mlMetrics.audienceRetention * 100).toFixed(0)}%` : '---'}
                </Text>
              </View>
              
              {anomalies && anomalies.length > 0 && isPaidTier && (
                <View style={[styles.mlInsightRow, { marginTop: 8 }]}>
                  <Text style={[styles.mlInsightLabel, { color: '#EF4444' }]}>⚠️ Stream Anomalies Detected</Text>
                  <Text style={[styles.mlInsightValue, { color: '#EF4444' }]}>{anomalies.length}</Text>
                </View>
              )}
            </View>
          )}
        </Animated.View>
      )}
    </View>
  );
}

