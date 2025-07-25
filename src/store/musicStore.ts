import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { musicService, Artist, Song, Album } from '../services/musicService';
import { realtimeService } from '../services/realtimeService';

interface MusicState {
  // Current playing
  currentSong: Song | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  queue: Song[];
  queueIndex: number;
  shuffleMode: boolean;
  repeatMode: 'off' | 'one' | 'all';

  // Content
  trendingSongs: Song[];
  popularSongs: Song[];
  recentSongs: Song[];
  likedSongs: Song[];
  followedArtists: Artist[];
  recommendedSongs: Song[];

  // Search
  searchResults: {
    artists: Artist[];
    albums: Album[];
    songs: Song[];
  };
  searchQuery: string;
  isSearching: boolean;

  // Loading states
  isLoadingTrending: boolean;
  isLoadingPopular: boolean;
  isLoadingRecent: boolean;
  isLoadingLiked: boolean;
  isLoadingRecommended: boolean;
  isLoadingFollowed: boolean;

  // Real-time features
  liveListeners: any[];
  currentListeningSession: any;
  artistListeners: Record<string, any[]>; // artistId -> listeners[]

  // Actions
  // Playback control
  playSong: (song: Song, queue?: Song[], startIndex?: number) => void;
  pauseSong: () => void;
  resumeSong: () => void;
  stopSong: () => void;
  seekTo: (time: number) => void;
  setVolume: (volume: number) => void;
  nextSong: () => void;
  previousSong: () => void;
  toggleShuffle: () => void;
  setRepeatMode: (mode: 'off' | 'one' | 'all') => void;
  updatePlaybackState: (currentTime: number, duration: number) => void;

  // Content loading
  loadTrendingSongs: () => Promise<void>;
  loadPopularSongs: () => Promise<void>;
  loadRecentSongs: () => Promise<void>;
  loadLikedSongs: () => Promise<void>;
  loadFollowedArtists: () => Promise<void>;
  loadRecommendations: () => Promise<void>;

  // User interactions
  likeSong: (songId: string) => Promise<void>;
  unlikeSong: (songId: string) => Promise<void>;
  followArtist: (artistId: string) => Promise<void>;
  unfollowArtist: (artistId: string) => Promise<void>;

  // Search
  searchMusic: (query: string) => Promise<void>;
  clearSearch: () => void;

  // Playback tracking
  recordPlay: (songId: string, durationMs: number, completionPercentage: number) => Promise<void>;

  // Real-time subscriptions
  subscribeToLiveListeners: () => void;
  subscribeToArtistListeners: (artistId: string) => void;
  unsubscribeFromRealtime: () => void;
  startListeningSession: (song: Song) => Promise<void>;
  endListeningSession: () => Promise<void>;
}

export const useMusicStore = create<MusicState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentSong: null,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      volume: 1.0,
      queue: [],
      queueIndex: 0,
      shuffleMode: false,
      repeatMode: 'off',

      trendingSongs: [],
      popularSongs: [],
      recentSongs: [],
      likedSongs: [],
      followedArtists: [],
      recommendedSongs: [],

      searchResults: {
        artists: [],
        albums: [],
        songs: [],
      },
      searchQuery: '',
      isSearching: false,

      isLoadingTrending: false,
      isLoadingPopular: false,
      isLoadingRecent: false,
      isLoadingLiked: false,
      isLoadingRecommended: false,
      isLoadingFollowed: false,

      // Real-time state
      liveListeners: [],
      currentListeningSession: null,
      artistListeners: {},

      // Playback control actions
      playSong: (song: Song, queue?: Song[], startIndex?: number) => {
        const newQueue = queue || [song];
        const index = startIndex !== undefined ? startIndex : newQueue.findIndex(s => s.id === song.id);
        
        // End current listening session if any
        get().endListeningSession();
        
        set({
          currentSong: song,
          isPlaying: true,
          queue: newQueue,
          queueIndex: index,
          currentTime: 0,
        });

        // Start new listening session
        get().startListeningSession(song);

        // Record play after a few seconds
        setTimeout(() => {
          get().recordPlay(song.id, 0, 0);
        }, 3000);
      },

      pauseSong: () => {
        set({ isPlaying: false });
      },

      resumeSong: () => {
        set({ isPlaying: true });
      },

      stopSong: () => {
        const state = get();
        if (state.currentSong) {
          get().recordPlay(
            state.currentSong.id,
            state.currentTime * 1000,
            state.duration > 0 ? (state.currentTime / state.duration) * 100 : 0
          );
        }
        
        set({
          currentSong: null,
          isPlaying: false,
          currentTime: 0,
          duration: 0,
        });
      },

      seekTo: (time: number) => {
        set({ currentTime: time });
      },

      setVolume: (volume: number) => {
        set({ volume });
      },

      nextSong: () => {
        const { queue, queueIndex, shuffleMode, repeatMode } = get();
        let nextIndex = queueIndex;

        if (repeatMode === 'one') {
          // Repeat current song
          const currentSong = queue[queueIndex];
          if (currentSong) {
            get().playSong(currentSong, queue, queueIndex);
          }
          return;
        }

        if (shuffleMode) {
          // Random next song
          nextIndex = Math.floor(Math.random() * queue.length);
        } else {
          nextIndex = queueIndex + 1;
          if (nextIndex >= queue.length) {
            if (repeatMode === 'all') {
              nextIndex = 0;
            } else {
              get().stopSong();
              return;
            }
          }
        }

        const nextSong = queue[nextIndex];
        if (nextSong) {
          get().playSong(nextSong, queue, nextIndex);
        }
      },

      previousSong: () => {
        const { queue, queueIndex, currentTime } = get();
        
        // If more than 3 seconds into song, restart current song
        if (currentTime > 3) {
          set({ currentTime: 0 });
          return;
        }

        let prevIndex = queueIndex - 1;
        if (prevIndex < 0) {
          prevIndex = queue.length - 1;
        }

        const prevSong = queue[prevIndex];
        if (prevSong) {
          get().playSong(prevSong, queue, prevIndex);
        }
      },

      toggleShuffle: () => {
        set(state => ({ shuffleMode: !state.shuffleMode }));
      },

      setRepeatMode: (mode: 'off' | 'one' | 'all') => {
        set({ repeatMode: mode });
      },

      updatePlaybackState: (currentTime: number, duration: number) => {
        set({ currentTime, duration });
      },

      // Content loading actions
      loadTrendingSongs: async () => {
        set({ isLoadingTrending: true });
        try {
          const songs = await musicService.getTrendingSongs(20);
          set({ trendingSongs: songs });
        } catch (error) {
          console.error('Failed to load trending songs:', error);
        } finally {
          set({ isLoadingTrending: false });
        }
      },

      loadPopularSongs: async () => {
        set({ isLoadingPopular: true });
        try {
          const songs = await musicService.getPopularSongs(20);
          set({ popularSongs: songs });
        } catch (error) {
          console.error('Failed to load popular songs:', error);
        } finally {
          set({ isLoadingPopular: false });
        }
      },

      loadRecentSongs: async () => {
        set({ isLoadingRecent: true });
        try {
          const songs = await musicService.getRecentSongs(20);
          set({ recentSongs: songs });
        } catch (error) {
          console.error('Failed to load recent songs:', error);
        } finally {
          set({ isLoadingRecent: false });
        }
      },

      loadLikedSongs: async () => {
        set({ isLoadingLiked: true });
        try {
          const songs = await musicService.getLikedSongs();
          set({ likedSongs: songs });
        } catch (error) {
          console.error('Failed to load liked songs:', error);
        } finally {
          set({ isLoadingLiked: false });
        }
      },

      loadFollowedArtists: async () => {
        set({ isLoadingFollowed: true });
        try {
          const artists = await musicService.getFollowedArtists();
          set({ followedArtists: artists });
        } catch (error) {
          console.error('Failed to load followed artists:', error);
        } finally {
          set({ isLoadingFollowed: false });
        }
      },

      loadRecommendations: async () => {
        set({ isLoadingRecommended: true });
        try {
          const songs = await musicService.getRecommendations({
            limit: 20,
            based_on_history: true,
          });
          set({ recommendedSongs: songs });
        } catch (error) {
          console.error('Failed to load recommendations:', error);
        } finally {
          set({ isLoadingRecommended: false });
        }
      },

      // User interaction actions
      likeSong: async (songId: string) => {
        try {
          await musicService.likeSong(songId);
          
          // Update liked songs in store
          const song = [...get().trendingSongs, ...get().popularSongs, ...get().recentSongs]
            .find(s => s.id === songId);
          
          if (song) {
            set(state => ({ 
              likedSongs: [song, ...state.likedSongs.filter(s => s.id !== songId)]
            }));
          }
        } catch (error) {
          console.error('Failed to like song:', error);
          throw error;
        }
      },

      unlikeSong: async (songId: string) => {
        try {
          await musicService.unlikeSong(songId);
          
          // Remove from liked songs
          set(state => ({ 
            likedSongs: state.likedSongs.filter(s => s.id !== songId)
          }));
        } catch (error) {
          console.error('Failed to unlike song:', error);
          throw error;
        }
      },

      followArtist: async (artistId: string) => {
        try {
          await musicService.followArtist(artistId);
          
          // Reload followed artists
          get().loadFollowedArtists();
        } catch (error) {
          console.error('Failed to follow artist:', error);
          throw error;
        }
      },

      unfollowArtist: async (artistId: string) => {
        try {
          await musicService.unfollowArtist(artistId);
          
          // Remove from followed artists
          set(state => ({ 
            followedArtists: state.followedArtists.filter(a => a.id !== artistId)
          }));
        } catch (error) {
          console.error('Failed to unfollow artist:', error);
          throw error;
        }
      },

      // Search actions
      searchMusic: async (query: string) => {
        if (!query.trim()) {
          get().clearSearch();
          return;
        }

        set({ isSearching: true, searchQuery: query });
        
        try {
          const results = await musicService.searchAll(query, {
            include_artists: true,
            include_albums: true,
            include_songs: true,
            limit: 10,
          });

          set({
            searchResults: {
              artists: results.artists || [],
              albums: results.albums || [],
              songs: results.songs || [],
            },
          });
        } catch (error) {
          console.error('Failed to search:', error);
        } finally {
          set({ isSearching: false });
        }
      },

      clearSearch: () => {
        set({
          searchResults: {
            artists: [],
            albums: [],
            songs: [],
          },
          searchQuery: '',
          isSearching: false,
        });
      },

      // Playback tracking
      recordPlay: async (songId: string, durationMs: number, completionPercentage: number) => {
        try {
          await musicService.recordPlay(songId, durationMs, completionPercentage);
        } catch (error) {
          console.error('Failed to record play:', error);
        }
      },

      // Real-time subscription methods
      subscribeToLiveListeners: () => {
        realtimeService.subscribeToListeningSessions((sessions) => {
          set({ liveListeners: sessions });
        });
      },

      subscribeToArtistListeners: (artistId: string) => {
        realtimeService.subscribeToArtistListeners(artistId, (sessions) => {
          set(state => ({
            artistListeners: {
              ...state.artistListeners,
              [artistId]: sessions,
            },
          }));
        });
      },

      unsubscribeFromRealtime: () => {
        realtimeService.unsubscribeAll();
        set({
          liveListeners: [],
          artistListeners: {},
          currentListeningSession: null,
        });
      },

      startListeningSession: async (song: Song) => {
        try {
          const session = await realtimeService.startListeningSession(song.id, song.artist_id);
          set({ currentListeningSession: session });
        } catch (error) {
          console.error('Failed to start listening session:', error);
        }
      },

      endListeningSession: async () => {
        try {
          const { currentListeningSession } = get();
          if (currentListeningSession) {
            await realtimeService.endListeningSession(currentListeningSession.id);
            set({ currentListeningSession: null });
          }
        } catch (error) {
          console.error('Failed to end listening session:', error);
        }
      },
    }),
    {
      name: 'music-store',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist certain fields
      partialize: (state) => ({
        currentSong: state.currentSong,
        queue: state.queue,
        queueIndex: state.queueIndex,
        volume: state.volume,
        shuffleMode: state.shuffleMode,
        repeatMode: state.repeatMode,
        likedSongs: state.likedSongs,
        followedArtists: state.followedArtists,
      }),
    }
  )
);