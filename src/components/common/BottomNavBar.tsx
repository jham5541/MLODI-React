import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, colors } from '../../context/ThemeContext';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/AppNavigator';

interface BottomNavBarProps {
  activeTab?: string;
}

type NavigationProps = NavigationProp<RootStackParamList>;

export default function BottomNavBar({ activeTab }: BottomNavBarProps) {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];
  const navigation = useNavigation<NavigationProps>();

  const tabs = [
    {
      key: 'Home',
      label: 'Home',
      icon: 'home',
      iconOutline: 'home-outline',
      onPress: () => navigation.navigate('MainTabs', { screen: 'Home' } as any),
    },
    {
      key: 'Discover',
      label: 'Discover',
      icon: 'compass',
      iconOutline: 'compass-outline',
      onPress: () => navigation.navigate('MainTabs', { screen: 'Discover' } as any),
    },
    {
      key: 'Library',
      label: 'Library',
      icon: 'library',
      iconOutline: 'library-outline',
      onPress: () => navigation.navigate('MainTabs', { screen: 'Library' } as any),
    },
    {
      key: 'Trending',
      label: 'Trending',
      icon: 'trending-up',
      iconOutline: 'trending-up-outline',
      onPress: () => navigation.navigate('MainTabs', { screen: 'Trending' } as any),
    },
    {
      key: 'Marketplace',
      label: 'Marketplace',
      icon: 'storefront',
      iconOutline: 'storefront-outline',
      onPress: () => navigation.navigate('MainTabs', { screen: 'Marketplace' } as any),
    },
  ];

  const styles = StyleSheet.create({
    container: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: themeColors.surface,
      borderTopWidth: 1,
      borderTopColor: themeColors.border,
    },
    safeArea: {
      backgroundColor: themeColors.surface,
    },
    tabContainer: {
      flexDirection: 'row',
      height: 50, // Standard tab bar height
      alignItems: 'center',
    },
    tab: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 4,
    },
    tabLabel: {
      fontSize: 10,
      fontWeight: '500',
      marginTop: 2,
    },
    activeTab: {
      color: themeColors.primary,
    },
    inactiveTab: {
      color: themeColors.textSecondary,
    },
  });

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.tabContainer}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            const iconName = isActive ? tab.icon : tab.iconOutline;
            const textColor = isActive ? styles.activeTab : styles.inactiveTab;

            return (
              <TouchableOpacity
                key={tab.key}
                style={styles.tab}
                onPress={tab.onPress}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={iconName as any}
                  size={24}
                  color={isActive ? themeColors.primary : themeColors.textSecondary}
                />
                <Text style={[styles.tabLabel, textColor]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </SafeAreaView>
    </View>
  );
}
