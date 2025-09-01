import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useTheme, colors } from '../context/ThemeContext';
import { usePlay } from '../context/PlayContext';
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
import AccountSettingsScreen from '../pages/AccountSettings';
import FavoritesScreen from '../pages/Favorites';
import AlbumPage from '../pages/AlbumPage';
import { SubscriptionScreen } from '../screens/SubscriptionScreen';
import { SubscriptionManagementScreen } from '../screens/SubscriptionManagementScreen';
import PurchaseHistoryScreen from '../screens/PurchaseHistoryScreen';
import Discography from '../screens/Discography';
import VideoPage from '../screens/VideoPage';
import VideosScreen from '../screens/VideosScreen';
import ArtistSongsScreen from '../pages/ArtistSongs';
import TrendingAllSongs from '../pages/TrendingAllSongs';
import TrendingAllArtists from '../pages/TrendingAllArtists';
import GenresAll from '../pages/GenresAll';
import GenreDetail from '../pages/GenreDetail';
import FeaturedPlaylistsScreen from '../screens/FeaturedPlaylistsScreen';
import PaymentMethodsScreen from '../screens/PaymentMethodsScreen';
import FansLeaderboardScreen from '../screens/FansLeaderboardScreen';

export type RootStackParamList = {
  MainTabs: undefined;
  ArtistProfile: { artistId: string };
  AlbumPage: { albumId: string };
  VideoPage: { videoId: string };
  Videos: { artistId: string };
  Albums: undefined;
  Playlists: undefined;
  FeaturedPlaylists: undefined;
  RadioAll: undefined;
  ChartsAll: undefined;
  Settings: undefined;
  AccountSettings: undefined;
  Subscription: undefined;
  SubscriptionManagement: undefined;
  PurchaseHistory: undefined;
  PaymentMethods: undefined;
  Discography: { artistId: string; artistName: string };
  ArtistSongs: { artistId: string; artistName: string };
  TrendingAllSongs: undefined;
  TrendingAllArtists: undefined;
  GenresAll: undefined;
  GenreDetail: { genre: string };
  FansLeaderboard: { artistId: string };
};

// Add navigation prop types
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';

export type RootStackNavigationProp<T extends keyof RootStackParamList> = StackNavigationProp<RootStackParamList, T>;
export type RootStackRouteProp<T extends keyof RootStackParamList> = RouteProp<RootStackParamList, T>;

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
          options={{ headerShown: false }}
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
          name="AccountSettings" 
          component={AccountSettingsScreen}
          options={{ headerShown: false }}
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
        <Stack.Screen 
          name="Discography" 
          component={Discography}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="VideoPage" 
          component={VideoPage}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Videos" 
          component={VideosScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="ArtistSongs" 
          component={ArtistSongsScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="TrendingAllSongs" 
          component={TrendingAllSongs}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="TrendingAllArtists" 
          component={TrendingAllArtists}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="GenresAll" 
          component={GenresAll}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="GenreDetail" 
          component={GenreDetail}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="PurchaseHistory" 
          component={PurchaseHistoryScreen}
          options={{ 
            title: 'Purchase History',
            headerShown: true,
            headerStyle: {
              backgroundColor: themeColors.surface,
            },
            headerTintColor: themeColors.text,
          }}
        />
        <Stack.Screen 
          name="FeaturedPlaylists" 
          component={FeaturedPlaylistsScreen}
          options={{ title: 'Featured Playlists' }}
        />
        <Stack.Screen 
          name="FansLeaderboard" 
          component={FansLeaderboardScreen}
          options={{ title: 'Top Fans' }}
        />
        <Stack.Screen 
          name="PaymentMethods" 
          component={PaymentMethodsScreen}
          options={{ 
            title: 'Payment Methods',
            headerShown: true,
            headerStyle: {
              backgroundColor: themeColors.surface,
            },
            headerTintColor: themeColors.text,
          }}
        />
      </Stack.Navigator>
      
      <SearchModal />
      <PlayBarWrapper />
    </NavigationContainer>
  );
}

function PlayBarWrapper() {
  const {
    currentSong,
    isPlaying,
    isPlayBarVisible,
    togglePlayPause,
    nextSong,
    previousSong,
    closePlayBar,
    expandPlayBar,
    sound
  } = usePlay();

  return (
    <PlayBar
      currentSong={currentSong}
      isPlaying={isPlaying}
      isVisible={isPlayBarVisible}
      onPlayPause={togglePlayPause}
      onNext={nextSong}
      onPrevious={previousSong}
      onClose={closePlayBar}
      onExpand={expandPlayBar}
      sound={sound}
    />
  );
}

export default function AppNavigator() {
  return <AuthFlowManager />;
}
