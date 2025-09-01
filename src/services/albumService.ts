import { supabase } from '../lib/supabase/client';

export interface Album {
  id: string;
  title: string;
  artist_id: string;
  release_date: string | null;
  total_tracks: number;
  created_at: string;
  cover_url?: string; // Optional, might need to be fetched separately
}

export interface AlbumWithTracks extends Album {
  tracks?: Track[];
}

export interface Track {
  id: string;
  title: string;
  artist_id: string;
  duration: number;
  track_number?: number;
  audio_url?: string;
  cover_url?: string;
}

class AlbumService {
  /**
   * Get albums for a specific artist using the public view
   */
  async getArtistAlbums(artistId: string): Promise<Album[]> {
    try {
      const { data, error } = await supabase
        .from('albums_listener_view')
        .select('*')
        .eq('artist_id', artistId)
        .order('release_date', { ascending: false });

      if (error) {
        console.error('Error fetching albums:', error);
        throw error;
      }

      // Add default cover URLs if not present
      const albums = (data || []).map(album => ({
        ...album,
        cover_url: album.cover_url || `https://picsum.photos/300/300?random=${album.id}`
      }));

      return albums;
    } catch (error) {
      console.error('Error in getArtistAlbums:', error);
      return [];
    }
  }

  /**
   * Get a single album by ID
   */
  async getAlbum(albumId: string): Promise<Album | null> {
    try {
      const { data, error } = await supabase
        .from('albums_listener_view')
        .select('*')
        .eq('id', albumId)
        .single();

      if (error) {
        console.error('Error fetching album:', error);
        return null;
      }

      return {
        ...data,
        cover_url: data.cover_url || `https://picsum.photos/300/300?random=${data.id}`
      };
    } catch (error) {
      console.error('Error in getAlbum:', error);
      return null;
    }
  }

  /**
   * Get tracks for an album
   * Note: This requires a relationship between tracks and albums
   * If not available, this will return tracks by the same artist
   */
  async getAlbumTracks(albumId: string, artistId: string): Promise<Track[]> {
    try {
      // First try to get tracks that belong to this album
      // Since there's no album_id in tracks, we'll get tracks by artist
      // This is a limitation of the current schema
      const { data, error } = await supabase
        .from('tracks_listener_view')
        .select('*')
        .eq('artist_id', artistId)
        .order('created_at', { ascending: true })
        .limit(10); // Limit to a reasonable number for an album

      if (error) {
        console.error('Error fetching album tracks:', error);
        return [];
      }

      // Transform to Track interface
      const tracks = (data || []).map((track, index) => ({
        id: track.id,
        title: track.title,
        artist_id: track.artist_id,
        duration: track.duration || 180,
        track_number: index + 1,
        audio_url: track.audio_url,
        cover_url: track.cover_url
      }));

      return tracks;
    } catch (error) {
      console.error('Error in getAlbumTracks:', error);
      return [];
    }
  }

  /**
   * Get recent albums across all artists
   */
  async getRecentAlbums(limit: number = 10): Promise<Album[]> {
    try {
      const { data, error } = await supabase
        .from('albums_listener_view')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching recent albums:', error);
        return [];
      }

      const albums = (data || []).map(album => ({
        ...album,
        cover_url: album.cover_url || `https://picsum.photos/300/300?random=${album.id}`
      }));

      return albums;
    } catch (error) {
      console.error('Error in getRecentAlbums:', error);
      return [];
    }
  }

  /**
   * Search albums by title
   */
  async searchAlbums(query: string): Promise<Album[]> {
    try {
      const { data, error } = await supabase
        .from('albums_listener_view')
        .select('*')
        .ilike('title', `%${query}%`)
        .order('release_date', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error searching albums:', error);
        return [];
      }

      const albums = (data || []).map(album => ({
        ...album,
        cover_url: album.cover_url || `https://picsum.photos/300/300?random=${album.id}`
      }));

      return albums;
    } catch (error) {
      console.error('Error in searchAlbums:', error);
      return [];
    }
  }
}

export const albumService = new AlbumService();
export default albumService;
