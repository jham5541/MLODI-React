import { supabase } from '../lib/supabase/client';

export interface Artist {
  id: string;
  name: string;
  bio?: string;
  avatar_url?: string;
  cover_url?: string;
  genres: string[];
  followers_count: number;
  monthly_listeners: number;
  is_verified: boolean;
  wallet_address?: string;
  revenue_share_percentage: number;
  social_links: Record<string, string>;
  created_at: string;
  updated_at: string;
}

export interface Album {
  id: string;
  title: string;
  artist_id: string;
  artist?: Artist;
  description?: string;
  cover_url?: string;
  release_date?: string;
  album_type: 'album' | 'ep' | 'single';
  total_tracks: number;
  duration_ms: number;
  is_public: boolean;
  nft_collection_address?: string;
  created_at: string;
  updated_at: string;
}

export interface Song {
  id: string;
  title: string;
  artist_id: string;
  artist?: Artist;
  album_id?: string;
  album?: Album;
  audio_url: string;
  cover_url?: string;
  duration_ms: number;
  genre?: string;
  mood?: string;
  tempo?: number;
  key_signature?: string;
  lyrics?: string;
  is_explicit: boolean;
  is_public: boolean;
  play_count: number;
  like_count: number;
  share_count: number;
  nft_token_address?: string;
  nft_total_supply: number;
  nft_available_supply: number;
  nft_price: number;
  nft_royalty_percentage: number;
  metadata: Record<string, any>;
  waveform_data: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface PlayHistory {
  id: string;
  user_id: string;
  song_id: string;
  song?: Song;
  played_at: string;
  duration_played_ms: number;
  completion_percentage: number;
  device_info: Record<string, any>;
  location_info: Record<string, any>;
}

class MusicService {
  // Artists
  async getArtists(options?: {
    limit?: number;
    offset?: number;
    verified_only?: boolean;
    genre?: string;
    search?: string;
  }) {
    let query = supabase
      .from('artists')
      .select('*');

    if (options?.verified_only) {
      query = query.eq('is_verified', true);
    }

    if (options?.genre) {
      query = query.contains('genres', [options.genre]);
    }

    if (options?.search) {
      query = query.ilike('name', `%${options.search}%`);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(options.offset, (options.offset + (options.limit || 10)) - 1);
    }

    query = query.order('followers_count', { ascending: false });

    const { data, error } = await query;
    if (error) throw error;
    return data as Artist[];
  }

  async getArtist(id: string) {
    const { data, error } = await supabase
      .from('artists')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as Artist;
  }

  async followArtist(artistId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('user_follows')
      .insert({
        user_id: user.id,
        followed_type: 'artist',
        followed_id: artistId,
      });

    if (error) throw error;
  }

  async unfollowArtist(artistId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('user_follows')
      .delete()
      .eq('user_id', user.id)
      .eq('followed_type', 'artist')
      .eq('followed_id', artistId);

    if (error) throw error;
  }

  async getFollowedArtists() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('user_follows')
      .select(`
        followed_id,
        artists:followed_id (*)
      `)
      .eq('user_id', user.id)
      .eq('followed_type', 'artist');

    if (error) throw error;
    return data.map(item => item.artists) as Artist[];
  }

  // Songs
  async getSongs(options?: {
    limit?: number;
    offset?: number;
    artist_id?: string;
    album_id?: string;
    genre?: string;
    mood?: string;
    search?: string;
    include_artist?: boolean;
    include_album?: boolean;
    sort?: 'popularity' | 'recent' | 'alphabetical';
  }) {
    let selectClause = '*';
    if (options?.include_artist) {
      selectClause += ', artists(*)';
    }
    if (options?.include_album) {
      selectClause += ', albums(*)';
    }

    let query = supabase
      .from('songs')
      .select(selectClause)
      .eq('is_public', true);

    if (options?.artist_id) {
      query = query.eq('artist_id', options.artist_id);
    }

    if (options?.album_id) {
      query = query.eq('album_id', options.album_id);
    }

    if (options?.genre) {
      query = query.eq('genre', options.genre);
    }

    if (options?.mood) {
      query = query.eq('mood', options.mood);
    }

    if (options?.search) {
      query = query.or(`title.ilike.%${options.search}%,lyrics.ilike.%${options.search}%`);
    }

    // Sorting
    switch (options?.sort) {
      case 'popularity':
        query = query.order('play_count', { ascending: false });
        break;
      case 'recent':
        query = query.order('created_at', { ascending: false });
        break;
      case 'alphabetical':
        query = query.order('title', { ascending: true });
        break;
      default:
        query = query.order('play_count', { ascending: false });
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(options.offset, (options.offset + (options.limit || 10)) - 1);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as Song[];
  }

  async getSong(id: string, includeRelated = true) {
    let selectClause = '*';
    if (includeRelated) {
      selectClause += ', artists(*), albums(*)';
    }

    const { data, error } = await supabase
      .from('songs')
      .select(selectClause)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as Song;
  }

  async getTrendingSongs(limit = 20) {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const { data, error } = await supabase
      .from('songs')
      .select('*, artists(*)')
      .eq('is_public', true)
      .gte('created_at', weekAgo.toISOString())
      .order('play_count', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data as Song[];
  }

  async getPopularSongs(limit = 20) {
    const { data, error } = await supabase
      .from('songs')
      .select('*, artists(*)')
      .eq('is_public', true)
      .order('play_count', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data as Song[];
  }

  async getRecentSongs(limit = 20) {
    const { data, error } = await supabase
      .from('songs')
      .select('*, artists(*)')
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data as Song[];
  }

  async likeSong(songId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('user_likes')
      .insert({
        user_id: user.id,
        liked_type: 'song',
        liked_id: songId,
      });

    if (error) throw error;
  }

  async unlikeSong(songId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('user_likes')
      .delete()
      .eq('user_id', user.id)
      .eq('liked_type', 'song')
      .eq('liked_id', songId);

    if (error) throw error;
  }

  async getLikedSongs() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('user_likes')
      .select(`
        liked_id,
        songs:liked_id (*, artists(*))
      `)
      .eq('user_id', user.id)
      .eq('liked_type', 'song')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data.map(item => item.songs) as Song[];
  }

  async isLiked(songId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase
      .from('user_likes')
      .select('id')
      .eq('user_id', user.id)
      .eq('liked_type', 'song')
      .eq('liked_id', songId)
      .maybeSingle();

    if (error) throw error;
    return !!data;
  }

  // Albums
  async getAlbums(options?: {
    limit?: number;
    offset?: number;
    artist_id?: string;
    album_type?: 'album' | 'ep' | 'single';
    search?: string;
    include_artist?: boolean;
  }) {
    let selectClause = '*';
    if (options?.include_artist) {
      selectClause += ', artists(*)';
    }

    let query = supabase
      .from('albums')
      .select(selectClause)
      .eq('is_public', true);

    if (options?.artist_id) {
      query = query.eq('artist_id', options.artist_id);
    }

    if (options?.album_type) {
      query = query.eq('album_type', options.album_type);
    }

    if (options?.search) {
      query = query.ilike('title', `%${options.search}%`);
    }

    query = query.order('release_date', { ascending: false });

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(options.offset, (options.offset + (options.limit || 10)) - 1);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as Album[];
  }

  async getAlbum(id: string) {
    const { data, error } = await supabase
      .from('albums')
      .select('*, artists(*)')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as Album;
  }

  // Play tracking
  async recordPlay(songId: string, durationPlayedMs = 0, completionPercentage = 0) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('play_history')
      .insert({
        user_id: user.id,
        song_id: songId,
        duration_played_ms: durationPlayedMs,
        completion_percentage: completionPercentage,
        device_info: {
          platform: 'mobile',
          user_agent: navigator.userAgent,
        },
      });

    if (error) throw error;
  }

  async getPlayHistory(limit = 50) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('play_history')
      .select('*, songs(*, artists(*))')
      .eq('user_id', user.id)
      .order('played_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data as PlayHistory[];
  }

  // Search
  async searchAll(query: string, options?: {
    include_artists?: boolean;
    include_albums?: boolean;
    include_songs?: boolean;
    limit?: number;
  }) {
    const results: {
      artists?: Artist[];
      albums?: Album[];
      songs?: Song[];
    } = {};

    const limit = options?.limit || 10;

    if (options?.include_artists !== false) {
      results.artists = await this.getArtists({
        search: query,
        limit,
      });
    }

    if (options?.include_albums !== false) {
      results.albums = await this.getAlbums({
        search: query,
        limit,
        include_artist: true,
      });
    }

    if (options?.include_songs !== false) {
      results.songs = await this.getSongs({
        search: query,
        limit,
        include_artist: true,
        include_album: true,
      });
    }

    return results;
  }

  // Recommendations
  async getRecommendations(options?: {
    limit?: number;
    based_on_history?: boolean;
    genre?: string;
    mood?: string;
  }) {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (options?.based_on_history && user) {
      // Get user's listening history to generate recommendations
      const { data: history } = await supabase
        .from('play_history')
        .select('songs(genre, mood, artist_id)')
        .eq('user_id', user.id)
        .order('played_at', { ascending: false })
        .limit(50);

      if (history && history.length > 0) {
        // Extract preferred genres and artists
        const genres = [...new Set(history.map(h => h.songs?.genre).filter(Boolean))];
        const artistIds = [...new Set(history.map(h => h.songs?.artist_id).filter(Boolean))];

        // Get recommendations based on preferences
        let query = supabase
          .from('songs')
          .select('*, artists(*)')
          .eq('is_public', true);

        if (genres.length > 0) {
          query = query.in('genre', genres);
        }

        if (artistIds.length > 0) {
          query = query.not('artist_id', 'in', `(${artistIds.join(',')})`); // Exclude already listened artists
        }

        query = query
          .order('play_count', { ascending: false })
          .limit(options?.limit || 20);

        const { data, error } = await query;
        if (error) throw error;
        return data as Song[];
      }
    }

    // Fallback to general popular songs
    return this.getPopularSongs(options?.limit);
  }
}

export const musicService = new MusicService();