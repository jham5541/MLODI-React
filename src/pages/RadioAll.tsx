import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme, colors } from '../context/ThemeContext';
import { usePlay } from '../context/PlayContext';

interface RadioStation {
  id: string;
  name: string;
  genre: string;
  description: string;
  coverUrl: string;
  isLive?: boolean;
  listeners?: number;
  isFeatured?: boolean;
}

export default function RadioAllScreen() {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];
  const { playSong } = usePlay();
  const navigation = useNavigation();

  // Create a mock song for radio station playback
  const createRadioSong = (station: RadioStation) => ({
    id: `radio-${station.id}`,
    title: `${station.name} - Live Radio`,
    artist: station.genre,
    artistId: station.id,
    album: 'Live Radio',
    coverUrl: station.coverUrl,
    duration: 3600, // 1 hour for radio
    audioUrl: '',
    isRadio: true,
  });

  // Mock data for featured stations in carousel
  const featuredStations: RadioStation[] = [
    {
      id: '1',
      name: 'Top Hits Radio',
      genre: 'Pop',
      description: 'The biggest hits right now',
      coverUrl: 'https://via.placeholder.com/300x200?text=Top+Hits',
      isLive: true,
      listeners: 1247,
      isFeatured: true,
    },
    {
      id: '2',
      name: 'Chill Vibes',
      genre: 'Ambient',
      description: 'Relaxing sounds for focus',
      coverUrl: 'https://via.placeholder.com/300x200?text=Chill+Vibes',
      isLive: true,
      listeners: 834,
      isFeatured: true,
    },
    {
      id: '3',
      name: 'Electronic Beats',
      genre: 'Electronic',
      description: 'High energy electronic music',
      coverUrl: 'https://via.placeholder.com/300x200?text=Electronic+Beats',
      isLive: true,
      listeners: 956,
      isFeatured: true,
    },
  ];

  // Mock data for all stations in grid
  const allStations: RadioStation[] = [
    ...featuredStations,
    {
      id: '4',
      name: 'Hip Hop Central',
      genre: 'Hip Hop',
      description: 'Latest hip hop and rap',
      coverUrl: 'https://via.placeholder.com/120x120?text=Hip+Hop',
      isLive: true,
      listeners: 723,
    },
    {
      id: '5',
      name: 'Rock Classics',
      genre: 'Rock',
      description: 'Timeless rock anthems',
      coverUrl: 'https://via.placeholder.com/120x120?text=Rock+Classics',
      isLive: false,
      listeners: 445,
    },
    {
      id: '6',
      name: 'Jazz Lounge',
      genre: 'Jazz',
      description: 'Smooth jazz and blues',
      coverUrl: 'https://via.placeholder.com/120x120?text=Jazz+Lounge',
      isLive: true,
      listeners: 312,
    },
    {
      id: '7',
      name: 'Country Roads',
      genre: 'Country',
      description: 'Modern and classic country',
      coverUrl: 'https://via.placeholder.com/120x120?text=Country+Roads',
      isLive: true,
      listeners: 587,
    },
    {
      id: '8',
      name: 'Classical Morning',
      genre: 'Classical',
      description: 'Beautiful classical pieces',
      coverUrl: 'https://via.placeholder.com/120x120?text=Classical',
      isLive: false,
      listeners: 234,
    },
    {
      id: '9',
      name: 'Latin Heat',
      genre: 'Latin',
      description: 'Hot Latin rhythms',
      coverUrl: 'https://via.placeholder.com/120x120?text=Latin+Heat',
      isLive: true,
      listeners: 678,
    },
  ];

  const handlePlayStation = (station: RadioStation) => {
    const radioSong = createRadioSong(station);
    playSong(radioSong, [radioSong]);
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeColors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
      paddingTop: 60,
      backgroundColor: themeColors.surface,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: themeColors.background,
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: themeColors.text,
    },
    searchButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: themeColors.background,
      justifyContent: 'center',
      alignItems: 'center',
    },
    content: {
      flex: 1,
    },
    showcaseSection: {
      marginBottom: 24,
    },
    showcaseTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: themeColors.text,
      marginHorizontal: 16,
      marginBottom: 16,
    },
    carouselContainer: {
      paddingHorizontal: 16,
    },
    featuredCard: {
      width: 280,
      marginRight: 16,
      backgroundColor: themeColors.surface,
      borderRadius: 16,
      overflow: 'hidden',
    },
    featuredImage: {
      width: '100%',
      height: 160,
    },
    featuredContent: {
      padding: 16,
    },
    featuredHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    liveIndicator: {
      backgroundColor: '#FF4444',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      marginRight: 12,
    },
    liveText: {
      fontSize: 10,
      color: 'white',
      fontWeight: 'bold',
    },
    featuredName: {
      fontSize: 16,
      fontWeight: 'bold',
      color: themeColors.text,
      flex: 1,
    },
    featuredGenre: {
      fontSize: 14,
      color: themeColors.textSecondary,
      marginBottom: 6,
    },
    featuredDescription: {
      fontSize: 12,
      color: themeColors.textSecondary,
      lineHeight: 16,
      marginBottom: 12,
    },
    featuredFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    listeners: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    listenersText: {
      fontSize: 12,
      color: themeColors.textSecondary,
      marginLeft: 4,
    },
    playButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: themeColors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    gridSection: {
      flex: 1,
      paddingHorizontal: 16,
    },
    gridTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: themeColors.text,
      marginBottom: 16,
    },
    gridContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    gridItem: {
      width: '31%',
      marginBottom: 16,
      backgroundColor: themeColors.surface,
      borderRadius: 12,
      padding: 12,
    },
    gridImage: {
      width: '100%',
      height: 80,
      borderRadius: 8,
      marginBottom: 8,
    },
    gridHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
    },
    gridLiveIndicator: {
      backgroundColor: '#FF4444',
      paddingHorizontal: 4,
      paddingVertical: 2,
      borderRadius: 3,
      marginRight: 6,
    },
    gridLiveText: {
      fontSize: 8,
      color: 'white',
      fontWeight: 'bold',
    },
    gridName: {
      fontSize: 12,
      fontWeight: '600',
      color: themeColors.text,
      flex: 1,
      numberOfLines: 1,
    },
    gridGenre: {
      fontSize: 10,
      color: themeColors.textSecondary,
      marginBottom: 6,
    },
    gridFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    gridListeners: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    gridListenersText: {
      fontSize: 10,
      color: themeColors.textSecondary,
      marginLeft: 2,
    },
    gridPlayButton: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: themeColors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

  const renderFeaturedStation = ({ item }: { item: RadioStation }) => (
    <TouchableOpacity style={styles.featuredCard}>
      <Image
        source={{ uri: item.coverUrl }}
        style={styles.featuredImage}
        defaultSource={{ uri: 'https://via.placeholder.com/280x160?text=📻' }}
      />
      <View style={styles.featuredContent}>
        <View style={styles.featuredHeader}>
          {item.isLive && (
            <View style={styles.liveIndicator}>
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          )}
          <Text style={styles.featuredName} numberOfLines={1}>
            {item.name}
          </Text>
        </View>
        
        <Text style={styles.featuredGenre}>{item.genre}</Text>
        <Text style={styles.featuredDescription} numberOfLines={2}>
          {item.description}
        </Text>
        
        <View style={styles.featuredFooter}>
          <View style={styles.listeners}>
            <Ionicons name="people" size={14} color={themeColors.textSecondary} />
            <Text style={styles.listenersText}>
              {item.listeners ? `${item.listeners}` : '0'}
            </Text>
          </View>
          
          <TouchableOpacity 
            style={styles.playButton}
            onPress={() => handlePlayStation(item)}
          >
            <Ionicons name="play" size={16} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderGridStation = (station: RadioStation) => (
    <TouchableOpacity key={station.id} style={styles.gridItem}>
      <Image
        source={{ uri: station.coverUrl }}
        style={styles.gridImage}
        defaultSource={{ uri: 'https://via.placeholder.com/80x80?text=📻' }}
      />
      
      <View style={styles.gridHeader}>
        {station.isLive && (
          <View style={styles.gridLiveIndicator}>
            <Text style={styles.gridLiveText}>LIVE</Text>
          </View>
        )}
        <Text style={styles.gridName} numberOfLines={1}>
          {station.name}
        </Text>
      </View>
      
      <Text style={styles.gridGenre} numberOfLines={1}>
        {station.genre}
      </Text>
      
      <View style={styles.gridFooter}>
        <View style={styles.gridListeners}>
          <Ionicons name="people" size={10} color={themeColors.textSecondary} />
          <Text style={styles.gridListenersText}>
            {station.listeners || 0}
          </Text>
        </View>
        
        <TouchableOpacity 
          style={styles.gridPlayButton}
          onPress={() => handlePlayStation(station)}
        >
          <Ionicons name="play" size={10} color="white" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={themeColors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Radio Stations</Text>
        <TouchableOpacity style={styles.searchButton}>
          <Ionicons name="search" size={24} color={themeColors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Showcase Carousel */}
        <View style={styles.showcaseSection}>
          <Text style={styles.showcaseTitle}>Featured Stations</Text>
          <FlatList
            data={featuredStations}
            renderItem={renderFeaturedStation}
            keyExtractor={(item) => `featured-${item.id}`}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.carouselContainer}
          />
        </View>

        {/* 3-Column Grid */}
        <View style={styles.gridSection}>
          <Text style={styles.gridTitle}>All Stations</Text>
          <View style={styles.gridContainer}>
            {allStations.map(renderGridStation)}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
