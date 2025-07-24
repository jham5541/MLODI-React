import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { useTheme, colors } from '../context/ThemeContext';
import { RootStackParamList } from '../navigation/AppNavigator';

type ArtistProfileRouteProp = RouteProp<RootStackParamList, 'ArtistProfile'>;

interface Props {
  route: ArtistProfileRouteProp;
}

export default function ArtistProfileScreen({ route }: Props) {
  const { artistId } = route.params;
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
      <Text style={styles.title}>Artist Profile</Text>
      <Text style={styles.subtitle}>Artist ID: {artistId}</Text>
    </View>
  );
}