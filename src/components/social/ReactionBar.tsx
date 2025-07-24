import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, colors } from '../../context/ThemeContext';
import { useAuthStore } from '../../store/authStore';

interface Reaction {
  type: 'like' | 'love' | 'fire' | 'wow' | 'sad' | 'angry';
  count: number;
  isActive: boolean;
}

interface ReactionBarProps {
  reactions: Reaction[];
  onReaction: (type: Reaction['type']) => void;
  showLabels?: boolean;
  size?: 'small' | 'medium' | 'large';
  orientation?: 'horizontal' | 'vertical';
}

const reactionConfig = {
  like: { icon: 'thumbs-up', activeIcon: 'thumbs-up', color: '#3b82f6', label: 'Like' },
  love: { icon: 'heart-outline', activeIcon: 'heart', color: '#ef4444', label: 'Love' },
  fire: { icon: 'flame-outline', activeIcon: 'flame', color: '#f97316', label: 'Fire' },
  wow: { icon: 'happy-outline', activeIcon: 'happy', color: '#eab308', label: 'Wow' },
  sad: { icon: 'sad-outline', activeIcon: 'sad', color: '#6366f1', label: 'Sad' },
  angry: { icon: 'ios-sad-outline', activeIcon: 'ios-sad', color: '#dc2626', label: 'Angry' },
};

export default function ReactionBar({
  reactions,
  onReaction,
  showLabels = false,
  size = 'medium',
  orientation = 'horizontal',
}: ReactionBarProps) {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];
  const { isConnected } = useAuthStore();
  const [animatedValues] = useState(() => 
    reactions.reduce((acc, reaction) => {
      acc[reaction.type] = new Animated.Value(1);
      return acc;
    }, {} as Record<Reaction['type'], Animated.Value>)
  );

  const iconSizes = {
    small: 16,
    medium: 20,
    large: 24,
  };

  const handleReaction = (type: Reaction['type']) => {
    if (!isConnected) {
      Alert.alert('Authentication Required', 'Please connect your wallet to react');
      return;
    }

    // Animate the reaction
    const animatedValue = animatedValues[type];
    if (animatedValue) {
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1.3,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
    }

    onReaction(type);
  };

  const getTotalReactions = () => {
    return reactions.reduce((total, reaction) => total + reaction.count, 0);
  };

  const getMostPopularReaction = () => {
    return reactions.reduce((max, reaction) => 
      reaction.count > max.count ? reaction : max
    );
  };

  const renderReaction = (reaction: Reaction) => {
    const config = reactionConfig[reaction.type];
    const iconName = reaction.isActive ? config.activeIcon : config.icon;
    const iconColor = reaction.isActive ? config.color : themeColors.textSecondary;
    const textColor = reaction.isActive ? config.color : themeColors.textSecondary;

    return (
      <Animated.View
        key={reaction.type}
        style={[
          styles.reactionButton,
          orientation === 'vertical' && styles.verticalReactionButton,
          { transform: [{ scale: animatedValues[reaction.type] || 1 }] }
        ]}
      >
        <TouchableOpacity
          style={[
            styles.reactionTouchable,
            reaction.isActive && styles.activeReaction,
          ]}
          onPress={() => handleReaction(reaction.type)}
          activeOpacity={0.7}
        >
          <Ionicons
            name={iconName as any}
            size={iconSizes[size]}
            color={iconColor}
          />
          {reaction.count > 0 && (
            <Text style={[styles.reactionCount, { color: textColor }]}>
              {reaction.count > 999 ? `${Math.floor(reaction.count / 1000)}k` : reaction.count}
            </Text>
          )}
          {showLabels && (
            <Text style={[styles.reactionLabel, { color: textColor }]}>
              {config.label}
            </Text>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const styles = StyleSheet.create({
    container: {
      flexDirection: orientation === 'horizontal' ? 'row' : 'column',
      alignItems: orientation === 'horizontal' ? 'center' : 'flex-start',
      gap: 8,
    },
    reactionButton: {
      alignItems: 'center',
    },
    verticalReactionButton: {
      width: '100%',
    },
    reactionTouchable: {
      flexDirection: orientation === 'horizontal' ? 'row' : 'column',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 20,
      gap: 4,
      minWidth: 48,
      backgroundColor: 'transparent',
    },
    activeReaction: {
      backgroundColor: `${themeColors.primary}15`,
    },
    reactionCount: {
      fontSize: size === 'small' ? 11 : size === 'medium' ? 12 : 14,
      fontWeight: '600',
    },
    reactionLabel: {
      fontSize: size === 'small' ? 10 : size === 'medium' ? 11 : 12,
      fontWeight: '500',
    },
    summary: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingVertical: 4,
    },
    summaryText: {
      fontSize: 12,
      color: themeColors.textSecondary,
    },
    summaryIcon: {
      marginRight: 2,
    },
    popularReactionContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: themeColors.surface,
      borderRadius: 16,
      paddingHorizontal: 8,
      paddingVertical: 4,
      gap: 4,
    },
    popularReactionText: {
      fontSize: 11,
      fontWeight: '600',
    },
  });

  // Show summary if there are many reactions
  const totalReactions = getTotalReactions();
  const mostPopular = getMostPopularReaction();
  const shouldShowSummary = totalReactions > 100 && !showLabels;

  if (shouldShowSummary) {
    const config = reactionConfig[mostPopular.type];
    return (
      <View style={styles.container}>
        <TouchableOpacity style={styles.popularReactionContainer}>
          <Ionicons
            name={config.activeIcon as any}
            size={iconSizes[size]}
            color={config.color}
            style={styles.summaryIcon}
          />
          <Text style={[styles.popularReactionText, { color: config.color }]}>
            {totalReactions > 999 ? `${Math.floor(totalReactions / 1000)}k` : totalReactions}
          </Text>
        </TouchableOpacity>
        
        <View style={styles.summary}>
          <Text style={styles.summaryText}>
            {mostPopular.count} {config.label.toLowerCase()}s
            {totalReactions > mostPopular.count && ` and ${totalReactions - mostPopular.count} others`}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {reactions.map(renderReaction)}
    </View>
  );
}