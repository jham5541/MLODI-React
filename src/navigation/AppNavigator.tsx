import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useTheme, colors } from '../context/ThemeContext';
import { PlayProvider, usePlay } from '../context/PlayContext';
import { useAuthStore } from '../store/authStore';
import SearchModal from '../components/search/SearchModal';
import PlayBar from '../components/PlayBar';
import OnboardingFlow from '../components/onboarding/OnboardingFlow';
import ProfileCompletionScreen from '../pages/ProfileCompletionScreen';

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
import RadioAllScreen from '../pages/RadioAll';
import ChartsAllScreen from '../pages/ChartsAll';
import SettingsScreen from '../pages/Settings';
import FavoritesScreen from '../pages/Favorites';
import AlbumPage from '../pages/AlbumPage';
import { SubscriptionScreen } from '../screens/SubscriptionScreen';
import { SubscriptionManagementScreen } from '../screens/SubscriptionManagementScreen';

export type RootStackParamList = {
  MainTabs: undefined;
  ArtistProfile: { artistId: string };
  AlbumPage: { albumId: string };
  Albums: undefined;
  Playlists: undefined;
  RadioAll: undefined;
  ChartsAll: undefined;
  Settings: undefined;
  Subscription: undefined;
  SubscriptionManagement: undefined;
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

function AuthFlowManager() {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];
  const {
    user,
    profile,
    hasCompletedOnboarding,
    needsProfileCompletion,
    checkSession,
    completeOnboarding,
    completeProfileSetup,
  } = useAuthStore();
  
  const [isInitializing, setIsInitializing] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Check for existing session
      await checkSession();
      
      // Check if user has completed onboarding
      const onboardingCompleted = await AsyncStorage.getItem('onboarding_completed');
      if (!onboardingCompleted && !user) {
        setShowOnboarding(true);
      }
    } catch (error) {
      console.error('App initialization error:', error);
    } finally {
      setIsInitializing(false);
    }
  };

  const handleOnboardingComplete = async () => {
    await AsyncStorage.setItem('onboarding_completed', 'true');
    completeOnboarding();
    setShowOnboarding(false);
  };

  const handleProfileCompletion = () => {
    completeProfileSetup();
  };

  // Show loading screen during initialization
  if (isInitializing) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: themeColors.background 
      }}>
        <ActivityIndicator size="large" color={themeColors.primary} />
      </View>
    );
  }

  // Show onboarding for new users
  if (showOnboarding && !user) {
    return <OnboardingFlow onComplete={handleOnboardingComplete} />;
  }

  // Show profile completion for users without completed profiles
  if (user && profile && !profile.username) {
    return <ProfileCompletionScreen />;
  }

  // Show main app
  return <AppContent />;
}

function AppContent() {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];
  const {
    currentSong,
    isPlaying,
    isPlayBarVisible,
    togglePlayPause,
    nextSong,
    previousSong,
    closePlayBar,
    expandPlayBar,
  } = usePlay();

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
          name="AlbumPage" 
          component={AlbumPage}
          options={{ headerShown: false }}
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
          name="RadioAll" 
          component={RadioAllScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="ChartsAll" 
          component={ChartsAllScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Settings" 
          component={SettingsScreen}
          options={{ title: 'Settings' }}
        />
        <Stack.Screen 
          name="Subscription" 
          component={SubscriptionScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="SubscriptionManagement" 
          component={SubscriptionManagementScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
      
      <SearchModal />
      
      <PlayBar
        currentSong={currentSong}
        isPlaying={isPlaying}
        isVisible={isPlayBarVisible}
        onPlayPause={togglePlayPause}
        onNext={nextSong}
        onPrevious={previousSong}
        onClose={closePlayBar}
        onExpand={expandPlayBar}
      />
    </NavigationContainer>
  );
}

export default function AppNavigator() {
  return (
    <PlayProvider>
      <AuthFlowManager />
    </PlayProvider>
  );
}
