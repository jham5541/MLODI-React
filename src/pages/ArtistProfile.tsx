import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { useTheme, colors } from '../context/ThemeContext';
import { RootStackParamList } from '../navigation/AppNavigator';
import BottomNavBar from '../components/common/BottomNavBar';

// Artist Components
import ArtistHeader from '../components/artists/ArtistHeader';
import PopularSongs from '../components/artists/PopularSongs';
import DiscographyCarousel from '../components/artists/DiscographyCarousel';
import VideoCarousel from '../components/artists/VideoCarousel';
import TourDates from '../components/artists/TourDates';
import EngagementChallenges from '../components/artists/EngagementChallenges';
import TopFansLeaderboard from '../components/artists/TopFansLeaderboard';
import PlaylistIntegration from '../components/artists/PlaylistIntegration';

// Analytics Components
import EngagementMetrics from '../components/analytics/EngagementMetrics';

// Finance Components
import RevenueInsights from '../components/finance/RevenueInsights';

// Social Components
import ReactionBar from '../components/social/ReactionBar';
import CommentSection from '../components/social/CommentSection';

// Collaboration Components
import CollaborationHub from '../components/collaboration/CollaborationHub';


import { Artist } from '../types/music';
import { fetchArtistDetails } from '../services/artistService';

type ArtistProfileRouteProp = RouteProp<RootStackParamList, 'ArtistProfile'>;

interface Props {
  route: ArtistProfileRouteProp;
}

export default function ArtistProfileScreen({ route }: Props) {
  const { artistId } = route?.params || { artistId: 'unknown' };
  console.log('ArtistProfile received artistId:', artistId);
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];
  const [artist, setArtist] = useState<Artist | null>(null);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeColors.background,
    },
    contentContainer: {
      flex: 1,
      paddingBottom: 180, // Space for bottom nav and play bar
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    artistName: {
      fontSize: 24,
      fontWeight: 'bold',
      color: themeColors.text,
      marginLeft: 8,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: themeColors.text,
      marginVertical: 12,
    },
    bio: {
      fontSize: 16,
      color: themeColors.textSecondary,
      marginBottom: 16,
    },
    image: {
      width: 100,
      height: 100,
      borderRadius: 50,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: themeColors.background,
    },
    loadingText: {
      fontSize: 18,
      color: themeColors.text,
    }
  });

  useEffect(() => {
    fetchArtistDetails(artistId).then(setArtist);
  }, [artistId]);

  if (!artist) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.contentContainer} contentContainerStyle={{ paddingBottom: 180 }}>
        <ArtistHeader artist={artist} />
        <EngagementMetrics artistId={artistId} artistName={artist.name} />
        <RevenueInsights artistId={artistId} artistName={artist.name} />
        <PopularSongs artistId={artistId} artistName={artist.name} />
        <ReactionBar artistId={artistId} />
        <CollaborationHub artistId={artistId} />
        <CommentSection artistId={artistId} />
        <DiscographyCarousel artistId={artistId} artistName={artist.name} />
        <VideoCarousel artistId={artistId} artistName={artist.name} />
        <TourDates artistId={artistId} artistName={artist.name} />
        <EngagementChallenges artistId={artistId} artistName={artist.name} userLevel={2} />
        <PlaylistIntegration artistId={artistId} artistName={artist.name} />
        <TopFansLeaderboard />
      </ScrollView>
      <BottomNavBar />
    </View>
  );
}