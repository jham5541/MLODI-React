import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme, colors } from '../../context/ThemeContext';
import TopFansLeaderboard from './TopFansLeaderboard';

interface FullScreenLeaderboardProps {
  artistId: string;
}

const FullScreenLeaderboard = ({ artistId }: FullScreenLeaderboardProps) => {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];

  // State is already handled by TopFansLeaderboard component
  
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeColors.background,
    },
  });

  return (
    <View style={styles.container}>
      <TopFansLeaderboard 
        artistId={artistId}
        compact={false}
      />
    </View>
  );
};

export default FullScreenLeaderboard;
