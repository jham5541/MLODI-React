import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TrendingRequest {
  type: 'songs' | 'artists' | 'albums' | 'playlists';
  timeWindow: 'hour' | 'day' | 'week' | 'month';
  limit?: number;
  genre?: string;
  artistId?: string;
}

interface TrendingItem {
  id: string;
  title: string;
  artist_name?: string;
  cover_url?: string;
  current_rank: number;
  previous_rank?: number;
  trend_velocity: number; // Positive = rising, negative = falling
  play_count: number;
  recent_plays: number;
  engagement_score: number;
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

    const { type, timeWindow, limit = 50, genre, artistId }: TrendingRequest = await req.json()

    console.log('Calculating trending:', { type, timeWindow, limit, genre, artistId })

    const timeThresholds = {
      hour: new Date(Date.now() - 60 * 60 * 1000),
      day: new Date(Date.now() - 24 * 60 * 60 * 1000),
      week: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      month: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    }

    const currentTime = timeThresholds[timeWindow]
    const previousTime = new Date(currentTime.getTime() - (Date.now() - currentTime.getTime()))

    let trendingItems: TrendingItem[] = []

    switch (type) {
      case 'songs':
        trendingItems = await calculateTrendingSongs(supabase, currentTime, previousTime, limit, genre, artistId)
        break
      case 'artists':
        trendingItems = await calculateTrendingArtists(supabase, currentTime, previousTime, limit, genre)
        break
      case 'albums':
        trendingItems = await calculateTrendingAlbums(supabase, currentTime, previousTime, limit, genre, artistId)
        break
      case 'playlists':
        trendingItems = await calculateTrendingPlaylists(supabase, currentTime, previousTime, limit)
        break
    }

    // Store trending results for caching
    await supabase
      .from('trending_cache')
      .upsert({
        type,
        time_window: timeWindow,
        genre,
        artist_id: artistId,
        results: trendingItems,
        calculated_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + getTTL(timeWindow)).toISOString()
      }, {
        onConflict: 'type,time_window,genre,artist_id'
      })

    return new Response(
      JSON.stringify({
        success: true,
        trending: trendingItems,
        type,
        timeWindow,
        calculatedAt: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Trending calculation error:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        trending: []
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})

async function calculateTrendingSongs(
  supabase: any,
  currentTime: Date,
  previousTime: Date,
  limit: number,
  genre?: string,
  artistId?: string
): Promise<TrendingItem[]> {
  // Get current period plays
  let currentQuery = supabase
    .from('play_history')
    .select(`
      song_id,
      songs (id, title, artist_name, cover_url, genre, play_count)
    `)
    .gte('played_at', currentTime.toISOString())

  if (genre) {
    currentQuery = currentQuery.eq('songs.genre', genre)
  }
  if (artistId) {
    currentQuery = currentQuery.eq('songs.artist_id', artistId)
  }

  const { data: currentPlays } = await currentQuery

  // Get previous period plays for comparison
  let previousQuery = supabase
    .from('play_history')
    .select(`
      song_id,
      songs (id, title, artist_name, cover_url, genre, play_count)
    `)
    .gte('played_at', previousTime.toISOString())
    .lt('played_at', currentTime.toISOString())

  if (genre) {
    previousQuery = previousQuery.eq('songs.genre', genre)
  }
  if (artistId) {
    previousQuery = previousQuery.eq('songs.artist_id', artistId)
  }

  const { data: previousPlays } = await previousQuery

  // Aggregate plays by song
  const currentCounts = aggregatePlayCounts(currentPlays)
  const previousCounts = aggregatePlayCounts(previousPlays)

  // Calculate trending scores
  const trendingScores = calculateTrendingScores(currentCounts, previousCounts)

  // Get engagement metrics (likes, shares, etc.)
  const songIds = Object.keys(trendingScores)
  const { data: engagements } = await supabase
    .from('user_likes')
    .select('liked_id')
    .eq('liked_type', 'song')
    .in('liked_id', songIds)
    .gte('created_at', currentTime.toISOString())

  const engagementCounts = engagements?.reduce((acc, like) => {
    acc[like.liked_id] = (acc[like.liked_id] || 0) + 1
    return acc
  }, {}) || {}

  // Combine data and sort
  const trending = Object.entries(trendingScores)
    .map(([songId, score]: [string, any]) => {
      const song = currentCounts[songId]?.song || previousCounts[songId]?.song
      if (!song) return null

      return {
        id: songId,
        title: song.title,
        artist_name: song.artist_name,
        cover_url: song.cover_url,
        current_rank: 0, // Will be set after sorting
        trend_velocity: score.velocity,
        play_count: song.play_count || 0,
        recent_plays: currentCounts[songId]?.count || 0,
        engagement_score: calculateEngagementScore(
          currentCounts[songId]?.count || 0,
          engagementCounts[songId] || 0
        )
      }
    })
    .filter(Boolean)
    .sort((a, b) => {
      // Sort by combination of recent plays, velocity, and engagement
      const scoreA = a.recent_plays * 0.5 + a.trend_velocity * 0.3 + a.engagement_score * 0.2
      const scoreB = b.recent_plays * 0.5 + b.trend_velocity * 0.3 + b.engagement_score * 0.2
      return scoreB - scoreA
    })
    .slice(0, limit)
    .map((item, index) => ({
      ...item,
      current_rank: index + 1
    }))

  return trending
}

async function calculateTrendingArtists(
  supabase: any,
  currentTime: Date,
  previousTime: Date,
  limit: number,
  genre?: string
): Promise<TrendingItem[]> {
  // Similar logic for artists
  let currentQuery = supabase
    .from('play_history')
    .select(`
      songs (artist_id, artists (id, name, avatar_url, followers_count))
    `)
    .gte('played_at', currentTime.toISOString())

  const { data: currentPlays } = await currentQuery

  const artistCounts = currentPlays?.reduce((acc, play) => {
    const artistId = play.songs.artist_id
    if (!acc[artistId]) {
      acc[artistId] = {
        count: 0,
        artist: play.songs.artists
      }
    }
    acc[artistId].count++
    return acc
  }, {}) || {}

  const trending = Object.entries(artistCounts)
    .map(([artistId, data]: [string, any]) => ({
      id: artistId,
      title: data.artist.name,
      cover_url: data.artist.avatar_url,
      current_rank: 0,
      trend_velocity: data.count, // Simplified for artists
      play_count: data.count,
      recent_plays: data.count,
      engagement_score: data.artist.followers_count || 0
    }))
    .sort((a, b) => b.recent_plays - a.recent_plays)
    .slice(0, limit)
    .map((item, index) => ({
      ...item,
      current_rank: index + 1
    }))

  return trending
}

async function calculateTrendingAlbums(
  supabase: any,
  currentTime: Date,
  previousTime: Date,
  limit: number,
  genre?: string,
  artistId?: string
): Promise<TrendingItem[]> {
  // Similar logic for albums - aggregate by album_id
  let query = supabase
    .from('play_history')
    .select(`
      songs (album_id, albums (id, title, cover_url, artist_name))
    `)
    .gte('played_at', currentTime.toISOString())
    .not('songs.album_id', 'is', null)

  if (artistId) {
    query = query.eq('songs.artist_id', artistId)
  }

  const { data: plays } = await query

  const albumCounts = plays?.reduce((acc, play) => {
    const albumId = play.songs.album_id
    if (!acc[albumId]) {
      acc[albumId] = {
        count: 0,
        album: play.songs.albums
      }
    }
    acc[albumId].count++
    return acc
  }, {}) || {}

  const trending = Object.entries(albumCounts)
    .map(([albumId, data]: [string, any]) => ({
      id: albumId,
      title: data.album.title,
      artist_name: data.album.artist_name,
      cover_url: data.album.cover_url,
      current_rank: 0,
      trend_velocity: data.count,
      play_count: data.count,
      recent_plays: data.count,
      engagement_score: data.count
    }))
    .sort((a, b) => b.recent_plays - a.recent_plays)
    .slice(0, limit)
    .map((item, index) => ({
      ...item,
      current_rank: index + 1
    }))

  return trending
}

async function calculateTrendingPlaylists(
  supabase: any,
  currentTime: Date,
  previousTime: Date,
  limit: number
): Promise<TrendingItem[]> {
  // Get playlist plays (when songs from playlists are played)
  const { data: playlistPlays } = await supabase
    .from('playlist_songs')
    .select(`
      playlist_id,
      playlists (id, name, cover_url, play_count),
      songs (
        play_history (played_at)
      )
    `)
    .gte('songs.play_history.played_at', currentTime.toISOString())

  const playlistCounts = playlistPlays?.reduce((acc, play) => {
    const playlistId = play.playlist_id
    if (!acc[playlistId]) {
      acc[playlistId] = {
        count: 0,
        playlist: play.playlists
      }
    }
    acc[playlistId].count++
    return acc
  }, {}) || {}

  const trending = Object.entries(playlistCounts)
    .map(([playlistId, data]: [string, any]) => ({
      id: playlistId,
      title: data.playlist.name,
      cover_url: data.playlist.cover_url,
      current_rank: 0,
      trend_velocity: data.count,
      play_count: data.playlist.play_count || 0,
      recent_plays: data.count,
      engagement_score: data.count
    }))
    .sort((a, b) => b.recent_plays - a.recent_plays)
    .slice(0, limit)
    .map((item, index) => ({
      ...item,
      current_rank: index + 1
    }))

  return trending
}

function aggregatePlayCounts(plays: any[]) {
  return plays?.reduce((acc, play) => {
    const songId = play.song_id
    if (!acc[songId]) {
      acc[songId] = {
        count: 0,
        song: play.songs
      }
    }
    acc[songId].count++
    return acc
  }, {}) || {}
}

function calculateTrendingScores(currentCounts: any, previousCounts: any) {
  const scores = {}
  
  // Calculate velocity for all songs
  for (const songId in currentCounts) {
    const current = currentCounts[songId].count
    const previous = previousCounts[songId]?.count || 0
    const velocity = previous > 0 ? (current - previous) / previous : current
    
    scores[songId] = {
      velocity,
      current,
      previous
    }
  }
  
  return scores
}

function calculateEngagementScore(plays: number, likes: number): number {
  // Weighted engagement score
  return plays * 0.7 + likes * 0.3
}

function getTTL(timeWindow: string): number {
  const ttls = {
    hour: 5 * 60 * 1000,      // 5 minutes
    day: 15 * 60 * 1000,      // 15 minutes
    week: 60 * 60 * 1000,     // 1 hour
    month: 4 * 60 * 60 * 1000 // 4 hours
  }
  
  return ttls[timeWindow] || ttls.day
}