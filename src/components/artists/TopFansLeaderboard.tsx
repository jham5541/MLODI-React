import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, colors } from '../../context/ThemeContext';

// Mock data with expanded list for infinite scroll demonstration
const generateMockFans = (start: number, count: number) => {
  const levels = ['Diamond', 'Platinum', 'Gold', 'Silver', 'Bronze'];
  const avatars = ['🥇', '🥈', '🥉', '🎵', '🎧', '🎤', '🎹', '🎸', '🎺', '🥁'];
  const usernames = ['CryptoMelody', 'BeatLover2024', 'MusicNFTFan', 'VibeCollector', 'SonicExplorer', 'VinylVibe', 'NewFanRising', 'GuitarHero88', 'DrumMachine', 'BasslineKing'];

  return Array.from({ length: count }, (_, i) => {
    const rank = start + i;
    const points = Math.max(15000 - (rank * 100) - Math.random() * 50, 100);

    return {
      walletAddress: `0x${Math.random().toString(16).substr(2, 8)}...${Math.random().toString(16).substr(2, 8)}`,
      points: Math.floor(points),
      rank,
      lastWeekRank: rank > 1 ? rank + Math.floor(Math.random() * 3 - 1) : rank,
      badges: rank <= 10 ? ['Super Fan'] : rank <= 50 ? ['Early Supporter'] : [],
      avatar: avatars[Math.floor(Math.random() * avatars.length)],
      username: `${usernames[Math.floor(Math.random() * usernames.length)]}${rank}`,
      streakDays: Math.floor(Math.random() * 60),
      totalSpent: Math.floor(Math.random() * 3000),
      fanLevel: levels[Math.min(Math.floor(rank / 20), levels.length - 1)],
      trend: (Math.random() - 0.5) * 10
    };
  });
};

const TopFansLeaderboard = () => {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];
  const listRef = useRef<FlatList>(null);

  const [fans, setFans] = useState(() => generateMockFans(1, 50));
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  // Mock current user - in real app this would come from context/auth
  const currentUser = { walletAddress: fans[2]?.walletAddress }; // Third place user for demo

  const fetchMoreFans = async () => {
    if (loading) return;

    setLoading(true);
    // Simulate API delay
    setTimeout(() => {
      const nextPage = page + 1;
      const newFans = generateMockFans((page * 50) + 1, 50);
      setFans(prevFans => [...prevFans, ...newFans]);
      setPage(nextPage);
      setLoading(false);
    }, 1000);
  };

  const autoScrollToUser = (userIndex: number) => {
    if (listRef.current && userIndex !== -1) {
      // Delay scroll to ensure the list is rendered
      setTimeout(() => {
        listRef.current?.scrollToIndex({
          index: userIndex,
          animated: true,
          viewPosition: 0.5 // Center the user's position in view
        });
      }, 500);
    }
  };

  useEffect(() => {
    if (currentUser && fans.length > 0) {
      const userIndex = fans.findIndex(fan => fan.walletAddress === currentUser.walletAddress);
      if (userIndex !== -1) {
        autoScrollToUser(userIndex);
      }
    }
  }, [fans, currentUser]);

  const formatPoints = (points: number) => {
    if (points >= 1000) {
      return `${(points / 1000).toFixed(1)}K`;
    }
    return points.toString();
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

  const renderFan = ({ item, index }: { item: any; index: number }) => {
    const isTopThree = item.rank <= 3;
    const positionChange = getPositionChange(item.rank, item.lastWeekRank);
    const isCurrentUser = item.walletAddress === currentUser?.walletAddress;

    const rowStyle = [
      styles.fanRow,
      isTopThree && styles.topThreeRow,
      isCurrentUser && styles.currentUserRow
    ];

    return (
      <View style={rowStyle}>
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
          {isCurrentUser && (
            <View style={styles.currentUserBadge}>
              <Ionicons name="person" size={8} color={themeColors.primary} />
            </View>
          )}
        </View>

        {/* Fan Information */}
        <View style={styles.fanInfoSection}>
          <Text style={[styles.username, isCurrentUser && styles.currentUserText]} numberOfLines={1}>
            {item.username}
            {isCurrentUser && ' (You)'}
          </Text>
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
            {item.trend > 0 ? '+' : ''}{item.trend.toFixed(1)}%
          </Text>
        </View>
      </View>
    );
  };

  const renderFooter = () => {
    if (!loading) return null;

    return (
      <View style={styles.loadingFooter}>
        <Text style={styles.loadingText}>Loading more fans...</Text>
      </View>
    );
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
    chartContainer: {
      height: 400, // Fixed height for contained scrolling
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
    fanRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.border + '30',
    },
    topThreeRow: {
      backgroundColor: activeTheme === 'dark' ? themeColors.surface + '40' : '#fefbf3',
    },
    currentUserRow: {
      backgroundColor: themeColors.primary + '15',
      borderLeftWidth: 3,
      borderLeftColor: themeColors.primary,
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
    currentUserBadge: {
      position: 'absolute',
      bottom: -2,
      right: 8,
      backgroundColor: themeColors.primary,
      borderRadius: 8,
      padding: 2,
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
    currentUserText: {
      color: themeColors.primary,
      fontWeight: '700',
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
    scrollableList: {
      flex: 1,
    },
    listContainer: {
      paddingBottom: 8,
    },
    loadingFooter: {
      paddingVertical: 20,
      alignItems: 'center',
    },
    loadingText: {
      color: themeColors.textSecondary,
      fontSize: 14,
    },
  });

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
      </View>

      <View style={styles.chartContainer}>
        <View style={styles.chartHeader}>
          <Text style={styles.chartHeaderText}>Rank</Text>
          <Text style={styles.chartHeaderText}>Last Week</Text>
          <Text style={styles.chartHeaderText}>Fan</Text>
          <Text style={styles.chartHeaderText}>Trend</Text>
        </View>

        <FlatList
          ref={listRef}
          data={fans}
          renderItem={renderFan}
          keyExtractor={(item) => item.walletAddress}
          showsVerticalScrollIndicator={true}
          onEndReached={fetchMoreFans}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          maxToRenderPerBatch={20}
          windowSize={10}
          style={styles.scrollableList}
          contentContainerStyle={styles.listContainer}
          getItemLayout={(data, index) => ({
            length: 60, // Approximate item height
            offset: 60 * index,
            index,
          })}
        />
      </View>
    </View>
  );
};

export default TopFansLeaderboard;

