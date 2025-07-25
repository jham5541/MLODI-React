import { useEffect } from 'react';
import { useMusicStore } from '../store/musicStore';
import { useMarketplaceStore } from '../store/marketplaceStore';
import { useFanEngagementStore } from '../store/fanEngagementStore';
import { usePlaylistStore } from '../store/playlistStore';
import { realtimeService } from '../services/realtimeService';

interface UseRealtimeOptions {
  // Music features
  enableLiveListeners?: boolean;
  enableArtistListeners?: string[]; // artist IDs to subscribe to
  
  // Marketplace features
  enableMarketplaceUpdates?: boolean;
  
  // Fan engagement features
  enableFanEngagement?: string[]; // artist IDs to subscribe to
  
  // Playlist features
  enablePlaylistUpdates?: string; // playlist ID to subscribe to
  
  // User notifications
  enableUserNotifications?: boolean;
  
  // Artist activity
  enableArtistActivity?: string[]; // artist IDs to subscribe to
  
  // Radio stations
  enableRadioStation?: string; // station ID to subscribe to
}

export const useRealtime = (options: UseRealtimeOptions = {}) => {
  const {
    subscribeToLiveListeners,
    subscribeToArtistListeners,
    unsubscribeFromRealtime: unsubscribeMusic,
  } = useMusicStore();

  const {
    subscribeToMarketplace,
    unsubscribeFromMarketplace,
  } = useMarketplaceStore();

  const {
    subscribeToFanEngagement,
    unsubscribeFromFanEngagement,
    unsubscribeAll: unsubscribeFanEngagement,
  } = useFanEngagementStore();

  const {
    subscribeToPlaylist,
    unsubscribeFromPlaylist,
  } = usePlaylistStore();

  useEffect(() => {
    // Subscribe to live listeners
    if (options.enableLiveListeners) {
      subscribeToLiveListeners();
    }

    // Subscribe to artist listeners
    if (options.enableArtistListeners && options.enableArtistListeners.length > 0) {
      options.enableArtistListeners.forEach(artistId => {
        subscribeToArtistListeners(artistId);
      });
    }

    // Subscribe to marketplace updates
    if (options.enableMarketplaceUpdates) {
      subscribeToMarketplace();
    }

    // Subscribe to fan engagement
    if (options.enableFanEngagement && options.enableFanEngagement.length > 0) {
      options.enableFanEngagement.forEach(artistId => {
        subscribeToFanEngagement(artistId);
      });
    }

    // Subscribe to playlist updates
    if (options.enablePlaylistUpdates) {
      subscribeToPlaylist(options.enablePlaylistUpdates);
    }

    // Subscribe to user notifications
    if (options.enableUserNotifications) {
      // TODO: Add user notifications subscription
      // This would require getting the current user ID from auth
    }

    // Subscribe to artist activity
    if (options.enableArtistActivity && options.enableArtistActivity.length > 0) {
      realtimeService.subscribeToArtistActivity(options.enableArtistActivity, (activity) => {
        console.log('Artist activity:', activity);
        // Could dispatch to a dedicated artist activity store or handle directly
      });
    }

    // Subscribe to radio station
    if (options.enableRadioStation) {
      realtimeService.subscribeToRadioStation(options.enableRadioStation, (update) => {
        console.log('Radio station update:', update);
        // Could dispatch to a dedicated radio store or handle directly
      });
    }

    // Cleanup function
    return () => {
      if (options.enableLiveListeners || options.enableArtistListeners) {
        unsubscribeMusic();
      }
      
      if (options.enableMarketplaceUpdates) {
        unsubscribeFromMarketplace();
      }
      
      if (options.enableFanEngagement) {
        unsubscribeFanEngagement();
      }
      
      if (options.enablePlaylistUpdates) {
        unsubscribeFromPlaylist();
      }
      
      // Cleanup individual subscriptions from realtimeService
      if (options.enableArtistActivity) {
        realtimeService.unsubscribe('artist-activity');
      }
      
      if (options.enableRadioStation) {
        realtimeService.unsubscribe(`radio-station:${options.enableRadioStation}`);
      }
    };
  }, [
    options.enableLiveListeners,
    JSON.stringify(options.enableArtistListeners || []),
    options.enableMarketplaceUpdates,
    JSON.stringify(options.enableFanEngagement || []),
    options.enablePlaylistUpdates,
    options.enableUserNotifications,
    JSON.stringify(options.enableArtistActivity || []),
    options.enableRadioStation,
  ]);

  // Return helper functions for manual subscription management
  return {
    // Manual subscription controls
    subscribeToLiveListeners,
    subscribeToArtistListeners,
    subscribeToMarketplace,
    subscribeToFanEngagement,
    subscribeToPlaylist,
    
    // Unsubscribe functions
    unsubscribeMusic,
    unsubscribeFromMarketplace,
    unsubscribeFromFanEngagement,
    unsubscribeFromPlaylist,
    
    // Service-level controls
    subscribeToArtistActivity: (artistIds: string[], callback: (activity: any) => void) => {
      return realtimeService.subscribeToArtistActivity(artistIds, callback);
    },
    
    subscribeToRadioStation: (stationId: string, callback: (update: any) => void) => {
      return realtimeService.subscribeToRadioStation(stationId, callback);
    },
    
    subscribeToUserNotifications: (userId: string, callback: (notification: any) => void) => {
      return realtimeService.subscribeToUserNotifications(userId, callback);
    },
    
    // Global cleanup
    unsubscribeAll: () => {
      unsubscribeMusic();
      unsubscribeFromMarketplace();
      unsubscribeFanEngagement();
      unsubscribeFromPlaylist();
      realtimeService.unsubscribeAll();
    },
    
    // Get active subscriptions info
    getActiveChannels: () => realtimeService.getActiveChannels(),
  };
};

// Specialized hooks for specific features
export const useLiveListeners = () => {
  const { liveListeners, subscribeToLiveListeners, unsubscribeFromRealtime } = useMusicStore();
  
  useEffect(() => {
    subscribeToLiveListeners();
    return () => unsubscribeFromRealtime();
  }, []);
  
  return liveListeners;
};

export const useArtistListeners = (artistId: string) => {
  const { artistListeners, subscribeToArtistListeners, unsubscribeFromRealtime } = useMusicStore();
  
  useEffect(() => {
    if (artistId) {
      subscribeToArtistListeners(artistId);
    }
    return () => unsubscribeFromRealtime();
  }, [artistId]);
  
  return artistListeners[artistId] || [];
};

export const useMarketplaceLive = () => {
  const { liveUpdates, subscribeToMarketplace, unsubscribeFromMarketplace } = useMarketplaceStore();
  
  useEffect(() => {
    subscribeToMarketplace();
    return () => unsubscribeFromMarketplace();
  }, []);
  
  return liveUpdates;
};

export const useFanEngagementLive = (artistId: string) => {
  const { 
    liveEngagementUpdates, 
    subscribeToFanEngagement, 
    unsubscribeFromFanEngagement 
  } = useFanEngagementStore();
  
  useEffect(() => {
    if (artistId) {
      subscribeToFanEngagement(artistId);
    }
    return () => {
      if (artistId) {
        unsubscribeFromFanEngagement(artistId);
      }
    };
  }, [artistId]);
  
  return liveEngagementUpdates;
};

export const usePlaylistLive = (playlistId: string) => {
  const { subscribeToPlaylist, unsubscribeFromPlaylist } = usePlaylistStore();
  
  useEffect(() => {
    if (playlistId) {
      subscribeToPlaylist(playlistId);
    }
    return () => unsubscribeFromPlaylist();
  }, [playlistId]);
  
  // Return current playlist state from store
  const { currentPlaylist, currentPlaylistSongs, currentPlaylistCollaborators } = usePlaylistStore();
  return { currentPlaylist, currentPlaylistSongs, currentPlaylistCollaborators };
};

export default useRealtime;