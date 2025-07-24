import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme, colors } from '../context/ThemeContext';

export default function ArtistsScreen() {
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
      <Text style={styles.title}>Artists</Text>
      <Text style={styles.subtitle}>Discover and follow your favorite artists</Text>
    </View>
  );
}