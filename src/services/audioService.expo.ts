// Mock Audio Service for Expo Go compatibility
import { Platform } from 'react-native';
import { Song } from '../types/music';

// Mock track player states
export const State = {
  None: 'none',
  Stopped: 'stopped',
  Paused: 'paused',
  Playing: 'playing',
  Ready: 'ready',
  Buffering: 'buffering',
  Connecting: 'connecting',
} as const;

class MockAudioService {
  private isInitialized = false;
  private currentTrack: Song | null = null;
  private isPlaying = false;
  private position = 0;
  private duration = 0;

  async initialize() {
    if (this.isInitialized) return;
    console.log('[Mock Audio] Service initialized');
    this.isInitialized = true;
  }

  async play(song?: Song) {
    if (song) {
      this.currentTrack = song;
      console.log('[Mock Audio] Playing:', song.title);
    }
    this.isPlaying = true;
    console.log('[Mock Audio] Play resumed');
  }

  async pause() {
    this.isPlaying = false;
    console.log('[Mock Audio] Paused');
  }

  async stop() {
    this.isPlaying = false;
    this.position = 0;
    console.log('[Mock Audio] Stopped');
  }

  async seekTo(position: number) {
    this.position = position;
    console.log('[Mock Audio] Seeked to:', position);
  }

  async setVolume(volume: number) {
    console.log('[Mock Audio] Volume set to:', volume);
  }

  async addToQueue(songs: Song[]) {
    console.log('[Mock Audio] Added to queue:', songs.length, 'songs');
  }

  async clearQueue() {
    console.log('[Mock Audio] Queue cleared');
  }

  async skipToNext() {
    console.log('[Mock Audio] Skipped to next');
  }

  async skipToPrevious() {
    console.log('[Mock Audio] Skipped to previous');
  }

  // Mock getters
  getCurrentTrack(): Song | null {
    return this.currentTrack;
  }

  getPosition(): number {
    return this.position;
  }

  getDuration(): number {
    return this.currentTrack?.duration || 0;
  }

  getState(): string {
    if (!this.currentTrack) return State.None;
    return this.isPlaying ? State.Playing : State.Paused;
  }

  isPlayerPlaying(): boolean {
    return this.isPlaying;
  }

  // Mock event listeners
  addEventListener(event: string, callback: Function) {
    console.log('[Mock Audio] Event listener added:', event);
  }

  removeEventListener(event: string, callback: Function) {
    // Only log if not a BackHandler event on non-Android platforms
    if (!(event === 'hardwareBackPress' && Platform.OS !== 'android')) {
      console.log('[Mock Audio] Event listener removed:', event);
    }
  }
}

export const audioService = new MockAudioService();
export default audioService;

// Premium URL helper with 5-minute cache
import { supabase } from '../lib/supabase/client';
const AUDIO_URL_TTL_MS = 5 * 60 * 1000;
const signedUrlCache = new Map<string, { url: string; expiresAt: number }>();

export async function getPlayableAudioUrl(trackId: string): Promise<string> {
  const now = Date.now();
  const cached = signedUrlCache.get(trackId);
  if (cached && cached.expiresAt > now + 10_000) return cached.url;

  const { data, error } = await supabase.rpc('get_signed_track_url', { p_track_id: trackId });
  if (error) throw error;
  const url = data as string;
  signedUrlCache.set(trackId, { url, expiresAt: now + AUDIO_URL_TTL_MS });
  return url;
}
