import { supabase } from '../lib/supabase/client';
import { Song, Artist, Album } from '../types/music';

export interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  image_url: string | null;
  result_type: 'artist' | 'album' | 'track';
  artist_id: string;
  artist_name: string;
  extra_info: {
    // For artists
    followers_count?: number;
    track_count?: number;
    album_count?: number;
    genres?: string[];
    is_verified?: boolean;
    bio?: string;
    // For albums
    release_date?: string;
    total_tracks?: number;
    // For tracks
    duration_ms?: number;
    play_count?: number;
    genre?: string;
  };
}

export interface SearchResults {
  artists: SearchResult[];
  albums: SearchResult[];
  tracks: SearchResult[];
  all: SearchResult[];
}

class SearchService {
  /**
   * Search for music content (artists, albums, tracks)
   * Only returns content from artists with active paid subscriptions
   */
  async searchMusic(
    query: string,
    searchType: 'all' | 'artists' | 'albums' | 'tracks' = 'all',
    limit: number = 20
  ): Promise<SearchResults> {
    try {
      if (!query || query.trim().length === 0) {
        return {
          artists: [],
          albums: [],
          tracks: [],
          all: []
        };
      }

      // Call the database search function
      const { data, error } = await supabase.rpc('search_music_content', {
        search_query: query.trim(),
        result_limit: limit,
        search_type: searchType
      });

      if (error) {
        console.error('Search error:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        return {
          artists: [],
          albums: [],
          tracks: [],
          all: []
        };
      }

      // Separate results by type
      const artists = data.filter((item: SearchResult) => item.result_type === 'artist');
      const albums = data.filter((item: SearchResult) => item.result_type === 'album');
      const tracks = data.filter((item: SearchResult) => item.result_type === 'track');

      return {
        artists,
        albums,
        tracks,
        all: data
      };
    } catch (error) {
      console.error('Error searching music:', error);
      // Return empty results on error
      return {
        artists: [],
        albums: [],
        tracks: [],
        all: []
      };
    }
  }

  /**
   * Get recently searched items from local storage
   */
  async getRecentSearches(): Promise<string[]> {
    try {
      // This would typically use AsyncStorage in React Native
      // For now, returning empty array as placeholder
      return [];
    } catch (error) {
      console.error('Error getting recent searches:', error);
      return [];
    }
  }

  /**
   * Save a search query to recent searches
   */
  async saveRecentSearch(query: string): Promise<void> {
    try {
      // This would typically use AsyncStorage in React Native
      // Implementation placeholder
      console.log('Saving recent search:', query);
    } catch (error) {
      console.error('Error saving recent search:', error);
    }
  }

  /**
   * Clear all recent searches
   */
  async clearRecentSearches(): Promise<void> {
    try {
      // This would typically use AsyncStorage in React Native
      // Implementation placeholder
      console.log('Clearing recent searches');
    } catch (error) {
      console.error('Error clearing recent searches:', error);
    }
  }

  /**
   * Convert search results to the format expected by the UI components
   */
  convertToUIFormat(results: SearchResults): {
    songs: Song[];
    artists: Artist[];
    albums: Album[];
  } {
    // Convert search results to UI format
    const songs: Song[] = results.tracks.map(track => ({
      id: track.id,
      title: track.title,
      artist: track.artist_name,
      artistId: track.artist_id,
      album: '', // Not available in current schema
      albumId: '', // Not available in current schema
      duration: track.extra_info.duration_ms 
        ? Math.floor(track.extra_info.duration_ms / 1000) 
        : 180, // Default 3 minutes
      coverUrl: track.image_url || '',
      audioUrl: '', // Will be loaded separately
      genre: track.extra_info.genre || 'Unknown',
      playCount: track.extra_info.play_count || 0,
      isLiked: false, // Will be loaded separately
      isExplicit: false, // Not available in current schema
    }));

    const artists: Artist[] = results.artists.map(artist => ({
      id: artist.id,
      name: artist.title,
      image: artist.image_url || '',
      genres: artist.extra_info.genres || [],
      bio: artist.extra_info.bio || '',
      followers: artist.extra_info.followers_count || 0,
      isVerified: artist.extra_info.is_verified || false,
      monthlyListeners: 0, // Will be loaded separately
      socialLinks: {},
    }));

    const albums: Album[] = results.albums.map(album => ({
      id: album.id,
      title: album.title,
      artist: album.artist_name,
      artistId: album.artist_id,
      coverUrl: album.image_url || '',
      releaseDate: album.extra_info.release_date || new Date().toISOString(),
      trackCount: album.extra_info.total_tracks || 0,
      tracks: [], // Will be loaded separately if needed
      genre: '', // Not available in current schema
      isExplicit: false, // Not available in current schema
    }));

    return { songs, artists, albums };
  }
}

export const searchService = new SearchService();
export default searchService;
