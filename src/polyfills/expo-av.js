// Expo AV compatibility polyfill for better audio support in Expo Go

import { Audio } from 'expo-av';

// Enhanced Audio service for Expo Go
export const ExpoAudioService = {
  async setAudioModeAsync(options) {
    try {
      return await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
        ...options,
      });
    } catch (error) {
      console.warn('[Expo Audio] Failed to set audio mode:', error);
    }
  },

  async createSoundAsync(source, initialStatus = {}) {
    try {
      return await Audio.Sound.createAsync(source, {
        shouldPlay: false,
        isLooping: false,
        volume: 1.0,
        rate: 1.0,
        ...initialStatus,
      });
    } catch (error) {
      console.error('[Expo Audio] Failed to create sound:', error);
      throw error;
    }
  },

  // Helper to check if audio is supported
  isAudioSupported() {
    return typeof Audio !== 'undefined' && Audio.Sound;
  },

  // Get audio permissions
  async getPermissionsAsync() {
    try {
      return await Audio.getPermissionsAsync();
    } catch (error) {
      console.warn('[Expo Audio] Failed to get permissions:', error);
      return { status: 'undetermined' };
    }
  },

  // Request audio permissions
  async requestPermissionsAsync() {
    try {
      return await Audio.requestPermissionsAsync();
    } catch (error) {
      console.warn('[Expo Audio] Failed to request permissions:', error);
      return { status: 'denied' };
    }
  },
};

export default ExpoAudioService;