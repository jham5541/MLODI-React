import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Audio } from 'expo-av';
import { Song } from '../types/music';

interface PlayContextType {
  currentSong: Song | null;
  isPlaying: boolean;
  isPlayBarVisible: boolean;
  playlist: Song[];
  currentIndex: number;
  sound: Audio.Sound | null;
  playSong: (song: Song, playlist?: Song[]) => void;
  pauseSong: () => void;
  togglePlayPause: () => void;
  nextSong: () => void;
  previousSong: () => void;
  closePlayBar: () => void;
  expandPlayBar: () => void;
}

const PlayContext = createContext<PlayContextType | undefined>(undefined);

interface PlayProviderProps {
  children: ReactNode;
}

export const PlayProvider: React.FC<PlayProviderProps> = ({ children }) => {
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPlayBarVisible, setIsPlayBarVisible] = useState(false);
  const [playlist, setPlaylist] = useState<Song[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  // Demo audio pool (royalty-free examples)
  const DEMO_AUDIO_URLS = [
    'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
    'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3',
    'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3',
    'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',
    'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3',
    'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3',
  ];

  // Initialize audio mode
  useEffect(() => {
    const initAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: true,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
      } catch (error) {
        console.error('Error setting audio mode:', error);
      }
    };
    initAudio();
  }, []);

  // Cleanup sound on unmount
  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  // Helper to load and play a track at a given index using the demo URL
  const loadAndPlay = async (index: number) => {
    try {
      const target = playlist[index];
      if (!target) return;

      // Unload previous
      if (sound) {
        try { await sound.unloadAsync(); } catch {}
      }

      const pickUrl = DEMO_AUDIO_URLS[index % DEMO_AUDIO_URLS.length];
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: pickUrl },
        { shouldPlay: true }
      );

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          nextSong();
        }
      });

      setSound(newSound);
      setCurrentIndex(index);
      setCurrentSong(target);
      setIsPlaying(true);
      setIsPlayBarVisible(true);
    } catch (e) {
      console.error('Error loading demo audio:', e);
    }
  };

  const playSong = async (song: Song, newPlaylist?: Song[]) => {
    console.log('PlayContext: playSong called with', { song, newPlaylist });
    try {
      let nextList = playlist;
      if (newPlaylist && newPlaylist.length) {
        nextList = newPlaylist;
        setPlaylist(newPlaylist);
      } else if (playlist.length === 0) {
        nextList = [song];
        setPlaylist(nextList);
      }

      // Find index of requested song within the active list
      const idx = nextList.findIndex((s) => s.id === song.id);
      const targetIndex = idx >= 0 ? idx : 0;
      await loadAndPlay(targetIndex);
    } catch (error) {
      console.error('Error playing song:', error);
    }
  };

  const pauseSong = async () => {
    try {
      if (sound) {
        await sound.pauseAsync();
        setIsPlaying(false);
      }
    } catch (error) {
      console.error('Error pausing song:', error);
    }
  };

  const togglePlayPause = async () => {
    console.log('PlayContext: togglePlayPause called, current state:', { isPlaying, sound });
    try {
      if (sound) {
        const status = await sound.getStatusAsync();
        if (status.isLoaded && status.isPlaying) {
          await sound.pauseAsync();
          setIsPlaying(false);
        } else {
          await sound.playAsync();
          setIsPlaying(true);
        }
      } else if (playlist.length > 0) {
        // If no sound yet but we have a playlist, (re)load current index
        await loadAndPlay(currentIndex);
      }
    } catch (error) {
      console.error('Error toggling play/pause:', error);
    }
  };

  const nextSong = () => {
    if (playlist.length > 0 && currentIndex < playlist.length - 1) {
      const nextIndex = currentIndex + 1;
      (async () => { await loadAndPlay(nextIndex); })();
    }
  };

  const previousSong = () => {
    if (playlist.length > 0 && currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      (async () => { await loadAndPlay(prevIndex); })();
    }
  };

  const closePlayBar = async () => {
    if (sound) {
      await sound.unloadAsync();
      setSound(null);
    }
    setIsPlayBarVisible(false);
    setIsPlaying(false);
    setCurrentSong(null);
    setPlaylist([]);
    setCurrentIndex(0);
  };

  const expandPlayBar = () => {
    // In a real app, this would navigate to a full-screen player
    console.log('Expanding play bar to full screen player');
  };

  const value: PlayContextType = {
    currentSong,
    isPlaying,
    isPlayBarVisible,
    playlist,
    currentIndex,
    sound,
    playSong,
    pauseSong,
    togglePlayPause,
    nextSong,
    previousSong,
    closePlayBar,
    expandPlayBar,
  };

  return (
    <PlayContext.Provider value={value}>
      {children}
    </PlayContext.Provider>
  );
};

export const usePlay = (): PlayContextType => {
  const context = useContext(PlayContext);
  if (!context) {
    throw new Error('usePlay must be used within a PlayProvider');
  }
  return context;
};
