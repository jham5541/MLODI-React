import { useState, useEffect, useCallback } from 'react';
import { audioService } from '../services/audioService';
import { Song } from '../types/music';

export interface AudioState {
  isPlaying: boolean;
  currentTrack: Song | null;
  position: number;
  duration: number;
  isLoading: boolean;
}

export function useAudioPlayer() {
  const [audioState, setAudioState] = useState<AudioState>({
    isPlaying: false,
    currentTrack: null,
    position: 0,
    duration: 0,
    isLoading: false,
  });

  useEffect(() => {
    let stateUnsubscribe: (() => void) | undefined;
    let trackUnsubscribe: (() => void) | undefined;
    let progressUnsubscribe: (() => void) | undefined;

    const setupListeners = async () => {
      // State change listener
      stateUnsubscribe = audioService.onStateChange((state) => {
        setAudioState(prev => ({
          ...prev,
          isPlaying: state === 'playing',
          isLoading: state === 'loading',
        }));
      });

      // Track change listener
      trackUnsubscribe = audioService.onTrackChange((track) => {
        setAudioState(prev => ({
          ...prev,
          currentTrack: track,
        }));
      });

      // Progress listener
      progressUnsubscribe = audioService.onProgress(({ position, duration }) => {
        setAudioState(prev => ({
          ...prev,
          position,
          duration,
        }));
      });
    };

    setupListeners();

    return () => {
      stateUnsubscribe?.();
      trackUnsubscribe?.();
      progressUnsubscribe?.();
    };
  }, []);

  const playSong = useCallback(async (song: Song) => {
    try {
      setAudioState(prev => ({ ...prev, isLoading: true }));
      await audioService.playSong(song);
    } catch (error) {
      console.error('Error playing song:', error);
      setAudioState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const playPlaylist = useCallback(async (songs: Song[], startIndex = 0) => {
    try {
      setAudioState(prev => ({ ...prev, isLoading: true }));
      await audioService.playPlaylist(songs, startIndex);
    } catch (error) {
      console.error('Error playing playlist:', error);
      setAudioState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const play = useCallback(async () => {
    await audioService.play();
  }, []);

  const pause = useCallback(async () => {
    await audioService.pause();
  }, []);

  const skipToNext = useCallback(async () => {
    await audioService.skipToNext();
  }, []);

  const skipToPrevious = useCallback(async () => {
    await audioService.skipToPrevious();
  }, []);

  const seekTo = useCallback(async (position: number) => {
    await audioService.seekTo(position);
  }, []);

  const togglePlayPause = useCallback(async () => {
    if (audioState.isPlaying) {
      await pause();
    } else {
      await play();
    }
  }, [audioState.isPlaying, play, pause]);

  return {
    ...audioState,
    playSong,
    playPlaylist,
    play,
    pause,
    skipToNext,
    skipToPrevious,
    seekTo,
    togglePlayPause,
  };
}