import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, colors } from '../../context/ThemeContext';
import { Artist } from '../../types/music';
import { formatNumber } from '../../utils/uiHelpers';

interface Top10ArtistCardProps {
  artist: Artist;
  rank: number;
  onPress?: () => void;
}

export default function Top10ArtistCard({ artist, rank, onPress }: Top10ArtistCardProps) {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];

  const getRankColor = (rank: number) => {
    if (rank === 1) return '#FFD700'; // Gold
    if (rank === 2) return '#C0C0C0'; // Silver
    if (rank === 3) return '#CD7F32'; // Bronze
    return themeColors.primary;
  };

  const getRankBadgeStyle = (rank: number) => {
    if (rank <= 3) {
      return {
        backgroundColor: getRankColor(rank),
        borderColor: getRankColor(rank),
      };
    }
    return {
      backgroundColor: themeColors.primary,
      borderColor: themeColors.primary,
    };
  };

  const styles = StyleSheet.create({
    container: {
      alignItems: 'center',
      padding: 16,
      backgroundColor: themeColors.surface,
      borderRadius: 16,
      marginRight: 16,
      width: 160,
      shadowColor: themeColors.text,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
      borderWidth: rank <= 3 ? 2 : 1,
      borderColor: rank <= 3 ? getRankColor(rank) : themeColors.border,
    },
    rankBadge: {
      position: 'absolute',
      top: -8,
      left: -8,
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1,
      ...getRankBadgeStyle(rank),
    },
    rankText: {
      fontSize: 14,
      fontWeight: 'bold',
      color: rank <= 3 ? '#000' : '#fff',
    },
    imageContainer: {
      position: 'relative',
      marginBottom: 12,
    },
    image: {
      width: 80,
      height: 80,
      borderRadius: 40,
      borderWidth: rank <= 3 ? 3 : 2,
      borderColor: rank <= 3 ? getRankColor(rank) : themeColors.primary,
    },
    crownIcon: {
      position: 'absolute',
      top: -8,
      right: -8,
      backgroundColor: themeColors.surface,
      borderRadius: 12,
      padding: 2,
    },
    nameContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 6,
      maxWidth: '100%',
    },
    name: {
      fontSize: 14,
      fontWeight: 'bold',
      color: themeColors.text,
      textAlign: 'center',
      flex: 1,
    },
    verifiedIcon: {
      marginLeft: 4,
    },
    genre: {
      fontSize: 12,
      color: themeColors.textSecondary,
      textAlign: 'center',
      marginBottom: 6,
    },
    stats: {
      alignItems: 'center',
    },
    followers: {
      fontSize: 12,
      color: themeColors.textSecondary,
      textAlign: 'center',
      marginBottom: 2,
    },
    trendingIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 4,
    },
    trendingText: {
      fontSize: 11,
      color: '#00C851',
      fontWeight: '600',
      marginLeft: 2,
    },
  });

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.rankBadge}>
        <Text style={styles.rankText}>#{rank}</Text>
      </View>
      
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: artist.coverUrl }}
          style={styles.image}
          defaultSource={{ uri: 'https://via.placeholder.com/80x80?text=♪' }}
        />
        {rank === 1 && (
          <View style={styles.crownIcon}>
            <Ionicons name="trophy" size={20} color="#FFD700" />
          </View>
        )}
      </View>
      
      <View style={styles.nameContainer}>
        <Text style={styles.name} numberOfLines={1}>
          {artist.name}
        </Text>
        {artist.isVerified && (
          <Ionicons
            name="checkmark-circle"
            size={16}
            color={themeColors.primary}
            style={styles.verifiedIcon}
          />
        )}
      </View>
      
      <Text style={styles.genre} numberOfLines={1}>
        {artist.genres[0]}
      </Text>
      
      <View style={styles.stats}>
        <Text style={styles.followers}>
          {formatNumber(artist.followers)} followers
        </Text>
        
        <View style={styles.trendingIndicator}>
          <Ionicons name="trending-up" size={12} color="#00C851" />
          <Text style={styles.trendingText}>Trending</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
