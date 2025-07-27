import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Common UI utility functions and components to reduce boilerplate

export interface ThemeColors {
  background: string;
  surface: string;
  primary: string;
  secondary: string;
  text: string;
  textSecondary: string;
  border: string;
  error: string;
  success: string;
  warning: string;
}

// Common style generators
export const createCommonStyles = (themeColors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: themeColors.background,
  },
  content: {
    padding: 16,
  },
  surface: {
    backgroundColor: themeColors.surface,
    borderRadius: 12,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: themeColors.text,
  },
  subtitle: {
    fontSize: 18,
    color: themeColors.textSecondary,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: themeColors.text,
    marginBottom: 12,
    marginTop: 24,
  },
  button: {
    backgroundColor: themeColors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  horizontalList: {
    paddingLeft: 16,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: themeColors.textSecondary,
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 24,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginLeft: 12,
    color: themeColors.textSecondary,
    fontSize: 16,
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: themeColors.error + '20',
    borderRadius: 8,
    margin: 16,
  },
  errorText: {
    color: themeColors.error,
    textAlign: 'center',
    marginBottom: 12,
    fontSize: 16,
  },
});

// Common UI Components
interface LoadingStateProps {
  text?: string;
  themeColors: ThemeColors;
  size?: 'small' | 'large';
  iconName?: keyof typeof Ionicons.glyphMap;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ 
  text = 'Loading...', 
  themeColors, 
  size = 'small',
  iconName = 'musical-note'
}) => {
  const commonStyles = createCommonStyles(themeColors);
  
  return (
    <View style={commonStyles.loadingContainer}>
      {iconName ? (
        <Ionicons name={iconName} size={size === 'large' ? 32 : 24} color={themeColors.primary} />
      ) : (
        <ActivityIndicator size={size} color={themeColors.primary} />
      )}
      <Text style={commonStyles.loadingText}>{text}</Text>
    </View>
  );
};

interface EmptyStateProps {
  title: string;
  subtitle?: string;
  themeColors: ThemeColors;
  iconName?: keyof typeof Ionicons.glyphMap;
  iconSize?: number;
  onActionPress?: () => void;
  actionText?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  subtitle,
  themeColors,
  iconName = 'library-outline',
  iconSize = 64,
  onActionPress,
  actionText
}) => {
  const commonStyles = createCommonStyles(themeColors);
  
  return (
    <View style={commonStyles.emptyState}>
      <Ionicons
        name={iconName}
        size={iconSize}
        color={themeColors.textSecondary}
        style={{ marginBottom: 16 }}
      />
      <Text style={[commonStyles.emptyText, { fontSize: 20, fontWeight: '600', marginBottom: 8 }]}>
        {title}
      </Text>
      {subtitle && (
        <Text style={commonStyles.emptyText}>
          {subtitle}
        </Text>
      )}
      {onActionPress && actionText && (
        <TouchableOpacity 
          style={[commonStyles.button, { marginTop: 20 }]} 
          onPress={onActionPress}
        >
          <Text style={commonStyles.buttonText}>{actionText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

interface ErrorStateProps {
  error: any;
  onRetry: () => void;
  title?: string;
  themeColors: ThemeColors;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ 
  error, 
  onRetry, 
  title = 'Something went wrong',
  themeColors 
}) => {
  const commonStyles = createCommonStyles(themeColors);
  
  return (
    <View style={commonStyles.errorContainer}>
      <Ionicons name="alert-circle" size={48} color={themeColors.error} style={{ marginBottom: 16 }} />
      <Text style={commonStyles.errorText}>{title}</Text>
      <TouchableOpacity style={commonStyles.button} onPress={onRetry}>
        <Text style={commonStyles.buttonText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );
};

// Utility functions
export const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
};

export const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// Higher-order component for consistent theming
export const withThemeStyles = <P extends object>(
  Component: React.ComponentType<P>,
  getStyles: (themeColors: ThemeColors) => any
) => {
  return React.forwardRef<any, P & { themeColors: ThemeColors }>((props, ref) => {
    const { themeColors, ...rest } = props;
    const styles = getStyles(themeColors);
    
    return <Component ref={ref} {...(rest as P)} styles={styles} />;
  });
};
