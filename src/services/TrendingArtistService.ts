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
        const { data: artistScores, error } = await supabase
            .rpc('calculate_trending_artists', { limit });

        if (error) {
            console.error('Error fetching trending artists:', error);
            return [];
        }

        return artistScores.map((artist: any) => ({
            artistId: artist.id,
            score: artist.score,
            name: artist.name
        }));
    }
}

export default TrendingArtistService.getInstance();

