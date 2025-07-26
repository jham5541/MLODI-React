import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { useTheme, colors } from '../context/ThemeContext';

// Import simplified screens
import HomeScreen from '../pages/Home';
import LibraryScreen from '../pages/Library';
import DiscoverScreen from '../pages/Discover';
import TrendingScreen from '../pages/Trending';
import MarketplaceScreen from '../pages/Marketplace';

const Tab = createBottomTabNavigator();

export default function AppNavigator() {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;

            switch (route.name) {
              case 'Home':
                iconName = focused ? 'home' : 'home-outline';
                break;
              case 'Discover':
                iconName = focused ? 'compass' : 'compass-outline';
                break;
              case 'Library':
                iconName = focused ? 'library' : 'library-outline';
                break;
              case 'Trending':
                iconName = focused ? 'trending-up' : 'trending-up-outline';
                break;
              case 'Marketplace':
                iconName = focused ? 'storefront' : 'storefront-outline';
                break;
              default:
                iconName = 'help-outline';
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: themeColors.primary,
          tabBarInactiveTintColor: themeColors.textSecondary,
          tabBarStyle: {
            backgroundColor: themeColors.surface,
            borderTopColor: themeColors.border,
          },
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Discover" component={DiscoverScreen} />
        <Tab.Screen name="Library" component={LibraryScreen} />
        <Tab.Screen name="Trending" component={TrendingScreen} />
        <Tab.Screen name="Marketplace" component={MarketplaceScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}