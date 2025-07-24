import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme, colors } from '../context/ThemeContext';

export default function DiscoverScreen() {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeColors.background,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 16,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: themeColors.text,
      marginBottom: 16,
    },
    subtitle: {
      fontSize: 16,
      color: themeColors.textSecondary,
      textAlign: 'center',
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Discover Music</Text>
      <Text style={styles.subtitle}>Find new artists and tracks to explore</Text>
    </View>
  );
}