import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme, colors } from '../context/ThemeContext';
import FullScreenLeaderboard from '../components/artists/FullScreenLeaderboard';
import { RootStackRouteProp } from '../navigation/AppNavigator';

interface Props {
  route: RootStackRouteProp<'FansLeaderboard'>;
}

export default function FansLeaderboardScreen({ route }: Props) {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];
  const { artistId } = route.params;

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeColors.background,
    },
  });

  return (
    <View style={styles.container}>
      <FullScreenLeaderboard artistId={artistId} />
    </View>
  );
}

