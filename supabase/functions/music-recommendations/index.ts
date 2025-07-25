import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RecommendationRequest {
  userId: string;
  artistId?: string;
  limit?: number;
  algorithm?: 'collaborative' | 'content' | 'hybrid';
}

interface RecommendationResult {
  songId: string;
  confidence: number;
  reason: string;
  song: {
    id: string;
    title: string;
    artist_name: string;
    cover_url?: string;
    genre?: string;
    bpm?: number;
    energy?: number;
    danceability?: number;
    valence?: number;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { 
      userId, 
      artistId, 
      limit = 20, 
      algorithm = 'hybrid' 
    }: RecommendationRequest = await req.json()

    console.log('Generating recommendations:', { userId, artistId, limit, algorithm })

    // Get user's listening history and preferences
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('preferences')
      .eq('id', userId)
      .single()

    // Get user's play history for collaborative filtering
    const { data: playHistory } = await supabase
      .from('play_history')
      .select(`
        song_id,
        songs (
          id, title, artist_name, genre, bpm, energy, danceability, valence,
          artist_id, cover_url
        )
      `)
      .eq('user_id', userId)
      .gte('played_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Last 30 days
      .limit(100)

    // Get user's liked songs for preference analysis
    const { data: likedSongs } = await supabase
      .from('user_likes')
      .select(`
        liked_id,
        songs!user_likes_liked_id_fkey (
          id, title, artist_name, genre, bpm, energy, danceability, valence,
          artist_id, cover_url
        )
      `)
      .eq('user_id', userId)
      .eq('liked_type', 'song')
      .limit(50)

    let recommendations: RecommendationResult[] = []

    switch (algorithm) {
      case 'collaborative':
        recommendations = await generateCollaborativeRecommendations(supabase, userId, playHistory, limit)
        break
      case 'content':
        recommendations = await generateContentBasedRecommendations(supabase, playHistory, likedSongs, limit)
        break
      case 'hybrid':
      default:
        const collaborativeRecs = await generateCollaborativeRecommendations(supabase, userId, playHistory, Math.floor(limit * 0.6))
        const contentRecs = await generateContentBasedRecommendations(supabase, playHistory, likedSongs, Math.floor(limit * 0.4))
        recommendations = [...collaborativeRecs, ...contentRecs]
        break
    }

    // If specific artist requested, boost those recommendations
    if (artistId) {
      const artistRecs = await generateArtistBasedRecommendations(supabase, artistId, userId, Math.floor(limit * 0.3))
      recommendations = [...artistRecs, ...recommendations.slice(0, limit - artistRecs.length)]
    }

    // Remove duplicates and songs user has already heard
    const playedSongIds = new Set([
      ...(playHistory?.map(p => p.song_id) || []),
      ...(likedSongs?.map(l => l.liked_id) || [])
    ])

    const uniqueRecommendations = recommendations
      .filter((rec, index, self) => 
        !playedSongIds.has(rec.songId) && 
        self.findIndex(r => r.songId === rec.songId) === index
      )
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, limit)

    // Log recommendation for analytics
    await supabase
      .from('recommendation_logs')
      .insert({
        user_id: userId,
        artist_id: artistId,
        algorithm,
        recommendations: uniqueRecommendations.map(r => ({
          song_id: r.songId,
          confidence: r.confidence,
          reason: r.reason
        })),
        generated_at: new Date().toISOString()
      })

    return new Response(
      JSON.stringify({
        success: true,
        recommendations: uniqueRecommendations,
        algorithm,
        generated_at: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Recommendation error:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        recommendations: []
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})

// Collaborative filtering based on similar users
async function generateCollaborativeRecommendations(
  supabase: any, 
  userId: string, 
  playHistory: any[], 
  limit: number
): Promise<RecommendationResult[]> {
  if (!playHistory?.length) return []

  const userSongIds = playHistory.map(p => p.song_id)

  // Find users with similar listening patterns
  const { data: similarUsers } = await supabase
    .rpc('find_similar_users', {
      target_user_id: userId,
      user_song_ids: userSongIds,
      similarity_threshold: 0.2,
      limit_users: 10
    })

  if (!similarUsers?.length) return []

  // Get songs liked by similar users that target user hasn't heard
  const { data: recommendations } = await supabase
    .from('play_history')
    .select(`
      song_id,
      songs (
        id, title, artist_name, genre, bpm, energy, danceability, valence,
        artist_id, cover_url, play_count
      )
    `)
    .in('user_id', similarUsers.map(u => u.user_id))
    .not('song_id', 'in', `(${userSongIds.join(',')})`)
    .limit(limit * 2)

  return recommendations?.map(rec => ({
    songId: rec.song_id,
    confidence: Math.min(0.9, (rec.songs.play_count || 0) / 1000 + 0.3),
    reason: 'Users with similar taste also enjoyed this',
    song: rec.songs
  })) || []
}

// Content-based filtering using audio features
async function generateContentBasedRecommendations(
  supabase: any,
  playHistory: any[],
  likedSongs: any[],
  limit: number
): Promise<RecommendationResult[]> {
  const referenceSongs = [...(playHistory || []), ...(likedSongs || [])].map(item => 
    item.songs || item.song
  ).filter(Boolean)

  if (!referenceSongs.length) return []

  // Calculate user's music preferences
  const preferences = calculateMusicPreferences(referenceSongs)

  // Find songs with similar audio features
  const { data: similarSongs } = await supabase
    .rpc('find_similar_songs_by_features', {
      target_bpm: preferences.avgBPM,
      target_energy: preferences.avgEnergy,
      target_danceability: preferences.avgDanceability,
      target_valence: preferences.avgValence,
      preferred_genres: preferences.topGenres,
      exclude_song_ids: referenceSongs.map(s => s.id),
      similarity_threshold: 0.15,
      limit_songs: limit
    })

  return similarSongs?.map(song => ({
    songId: song.id,
    confidence: calculateContentSimilarity(song, preferences),
    reason: `Similar to your ${preferences.topGenres[0]} preferences`,
    song
  })) || []
}

// Artist-based recommendations
async function generateArtistBasedRecommendations(
  supabase: any,
  artistId: string,
  userId: string,
  limit: number
): Promise<RecommendationResult[]> {
  // Get artist's popular songs user hasn't heard
  const { data: artistSongs } = await supabase
    .from('songs')
    .select('*')
    .eq('artist_id', artistId)
    .not('id', 'in', `(
      SELECT song_id FROM play_history WHERE user_id = '${userId}'
      UNION
      SELECT liked_id FROM user_likes WHERE user_id = '${userId}' AND liked_type = 'song'
    )`)
    .order('play_count', { ascending: false })
    .limit(limit)

  return artistSongs?.map(song => ({
    songId: song.id,
    confidence: 0.8,
    reason: 'From an artist you follow',
    song
  })) || []
}

// Calculate user's music preferences from listening history
function calculateMusicPreferences(songs: any[]) {
  const validSongs = songs.filter(s => s.bpm && s.energy !== null)
  
  if (!validSongs.length) {
    return {
      avgBPM: 120,
      avgEnergy: 0.7,
      avgDanceability: 0.7,
      avgValence: 0.6,
      topGenres: ['pop']
    }
  }

  const genreCounts = validSongs.reduce((acc, song) => {
    if (song.genre) {
      acc[song.genre] = (acc[song.genre] || 0) + 1
    }
    return acc
  }, {})

  return {
    avgBPM: validSongs.reduce((sum, s) => sum + (s.bpm || 120), 0) / validSongs.length,
    avgEnergy: validSongs.reduce((sum, s) => sum + (s.energy || 0.7), 0) / validSongs.length,
    avgDanceability: validSongs.reduce((sum, s) => sum + (s.danceability || 0.7), 0) / validSongs.length,
    avgValence: validSongs.reduce((sum, s) => sum + (s.valence || 0.6), 0) / validSongs.length,
    topGenres: Object.entries(genreCounts)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 3)
      .map(([genre]) => genre)
  }
}

// Calculate content similarity score
function calculateContentSimilarity(song: any, preferences: any): number {
  let score = 0.5 // Base score

  // BPM similarity (weight: 0.2)
  const bpmDiff = Math.abs((song.bpm || 120) - preferences.avgBPM)
  score += (1 - Math.min(bpmDiff / 60, 1)) * 0.2

  // Energy similarity (weight: 0.25)
  const energyDiff = Math.abs((song.energy || 0.7) - preferences.avgEnergy)
  score += (1 - energyDiff) * 0.25

  // Danceability similarity (weight: 0.25)
  const danceabilityDiff = Math.abs((song.danceability || 0.7) - preferences.avgDanceability)
  score += (1 - danceabilityDiff) * 0.25

  // Valence similarity (weight: 0.2)
  const valenceDiff = Math.abs((song.valence || 0.6) - preferences.avgValence)
  score += (1 - valenceDiff) * 0.2

  // Genre bonus (weight: 0.1)
  if (song.genre && preferences.topGenres.includes(song.genre)) {
    score += 0.1
  }

  return Math.min(score, 0.95) // Cap at 95%
}