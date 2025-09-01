import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  last_week_rank: number | null;
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

import { useNavigation } from '@react-navigation/native';
import { RootStackNavigationProp } from '../../navigation/AppNavigator';

interface TopFansLeaderboardProps {
  artistId: string;
  maxItems?: number; // if provided, show only this many fans (e.g. 3)
  fullScreen?: boolean; // when true, extend to fill page height
}

const ITEMS_PER_PAGE = 50;

const TopFansLeaderboard = ({ artistId, maxItems, fullScreen }: TopFansLeaderboardProps) => {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];
  const listRef = useRef<FlatList>(null);
  const { user } = useAuthStore();
  const navigation = useNavigation<RootStackNavigationProp<'ArtistProfile'>>();

  const [fans, setFans] = useState<Fan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPeriod, setCurrentPeriod] = useState<'all_time' | 'monthly' | 'weekly'>('all_time');

  // Only render up to maxItems if provided
  const displayedFans = useMemo(() => (maxItems ? fans.slice(0, maxItems) : fans), [fans, maxItems]);

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

      // Fetch leaderboard from Supabase via databaseService
      const entries = await databaseService.getArtistLeaderboard(artistId, ITEMS_PER_PAGE, 0);

      // Map to this component's Fan shape
      const mapped: Fan[] = (entries || []).map((e) => {
        const points = e.fanScore || 0;
        const level = points >= 15000
          ? 'Diamond'
          : points >= 10000
          ? 'Platinum'
          : points >= 5000
          ? 'Gold'
          : points >= 2500
          ? 'Silver'
          : 'Bronze';
        return {
          id: `${e.userId}-${e.artistId}`,
          user_id: e.userId,
          username: e.username,
          avatar_url: e.profilePicture || '',
          level,
          points,
          rank: e.rank,
          fan_since: '',
          last_week_rank: null,
          badges: [],
          user: { username: e.username, avatar_url: e.profilePicture || '' },
          avatar: '🎵',
        };
      });

      setFans(mapped);
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
    if (!listRef.current) return;
    if (userIndex < 0) return;
    const upperBound = displayedFans.length - 1;
    if (upperBound < 0) return;
    const safeIndex = Math.min(userIndex, upperBound);
    // Delay scroll to ensure the list is rendered
    setTimeout(() => {
      try {
        listRef.current?.scrollToIndex({
          index: safeIndex,
          animated: true,
          viewPosition: 0.5,
        });
      } catch (e) {
        // ignore; will be handled by onScrollToIndexFailed
      }
    }, 300);
  };

  useEffect(() => {
    if (user && displayedFans.length > 0) {
      const userIndex = displayedFans.findIndex(fan => fan.user_id === user.id);
      if (userIndex !== -1) {
        autoScrollToUser(userIndex);
      }
    }
  }, [displayedFans, user]);

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
          {(() => {
            const posChange = getPositionChange(item.rank, item.last_week_rank);
            return (
              <View style={[
                styles.positionChange,
                posChange.type === 'up' ? styles.upChange :
                posChange.type === 'down' ? styles.downChange :
                posChange.type === 'new' ? styles.newChange :
                styles.sameChange
              ]}>
                <Text style={[
                  styles.positionChangeText,
                  posChange.type === 'up' ? styles.upText :
                  posChange.type === 'down' ? styles.downText :
                  posChange.type === 'new' ? styles.newText :
                  styles.sameText
                ]}>
                  {posChange.text}
                </Text>
              </View>
            );
          })()} 
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
          </View>
        </View>
        
        {/* Points Column */}
        <View style={styles.pointsSection}>
          <Text style={styles.pointsValue}>{formatPoints(item.points)}</Text>
          <Text style={styles.pointsLabel}>pts</Text>
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
      marginHorizontal: fullScreen ? 0 : 16,
      marginVertical: fullScreen ? 0 : 8,
      borderRadius: fullScreen ? 0 : 16,
      shadowColor: themeColors.text,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: fullScreen ? 0 : 0.1,
      shadowRadius: fullScreen ? 0 : 8,
      elevation: fullScreen ? 0 : 4,
      height: fullScreen ? undefined : 480, // No fixed height for full screen
      flex: fullScreen ? 1 : undefined, // Take full available space when fullScreen
      overflow: 'hidden', // Prevent visual overflow into next section
      marginBottom: fullScreen ? 0 : 12, // No margin bottom for full screen
    },
    header: {
      paddingHorizontal: 16,
      paddingTop: 16,
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
      fontSize: 18,
      fontWeight: '700',
      color: themeColors.text,
      marginLeft: 6,
    },
    weekLabel: {
      fontSize: 11,
      color: themeColors.textSecondary,
      fontWeight: '600',
      backgroundColor: themeColors.background,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
    },
    chartContainer: {
      flex: 1,
      height: fullScreen ? undefined : 380, // No fixed height for full screen
      backgroundColor: themeColors.background,
    },
    chartHeader: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      paddingVertical: 10,
      backgroundColor: themeColors.background,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.border,
    },
    chartHeaderText: {
      fontSize: 10,
      fontWeight: '600',
      color: themeColors.textSecondary,
      textTransform: 'uppercase',
    },
    fanRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.border + '20',
      height: 65,
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
      width: 55,
      alignItems: 'center',
      flexShrink: 0,
      justifyContent: 'center',
    },
    rankNumber: {
      fontSize: 20,
      fontWeight: '700',
      color: themeColors.text,
      marginBottom: 2,
    },
    topThreeRank: {
      color: '#FFD700',
      fontSize: 24,
      fontWeight: '800',
    },
    positionChange: {
      paddingHorizontal: 5,
      paddingVertical: 1,
      borderRadius: 6,
      minWidth: 35,
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
      fontSize: 11,
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
      width: 55,
      alignItems: 'center',
      position: 'relative',
      flexShrink: 0,
      marginHorizontal: 4,
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: themeColors.background,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: themeColors.border,
    },
    topThreeAvatar: {
      borderColor: '#FFD700',
      borderWidth: 2,
      width: 42,
      height: 42,
      borderRadius: 21,
    },
    avatarEmoji: {
      fontSize: 20,
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
      marginLeft: 10,
      marginRight: 10,
      minWidth: 0, // Allow text truncation
      justifyContent: 'center',
    },
    pointsSection: {
      width: 80,
      alignItems: 'flex-end',
      justifyContent: 'center',
      paddingRight: 16,
    },
    pointsValue: {
      fontSize: 16,
      fontWeight: '700',
      color: themeColors.text,
    },
    pointsLabel: {
      fontSize: 11,
      color: themeColors.textSecondary,
      marginTop: 2,
    },
    username: {
      fontSize: 15,
      fontWeight: '600',
      color: themeColors.text,
      marginBottom: 4,
    },
    currentUserText: {
      color: themeColors.primary,
      fontWeight: '700',
    },
    detailsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 2,
    },
    fanLevelBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 10,
      marginRight: 8,
    },
    fanLevelText: {
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.5,
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
      paddingBottom: 20, // Extra padding at bottom for better scrolling
      paddingTop: 4,
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
            <Text style={styles.title}>Top Fans</Text>
          </View>
          {!fullScreen && (
            <TouchableOpacity
              onPress={() => navigation.navigate('FansLeaderboard', { artistId })}
            >
              <Text style={styles.weekLabel}>See All</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={[styles.chartContainer, maxItems && !fullScreen ? { height: 230 } : {}]}>
        {fans.length > 0 && (
          <View style={styles.chartHeader}>
            <Text style={[styles.chartHeaderText, { width: 55, textAlign: 'left' }]}>Rank</Text>
            <Text style={[styles.chartHeaderText, { width: 55, textAlign: 'center' }]}></Text>
            <Text style={[styles.chartHeaderText, { flex: 1, textAlign: 'left', marginLeft: 10 }]}>Top Fans</Text>
            <Text style={[styles.chartHeaderText, { width: 80, textAlign: 'right', paddingRight: 16 }]}>Points</Text>
          </View>
        )}

            <FlatList
              ref={listRef}
              data={displayedFans}
              renderItem={renderFan}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={true}
              style={styles.scrollableList}
              contentContainerStyle={styles.listContainer}
              nestedScrollEnabled={true}
              scrollEnabled={true}
              bounces={true}
              scrollEventThrottle={16}
              removeClippedSubviews={false}
              initialNumToRender={10}
              maxToRenderPerBatch={10}
              windowSize={10}
              refreshControl={
                <RefreshControl
                  refreshing={loading}
                  onRefresh={handleRefresh}
                  tintColor={themeColors.primary}
                />
              }
              ListEmptyComponent={error ? renderError() : renderEmptyState()}
              getItemLayout={(data, index) => ({
                length: 65,
                offset: 65 * index,
                index,
              })}
              onScrollToIndexFailed={(info) => {
                // Ensure we don't crash if layout isn't computed yet
                const wait = new Promise((resolve) => setTimeout(resolve, 300));
                wait.then(() => {
                  if (!listRef.current) return;
                  const clampedIndex = Math.min(info.index, displayedFans.length - 1);
                  if (clampedIndex >= 0) {
                    listRef.current?.scrollToIndex({ index: clampedIndex, animated: true });
                  }
                });
              }}
            />
      </View>
    </View>
  );
};

export default TopFansLeaderboard;

