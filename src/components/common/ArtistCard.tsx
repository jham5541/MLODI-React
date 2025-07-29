import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, colors } from '../../context/ThemeContext';
import { Artist } from '../../types/music';
import { formatNumber } from '../../utils/uiHelpers';

interface ArtistCardProps {
  artist: Artist;
  onPress?: () => void;
}

export default function ArtistCard({ artist, onPress }: ArtistCardProps) {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];

  const styles = StyleSheet.create({
    container: {
      alignItems: 'center',
      padding: 12,
      backgroundColor: themeColors.surface,
      borderRadius: 12,
      marginRight: 12,
      width: 140,
      shadowColor: themeColors.text,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    image: {
      width: 70,
      height: 70,
      borderRadius: 35,
      marginBottom: 10,
    },
    nameContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
    },
    name: {
      fontSize: 13,
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
        {formatNumber(artist.followers)} followers
      </Text>
    </TouchableOpacity>
  );
}