import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useTheme, colors } from '../../context/ThemeContext';
import { monthlyListenersService } from '../../services/monthlyListenersService';

interface MonthlyListenersDemoProps {
  artistId: string;
  artistName: string;
}

export function MonthlyListenersDemo({ artistId, artistName }: MonthlyListenersDemoProps) {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];
  const [isUpdating, setIsUpdating] = useState(false);

  const handleSimulateGrowth = async () => {
    setIsUpdating(true);
    try {
      const growthPercentage = Math.floor(Math.random() * 10) + 1; // 1-10% growth
      const newCount = await monthlyListenersService.simulateGrowth(artistId, growthPercentage);
      
      Alert.alert(
        'Growth Simulated!',
        `${artistName}'s monthly listeners grew by ${growthPercentage}% to ${newCount.toLocaleString()} listeners!`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to simulate growth');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSetSpecificCount = async () => {
    setIsUpdating(true);
    try {
      const randomCount = Math.floor(Math.random() * 5000000) + 100000; // 100K to 5M
      const success = await monthlyListenersService.updateMonthlyListeners(artistId, randomCount);
      
      if (success) {
        Alert.alert(
          'Updated!',
          `${artistName}'s monthly listeners set to ${randomCount.toLocaleString()}!`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update monthly listeners');
    } finally {
      setIsUpdating(false);
    }
  };

  const styles = StyleSheet.create({
    container: {
      backgroundColor: themeColors.surface,
      borderRadius: 16,
      padding: 20,
      marginHorizontal: 16,
      marginVertical: 8,
      borderWidth: 1,
      borderColor: themeColors.border,
    },
    title: {
      fontSize: 16,
      fontWeight: '700',
      color: themeColors.text,
      marginBottom: 16,
    },
    buttonRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 12,
    },
    button: {
      flex: 1,
      backgroundColor: themeColors.primary,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 12,
      alignItems: 'center',
    },
    buttonDisabled: {
      opacity: 0.6,
    },
    buttonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '600',
    },
    infoText: {
      fontSize: 12,
      color: themeColors.textSecondary,
      marginTop: 12,
      textAlign: 'center',
    },
  });

  if (!__DEV__) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Monthly Listeners Demo Controls</Text>
      
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.button, isUpdating && styles.buttonDisabled]}
          onPress={handleSimulateGrowth}
          disabled={isUpdating}
        >
          <Text style={styles.buttonText}>Simulate Growth</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.button, isUpdating && styles.buttonDisabled]}
          onPress={handleSetSpecificCount}
          disabled={isUpdating}
        >
          <Text style={styles.buttonText}>Random Count</Text>
        </TouchableOpacity>
      </View>
      
      <Text style={styles.infoText}>
        Changes will update in real-time on all devices
      </Text>
    </View>
  );
}
