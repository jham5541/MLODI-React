import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, colors } from '../../context/ThemeContext';

// Mock data with Billboard-style position tracking
const topFans = [
  { 
    walletAddress: '0x1a2b3c4d...ef56789a', 
    points: 12847, 
    rank: 1, 
    lastWeekRank: 2,
    badges: ['Super Fan', 'Early Supporter', 'VIP'],
    avatar: '🥇',
    username: 'CryptoMelody',
    streakDays: 45,
    totalSpent: 2450,
    fanLevel: 'Diamond',
    trend: 2.5
  },
  { 
    walletAddress: '0x9f8e7d6c...ba098765', 
    points: 11239, 
    rank: 2, 
    lastWeekRank: 1,
    badges: ['Super Fan', 'Collector'],
    avatar: '🥈',
    username: 'BeatLover2024',
    streakDays: 32,
    totalSpent: 1890,
    fanLevel: 'Platinum',
    trend: 0.5
  },
  { 
    walletAddress: '0xa1b2c3d4...e5f6789b', 
    points: 10564, 
    rank: 3, 
    lastWeekRank: 3,
    badges: ['Super Fan'],
    avatar: '🥉',
    username: 'MusicNFTFan',
    streakDays: 28,
    totalSpent: 1650,
    fanLevel: 'Gold',
    trend: -1.2
  },
  { 
    walletAddress: '0x5d4c3b2a...19876543', 
    points: 9832, 
    rank: 4, 
    lastWeekRank: 6,
    badges: ['Early Supporter'],
    avatar: '🎵',
    username: 'VibeCollector',
    streakDays: 21,
    totalSpent: 1420,
    fanLevel: 'Silver',
    trend: 1.7
  },
  { 
    walletAddress: '0x6e7f8a9b...cdef0123', 
    points: 8765, 
    rank: 5, 
    lastWeekRank: 4,
    badges: [],
    avatar: '🎧',
    username: 'SonicExplorer',
    streakDays: 15,
    totalSpent: 980,
    fanLevel: 'Bronze',
    trend: -0.4
  },
  { 
    walletAddress: '0x7f8e9a0b...1c2d3e4f', 
    points: 8234, 
    rank: 6, 
    lastWeekRank: 5,
    badges: ['Collector'],
    avatar: '🎤',
    username: 'VinylVibe',
    streakDays: 12,
    totalSpent: 750,
    fanLevel: 'Bronze',
    trend: -0.8
  },
  { 
    walletAddress: '0x9a1b2c3d...4e5f6789', 
    points: 7890, 
    rank: 7, 
    lastWeekRank: null,
    badges: [],
    avatar: '🎹',
    username: 'NewFanRising',
    streakDays: 8,
    totalSpent: 450,
    fanLevel: 'Bronze',
    trend: 5.2
  },
  { 
    walletAddress: '0xb2c3d4e5...f6789abc', 
    points: 7456, 
    rank: 8, 
    lastWeekRank: 7,
    badges: ['Early Supporter'],
    avatar: '🎸',
    username: 'GuitarHero88',
    streakDays: 18,
    totalSpent: 890,
    fanLevel: 'Bronze',
    trend: -0.3
  }
];

const TopFansLeaderboard = () => {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];

  const formatPoints = (points: number) => {
    if (points >= 1000) {
      return `${(points / 1000).toFixed(1)}K`;
    }
    return points.toString();
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString()}`;
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return '#FFD700'; // Gold
      case 2:
        return '#C0C0C0'; // Silver
      case 3:
        return '#CD7F32'; // Bronze
      default:
        return '#667eea'; // Purple
    }
  };

  const getBadgeColor = (badge: string) => {
    switch (badge) {
      case 'Super Fan':
        return { bg: '#FF6B6B20', text: '#FF6B6B', border: '#FF6B6B' };
      case 'Early Supporter':
        return { bg: '#4ECDC420', text: '#4ECDC4', border: '#4ECDC4' };
      case 'VIP':
        return { bg: '#FFD93D20', text: '#FFD93D', border: '#FFD93D' };
      case 'Collector':
        return { bg: '#6BCF7F20', text: '#6BCF7F', border: '#6BCF7F' };
      default:
        return { bg: '#A8A8A820', text: '#A8A8A8', border: '#A8A8A8' };
    }
  };

  const getFanLevelColor = (level: string) => {
    switch (level) {
      case 'Diamond':
        return '#B9F2FF';
      case 'Platinum':
        return '#E5E4E2';
      case 'Gold':
        return '#FFD700';
      case 'Silver':
        return '#C0C0C0';
      case 'Bronze':
        return '#CD7F32';
      default:
        return '#666';
    }
  };

  const getPositionChange = (currentRank: number, lastWeekRank: number | null) => {
    if (lastWeekRank === null) {
      return { type: 'new', change: 0, text: 'NEW' };
    }
    
    const change = lastWeekRank - currentRank;
    if (change > 0) {
      return { type: 'up', change, text: `+${change}` };
    } else if (change < 0) {
      return { type: 'down', change: Math.abs(change), text: `-${Math.abs(change)}` };
    } else {
      return { type: 'same', change: 0, text: '—' };
    }
  };

  const styles = StyleSheet.create({
    container: {
      backgroundColor: themeColors.surface,
      marginHorizontal: 16,
      marginVertical: 8,
      borderRadius: 16,
      shadowColor: themeColors.text,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    header: {
      paddingHorizontal: 16,
      paddingTop: 20,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.border,
    },
    titleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4,
    },
    titleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    title: {
      fontSize: 20,
      fontWeight: '700',
      color: themeColors.text,
      marginLeft: 6,
    },
    weekLabel: {
      fontSize: 12,
      color: themeColors.textSecondary,
      fontWeight: '500',
      backgroundColor: themeColors.background,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
    },
    subtitle: {
      fontSize: 13,
      color: themeColors.textSecondary,
      fontWeight: '400',
    },
    chartContainer: {
      flex: 1,
    },
    chartHeader: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      paddingVertical: 8,
      backgroundColor: themeColors.background,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.border,
    },
    chartHeaderText: {
      fontSize: 11,
      fontWeight: '600',
      color: themeColors.textSecondary,
      textTransform: 'uppercase',
      flex: 1,
      textAlign: 'center',
    },
    scrollableList: {
      maxHeight: 400,
    },
    listContainer: {
      paddingBottom: 8,
    },
    fanRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.borderLight,
    },
    topThreeRow: {
      backgroundColor: activeTheme === 'dark' ? themeColors.surfaceElevated : '#fefbf3',
    },
    rankSection: {
      width: 50,
      alignItems: 'center',
    },
    rankNumber: {
      fontSize: 18,
      fontWeight: '700',
      color: themeColors.text,
      marginBottom: 2,
    },
    topThreeRank: {
      color: '#FFD700',
      fontSize: 20,
    },
    positionChange: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 8,
      minWidth: 32,
      alignItems: 'center',
    },
    upChange: {
      backgroundColor: '#dcfce7',
    },
    downChange: {
      backgroundColor: '#fef2f2',
    },
    newChange: {
      backgroundColor: '#e0f2fe',
    },
    sameChange: {
      backgroundColor: themeColors.background,
    },
    positionChangeText: {
      fontSize: 10,
      fontWeight: '600',
    },
    upText: {
      color: '#16a34a',
    },
    downText: {
      color: '#dc2626',
    },
    newText: {
      color: '#0284c7',
    },
    sameText: {
      color: themeColors.textSecondary,
    },
    avatarSection: {
      width: 60,
      alignItems: 'center',
      position: 'relative',
    },
    avatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: themeColors.background,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: themeColors.border,
    },
    topThreeAvatar: {
      borderColor: '#FFD700',
      borderWidth: 2,
    },
    avatarEmoji: {
      fontSize: 18,
    },
    topBadge: {
      position: 'absolute',
      top: -2,
      right: 8,
      backgroundColor: themeColors.surface,
      borderRadius: 8,
      padding: 1,
    },
    fanInfoSection: {
      flex: 1,
      marginLeft: 8,
    },
    username: {
      fontSize: 14,
      fontWeight: '600',
      color: themeColors.text,
      marginBottom: 3,
    },
    detailsRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    fanLevelBadge: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 8,
      marginRight: 8,
    },
    fanLevelText: {
      fontSize: 10,
      fontWeight: '600',
    },
    pointsText: {
      fontSize: 12,
      color: themeColors.textSecondary,
      fontWeight: '500',
    },
    trendSection: {
      width: 60,
      alignItems: 'center',
    },
    trendText: {
      fontSize: 11,
      fontWeight: '600',
      marginTop: 2,
    },
  });

  const renderFan = ({ item, index }) => {
    const isTopThree = item.rank <= 3;
    const positionChange = getPositionChange(item.rank, item.lastWeekRank);
    
    return (
      <View style={[styles.fanRow, isTopThree && styles.topThreeRow]}>
        {/* Rank and Position Change */}
        <View style={styles.rankSection}>
          <Text style={[styles.rankNumber, isTopThree && styles.topThreeRank]}>
            {item.rank}
          </Text>
          <View style={[
            styles.positionChange,
            styles[`${positionChange.type}Change`]
          ]}>
            <Text style={[
              styles.positionChangeText,
              styles[`${positionChange.type}Text`]
            ]}>
              {positionChange.text}
            </Text>
          </View>
        </View>
        
        {/* Fan Avatar */}
        <View style={styles.avatarSection}>
          <View style={[styles.avatar, isTopThree && styles.topThreeAvatar]}>
            <Text style={styles.avatarEmoji}>{item.avatar}</Text>
          </View>
          {isTopThree && (
            <View style={styles.topBadge}>
              <Ionicons name="star" size={10} color="#FFD700" />
            </View>
          )}
        </View>
        
        {/* Fan Information */}
        <View style={styles.fanInfoSection}>
          <Text style={styles.username} numberOfLines={1}>{item.username}</Text>
          <View style={styles.detailsRow}>
            <View style={[styles.fanLevelBadge, { backgroundColor: `${getFanLevelColor(item.fanLevel)}20` }]}>
              <Text style={[styles.fanLevelText, { color: getFanLevelColor(item.fanLevel) }]}>
                {item.fanLevel}
              </Text>
            </View>
            <Text style={styles.pointsText}>{formatPoints(item.points)} pts</Text>
          </View>
        </View>
        
        {/* Trend Indicator */}
        <View style={styles.trendSection}>
          <Ionicons 
            name={item.trend >= 0 ? "trending-up" : "trending-down"} 
            size={16} 
            color={item.trend >= 0 ? '#22C55E' : '#EF4444'} 
          />
          <Text style={[
            styles.trendText,
            { color: item.trend >= 0 ? '#22C55E' : '#EF4444' }
          ]}>
            {item.trend > 0 ? '+' : ''}{item.trend}%
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={styles.titleContainer}>
            <Ionicons name="trophy" size={20} color="#FFD700" />
            <Text style={styles.title}>Top Fans Chart</Text>
          </View>
          <Text style={styles.weekLabel}>This Week</Text>
        </View>
        <Text style={styles.subtitle}>Billboard-style fan engagement rankings</Text>
      </View>
      
      <View style={styles.chartContainer}>
        <View style={styles.chartHeader}>
          <Text style={styles.chartHeaderText}>Rank</Text>
          <Text style={styles.chartHeaderText}>Last Week</Text>
          <Text style={styles.chartHeaderText}>Fan</Text>
          <Text style={styles.chartHeaderText}>Trend</Text>
        </View>
        
        <FlatList
          data={topFans}
          renderItem={renderFan}
          keyExtractor={(item) => item.walletAddress}
          showsVerticalScrollIndicator={true}
          style={styles.scrollableList}
          contentContainerStyle={styles.listContainer}
        />
      </View>
    </View>
  );
};


export default TopFansLeaderboard;

