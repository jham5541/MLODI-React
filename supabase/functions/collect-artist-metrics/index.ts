import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface MetricsUpdateRequest {
  artistId: string;
  metricType: 'streaming' | 'engagement' | 'revenue' | 'all';
  date?: string; // ISO date string, defaults to today
  data?: {
    // For streaming metrics
    streamCount?: number;
    uniqueListeners?: number;
    totalDurationSeconds?: number;
    avgCompletionRate?: number;
    skipRate?: number;
    
    // For engagement metrics
    likesCount?: number;
    commentsCount?: number;
    sharesCount?: number;
    followsCount?: number;
    unfollowsCount?: number;
    videoViews?: number;
    profileViews?: number;
    
    // For revenue metrics
    streamingRevenue?: number;
    merchandiseRevenue?: number;
    ticketRevenue?: number;
    subscriptionRevenue?: number;
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

    const { artistId, metricType, date, data }: MetricsUpdateRequest = await req.json()
    const targetDate = date || new Date().toISOString().split('T')[0]

    console.log('Collecting metrics for artist:', artistId, 'type:', metricType, 'date:', targetDate)

    let results = {}

    // Update streaming metrics
    if (metricType === 'streaming' || metricType === 'all') {
      const streamingData = await collectStreamingMetrics(supabase, artistId, targetDate, data)
      results = { ...results, streaming: streamingData }
    }

    // Update engagement metrics
    if (metricType === 'engagement' || metricType === 'all') {
      const engagementData = await collectEngagementMetrics(supabase, artistId, targetDate, data)
      results = { ...results, engagement: engagementData }
    }

    // Update revenue metrics
    if (metricType === 'revenue' || metricType === 'all') {
      const revenueData = await collectRevenueMetrics(supabase, artistId, targetDate, data)
      results = { ...results, revenue: revenueData }
    }

    // Trigger analytics aggregation if all metrics are collected
    if (metricType === 'all') {
      await triggerAnalyticsAggregation(supabase, artistId, targetDate)
    }

    return new Response(
      JSON.stringify({
        success: true,
        artistId,
        date: targetDate,
        results
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Metrics collection error:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})

async function collectStreamingMetrics(
  supabase: any, 
  artistId: string, 
  date: string,
  data?: any
) {
  // If data is provided directly, use it
  if (data?.streamCount !== undefined) {
    const { error } = await supabase
      .from('artist_streaming_stats')
      .upsert({
        artist_id: artistId,
        date,
        stream_count: data.streamCount || 0,
        unique_listeners: data.uniqueListeners || 0,
        total_duration_seconds: data.totalDurationSeconds || 0,
        avg_completion_rate: data.avgCompletionRate || 0,
        skip_rate: data.skipRate || 0,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'artist_id,date'
      })
    
    if (error) throw error
    return { updated: true, source: 'direct' }
  }

  // Otherwise, calculate from play_history
  const startOfDay = new Date(date)
  startOfDay.setHours(0, 0, 0, 0)
  const endOfDay = new Date(date)
  endOfDay.setHours(23, 59, 59, 999)

  // Get all plays for this artist's songs today
  const { data: plays, error: playsError } = await supabase
    .from('play_history')
    .select(`
      id,
      user_id,
      duration_played,
      completed,
      songs!inner (
        id,
        duration,
        artist_id
      )
    `)
    .eq('songs.artist_id', artistId)
    .gte('played_at', startOfDay.toISOString())
    .lte('played_at', endOfDay.toISOString())

  if (playsError) throw playsError

  const streamCount = plays?.length || 0
  const uniqueListeners = new Set(plays?.map(p => p.user_id) || []).size
  const totalDurationSeconds = plays?.reduce((sum, p) => sum + (p.duration_played || 0), 0) || 0
  
  // Calculate completion and skip rates
  const completedPlays = plays?.filter(p => p.completed).length || 0
  const avgCompletionRate = streamCount > 0 ? completedPlays / streamCount : 0
  const skipRate = 1 - avgCompletionRate

  // Update the streaming stats
  const { error: updateError } = await supabase
    .from('artist_streaming_stats')
    .upsert({
      artist_id: artistId,
      date,
      stream_count: streamCount,
      unique_listeners: uniqueListeners,
      total_duration_seconds: totalDurationSeconds,
      avg_completion_rate: avgCompletionRate,
      skip_rate: skipRate,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'artist_id,date'
    })

  if (updateError) throw updateError

  return {
    updated: true,
    source: 'calculated',
    stats: {
      streamCount,
      uniqueListeners,
      totalDurationSeconds,
      avgCompletionRate,
      skipRate
    }
  }
}

async function collectEngagementMetrics(
  supabase: any, 
  artistId: string, 
  date: string,
  data?: any
) {
  // If data is provided directly, use it
  if (data?.likesCount !== undefined) {
    const { error } = await supabase
      .from('artist_engagement_metrics')
      .upsert({
        artist_id: artistId,
        date,
        likes_count: data.likesCount || 0,
        comments_count: data.commentsCount || 0,
        shares_count: data.sharesCount || 0,
        follows_count: data.followsCount || 0,
        unfollows_count: data.unfollowsCount || 0,
        video_views: data.videoViews || 0,
        profile_views: data.profileViews || 0,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'artist_id,date'
      })
    
    if (error) throw error
    return { updated: true, source: 'direct' }
  }

  // Otherwise, calculate from various tables
  const startOfDay = new Date(date)
  startOfDay.setHours(0, 0, 0, 0)
  const endOfDay = new Date(date)
  endOfDay.setHours(23, 59, 59, 999)

  // Count likes on artist's content
  const { count: likesCount } = await supabase
    .from('user_likes')
    .select('*', { count: 'exact', head: true })
    .eq('liked_type', 'artist')
    .eq('liked_id', artistId)
    .gte('created_at', startOfDay.toISOString())
    .lte('created_at', endOfDay.toISOString())

  // Count comments on artist
  const { count: commentsCount } = await supabase
    .from('artist_comments')
    .select('*', { count: 'exact', head: true })
    .eq('artist_id', artistId)
    .gte('created_at', startOfDay.toISOString())
    .lte('created_at', endOfDay.toISOString())

  // Count follows/unfollows
  const { count: followsCount } = await supabase
    .from('user_follows')
    .select('*', { count: 'exact', head: true })
    .eq('followed_type', 'artist')
    .eq('followed_id', artistId)
    .gte('created_at', startOfDay.toISOString())
    .lte('created_at', endOfDay.toISOString())

  // For demo purposes, simulate some metrics
  const sharesCount = Math.floor((likesCount || 0) * 0.1)
  const videoViews = Math.floor((likesCount || 0) * 2.5)
  const profileViews = followsCount || 0 + Math.floor(Math.random() * 50)

  // Update engagement metrics
  const { error: updateError } = await supabase
    .from('artist_engagement_metrics')
    .upsert({
      artist_id: artistId,
      date,
      likes_count: likesCount || 0,
      comments_count: commentsCount || 0,
      shares_count: sharesCount,
      follows_count: followsCount || 0,
      unfollows_count: 0, // Would need a separate tracking table
      video_views: videoViews,
      profile_views: profileViews,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'artist_id,date'
    })

  if (updateError) throw updateError

  return {
    updated: true,
    source: 'calculated',
    stats: {
      likesCount: likesCount || 0,
      commentsCount: commentsCount || 0,
      sharesCount,
      followsCount: followsCount || 0,
      videoViews,
      profileViews
    }
  }
}

async function collectRevenueMetrics(
  supabase: any, 
  artistId: string, 
  date: string,
  data?: any
) {
  // If data is provided directly, use it
  if (data?.streamingRevenue !== undefined) {
    const totalRevenue = (data.streamingRevenue || 0) + 
                        (data.merchandiseRevenue || 0) + 
                        (data.ticketRevenue || 0) + 
                        (data.subscriptionRevenue || 0)

    const { error } = await supabase
      .from('artist_revenue_metrics')
      .upsert({
        artist_id: artistId,
        date,
        streaming_revenue: data.streamingRevenue || 0,
        merchandise_revenue: data.merchandiseRevenue || 0,
        ticket_revenue: data.ticketRevenue || 0,
        subscription_revenue: data.subscriptionRevenue || 0,
        total_revenue: totalRevenue,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'artist_id,date'
      })
    
    if (error) throw error
    return { updated: true, source: 'direct' }
  }

  // Otherwise, calculate from various sources
  const startOfDay = new Date(date)
  startOfDay.setHours(0, 0, 0, 0)
  const endOfDay = new Date(date)
  endOfDay.setHours(23, 59, 59, 999)

  // Calculate streaming revenue (simplified: $0.003 per stream)
  const { data: streamStats } = await supabase
    .from('artist_streaming_stats')
    .select('stream_count')
    .eq('artist_id', artistId)
    .eq('date', date)
    .single()

  const streamingRevenue = (streamStats?.stream_count || 0) * 0.003

  // Calculate merchandise revenue
  const { data: merchOrders } = await supabase
    .from('artist_fan_orders')
    .select('total')
    .eq('artist_id', artistId)
    .gte('created_at', startOfDay.toISOString())
    .lte('created_at', endOfDay.toISOString())

  const merchandiseRevenue = merchOrders?.reduce((sum, order) => sum + (order.total || 0), 0) || 0

  // Calculate subscription revenue
  const { count: activeSubscriptions } = await supabase
    .from('artist_subscriptions')
    .select('*', { count: 'exact', head: true })
    .eq('artist_id', artistId)
    .eq('status', 'active')

  const subscriptionRevenue = (activeSubscriptions || 0) * 4.99 / 30 // Daily revenue from $4.99/month subscriptions

  // For demo, simulate ticket revenue
  const ticketRevenue = Math.random() < 0.1 ? Math.floor(Math.random() * 500) : 0

  const totalRevenue = streamingRevenue + merchandiseRevenue + ticketRevenue + subscriptionRevenue

  // Update revenue metrics
  const { error: updateError } = await supabase
    .from('artist_revenue_metrics')
    .upsert({
      artist_id: artistId,
      date,
      streaming_revenue: streamingRevenue,
      merchandise_revenue: merchandiseRevenue,
      ticket_revenue: ticketRevenue,
      subscription_revenue: subscriptionRevenue,
      total_revenue: totalRevenue,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'artist_id,date'
    })

  if (updateError) throw updateError

  return {
    updated: true,
    source: 'calculated',
    stats: {
      streamingRevenue,
      merchandiseRevenue,
      ticketRevenue,
      subscriptionRevenue,
      totalRevenue
    }
  }
}

async function triggerAnalyticsAggregation(supabase: any, artistId: string, date: string) {
  // This would trigger the analytics aggregation function
  // For now, we'll just log it
  console.log('Triggering analytics aggregation for artist:', artistId, 'date:', date)
  
  // You could call another edge function here or use pg_cron for scheduled aggregation
  return { triggered: true }
}
