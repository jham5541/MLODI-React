import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Song } from '../types/music';

interface PlayContextType {
  currentSong: Song | null;
  isPlaying: boolean;
  isPlayBarVisible: boolean;
  playlist: Song[];
  currentIndex: number;
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

  const playSong = (song: Song, newPlaylist?: Song[]) => {
    if (newPlaylist) {
      setPlaylist(newPlaylist);
      const index = newPlaylist.findIndex(s => s.id === song.id);
      setCurrentIndex(index >= 0 ? index : 0);
    } else if (playlist.length === 0) {
      setPlaylist([song]);
      setCurrentIndex(0);
    }
    
    setCurrentSong(song);
    setIsPlaying(true);
    setIsPlayBarVisible(true);
  };

  const pauseSong = () => {
    setIsPlaying(false);
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const nextSong = () => {
    if (playlist.length > 0 && currentIndex < playlist.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      setCurrentSong(playlist[nextIndex]);
      setIsPlaying(true);
    }
  };

  const previousSong = () => {
    if (playlist.length > 0 && currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      setCurrentIndex(prevIndex);
      setCurrentSong(playlist[prevIndex]);
      setIsPlaying(true);
    }
  };

  const closePlayBar = () => {
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
