import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { useTheme, colors } from '../context/ThemeContext';

// Import screens (we'll create these next)
import HomeScreen from '../pages/Home';
import LibraryScreen from '../pages/Library';
import DiscoverScreen from '../pages/Discover';
import TrendingScreen from '../pages/Trending';
import MarketplaceScreen from '../pages/Marketplace';
import AlbumsScreen from '../pages/Albums';
import ArtistsScreen from '../pages/Artists';
import ArtistProfileScreen from '../pages/ArtistProfile';
import PlaylistsScreen from '../pages/Playlists';
import RadioScreen from '../pages/Radio';
import SettingsScreen from '../pages/Settings';
import FavoritesScreen from '../pages/Favorites';

export type RootStackParamList = {
  MainTabs: undefined;
  ArtistProfile: { artistId: string };
  Albums: undefined;
  Playlists: undefined;
  Settings: undefined;
};

export type TabParamList = {
  Home: undefined;
  Library: undefined;
  Discover: undefined;
  Trending: undefined;
  Radio: undefined;
  Marketplace: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

function TabNavigator() {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

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
            case 'Radio':
              iconName = focused ? 'radio' : 'radio-outline';
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
        headerStyle: {
          backgroundColor: themeColors.surface,
        },
        headerTintColor: themeColors.text,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Discover" component={DiscoverScreen} />
      <Tab.Screen name="Library" component={LibraryScreen} />
      <Tab.Screen name="Trending" component={TrendingScreen} />
      <Tab.Screen name="Marketplace" component={MarketplaceScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];

  return (
    <NavigationContainer
      theme={{
        dark: activeTheme === 'dark',
        colors: {
          primary: themeColors.primary,
          background: themeColors.background,
          card: themeColors.surface,
          text: themeColors.text,
          border: themeColors.border,
          notification: themeColors.primary,
        },
      }}
    >
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: themeColors.surface,
          },
          headerTintColor: themeColors.text,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen 
          name="MainTabs" 
          component={TabNavigator} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="ArtistProfile" 
          component={ArtistProfileScreen}
          options={{ title: 'Artist' }}
        />
        <Stack.Screen 
          name="Albums" 
          component={AlbumsScreen}
          options={{ title: 'Albums' }}
        />
        <Stack.Screen 
          name="Playlists" 
          component={PlaylistsScreen}
          options={{ title: 'Playlists' }}
        />
        <Stack.Screen 
          name="Settings" 
          component={SettingsScreen}
          options={{ title: 'Settings' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}