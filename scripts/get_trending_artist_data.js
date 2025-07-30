// Import libraries
import { supabase } from '../lib/supabase/client';

async function getTrendingArtistData() {
    // Collect data on artist plays and social engagement
    const { data: plays, error: playsError } = await supabase
        .from('artist_plays')
        .select('artist_id, play_count, date')
        .order('date', { ascending: false });

    if (playsError) {
        console.error('Error fetching play data:', playsError);
        return;
    }

    const { data: engagement, error: engagementError } = await supabase
        .from('social_engagements')
        .select('artist_id, likes, shares, date')
        .order('date', { ascending: false });

    if (engagementError) {
        console.error('Error fetching engagement data:', engagementError);
        return;
    }

    console.log('Trending artist data collected successfully!');
    return { plays, engagement };
}

getTrendingArtistData().then(data => {
    console.log('Data:', data);
}).catch(err => {
    console.error('Error in data collection:', err);
});

