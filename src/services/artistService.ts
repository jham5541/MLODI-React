import { supabase } from '../lib/supabase/client';
import { Artist } from '../types/music';
import { monthlyListenersService } from './monthlyListenersService';

class ArtistService {
  async fetchArtistDetails(id: string): Promise<Artist> {
    console.log('ArtistService: fetchArtistDetails called with id:', id);
    try {
      // Query the artists table directly
      const { data, error } = await supabase
        .from('artists')
        .select('id, name, display_name, avatar_url, banner_url, bio, genres, followers_count, is_verified')
        .eq('id', id)
        .maybeSingle(); // Use maybeSingle() to handle no rows gracefully

      if (error) {
        console.error('Supabase fetch failed:', error.message);
        throw new Error(`Failed to fetch artist details: ${error.message}`);
      }
      
      if (!data) {
        console.error('No artist found with id:', id);
        throw new Error(`Artist not found with id: ${id}`);
      }
      console.log('Supabase fetch successful:', data?.name || data?.display_name);
      
      // Fetch monthly listeners separately
      const monthlyListeners = await monthlyListenersService.getMonthlyListeners(id);
      
      // Map DB row to our Artist interface
      const mapped: Artist = {
        id: data.id,
        name: data.name || data.display_name || '', // show the artist name from the artists table
        coverUrl: data.avatar_url || '',
        bio: data.bio || '',
        genres: Array.isArray(data.genres) ? data.genres : [],
        followers: typeof data.followers_count === 'number' ? data.followers_count : 0,
        isVerified: !!data.is_verified,
        bannerUrl: data.banner_url || undefined,
        monthlyListeners,
      };

      return mapped;
    } catch (error) {
      console.error('Error fetching artist details:', error);
      throw error;
    }
  }
}

export const artistService = new ArtistService();

// Export the function directly for convenience
export const fetchArtistDetails = (id: string) => artistService.fetchArtistDetails(id);

