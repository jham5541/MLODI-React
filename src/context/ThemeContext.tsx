import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Theme = 'light' | 'dark' | 'auto';

interface ThemeContextType {
  theme: Theme;
  activeTheme: 'light' | 'dark';
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  colors: typeof colors['light'] | typeof colors['dark'];
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('auto');
  const systemColorScheme = useColorScheme();
  
  const activeTheme = theme === 'auto' 
    ? (systemColorScheme || 'dark') as 'light' | 'dark'
    : theme as 'light' | 'dark';

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('theme');
      if (savedTheme && ['light', 'dark', 'auto'].includes(savedTheme)) {
        setThemeState(savedTheme as Theme);
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    }
  };

  const setTheme = async (newTheme: Theme) => {
    try {
      setThemeState(newTheme);
      await AsyncStorage.setItem('theme', newTheme);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const toggleTheme = () => {
    const nextTheme = activeTheme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, activeTheme, toggleTheme, setTheme, colors: colors[activeTheme] }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Theme colors matching modern music platform aesthetic
export const colors = {
  light: {
    background: '#ffffff',
    surface: '#f8fafc',
    surfaceElevated: '#ffffff',
    primary: '#8b5cf6', // Purple accent
    primaryLight: '#a78bfa',
    secondary: '#06b6d4', // Cyan accent
    accent: '#f59e0b', // Gold/yellow accent
    text: '#0f172a',
    textSecondary: '#475569',
    textMuted: '#94a3b8',
    border: '#e2e8f0',
    borderLight: '#f1f5f9',
    error: '#ef4444',
    success: '#10b981',
    warning: '#f59e0b',
    info: '#06b6d4',
    // Music-specific colors
    playButton: '#8b5cf6',
    waveform: '#a78bfa',
    albumArt: '#f1f5f9',
  },
  dark: {
    background: '#0a0a0a', // Deep black
    surface: '#111111',
    surfaceElevated: '#1a1a1a',
    primary: '#a78bfa', // Brighter purple for dark mode
    primaryLight: '#c4b5fd',
    secondary: '#22d3ee', // Brighter cyan
    accent: '#fbbf24', // Brighter gold
    text: '#ffffff',
    textSecondary: '#e2e8f0',
    textMuted: '#94a3b8',
    border: '#27272a',
    borderLight: '#3f3f46',
    error: '#f87171',
    success: '#34d399',
    warning: '#fbbf24',
    info: '#22d3ee',
    // Music-specific colors
    playButton: '#a78bfa',
    waveform: '#8b5cf6',
    albumArt: '#27272a',
  },
};
