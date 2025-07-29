import './src/polyfills';
import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { SearchProvider } from './src/context/SearchContext';
import { PlayProvider, usePlay } from './src/context/PlayContext';
import { PlayTrackingProvider } from './src/context/PlayTrackingContext';
import { RadioProvider } from './src/context/RadioContext';
import AppNavigator from './src/navigation/AppNavigator';
import { useAuthStore } from './src/store/authStore';
import PlayBar from './src/components/PlayBar';

function PlayBarWrapper() {
  const {
    currentSong,
    isPlaying,
    isPlayBarVisible,
    togglePlayPause,
    nextSong,
    previousSong,
    closePlayBar,
    expandPlayBar,
  } = usePlay();

  return (
    <PlayBar
      currentSong={currentSong}
      isPlaying={isPlaying}
      isVisible={isPlayBarVisible}
      onPlayPause={togglePlayPause}
      onNext={nextSong}
      onPrevious={previousSong}
      onClose={closePlayBar}
      onExpand={expandPlayBar}
    />
  );
}

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
        <PlayBarWrapper />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <PlayProvider>
        <PlayTrackingProvider>
          <RadioProvider>
            <SearchProvider>
              <AppContent />
            </SearchProvider>
          </RadioProvider>
        </PlayTrackingProvider>
      </PlayProvider>
    </ThemeProvider>
  );
}
