import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, colors } from '../../context/ThemeContext';
import { useAuthStore } from '../../store/authStore';
import { databaseService } from '../../services/databaseService';

interface Fan {
  id: string;
  user_id: string;
  username: string;
  avatar_url: string;
  level: string;
  points: number;
  rank: number;
  fan_since: string;
  badges: Array<{
    id: string;
    name: string;
    icon: string;
    color: string;
  }>;
  user: {
    username: string;
    avatar_url: string;
  };
  avatar: string;
}

interface TopFansLeaderboardProps {
  artistId: string;
}

const ITEMS_PER_PAGE = 50;

const TopFansLeaderboard = ({ artistId }: TopFansLeaderboardProps) => {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];
  const listRef = useRef<FlatList>(null);
  const { user } = useAuthStore();

  const [fans, setFans] = useState<Fan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPeriod, setCurrentPeriod] = useState<'all_time' | 'monthly' | 'weekly'>('all_time');

useEffect(() => {
    loadFans();
    const subscription = databaseService.subscribeToArtistLeaderboard(artistId, loadFans);
    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [artistId, currentPeriod]);

  const loadFans = async () => {
    try {
      setLoading(true);
      setError(null);

      let data: Fan[];
      // Get fan leaderboard data
      if (!artistId || true) { // Force empty state while feature is in development
        data = [];
      } else {
      const { data: leaderboardData } = await databaseService.getArtistLeaderboard(artistId, ITEMS_PER_PAGE);
      data = leaderboardData || [];
      }

      setFans(data);
    } catch (err) {
      console.error('Error loading fans:', err);
      setError('Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadFans();
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
    if (user && fans.length > 0) {
      const userIndex = fans.findIndex(fan => fan.user_id === user.id);
      if (userIndex !== -1) {
        autoScrollToUser(userIndex);
      }
    }
  }, [fans, user]);

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

  const renderFan = ({ item, index }: { item: Fan; index: number }) => {
    const isTopThree = item.rank <= 3;
    const isCurrentUser = user && item.user_id === user.id;

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
            positionChange.type === 'up' ? styles.upChange :
            positionChange.type === 'down' ? styles.downChange :
            positionChange.type === 'new' ? styles.newChange :
            styles.sameChange
          ]}>
            <Text style={[
              styles.positionChangeText,
              positionChange.type === 'up' ? styles.upText :
              positionChange.type === 'down' ? styles.downText :
              positionChange.type === 'new' ? styles.newText :
              styles.sameText
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
            {item.user.username}
            {isCurrentUser && ' (You)'}
          </Text>
          <View style={styles.detailsRow}>
            <View style={[styles.fanLevelBadge, { backgroundColor: `${getFanLevelColor(item.level)}20` }]}>
              <Text style={[styles.fanLevelText, { color: getFanLevelColor(item.level) }]}>
                {item.level}
              </Text>
            </View>
            <Text style={styles.pointsText}>{formatPoints(item.points)} pts</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="people-outline" size={64} color={themeColors.textSecondary} />
      <Text style={[styles.emptyTitle, { color: themeColors.text }]}>
        Top Fans Leaderboard Coming Soon
      </Text>
      <Text style={[styles.emptySubtitle, { color: themeColors.primary }]}>
        Compete with other fans and earn rewards!
      </Text>
    </View>
  );

  const renderError = () => (
    <View style={styles.emptyState}>
      <Ionicons name="alert-circle-outline" size={64} color={themeColors.error} />
      <Text style={[styles.emptyTitle, { color: themeColors.error }]}>
        {error}
      </Text>
      <TouchableOpacity 
        style={[styles.retryButton, { backgroundColor: themeColors.primary }]}
        onPress={loadFans}
      >
        <Text style={styles.retryButtonText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );

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
    emptyState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
      backgroundColor: themeColors.background,
      borderRadius: 16,
      margin: 16,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: '600',
      marginTop: 16,
      marginBottom: 8,
      textAlign: 'center',
      width: '100%',
    },
    emptySubtitle: {
      fontSize: 14,
      textAlign: 'center',
      lineHeight: 20,
      width: '100%',
      paddingHorizontal: 20,
    },
    retryButton: {
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 8,
      marginTop: 16,
    },
    retryButtonText: {
      color: 'white',
      fontSize: 14,
      fontWeight: '600',
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
            data={fans}
            renderItem={renderFan}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={true}
            style={styles.scrollableList}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl
                refreshing={loading}
                onRefresh={handleRefresh}
                tintColor={themeColors.primary}
              />
            }
            ListEmptyComponent={error ? renderError() : renderEmptyState()}
            getItemLayout={(data, index) => ({
              length: 60,
              offset: 60 * index,
              index,
            })}
          />
      </View>
    </View>
  );
};

export default TopFansLeaderboard;

