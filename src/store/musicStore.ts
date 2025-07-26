import { create } from 'zustand';
import { Song } from '../types/music';

interface MusicState {
  // Current playing
  currentSong: Song | null;
  isPlaying: boolean;

  // Actions
  playSong: (song: Song, queue?: Song[], startIndex?: number) => void;
  pauseSong: () => void;
  resumeSong: () => void;
}

export const useMusicStore = create<MusicState>((set, get) => ({
  // Initial state
  currentSong: null,
  isPlaying: false,

  // Simple actions for Expo Go
  playSong: (song: Song) => {
    console.log('Playing song in Expo Go:', song.title);
    set({
      currentSong: song,
      isPlaying: true,
    });
  },

  pauseSong: () => {
    console.log('Pausing song in Expo Go');
    set({ isPlaying: false });
  },

  resumeSong: () => {
    console.log('Resuming song in Expo Go');
    set({ isPlaying: true });
  },
}));