// Import necessary libraries
import { supabase } from '../lib/supabase/client';

async function extractUserFeatures(userId) {
    // Extract top genres, artists, and mood indicators
    const topGenres = await extractTopGenres(userId);
    const topArtists = await extractTopArtists(userId);
    const moodIndicators = await extractMoodIndicators(userId);

    return {
        topGenres,
        topArtists,
        moodIndicators
    };
}

async function extractTopGenres(userId) {
    const { data, error } = await supabase
        .from('play_history')
        .select('songs(genre)')
        .eq('user_id', userId)
        .order('played_at', { ascending: false })
        .limit(100);

    if (error) {
        console.error('Error fetching top genres:', error);
        return [];
    }

    // Count genre occurrences
    const genreCounts = {};
    data.forEach(item => {
        const genre = item.songs?.genre;
        if (genre) {
            genreCounts[genre] = (genreCounts[genre] || 0) + 1;
        }
    });

    // Sort and get top 5 genres
    return Object.entries(genreCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([genre]) => genre);
}

async function extractTopArtists(userId) {
    const { data, error } = await supabase
        .from('play_history')
        .select('songs(artist_id, artists(name))')
        .eq('user_id', userId)
        .order('played_at', { ascending: false })
        .limit(100);

    if (error) {
        console.error('Error fetching top artists:', error);
        return [];
    }

    // Count artist occurrences
    const artistCounts = {};
    data.forEach(item => {
        const artistId = item.songs?.artist_id;
        const artistName = item.songs?.artists?.name;
        if (artistId && artistName) {
            artistCounts[artistId] = {
                name: artistName,
                count: (artistCounts[artistId]?.count || 0) + 1
            };
        }
    });

    // Sort and get top 10 artists
    return Object.entries(artistCounts)
        .sort(([, a], [, b]) => b.count - a.count)
        .slice(0, 10)
        .map(([artistId, info]) => ({ id: artistId, name: info.name }));
}

async function extractMoodIndicators(userId) {
    const { data, error } = await supabase
        .from('play_history')
        .select('audio_features(energy, valence), played_at')
        .eq('user_id', userId)
        .order('played_at', { ascending: false })
        .limit(100);

    if (error) {
        console.error('Error fetching mood indicators:', error);
        return {};
    }

    // Calculate average mood by time of day
    const moodByTime = {
        morning: { energy: 0, valence: 0, count: 0 },
        afternoon: { energy: 0, valence: 0, count: 0 },
        evening: { energy: 0, valence: 0, count: 0 },
        night: { energy: 0, valence: 0, count: 0 }
    };

    data.forEach(item => {
        const hour = new Date(item.played_at).getHours();
        let timeOfDay;
        if (hour >= 5 && hour < 12) timeOfDay = 'morning';
        else if (hour >= 12 && hour < 17) timeOfDay = 'afternoon';
        else if (hour >= 17 && hour < 22) timeOfDay = 'evening';
        else timeOfDay = 'night';

        if (item.audio_features) {
            moodByTime[timeOfDay].energy += item.audio_features.energy || 0;
            moodByTime[timeOfDay].valence += item.audio_features.valence || 0;
            moodByTime[timeOfDay].count += 1;
        }
    });

    // Calculate averages
    Object.keys(moodByTime).forEach(time => {
        if (moodByTime[time].count > 0) {
            moodByTime[time].energy /= moodByTime[time].count;
            moodByTime[time].valence /= moodByTime[time].count;
        }
    });

    return moodByTime;
}

// Export for use in other scripts
export { extractUserFeatures, extractTopGenres, extractTopArtists, extractMoodIndicators };
