import './src/patches/navigationPatches';
import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { initializeApp } from './src/utils/supabaseInit';
import { Platform } from 'react-native';
import { enableScreens } from 'react-native-screens';

// Global CSS for web to stabilize scrolling
if (typeof window !== 'undefined' && Platform.OS === 'web') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require('./src/web.css');
}

import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { SearchProvider } from './src/context/SearchContext';
import { AuthProvider } from './src/context/AuthContext';
import { PlayProvider, usePlay } from './src/context/PlayContext';
import { PlayTrackingProvider } from './src/context/PlayTrackingContext';
import { RadioProvider } from './src/context/RadioContext';
import AppNavigator from './src/navigation/AppNavigator';
import { useAuthStore } from './src/store/authStore';
import { PointsNotification } from './src/components/notifications/PointsNotification';

// Disable react-native-screens on web to avoid scroll glitches with nested navigators
if (Platform.OS === 'web') {
  try {
    enableScreens(false);
  } catch {}
}

function AppContent() {
  const { activeTheme } = useTheme();
  const { checkSession } = useAuthStore();

  useEffect(() => {
    // Initialize app and database
    const init = async () => {
      await initializeApp();
      await checkSession();
    };
    init();
  }, [checkSession]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style={activeTheme === 'dark' ? 'light' : 'dark'} />
        <AppNavigator />
        <PointsNotification />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <PlayProvider>
          <PlayTrackingProvider>
            <RadioProvider>
              <SearchProvider>
                <AppContent />
              </SearchProvider>
            </RadioProvider>
          </PlayTrackingProvider>
        </PlayProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
