import './src/polyfills';
import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { SearchProvider } from './src/context/SearchContext';
import { Web3Provider } from './src/context/Web3Context';
import { Web3ErrorBoundary } from './src/components/common/Web3ErrorBoundary';
import AppNavigator from './src/navigation/AppNavigator';
import { useAuthStore } from './src/store/authStore';
import Player from './src/components/audio/Player';
import SearchModal from './src/components/search/SearchModal';

function AppContent() {
  const { activeTheme } = useTheme();
  const { checkSession } = useAuthStore();

  useEffect(() => {
    // Initialize auth state on app load
    checkSession();
  }, [checkSession]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style={activeTheme === 'dark' ? 'light' : 'dark'} />
        <AppNavigator />
        <SearchModal />
        <Player />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <Web3ErrorBoundary>
        <Web3Provider>
          <SearchProvider>
            <AppContent />
          </SearchProvider>
        </Web3Provider>
      </Web3ErrorBoundary>
    </ThemeProvider>
  );
}
