import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import AppNavigator from './src/navigation/AppNavigator';

function AppContent() {
  const { activeTheme } = useTheme();

  return (
    <SafeAreaProvider>
      <StatusBar style={activeTheme === 'dark' ? 'light' : 'dark'} />
      <AppNavigator />
    </SafeAreaProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
