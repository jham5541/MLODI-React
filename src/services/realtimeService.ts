import { supabase } from '../lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

interface ListeningSession {
  user_id: string;
  song_id: string;
  artist_id: string;
  started_at: string;
  is_active: boolean;
  user: {
    display_name?: string;
    avatar_url?: string;
  };
  song: {
    title: string;
    artist_name: string;
    cover_url?: string;
  };
}

interface FanEngagementUpdate {
  id: string;
  user_id: string;
  artist_id: string;
  activity_type: string;
  points_earned: number;
  tier_updated: boolean;
  achievement_unlocked?: string;
  created_at: string;
}

interface MarketplaceUpdate {
  id: string;
  type: 'new_listing' | 'price_change' | 'sale' | 'bid_placed';
  listing_id: string;
  listing: {
    id: string;
    price: number;
    currency: string;
    song?: {
      title: string;
      artist_name: string;
    };
  };
  created_at: string;
}

interface ArtistActivity {
  id: string;
  artist_id: string;
  activity_type: 'new_song' | 'new_album' | 'live_session' | 'announcement';
  data: any;
  created_at: string;
  artist: {
    name: string;
    avatar_url?: string;
  };
}

class RealtimeService {
  private channels: Map<string, RealtimeChannel> = new Map();

  // Live listening sessions - see who's listening to what in real-time
  subscribeToListeningSessions(callback: (sessions: ListeningSession[]) => void) {
    const channelName = 'listening-sessions';
    
    if (this.channels.has(channelName)) {
      this.channels.get(channelName)?.unsubscribe();
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'listening_sessions',
          filter: 'is_active=eq.true',
        },
        async (payload) => {
          // Reload active sessions with user and song details
          const { data, error } = await supabase
            .from('listening_sessions')
            .select(`
              *,
              user:users(display_name, avatar_url),
              song:songs(title, artist_name, cover_url)
            `)
            .eq('is_active', true)
            .order('started_at', { ascending: false })
            .limit(50);

          if (!error && data) {
            callback(data as ListeningSession[]);
          }
        }
      )
      .subscribe();

    this.channels.set(channelName, channel);
    return channel;
  }

  // Artist-specific listening sessions (for fan engagement)
  subscribeToArtistListeners(artistId: string, callback: (sessions: ListeningSession[]) => void) {
    const channelName = `artist-listeners:${artistId}`;
    
    if (this.channels.has(channelName)) {
      this.channels.get(channelName)?.unsubscribe();
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'listening_sessions',
          filter: `artist_id=eq.${artistId}`,
        },
        async (payload) => {
          // Reload artist's active listeners
          const { data, error } = await supabase
            .from('listening_sessions')
            .select(`
              *,
              user:users(display_name, avatar_url),
              song:songs(title, artist_name, cover_url)
            `)
            .eq('artist_id', artistId)
            .eq('is_active', true)
            .order('started_at', { ascending: false });

          if (!error && data) {
            callback(data as ListeningSession[]);
          }
        }
      )
      .subscribe();

    this.channels.set(channelName, channel);
    return channel;
  }

  // Fan engagement real-time updates
  subscribeToFanEngagement(
    artistId: string, 
    callback: (update: FanEngagementUpdate) => void
  ) {
    const channelName = `fan-engagement:${artistId}`;
    
    if (this.channels.has(channelName)) {
      this.channels.get(channelName)?.unsubscribe();
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'fan_activity_log',
          filter: `artist_id=eq.${artistId}`,
        },
        (payload) => {
          if (payload.new) {
            callback(payload.new as FanEngagementUpdate);
          }
        }
      )
      .subscribe();

    this.channels.set(channelName, channel);
    return channel;
  }

  // Marketplace real-time updates
  subscribeToMarketplace(callback: (update: MarketplaceUpdate) => void) {
    const channelName = 'marketplace-updates';
    
    if (this.channels.has(channelName)) {
      this.channels.get(channelName)?.unsubscribe();
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'nft_listings',
        },
        async (payload) => {
          let updateType: MarketplaceUpdate['type'] = 'new_listing';
          
          if (payload.eventType === 'INSERT') {
            updateType = 'new_listing';
          } else if (payload.eventType === 'UPDATE' && payload.old && payload.new) {
            if (payload.old.price !== payload.new.price) {
              updateType = 'price_change';
            }
            if (payload.new.status === 'sold') {
              updateType = 'sale';
            }
          }

          // Get listing details with song info
          const { data: listing, error } = await supabase
            .from('nft_listings')
            .select(`
              id,
              price,
              currency,
              song:songs(title, artist_name)
            `)
            .eq('id', payload.new?.id || payload.old?.id)
            .single();

          if (!error && listing) {
            callback({
              id: `${Date.now()}-${Math.random()}`,
              type: updateType,
              listing_id: listing.id,
              listing,
              created_at: new Date().toISOString(),
            });
          }
        }
      )
      .subscribe();

    this.channels.set(channelName, channel);
    return channel;
  }

  // Artist activity updates for followers
  subscribeToArtistActivity(
    artistIds: string[], 
    callback: (activity: ArtistActivity) => void
  ) {
    const channelName = 'artist-activity';
    
    if (this.channels.has(channelName)) {
      this.channels.get(channelName)?.unsubscribe();
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'artist_activity',
          filter: `artist_id=in.(${artistIds.join(',')})`,
        },
        async (payload) => {
          if (payload.new) {
            // Get artist details
            const { data: artist, error } = await supabase
              .from('artists')
              .select('name, avatar_url')
              .eq('id', payload.new.artist_id)
              .single();

            if (!error && artist) {
              callback({
                ...payload.new,
                artist,
              } as ArtistActivity);
            }
          }
        }
      )
      .subscribe();

    this.channels.set(channelName, channel);
    return channel;
  }

  // User-specific real-time notifications
  subscribeToUserNotifications(userId: string, callback: (notification: any) => void) {
    const channelName = `user-notifications:${userId}`;
    
    if (this.channels.has(channelName)) {
      this.channels.get(channelName)?.unsubscribe();
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.new) {
            callback(payload.new);
          }
        }
      )
      .subscribe();

    this.channels.set(channelName, channel);
    return channel;
  }

  // Live radio station updates
  subscribeToRadioStation(stationId: string, callback: (update: any) => void) {
    const channelName = `radio-station:${stationId}`;
    
    if (this.channels.has(channelName)) {
      this.channels.get(channelName)?.unsubscribe();
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'radio_stations',
          filter: `id=eq.${stationId}`,
        },
        (payload) => {
          callback(payload);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'radio_listeners',
          filter: `station_id=eq.${stationId}`,
        },
        (payload) => {
          callback({ type: 'listener_update', ...payload });
        }
      )
      .subscribe();

    this.channels.set(channelName, channel);
    return channel;
  }

  // Utility methods
  unsubscribe(channelName: string) {
    const channel = this.channels.get(channelName);
    if (channel) {
      channel.unsubscribe();
      this.channels.delete(channelName);
    }
  }

  unsubscribeAll() {
    this.channels.forEach((channel, name) => {
      channel.unsubscribe();
    });
    this.channels.clear();
  }

  getActiveChannels() {
    return Array.from(this.channels.keys());
  }

  // Helper method to start a listening session
  async startListeningSession(songId: string, artistId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // End any existing active sessions
    await supabase
      .from('listening_sessions')
      .update({ is_active: false, ended_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('is_active', true);

    // Start new session
    const { data, error } = await supabase
      .from('listening_sessions')
      .insert({
        user_id: user.id,
        song_id: songId,
        artist_id: artistId,
        started_at: new Date().toISOString(),
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to start listening session:', error);
      return null;
    }

    return data;
  }

  // Helper method to end a listening session
  async endListeningSession(sessionId?: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    let query = supabase
      .from('listening_sessions')
      .update({ is_active: false, ended_at: new Date().toISOString() })
      .eq('user_id', user.id);

    if (sessionId) {
      query = query.eq('id', sessionId);
    } else {
      query = query.eq('is_active', true);
    }

    const { error } = await query;
    if (error) {
      console.error('Failed to end listening session:', error);
    }
  }
}

export const realtimeService = new RealtimeService();
export default realtimeService;