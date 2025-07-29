import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, colors } from '../../context/ThemeContext';
import { useUserFanRank, useArtistFanScore } from '../../hooks/useFanScoring';
import { LeaderboardType } from '../../types/fanScoring';

interface UserRankCardProps {
  userId: string;
  artistId: string;
  artistName: string;
  type?: LeaderboardType;
  onPress?: () => void;
}

export default function UserRankCard({ 
  userId, 
  artistId, 
  artistName, 
  type = LeaderboardType.ALL_TIME,
  onPress 
}: UserRankCardProps) {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];
  
  const { rankInfo, loading: rankLoading } = useUserFanRank(userId, artistId, type);
  const { fanScore, loading: scoreLoading } = useArtistFanScore(userId, artistId);

  const loading = rankLoading || scoreLoading;

  const getRankDisplay = () => {
    if (!rankInfo) return 'Unranked';
    
    if (rankInfo.currentRank <= 3) {
      const medals = ['🥇', '🥈', '🥉'];
      return `${medals[rankInfo.currentRank - 1]} #${rankInfo.currentRank}`;
    }
    
    return `#${rankInfo.currentRank}`;
  };

  const getPercentileText = () => {
    if (!rankInfo) return '';
    return `Top ${100 - rankInfo.percentile}%`;
  };

  const getRankColor = () => {
    if (!rankInfo) return themeColors.textSecondary;
    
    if (rankInfo.currentRank === 1) return '#FFD700';
    if (rankInfo.currentRank <= 3) return themeColors.primary;
    if (rankInfo.percentile >= 90) return '#4CAF50';
    if (rankInfo.percentile >= 75) return '#FF9800';
    return themeColors.textSecondary;
  };

  const getProgressWidth = () => {
    if (!rankInfo || !fanScore) return '0%';
    
    const currentPoints = fanScore.totalScore;
    const nextRankPoints = currentPoints + rankInfo.pointsToNextRank;
    const progress = nextRankPoints > 0 ? (currentPoints / nextRankPoints) * 100 : 100;
    
    return `${Math.min(progress, 100)}%`;
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: themeColors.surface }]}>
        <ActivityIndicator size="small" color={themeColors.primary} />
        <Text style={[styles.loadingText, { color: themeColors.textSecondary }]}>
          Loading rank...
        </Text>
      </View>
    );
  }

  if (!fanScore || !rankInfo) {
    return (
      <TouchableOpacity 
        style={[styles.container, { backgroundColor: themeColors.surface }]}
        onPress={onPress}
      >
        <View style={styles.noRankContainer}>
          <Ionicons name="star-outline" size={24} color={themeColors.textSecondary} />
          <View style={styles.noRankTextContainer}>
            <Text style={[styles.noRankTitle, { color: themeColors.text }]}>
              Start Your Journey
            </Text>
            <Text style={[styles.noRankSubtitle, { color: themeColors.textSecondary }]}>
              Engage with {artistName} to earn your rank!
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  const styles = StyleSheet.create({
    container: {
      borderRadius: 16,
      padding: 20,
      marginHorizontal: 20,
      marginVertical: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    artistName: {
      fontSize: 16,
      fontWeight: '600',
      color: themeColors.text,
      flex: 1,
    },
    viewLeaderboardButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 6,
      backgroundColor: themeColors.primary + '20',
      borderRadius: 12,
    },
    viewLeaderboardText: {
      fontSize: 12,
      fontWeight: '600',
      color: themeColors.primary,
      marginRight: 4,
    },
    statsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    statItem: {
      alignItems: 'center',
      flex: 1,
    },
    statValue: {
      fontSize: 20,
      fontWeight: '700',
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 12,
      fontWeight: '500',
      color: themeColors.textSecondary,
      textAlign: 'center',
    },
    progressContainer: {
      marginTop: 4,
    },
    progressLabel: {
      fontSize: 12,
      fontWeight: '500',
      color: themeColors.textSecondary,
      marginBottom: 8,
    },
    progressBar: {
      height: 6,
      backgroundColor: themeColors.border,
      borderRadius: 3,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      backgroundColor: themeColors.primary,
      borderRadius: 3,
    },
    pointsToNext: {
      fontSize: 11,
      color: themeColors.textSecondary,
      marginTop: 4,
      textAlign: 'center',
    },
    engagementBreakdown: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginTop: 16,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: themeColors.border,
    },
    breakdownItem: {
      alignItems: 'center',
    },
    breakdownIcon: {
      marginBottom: 4,
    },
    breakdownPoints: {
      fontSize: 14,
      fontWeight: '600',
      color: themeColors.text,
    },
    breakdownLabel: {
      fontSize: 10,
      color: themeColors.textSecondary,
      marginTop: 2,
    },
    loadingText: {
      fontSize: 14,
      marginLeft: 8,
    },
    noRankContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    noRankTextContainer: {
      marginLeft: 12,
      flex: 1,
    },
    noRankTitle: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 4,
    },
    noRankSubtitle: {
      fontSize: 14,
      lineHeight: 20,
    },
  });

  return (
    <TouchableOpacity 
      style={[styles.container, { backgroundColor: themeColors.surface }]}
      onPress={onPress}
    >
      <View style={styles.header}>
        <Text style={styles.artistName} numberOfLines={1}>
          {artistName} Fan Rank
        </Text>
        <TouchableOpacity style={styles.viewLeaderboardButton} onPress={onPress}>
          <Text style={styles.viewLeaderboardText}>View All</Text>
          <Ionicons name="chevron-forward" size={14} color={themeColors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: getRankColor() }]}>
            {getRankDisplay()}
          </Text>
          <Text style={styles.statLabel}>Your Rank</Text>
        </View>

        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: themeColors.primary }]}>
            {fanScore.totalScore.toLocaleString()}
          </Text>
          <Text style={styles.statLabel}>Fan Points</Text>
        </View>

        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: themeColors.text }]}>
            {getPercentileText()}
          </Text>
          <Text style={styles.statLabel}>Percentile</Text>
        </View>
      </View>

      {rankInfo.pointsToNextRank > 0 && (
        <View style={styles.progressContainer}>
          <Text style={styles.progressLabel}>
            Progress to next rank
          </Text>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: getProgressWidth() }
              ]} 
            />
          </View>
          <Text style={styles.pointsToNext}>
            {rankInfo.pointsToNextRank.toLocaleString()} points to go
          </Text>
        </View>
      )}

      <View style={styles.engagementBreakdown}>
        <View style={styles.breakdownItem}>
          <Ionicons 
            name="musical-notes" 
            size={20} 
            color={themeColors.primary} 
            style={styles.breakdownIcon}
          />
          <Text style={styles.breakdownPoints}>
            {fanScore.engagementBreakdown.streaming.toLocaleString()}
          </Text>
          <Text style={styles.breakdownLabel}>Streaming</Text>
        </View>

        <View style={styles.breakdownItem}>
          <Ionicons 
            name="card" 
            size={20} 
            color={themeColors.primary} 
            style={styles.breakdownIcon}
          />
          <Text style={styles.breakdownPoints}>
            {fanScore.engagementBreakdown.purchases.toLocaleString()}
          </Text>
          <Text style={styles.breakdownLabel}>Purchases</Text>
        </View>

        <View style={styles.breakdownItem}>
          <Ionicons 
            name="heart" 
            size={20} 
            color={themeColors.primary} 
            style={styles.breakdownIcon}
          />
          <Text style={styles.breakdownPoints}>
            {fanScore.engagementBreakdown.social.toLocaleString()}
          </Text>
          <Text style={styles.breakdownLabel}>Social</Text>
        </View>

        <View style={styles.breakdownItem}>
          <Ionicons 
            name="videocam" 
            size={20} 
            color={themeColors.primary} 
            style={styles.breakdownIcon}
          />
          <Text style={styles.breakdownPoints}>
            {fanScore.engagementBreakdown.videos.toLocaleString()}
          </Text>
          <Text style={styles.breakdownLabel}>Videos</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
