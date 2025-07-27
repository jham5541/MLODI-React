import React from 'react';
import { View, Text, StyleSheet, ImageBackground } from 'react-native';
import { useTheme, colors } from '../../context/ThemeContext';
import Ionicons from '@expo/vector-icons/Ionicons';

interface TrendingHeroProps {
  title: string;
  imageUri: string;
}

export default function TrendingHero({ title, imageUri }: TrendingHeroProps) {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];

  const styles = StyleSheet.create({
    container: {
      height: 200,
      marginBottom: 16,
      borderRadius: 12,
      overflow: 'hidden',
    },
    image: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 16,
    },
    overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: 'white',
    },
    icon: {
      position: 'absolute',
      top: 16,
      right: 16,
    },
  });

  return (
    <View style={styles.container}>
      <ImageBackground source={{ uri: imageUri }} style={styles.image}>
        <View style={styles.overlay} />
        <Text style={styles.title}>{title}</Text>
        <View style={styles.icon}>
          <Ionicons name="trending-up" size={24} color="white" />
        </View>
      </ImageBackground>
    </View>
  );
}
