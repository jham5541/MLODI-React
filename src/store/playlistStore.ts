import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { playlistService, Playlist, PlaylistSong, PlaylistCollaborator, CreatePlaylistData, UpdatePlaylistData } from '../services/playlistService';

interface PlaylistState {
  // User playlists
  userPlaylists: Playlist[];
  likedPlaylists: Playlist[];
  collaborativePlaylists: Playlist[];
  
  // Current playlist details
  currentPlaylist: Playlist | null;
  currentPlaylistSongs: PlaylistSong[];
  currentPlaylistCollaborators: PlaylistCollaborator[];
  
  // Loading states
  isLoadingPlaylists: boolean;
  isLoadingPlaylistDetails: boolean;
  isLoadingSongs: boolean;
  isLoadingCollaborators: boolean;
  isCreatingPlaylist: boolean;
  isUpdatingPlaylist: boolean;
  
  // Real-time subscription
  playlistSubscription: any;
  collaboratorSubscription: any;
  
  // Actions
  // Playlist CRUD
  loadUserPlaylists: () => Promise<void>;
  loadLikedPlaylists: () => Promise<void>;
  loadCollaborativePlaylists: () => Promise<void>;
  createPlaylist: (data: CreatePlaylistData) => Promise<Playlist>;
  updatePlaylist: (id: string, data: UpdatePlaylistData) => Promise<Playlist>;
  deletePlaylist: (id: string) => Promise<void>;
  
  // Playlist details
  loadPlaylistDetails: (id: string) => Promise<void>;
  loadPlaylistSongs: (id: string) => Promise<void>;
  loadPlaylistCollaborators: (id: string) => Promise<void>;
  
  // Song management
  addSongToPlaylist: (playlistId: string, songId: string, position?: number) => Promise<void>;
  removeSongFromPlaylist: (playlistId: string, songId: string) => Promise<void>;
  reorderPlaylistSongs: (playlistId: string, songMoves: { songId: string; newPosition: number }[]) => Promise<void>;
  
  // Collaboration
  inviteCollaborator: (playlistId: string, userIdOrAddress: string, role?: 'admin' | 'editor' | 'viewer') => Promise<void>;
  removeCollaborator: (playlistId: string, userId: string) => Promise<void>;
  updateCollaboratorRole: (playlistId: string, userId: string, role: 'admin' | 'editor' | 'viewer') => Promise<void>;
  
  // User interactions
  likePlaylist: (playlistId: string) => Promise<void>;
  unlikePlaylist: (playlistId: string) => Promise<void>;
  
  // Real-time subscriptions
  subscribeToPlaylist: (playlistId: string) => void;
  unsubscribeFromPlaylist: () => void;
  
  // Utility
  clearCurrentPlaylist: () => void;
  findPlaylistById: (id: string) => Playlist | null;
}

export const usePlaylistStore = create<PlaylistState>()(
  persist(
    (set, get) => ({
      // Initial state
      userPlaylists: [],
      likedPlaylists: [],
      collaborativePlaylists: [],
      currentPlaylist: null,
      currentPlaylistSongs: [],
      currentPlaylistCollaborators: [],
      
      isLoadingPlaylists: false,
      isLoadingPlaylistDetails: false,
      isLoadingSongs: false,
      isLoadingCollaborators: false,
      isCreatingPlaylist: false,
      isUpdatingPlaylist: false,
      
      playlistSubscription: null,
      collaboratorSubscription: null,
      
      // Playlist CRUD actions
      loadUserPlaylists: async () => {
        set({ isLoadingPlaylists: true });
        try {
          const playlists = await playlistService.getPlaylists({
            include_owner: true,
            limit: 50,
          });
          set({ userPlaylists: playlists });
        } catch (error) {
          console.error('Failed to load user playlists:', error);
        } finally {
          set({ isLoadingPlaylists: false });
        }
      },
      
      loadLikedPlaylists: async () => {
        try {
          const playlists = await playlistService.getLikedPlaylists();
          set({ likedPlaylists: playlists });
        } catch (error) {
          console.error('Failed to load liked playlists:', error);
        }
      },
      
      loadCollaborativePlaylists: async () => {
        try {
          const playlists = await playlistService.getPlaylists({
            is_collaborative: true,
            include_owner: true,
            limit: 50,
          });
          set({ collaborativePlaylists: playlists });
        } catch (error) {
          console.error('Failed to load collaborative playlists:', error);
        }
      },
      
      createPlaylist: async (data: CreatePlaylistData) => {
        set({ isCreatingPlaylist: true });
        try {
          const playlist = await playlistService.createPlaylist(data);
          
          // Add to user playlists
          set(state => ({
            userPlaylists: [playlist, ...state.userPlaylists],
          }));
          
          return playlist;
        } catch (error) {
          console.error('Failed to create playlist:', error);
          throw error;
        } finally {
          set({ isCreatingPlaylist: false });
        }
      },
      
      updatePlaylist: async (id: string, data: UpdatePlaylistData) => {
        set({ isUpdatingPlaylist: true });
        try {
          const updatedPlaylist = await playlistService.updatePlaylist(id, data);
          
          // Update in all relevant arrays
          set(state => ({
            userPlaylists: state.userPlaylists.map(p => 
              p.id === id ? updatedPlaylist : p
            ),
            likedPlaylists: state.likedPlaylists.map(p => 
              p.id === id ? updatedPlaylist : p
            ),
            collaborativePlaylists: state.collaborativePlaylists.map(p => 
              p.id === id ? updatedPlaylist : p
            ),
            currentPlaylist: state.currentPlaylist?.id === id ? updatedPlaylist : state.currentPlaylist,
          }));
          
          return updatedPlaylist;
        } catch (error) {
          console.error('Failed to update playlist:', error);
          throw error;
        } finally {
          set({ isUpdatingPlaylist: false });
        }
      },
      
      deletePlaylist: async (id: string) => {
        try {
          await playlistService.deletePlaylist(id);
          
          // Remove from all arrays
          set(state => ({
            userPlaylists: state.userPlaylists.filter(p => p.id !== id),
            likedPlaylists: state.likedPlaylists.filter(p => p.id !== id),
            collaborativePlaylists: state.collaborativePlaylists.filter(p => p.id !== id),
            currentPlaylist: state.currentPlaylist?.id === id ? null : state.currentPlaylist,
            currentPlaylistSongs: state.currentPlaylist?.id === id ? [] : state.currentPlaylistSongs,
            currentPlaylistCollaborators: state.currentPlaylist?.id === id ? [] : state.currentPlaylistCollaborators,
          }));
        } catch (error) {
          console.error('Failed to delete playlist:', error);
          throw error;
        }
      },
      
      // Playlist details actions
      loadPlaylistDetails: async (id: string) => {
        set({ isLoadingPlaylistDetails: true });
        try {
          const playlist = await playlistService.getPlaylist(id, true);
          set({ currentPlaylist: playlist });
          
          // Load songs and collaborators concurrently
          await Promise.all([
            get().loadPlaylistSongs(id),
            playlist.is_collaborative ? get().loadPlaylistCollaborators(id) : Promise.resolve(),
          ]);
        } catch (error) {
          console.error('Failed to load playlist details:', error);
          throw error;
        } finally {
          set({ isLoadingPlaylistDetails: false });
        }
      },
      
      loadPlaylistSongs: async (id: string) => {
        set({ isLoadingSongs: true });
        try {
          const songs = await playlistService.getPlaylistSongs(id);
          set({ currentPlaylistSongs: songs });
        } catch (error) {
          console.error('Failed to load playlist songs:', error);
        } finally {
          set({ isLoadingSongs: false });
        }
      },
      
      loadPlaylistCollaborators: async (id: string) => {
        set({ isLoadingCollaborators: true });
        try {
          const collaborators = await playlistService.getPlaylistCollaborators(id);
          set({ currentPlaylistCollaborators: collaborators });
        } catch (error) {
          console.error('Failed to load playlist collaborators:', error);
        } finally {
          set({ isLoadingCollaborators: false });
        }
      },
      
      // Song management actions
      addSongToPlaylist: async (playlistId: string, songId: string, position?: number) => {
        try {
          const playlistSong = await playlistService.addSongToPlaylist(playlistId, songId, position);
          
          // Update current playlist songs if viewing this playlist
          if (get().currentPlaylist?.id === playlistId) {
            set(state => ({
              currentPlaylistSongs: [...state.currentPlaylistSongs, playlistSong]
                .sort((a, b) => a.position - b.position),
            }));
          }
          
          // Update playlist in lists (increment track count)
          const updatePlaylistInArray = (playlists: Playlist[]) =>
            playlists.map(p => 
              p.id === playlistId 
                ? { ...p, total_tracks: p.total_tracks + 1 }
                : p
            );
          
          set(state => ({
            userPlaylists: updatePlaylistInArray(state.userPlaylists),
            likedPlaylists: updatePlaylistInArray(state.likedPlaylists),
            collaborativePlaylists: updatePlaylistInArray(state.collaborativePlaylists),
          }));
        } catch (error) {
          console.error('Failed to add song to playlist:', error);
          throw error;
        }
      },
      
      removeSongFromPlaylist: async (playlistId: string, songId: string) => {
        try {
          await playlistService.removeSongFromPlaylist(playlistId, songId);
          
          // Update current playlist songs if viewing this playlist
          if (get().currentPlaylist?.id === playlistId) {
            set(state => ({
              currentPlaylistSongs: state.currentPlaylistSongs.filter(ps => ps.song_id !== songId),
            }));
          }
          
          // Update playlist in lists (decrement track count)
          const updatePlaylistInArray = (playlists: Playlist[]) =>
            playlists.map(p => 
              p.id === playlistId 
                ? { ...p, total_tracks: Math.max(0, p.total_tracks - 1) }
                : p
            );
          
          set(state => ({
            userPlaylists: updatePlaylistInArray(state.userPlaylists),
            likedPlaylists: updatePlaylistInArray(state.likedPlaylists),
            collaborativePlaylists: updatePlaylistInArray(state.collaborativePlaylists),
          }));
        } catch (error) {
          console.error('Failed to remove song from playlist:', error);
          throw error;
        }
      },
      
      reorderPlaylistSongs: async (playlistId: string, songMoves: { songId: string; newPosition: number }[]) => {
        try {
          await playlistService.reorderPlaylistSongs(playlistId, songMoves);
          
          // Update current playlist songs order
          if (get().currentPlaylist?.id === playlistId) {
            set(state => {
              const updatedSongs = [...state.currentPlaylistSongs];
              songMoves.forEach(move => {
                const songIndex = updatedSongs.findIndex(ps => ps.song_id === move.songId);
                if (songIndex !== -1) {
                  updatedSongs[songIndex] = { ...updatedSongs[songIndex], position: move.newPosition };
                }
              });
              return {
                currentPlaylistSongs: updatedSongs.sort((a, b) => a.position - b.position),
              };
            });
          }
        } catch (error) {
          console.error('Failed to reorder playlist songs:', error);
          throw error;
        }
      },
      
      // Collaboration actions
      inviteCollaborator: async (playlistId: string, userIdOrAddress: string, role: 'admin' | 'editor' | 'viewer' = 'editor') => {
        try {
          const collaborator = await playlistService.inviteCollaborator(playlistId, userIdOrAddress, role);
          
          // Update current playlist collaborators if viewing this playlist
          if (get().currentPlaylist?.id === playlistId) {
            set(state => ({
              currentPlaylistCollaborators: [...state.currentPlaylistCollaborators, collaborator],
            }));
          }
        } catch (error) {
          console.error('Failed to invite collaborator:', error);
          throw error;
        }
      },
      
      removeCollaborator: async (playlistId: string, userId: string) => {
        try {
          await playlistService.removeCollaborator(playlistId, userId);
          
          // Update current playlist collaborators if viewing this playlist
          if (get().currentPlaylist?.id === playlistId) {
            set(state => ({
              currentPlaylistCollaborators: state.currentPlaylistCollaborators.filter(c => c.user_id !== userId),
            }));
          }
        } catch (error) {
          console.error('Failed to remove collaborator:', error);
          throw error;
        }
      },
      
      updateCollaboratorRole: async (playlistId: string, userId: string, role: 'admin' | 'editor' | 'viewer') => {
        try {
          await playlistService.updateCollaboratorRole(playlistId, userId, role);
          
          // Update current playlist collaborators if viewing this playlist
          if (get().currentPlaylist?.id === playlistId) {
            set(state => ({
              currentPlaylistCollaborators: state.currentPlaylistCollaborators.map(c =>
                c.user_id === userId ? { ...c, role } : c
              ),
            }));
          }
        } catch (error) {
          console.error('Failed to update collaborator role:', error);
          throw error;
        }
      },
      
      // User interaction actions
      likePlaylist: async (playlistId: string) => {
        try {
          await playlistService.likePlaylist(playlistId);
          
          // Find playlist and add to liked playlists
          const playlist = get().findPlaylistById(playlistId);
          if (playlist) {
            set(state => ({
              likedPlaylists: [playlist, ...state.likedPlaylists.filter(p => p.id !== playlistId)],
            }));
          }
        } catch (error) {
          console.error('Failed to like playlist:', error);
          throw error;
        }
      },
      
      unlikePlaylist: async (playlistId: string) => {
        try {
          await playlistService.unlikePlaylist(playlistId);
          
          // Remove from liked playlists
          set(state => ({
            likedPlaylists: state.likedPlaylists.filter(p => p.id !== playlistId),
          }));
        } catch (error) {
          console.error('Failed to unlike playlist:', error);
          throw error;
        }
      },
      
      // Real-time subscription actions
      subscribeToPlaylist: (playlistId: string) => {
        // Unsubscribe from previous subscriptions
        get().unsubscribeFromPlaylist();
        
        // Subscribe to playlist changes
        const playlistSub = playlistService.subscribeToPlaylist(playlistId, (payload) => {
          console.log('Playlist change:', payload);
          // Reload playlist songs when changes occur
          if (get().currentPlaylist?.id === playlistId) {
            get().loadPlaylistSongs(playlistId);
          }
        });
        
        // Subscribe to collaborator changes
        const collaboratorSub = playlistService.subscribeToCollaborators(playlistId, (payload) => {
          console.log('Collaborator change:', payload);
          // Reload collaborators when changes occur
          if (get().currentPlaylist?.id === playlistId) {
            get().loadPlaylistCollaborators(playlistId);
          }
        });
        
        set({
          playlistSubscription: playlistSub,
          collaboratorSubscription: collaboratorSub,
        });
      },
      
      unsubscribeFromPlaylist: () => {
        const { playlistSubscription, collaboratorSubscription } = get();
        
        if (playlistSubscription) {
          playlistSubscription.unsubscribe();
        }
        
        if (collaboratorSubscription) {
          collaboratorSubscription.unsubscribe();
        }
        
        set({
          playlistSubscription: null,
          collaboratorSubscription: null,
        });
      },
      
      // Utility actions
      clearCurrentPlaylist: () => {
        get().unsubscribeFromPlaylist();
        set({
          currentPlaylist: null,
          currentPlaylistSongs: [],
          currentPlaylistCollaborators: [],
        });
      },
      
      findPlaylistById: (id: string) => {
        const { userPlaylists, likedPlaylists, collaborativePlaylists } = get();
        return [...userPlaylists, ...likedPlaylists, ...collaborativePlaylists]
          .find(p => p.id === id) || null;
      },
    }),
    {
      name: 'playlist-store',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist user playlists and liked playlists
      partialize: (state) => ({
        userPlaylists: state.userPlaylists,
        likedPlaylists: state.likedPlaylists,
      }),
    }
  )
);