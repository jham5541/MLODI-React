import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme, colors } from '../../context/ThemeContext';
import { usePlay } from '../../context/PlayContext';
import { useRadio } from '../../context/RadioContext';

interface RadioStation {
  id: string;
  name: string;
  genre: string;
  description: string;
  coverUrl: string;
  isLive?: boolean;
  listeners?: number;
}

interface RadioCarouselProps {
  title: string;
  stations: RadioStation[];
  onStationPress?: (station: RadioStation) => void;
  onSeeAllPress?: () => void;
}

export default function RadioCarousel({ 
  title, 
  stations, 
  onStationPress,
  onSeeAllPress 
}: RadioCarouselProps) {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];
  const { playSong } = usePlay();
  const { getListenerCount, stationListeners, addListener } = useRadio();
  const navigation = useNavigation();
  const [forceUpdate, setForceUpdate] = useState(0);

  console.log('RadioCarousel: Component rendered with stationListeners:', stationListeners);

  // Force re-render when stationListeners changes
  useEffect(() => {
    console.log('RadioCarousel: stationListeners changed, forcing update');
    setForceUpdate(prev => prev + 1);
  }, [stationListeners]);

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

  const styles = StyleSheet.create({
    container: {
      marginBottom: 24,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
      paddingHorizontal: 16,
    },
    title: {
      fontSize: 18,
      fontWeight: 'bold',
      color: themeColors.text,
    },
    seeAll: {
      fontSize: 14,
      color: themeColors.primary,
      fontWeight: '600',
    },
    listContainer: {
      paddingHorizontal: 16,
    },
    stationCard: {
      width: 160,
      marginRight: 12,
      backgroundColor: themeColors.surface,
      borderRadius: 12,
      padding: 12,
    },
    stationImage: {
      width: '100%',
      height: 120,
      borderRadius: 8,
      marginBottom: 8,
    },
    stationHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
    },
    liveIndicator: {
      backgroundColor: '#FF4444',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      marginRight: 8,
    },
    liveText: {
      fontSize: 10,
      color: 'white',
      fontWeight: 'bold',
    },
    stationName: {
      fontSize: 14,
      fontWeight: '600',
      color: themeColors.text,
      flex: 1,
    },
    genre: {
      fontSize: 12,
      color: themeColors.textSecondary,
      marginBottom: 6,
    },
    description: {
      fontSize: 11,
      color: themeColors.textSecondary,
      lineHeight: 14,
      marginBottom: 8,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    listeners: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    listenersText: {
      fontSize: 11,
      color: themeColors.textSecondary,
      marginLeft: 4,
    },
    playButton: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: themeColors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

  const renderStation = ({ item }: { item: RadioStation }) => {
    const listenerCount = stationListeners[item.id] || 0;
    console.log('RadioCarousel: Rendering station', item.id, 'with listener count:', listenerCount);
    
    return (
      <TouchableOpacity 
        style={styles.stationCard}
        onPress={() => onStationPress?.(item)}
      >
        <Image
          source={{ uri: item.coverUrl }}
          style={styles.stationImage}
          defaultSource={{ uri: 'https://via.placeholder.com/160x120?text=📻' }}
        />
        
        <View style={styles.stationHeader}>
          {item.isLive && (
            <View style={styles.liveIndicator}>
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          )}
          <Text style={styles.stationName} numberOfLines={1}>
            {item.name}
          </Text>
        </View>
        
        <Text style={styles.genre} numberOfLines={1}>
          {item.genre}
        </Text>
        
        <Text style={styles.description} numberOfLines={2}>
          {item.description}
        </Text>
        
        <View style={styles.footer}>
          <View style={styles.listeners}>
            <Ionicons name="people" size={12} color={themeColors.textSecondary} />
            <Text style={styles.listenersText}>
              {listenerCount}
            </Text>
          </View>
          
          <TouchableOpacity 
            style={styles.playButton}
            onPress={(e) => {
              e.stopPropagation();
              const radioSong = createRadioSong(item);
              playSong(radioSong, [radioSong]);
            }}
          >
            <Ionicons name="play" size={12} color="white" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  if (!stations.length) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <TouchableOpacity onPress={onSeeAllPress || (() => navigation.navigate('RadioAll' as never))}>
          <Text style={styles.seeAll}>See All</Text>
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={stations}
        renderItem={renderStation}
        keyExtractor={(item) => item.id}
        extraData={stationListeners}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
}
