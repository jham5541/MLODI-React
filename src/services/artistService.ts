import { supabase } from '../lib/supabase/client';
import { Artist } from '../types/music';
import { sampleArtists } from '../data/sampleData';

class ArtistService {
  async fetchArtistDetails(id: string): Promise<Artist> {
    console.log('ArtistService: fetchArtistDetails called with id:', id);
    try {
      // First try to get from Supabase
      const { data, error } = await supabase
        .from('artists_public_view')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.log('Supabase fetch failed, using sample data. Error:', error.message);
        // Fallback to sample data
        const sampleArtist = sampleArtists.find(artist => artist.id === id || artist.name === id);
        console.log('Sample artist found:', sampleArtist ? sampleArtist.name : 'None');
        if (sampleArtist) {
          return sampleArtist;
        }
        // If no match found, return the first sample artist with the given ID
        console.log('No sample artist match, creating default with first artist');
        return {
          ...sampleArtists[0],
          id,
          name: id,
        };
      }
      console.log('Supabase fetch successful:', data.name);
      return data as Artist;
    } catch (error) {
      console.error('Error fetching artist details:', error);
      // Fallback to sample data on any error
      const sampleArtist = sampleArtists.find(artist => artist.id === id || artist.name === id);
      console.log('Exception fallback - Sample artist found:', sampleArtist ? sampleArtist.name : 'None');
      if (sampleArtist) {
        return sampleArtist;
      }
      // Return a default artist if nothing else works
      console.log('Exception fallback - Creating default artist');
      return {
        ...sampleArtists[0],
        id,
        name: id,
      };
    }
  }
}

export const artistService = new ArtistService();

// Export the function directly for convenience
export const fetchArtistDetails = (id: string) => artistService.fetchArtistDetails(id);

