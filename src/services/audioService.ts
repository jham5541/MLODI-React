import { Audio } from 'expo-audio';
import { Song } from '../types/music';

class AudioService {
  private sound: Audio.Sound | null = null;
  private currentSong: Song | null = null;
  private isInitialized = false;

  async initialize() {
    if (this.isInitialized) return;

    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
      this.isInitialized = true;
    } catch (error) {
      console.error('AudioService initialization failed:', error);
    }
  }

  async playSong(song: Song) {
    try {
      await this.initialize();
      
      // Stop current song if playing
      if (this.sound) {
        await this.sound.unloadAsync();
      }

      // Create new sound instance
      const { sound } = await Audio.Sound.createAsync(
        { uri: song.audioUrl },
        { shouldPlay: true }
      );
      
      this.sound = sound;
      this.currentSong = song;
    } catch (error) {
      console.error('Error playing song:', error);
      throw error;
    }
  }

  async playPlaylist(songs: Song[], startIndex = 0) {
    try {
      if (songs.length > startIndex) {
        await this.playSong(songs[startIndex]);
      }
    } catch (error) {
      console.error('Error playing playlist:', error);
      throw error;
    }
  }

  async play() {
    try {
      if (this.sound) {
        await this.sound.playAsync();
      }
    } catch (error) {
      console.error('Error playing:', error);
    }
  }

  async pause() {
    try {
      if (this.sound) {
        await this.sound.pauseAsync();
      }
    } catch (error) {
      console.error('Error pausing:', error);
    }
  }

  async skipToNext() {
    console.log('Skip to next - not implemented in simple version');
  }

  async skipToPrevious() {
    console.log('Skip to previous - not implemented in simple version');
  }

  async seekTo(position: number) {
    try {
      if (this.sound) {
        await this.sound.setPositionAsync(position * 1000); // Convert to milliseconds
      }
    } catch (error) {
      console.error('Error seeking:', error);
    }
  }

  async setRepeatMode(mode: any) {
    console.log('Repeat mode - not implemented in simple version');
  }

  async getState() {
    try {
      if (this.sound) {
        const status = await this.sound.getStatusAsync();
        if (status.isLoaded) {
          return status.isPlaying ? 'playing' : 'paused';
        }
      }
      return 'none';
    } catch (error) {
      console.error('Error getting state:', error);
      return 'none';
    }
  }

  async getCurrentTrack() {
    return this.currentSong;
  }

  async getPosition() {
    try {
      if (this.sound) {
        const status = await this.sound.getStatusAsync();
        if (status.isLoaded) {
          return (status.positionMillis || 0) / 1000; // Convert to seconds
        }
      }
      return 0;
    } catch (error) {
      console.error('Error getting position:', error);
      return 0;
    }
  }

  async getDuration() {
    try {
      if (this.sound) {
        const status = await this.sound.getStatusAsync();
        if (status.isLoaded) {
          return (status.durationMillis || 0) / 1000; // Convert to seconds
        }
      }
      return 0;
    } catch (error) {
      console.error('Error getting duration:', error);
      return 0;
    }
  }

  onStateChange(callback: (state: string) => void) {
    // Simple polling implementation for Expo AV
    const interval = setInterval(async () => {
      const state = await this.getState();
      callback(state);
    }, 1000);

    return { remove: () => clearInterval(interval) };
  }

  onTrackChange(callback: (track: Song | null) => void) {
    // Simple implementation - call immediately with current track
    callback(this.currentSong);
    return { remove: () => {} };
  }

  onProgress(callback: (progress: { position: number; duration: number }) => void) {
    // Simple polling implementation for progress
    const interval = setInterval(async () => {
      const position = await this.getPosition();
      const duration = await this.getDuration();
      callback({ position, duration });
    }, 1000);

    return { remove: () => clearInterval(interval) };
  }
}

export const audioService = new AudioService();