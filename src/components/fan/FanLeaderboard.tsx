import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, colors } from '../../context/ThemeContext';
import { useFanLeaderboard } from '../../hooks/useFanScoring';
import { FanLeaderboard as FanLeaderboardType, LeaderboardType, FanBadge } from '../../types/fanScoring';

interface FanLeaderboardProps {
  artistId: string;
  currentUserId?: string;
  onUserPress?: (userId: string) => void;
}

export default function FanLeaderboard({ artistId, currentUserId, onUserPress }: FanLeaderboardProps) {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];
  const [selectedType, setSelectedType] = useState<LeaderboardType>(LeaderboardType.ALL_TIME);
  
  const { leaderboard, loading, error, refetch } = useFanLeaderboard(artistId, selectedType);

  const leaderboardTabs = [
    { type: LeaderboardType.ALL_TIME, label: 'All Time' },
    { type: LeaderboardType.MONTHLY, label: 'Monthly' },
    { type: LeaderboardType.WEEKLY, label: 'Weekly' },
    { type: LeaderboardType.SUPERFANS, label: 'Superfans' },
  ];

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return `#${rank}`;
    }
  };

  const getBadgeColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary':
        return '#FFD700';
      case 'epic':
        return '#B9F2FF';
      case 'rare':
        return '#E5E4E2';
      case 'common':
        return '#CD7F32';
      default:
        return themeColors.textSecondary;
    }
  };

  const renderBadge = (badge: FanBadge) => (
    <View
      key={badge.id}
      style={[
        styles.badge,
        { borderColor: getBadgeColor(badge.rarity) }
      ]}
    >
      <Text style={styles.badgeIcon}>{badge.icon}</Text>
    </View>
  );

  const renderLeaderboardItem = ({ item, index }: { item: FanLeaderboardType; index: number }) => {
    const isCurrentUser = item.userId === currentUserId;
    
    return (
      <TouchableOpacity
        style={[
          styles.leaderboardItem,
          {
            backgroundColor: isCurrentUser 
              ? themeColors.primary + '20' 
              : themeColors.surface,
            borderColor: isCurrentUser 
              ? themeColors.primary 
              : themeColors.border,
          }
        ]}
        onPress={() => onUserPress?.(item.userId)}
      >
        <View style={styles.rankContainer}>
          <Text style={[
            styles.rankText,
            item.rank <= 3 ? styles.topRankText : { color: themeColors.textSecondary }
          ]}>
            {getRankIcon(item.rank)}
          </Text>
        </View>

        <Image
          source={{ uri: item.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.userId}` }}
          style={styles.profileImage}
        />

        <View style={styles.userInfo}>
          <Text style={[styles.username, { color: themeColors.text }]} numberOfLines={1}>
            {item.username}
          </Text>
          <View style={styles.scoreContainer}>
            <Text style={[styles.fanScore, { color: themeColors.primary }]}>
              {item.fanScore.toLocaleString()} pts
            </Text>
            <Text style={[styles.percentile, { color: themeColors.textSecondary }]}>
              Top {100 - item.percentile}%
            </Text>
          </View>
        </View>

        <View style={styles.badgesContainer}>
          {item.badges.slice(0, 2).map(renderBadge)}
          {item.badges.length > 2 && (
            <Text style={[styles.moreBadges, { color: themeColors.textSecondary }]}>
              +{item.badges.length - 2}
            </Text>
          )}
        </View>

        {isCurrentUser && (
          <View style={[styles.currentUserIndicator, { backgroundColor: themeColors.primary }]}>
            <Ionicons name="person" size={12} color="white" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="trophy-outline" size={64} color={themeColors.textSecondary} />
      <Text style={[styles.emptyTitle, { color: themeColors.text }]}>
        No Fans Yet
      </Text>
      <Text style={[styles.emptySubtitle, { color: themeColors.textSecondary }]}>
        Be the first to engage with this artist!
      </Text>
    </View>
  );

  const renderError = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="warning-outline" size={64} color={themeColors.error} />
      <Text style={[styles.emptyTitle, { color: themeColors.error }]}>
        Failed to Load
      </Text>
      <TouchableOpacity 
        style={[styles.retryButton, { backgroundColor: themeColors.primary }]}
        onPress={refetch}
      >
        <Text style={styles.retryButtonText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeColors.background,
    },
    header: {
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.border,
    },
    title: {
      fontSize: 24,
      fontWeight: '700',
      color: themeColors.text,
      marginBottom: 16,
    },
    tabsContainer: {
      flexDirection: 'row',
      backgroundColor: themeColors.surface,
      borderRadius: 12,
      padding: 4,
    },
    tab: {
      flex: 1,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 8,
      alignItems: 'center',
    },
    activeTab: {
      backgroundColor: themeColors.primary,
    },
    tabText: {
      fontSize: 12,
      fontWeight: '600',
      color: themeColors.textSecondary,
    },
    activeTabText: {
      color: 'white',
    },
    leaderboardContainer: {
      flex: 1,
    },
    leaderboardItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      marginHorizontal: 20,
      marginVertical: 6,
      borderRadius: 16,
      borderWidth: 1,
      position: 'relative',
    },
    rankContainer: {
      width: 40,
      alignItems: 'center',
    },
    rankText: {
      fontSize: 16,
      fontWeight: '700',
    },
    topRankText: {
      fontSize: 20,
    },
    profileImage: {
      width: 48,
      height: 48,
      borderRadius: 24,
      marginLeft: 12,
    },
    userInfo: {
      flex: 1,
      marginLeft: 12,
    },
    username: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 4,
    },
    scoreContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    fanScore: {
      fontSize: 14,
      fontWeight: '700',
    },
    percentile: {
      fontSize: 12,
      fontWeight: '500',
    },
    badgesContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    badge: {
      width: 28,
      height: 28,
      borderRadius: 14,
      borderWidth: 2,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
    },
    badgeIcon: {
      fontSize: 14,
    },
    moreBadges: {
      fontSize: 12,
      fontWeight: '600',
      marginLeft: 4,
    },
    currentUserIndicator: {
      position: 'absolute',
      top: 8,
      right: 8,
      width: 20,
      height: 20,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 40,
    },
    emptyTitle: {
      fontSize: 20,
      fontWeight: '700',
      marginTop: 16,
      marginBottom: 8,
    },
    emptySubtitle: {
      fontSize: 14,
      textAlign: 'center',
      lineHeight: 20,
    },
    retryButton: {
      marginTop: 16,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
    },
    retryButtonText: {
      color: 'white',
      fontSize: 14,
      fontWeight: '600',
    },
    loadingContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });

  if (loading && leaderboard.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Top Fans</Text>
          <View style={styles.tabsContainer}>
            {leaderboardTabs.map((tab) => (
              <TouchableOpacity
                key={tab.type}
                style={[
                  styles.tab,
                  selectedType === tab.type && styles.activeTab,
                ]}
                onPress={() => setSelectedType(tab.type)}
              >
                <Text style={[
                  styles.tabText,
                  selectedType === tab.type && styles.activeTabText,
                ]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={themeColors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Top Fans</Text>
        <View style={styles.tabsContainer}>
          {leaderboardTabs.map((tab) => (
            <TouchableOpacity
              key={tab.type}
              style={[
                styles.tab,
                selectedType === tab.type && styles.activeTab,
              ]}
              onPress={() => setSelectedType(tab.type)}
            >
              <Text style={[
                styles.tabText,
                selectedType === tab.type && styles.activeTabText,
              ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.leaderboardContainer}>
        {error ? (
          renderError()
        ) : leaderboard.length === 0 ? (
          renderEmptyState()
        ) : (
          <FlatList
            data={leaderboard}
            renderItem={renderLeaderboardItem}
            keyExtractor={(item) => `${item.userId}-${item.artistId}`}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={loading}
                onRefresh={refetch}
                tintColor={themeColors.primary}
              />
            }
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        )}
      </View>
    </View>
  );
}
