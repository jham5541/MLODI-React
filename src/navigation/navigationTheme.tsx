import { DefaultTheme, DarkTheme, Theme } from '@react-navigation/native';
import { colors } from '../context/ThemeContext';

// Define font styles that React Navigation expects
const fontStyles = {
  regular: {
    fontFamily: 'System',
    fontWeight: 'normal' as const,
  },
  medium: {
    fontFamily: 'System',
    fontWeight: '500' as const,
  },
  bold: {
    fontFamily: 'System',
    fontWeight: 'bold' as const,
  },
  heavy: {
    fontFamily: 'System',
    fontWeight: '900' as const,
  },
};

export const lightNavigationTheme: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.light.primary,
    background: colors.light.background,
    card: colors.light.surface,
    text: colors.light.text,
    border: colors.light.border,
    notification: colors.light.accent,
  },
  fonts: fontStyles,
};

export const darkNavigationTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: colors.dark.primary,
    background: colors.dark.background,
    card: colors.dark.surface,
    text: colors.dark.text,
    border: colors.dark.border,
    notification: colors.dark.accent,
  },
  fonts: fontStyles,
};