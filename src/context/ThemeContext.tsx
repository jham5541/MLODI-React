import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Theme = 'light' | 'dark' | 'auto';

interface ThemeContextType {
  theme: Theme;
  activeTheme: 'light' | 'dark';
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
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
    <ThemeContext.Provider value={{ theme, activeTheme, toggleTheme, setTheme }}>
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

// Theme colors for React Native
export const colors = {
  light: {
    background: '#ffffff',
    surface: '#f8f9fa',
    primary: '#6366f1',
    secondary: '#64748b',
    text: '#1e293b',
    textSecondary: '#64748b',
    border: '#e2e8f0',
    error: '#ef4444',
    success: '#10b981',
    warning: '#f59e0b',
  },
  dark: {
    background: '#0f172a',
    surface: '#1e293b',
    primary: '#818cf8',
    secondary: '#94a3b8',
    text: '#f1f5f9',
    textSecondary: '#94a3b8',
    border: '#334155',
    error: '#f87171',
    success: '#34d399',
    warning: '#fbbf24',
  },
};