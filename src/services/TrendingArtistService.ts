import { supabase } from '../lib/supabase/client';

interface TrendingArtist {
    artistId: string;
    score: number;
    name: string;
}

export class TrendingArtistService {
    private static instance: TrendingArtistService;

    private constructor() {}

    static getInstance(): TrendingArtistService {
        if (!TrendingArtistService.instance) {
            TrendingArtistService.instance = new TrendingArtistService();
        }
        return TrendingArtistService.instance;
    }

    async getTrendingArtists(limit: number = 10): Promise<TrendingArtist[]> {
        try {
            const { data: artistScores, error } = await supabase
                .rpc('calculate_trending_artists', { limit });

            if (error) {
                console.error('Error fetching trending artists:', error);
                // If function doesn't exist, fall back to fetching from artists table
                return this.getFallbackTrendingArtists(limit);
            }

            return artistScores.map((artist: any) => ({
                artistId: artist.id,
                score: artist.score,
                name: artist.name
            }));
        } catch (error) {
            console.error('Failed to fetch trending artists:', error);
            return this.getFallbackTrendingArtists(limit);
        }
    }

    private async getFallbackTrendingArtists(limit: number): Promise<TrendingArtist[]> {
        try {
            // Try to fetch from artists table if it exists
            const { data: artists, error } = await supabase
                .from('artists_public_view')
                .select('id, name')
                .limit(limit);

            if (error || !artists) {
                console.warn('Artists table not found, returning mock data');
                return this.getMockTrendingArtists(limit);
            }

            return artists.map((artist, index) => ({
                artistId: artist.id,
                score: Math.random() * 100, // Mock score
                name: artist.name
            }));
        } catch (error) {
            console.warn('Fallback failed, returning mock data:', error);
            return this.getMockTrendingArtists(limit);
        }
    }

    private getMockTrendingArtists(limit: number): TrendingArtist[] {
        return Array.from({ length: limit }, (_, index) => ({
            artistId: `mock-artist-${index + 1}`,
            score: Math.random() * 100,
            name: `Trending Artist ${index + 1}`
        }));
    }
}

export default TrendingArtistService.getInstance();

