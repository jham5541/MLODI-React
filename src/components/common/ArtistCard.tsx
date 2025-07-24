import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, colors } from '../../context/ThemeContext';
import { Artist } from '../../types/music';

interface ArtistCardProps {
  artist: Artist;
  onPress?: () => void;
}

export default function ArtistCard({ artist, onPress }: ArtistCardProps) {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];

  const formatFollowers = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  const styles = StyleSheet.create({
    container: {
      alignItems: 'center',
      padding: 16,
      backgroundColor: themeColors.surface,
      borderRadius: 12,
      marginRight: 12,
      width: 140,
    },
    image: {
      width: 80,
      height: 80,
      borderRadius: 40,
      marginBottom: 12,
    },
    nameContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
    },
    name: {
      fontSize: 14,
      fontWeight: '600',
      color: themeColors.text,
      textAlign: 'center',
    },
    verifiedIcon: {
      marginLeft: 4,
    },
    genre: {
      fontSize: 12,
      color: themeColors.textSecondary,
      textAlign: 'center',
      marginBottom: 8,
    },
    followers: {
      fontSize: 12,
      color: themeColors.textSecondary,
      textAlign: 'center',
    },
  });

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <Image
        source={{ uri: artist.coverUrl }}
        style={styles.image}
        defaultSource={{ uri: 'https://via.placeholder.com/80x80?text=♪' }}
      />
      
      <View style={styles.nameContainer}>
        <Text style={styles.name} numberOfLines={1}>
          {artist.name}
        </Text>
        {artist.isVerified && (
          <Ionicons
            name="checkmark-circle"
            size={14}
            color={themeColors.primary}
            style={styles.verifiedIcon}
          />
        )}
      </View>
      
      <Text style={styles.genre} numberOfLines={1}>
        {artist.genres[0]}
      </Text>
      
      <Text style={styles.followers}>
        {formatFollowers(artist.followers)} followers
      </Text>
    </TouchableOpacity>
  );
}