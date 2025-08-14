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
      
      // Use mock data for now
      const mockFans: Fan[] = [
        {
          id: '1',
          user_id: 'user-1',
          username: 'SuperFan123',
          avatar_url: '',
          level: 'Diamond',
          points: 15750,
          rank: 1,
          fan_since: '2023-01-15',
          last_week_rank: 2,
          badges: [],
          user: { username: 'SuperFan123', avatar_url: '' },
          avatar: '🎸'
        },
        {
          id: '2',
          user_id: 'user-2',
          username: 'MusicLover99',
          avatar_url: '',
          level: 'Platinum',
          points: 12300,
          rank: 2,
          fan_since: '2023-02-20',
          last_week_rank: 1,
          badges: [],
          user: { username: 'MusicLover99', avatar_url: '' },
          avatar: '🎵'
        },
        {
          id: '3',
          user_id: 'user-3',
          username: 'BeatDropper',
          avatar_url: '',
          level: 'Gold',
          points: 9850,
          rank: 3,
          fan_since: '2023-03-10',
          last_week_rank: 3,
          badges: [],
          user: { username: 'BeatDropper', avatar_url: '' },
          avatar: '🎤'
        },
        {
          id: '4',
          user_id: 'user-4',
          username: 'VibeChaser',
          avatar_url: '',
          level: 'Gold',
          points: 8200,
          rank: 4,
          fan_since: '2023-04-05',
          last_week_rank: 5,
          badges: [],
          user: { username: 'VibeChaser', avatar_url: '' },
          avatar: '🎧'
        },
        {
          id: '5',
          user_id: 'user-5',
          username: 'RhythmRider',
          avatar_url: '',
          level: 'Silver',
          points: 6500,
          rank: 5,
          fan_since: '2023-05-12',
          last_week_rank: 4,
          badges: [],
          user: { username: 'RhythmRider', avatar_url: '' },
          avatar: '🎹'
        },
        {
          id: '6',
          user_id: 'user-6',
          username: 'SoundSeeker',
          avatar_url: '',
          level: 'Silver',
          points: 5200,
          rank: 6,
          fan_since: '2023-06-01',
          last_week_rank: 8,
          badges: [],
          user: { username: 'SoundSeeker', avatar_url: '' },
          avatar: '🎺'
        },
        {
          id: '7',
          user_id: 'user-7',
          username: 'MelodyMaker',
          avatar_url: '',
          level: 'Bronze',
          points: 3800,
          rank: 7,
          fan_since: '2023-07-20',
          last_week_rank: 6,
          badges: [],
          user: { username: 'MelodyMaker', avatar_url: '' },
          avatar: '🥁'
        },
        {
          id: '8',
          user_id: 'user-8',
          username: 'HarmonyHunter',
          avatar_url: '',
          level: 'Bronze',
          points: 2900,
          rank: 8,
          fan_since: '2023-08-15',
          last_week_rank: null,
          badges: [],
          user: { username: 'HarmonyHunter', avatar_url: '' },
          avatar: '🎻'
        },
        {
          id: '9',
          user_id: user?.id || 'user-9',
          username: user?.profile?.username || 'YourUsername',
          avatar_url: '',
          level: 'Bronze',
          points: 2100,
          rank: 9,
          fan_since: '2023-09-01',
          last_week_rank: 10,
          badges: [],
          user: { username: user?.profile?.username || 'YourUsername', avatar_url: '' },
          avatar: '🎶'
        },
        {
          id: '10',
          user_id: 'user-10',
          username: 'TuneTaster',
          avatar_url: '',
          level: 'Bronze',
          points: 1500,
          rank: 10,
          fan_since: '2023-10-05',
          last_week_rank: 9,
          badges: [],
          user: { username: 'TuneTaster', avatar_url: '' },
          avatar: '🎼'
        }
      ];
      
      // Try to get real data, fallback to mock
      if (!artistId) {
        data = [];
      } else {
        try {
          const leaderboardResponse = await databaseService.getArtistLeaderboard(artistId, ITEMS_PER_PAGE);
          if (leaderboardResponse && leaderboardResponse.length > 0) {
            data = leaderboardResponse.map(item => ({
              ...item,
              avatar: '🎵', // Default emoji avatar
              last_week_rank: item.last_week_rank || null
            }));
          } else {
            // Use mock data if no real data available
            data = mockFans;
          }
        } catch (dbError) {
          console.log('Using mock data for leaderboard');
          data = mockFans;
        }
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
      maxHeight: 280, // Show ~4-5 fans at once with scrolling
      overflow: 'hidden',
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
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.border + '30',
      minHeight: 56,
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
      width: 45,
      alignItems: 'center',
      flexShrink: 0,
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
      width: 50,
      alignItems: 'center',
      position: 'relative',
      flexShrink: 0,
    },
    avatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
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
      fontSize: 16,
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
      marginRight: 8,
      minWidth: 0, // Allow text truncation
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
      maxHeight: 240, // Ensure list doesn't overflow
    },
    listContainer: {
      paddingBottom: 4,
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
            nestedScrollEnabled={true}
            scrollEnabled={true}
            refreshControl={
              <RefreshControl
                refreshing={loading}
                onRefresh={handleRefresh}
                tintColor={themeColors.primary}
              />
            }
            ListEmptyComponent={error ? renderError() : renderEmptyState()}
            getItemLayout={(data, index) => ({
              length: 56, // Updated to match minHeight of fanRow
              offset: 56 * index,
              index,
            })}
          />
      </View>
    </View>
  );
};

export default TopFansLeaderboard;

