import { StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../context/ThemeContext';

interface ContainerStyles {
  container: ViewStyle;
  sectionContainer: ViewStyle;
}

/**
 * Common container styles for all artist profile sections
 * This ensures consistent styling across all components
 */
export const getCommonContainerStyle = (themeColors: typeof colors[keyof typeof colors]): ContainerStyles => {
  return {
    // Base container style used by all sections
    container: {
      backgroundColor: themeColors.surface,
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
      marginHorizontal: 16,
      borderWidth: 1,
      borderColor: themeColors.border,
      // Add subtle shadow for depth
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 3,
    },
    // Alternative style for sections that need different spacing
    sectionContainer: {
      backgroundColor: themeColors.surface,
      borderRadius: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: themeColors.border,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 3,
    }
  };
};

/**
 * Common title styles for section headers
 */
export const getCommonTitleStyle = (themeColors: typeof colors[keyof typeof colors]) => {
  return {
    sectionTitle: {
      fontSize: 20,
      fontWeight: '800' as const,
      color: themeColors.text,
      marginBottom: 16,
    },
    sectionSubtitle: {
      fontSize: 14,
      color: themeColors.textSecondary,
      marginBottom: 4,
    }
  };
};
