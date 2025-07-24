import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, colors } from '../../context/ThemeContext';

interface MetricsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  trend?: {
    value: number;
    period: string;
  };
  color?: string;
  onPress?: () => void;
  size?: 'small' | 'medium' | 'large';
}

export default function MetricsCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  color,
  onPress,
  size = 'medium',
}: MetricsCardProps) {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];
  
  const cardColor = color || themeColors.primary;
  
  const formatValue = (val: string | number) => {
    if (typeof val === 'number') {
      if (val >= 1000000) {
        return `${(val / 1000000).toFixed(1)}M`;
      }
      if (val >= 1000) {
        return `${(val / 1000).toFixed(1)}K`;
      }
      return val.toLocaleString();
    }
    return val;
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          container: { padding: 12 },
          icon: 20,
          title: 12,
          value: 18,
          subtitle: 10,
          trend: 10,
        };
      case 'large':
        return {
          container: { padding: 20 },
          icon: 32,
          title: 16,
          value: 28,
          subtitle: 14,
          trend: 12,
        };
      default:
        return {
          container: { padding: 16 },
          icon: 24,
          title: 14,
          value: 24,
          subtitle: 12,
          trend: 11,
        };
    }
  };

  const sizeStyles = getSizeStyles();

  const styles = StyleSheet.create({
    container: {
      backgroundColor: themeColors.surface,
      borderRadius: 16,
      ...sizeStyles.container,
      borderLeftWidth: 4,
      borderLeftColor: cardColor,
    },
    touchable: {
      borderRadius: 16,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 8,
    },
    headerLeft: {
      flex: 1,
    },
    title: {
      fontSize: sizeStyles.title,
      fontWeight: '600',
      color: themeColors.textSecondary,
      marginBottom: 4,
    },
    iconContainer: {
      width: sizeStyles.icon + 12,
      height: sizeStyles.icon + 12,
      borderRadius: (sizeStyles.icon + 12) / 2,
      backgroundColor: `${cardColor}20`,
      justifyContent: 'center',
      alignItems: 'center',
    },
    valueContainer: {
      marginBottom: subtitle || trend ? 8 : 0,
    },
    value: {
      fontSize: sizeStyles.value,
      fontWeight: 'bold',
      color: themeColors.text,
    },
    subtitle: {
      fontSize: sizeStyles.subtitle,
      color: themeColors.textSecondary,
      marginTop: 4,
    },
    trendContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 4,
    },
    trendText: {
      fontSize: sizeStyles.trend,
      fontWeight: '600',
    },
    trendPositive: {
      color: themeColors.success,
    },
    trendNegative: {
      color: themeColors.error,
    },
    trendNeutral: {
      color: themeColors.textSecondary,
    },
    pressable: {
      opacity: 0.8,
    },
  });

  const renderContent = () => (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>{title}</Text>
        </View>
        <View style={styles.iconContainer}>
          <Ionicons name={icon} size={sizeStyles.icon} color={cardColor} />
        </View>
      </View>
      
      <View style={styles.valueContainer}>
        <Text style={styles.value}>{formatValue(value)}</Text>
        {subtitle && (
          <Text style={styles.subtitle}>{subtitle}</Text>
        )}
      </View>
      
      {trend && (
        <View style={styles.trendContainer}>
          <Ionicons
            name={
              trend.value > 0 
                ? 'trending-up' 
                : trend.value < 0 
                ? 'trending-down' 
                : 'remove'
            }
            size={sizeStyles.trend}
            color={
              trend.value > 0 
                ? themeColors.success 
                : trend.value < 0 
                ? themeColors.error 
                : themeColors.textSecondary
            }
          />
          <Text style={[
            styles.trendText,
            trend.value > 0 
              ? styles.trendPositive 
              : trend.value < 0 
              ? styles.trendNegative 
              : styles.trendNeutral
          ]}>
            {trend.value > 0 ? '+' : ''}{trend.value.toFixed(1)}% {trend.period}
          </Text>
        </View>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        style={styles.touchable}
        onPress={onPress}
        activeOpacity={0.8}
      >
        {renderContent()}
      </TouchableOpacity>
    );
  }

  return renderContent();
}