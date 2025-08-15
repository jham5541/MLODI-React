import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AggregationRequest {
  artistId: string;
  periodType: 'daily' | 'weekly' | 'monthly';
  endDate?: string; // ISO date string, defaults to today
}

interface MetricComparison {
  current: number;
  previous: number;
  growthRate: number;
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

    const { artistId, periodType, endDate }: AggregationRequest = await req.json()
    const targetEndDate = endDate || new Date().toISOString().split('T')[0]

    console.log('Aggregating analytics for artist:', artistId, 'period:', periodType, 'ending:', targetEndDate)

    // Calculate period dates
    const { currentStart, currentEnd, previousStart, previousEnd } = calculatePeriods(targetEndDate, periodType)

    // Fetch metrics for both periods
    const [currentMetrics, previousMetrics] = await Promise.all([
      fetchPeriodMetrics(supabase, artistId, currentStart, currentEnd),
      fetchPeriodMetrics(supabase, artistId, previousStart, previousEnd)
    ])

    // Calculate growth rates
    const streamingGrowth = calculateGrowthRate(
      currentMetrics.streaming,
      previousMetrics.streaming
    )

    const engagementGrowth = calculateEngagementGrowth(
      currentMetrics.engagement,
      previousMetrics.engagement
    )

    const revenueGrowth = calculateGrowthRate(
      currentMetrics.revenue.total,
      previousMetrics.revenue.total
    )

    // Get ML predictions if available
    const mlPrediction = await fetchMLPredictions(supabase, artistId)

    // Calculate overall artist interest change
    const interestChange = calculateArtistInterestChange({
      streamingGrowth: streamingGrowth.growthRate,
      engagementGrowth: engagementGrowth.growthRate,
      revenueGrowth: revenueGrowth.growthRate,
      mlPredictedGrowth: mlPrediction.growthRate
    })

    // Calculate engagement score
    const avgEngagementScore = calculateEngagementScore(currentMetrics.engagement)

    // Store the aggregated results
    const { error: upsertError } = await supabase
      .from('artist_analytics_summary')
      .upsert({
        artist_id: artistId,
        period_type: periodType,
        period_start: currentStart,
        period_end: currentEnd,
        interest_change_percentage: interestChange,
        streaming_growth_rate: streamingGrowth.growthRate,
        engagement_growth_rate: engagementGrowth.growthRate,
        revenue_growth_rate: revenueGrowth.growthRate,
        ml_predicted_growth: mlPrediction.growthRate,
        total_streams: currentMetrics.streaming.totalStreams,
        unique_listeners: currentMetrics.streaming.uniqueListeners,
        avg_engagement_score: avgEngagementScore,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'artist_id,period_type,period_start'
      })

    if (upsertError) throw upsertError

    // Store historical snapshot
    await storeHistoricalSnapshot(supabase, artistId, {
      date: targetEndDate,
      periodType,
      metrics: currentMetrics,
      analytics: {
        interestChange,
        streamingGrowth: streamingGrowth.growthRate,
        engagementGrowth: engagementGrowth.growthRate,
        revenueGrowth: revenueGrowth.growthRate,
        mlPredictedGrowth: mlPrediction.growthRate,
        avgEngagementScore
      }
    })

    return new Response(
      JSON.stringify({
        success: true,
        artistId,
        periodType,
        periodStart: currentStart,
        periodEnd: currentEnd,
        analytics: {
          interestChangePercentage: interestChange,
          streamingGrowth,
          engagementGrowth,
          revenueGrowth,
          mlPrediction,
          totalStreams: currentMetrics.streaming.totalStreams,
          uniqueListeners: currentMetrics.streaming.uniqueListeners,
          avgEngagementScore
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Analytics aggregation error:', error)
    
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

function calculatePeriods(endDate: string, periodType: string) {
  const end = new Date(endDate)
  let currentStart: Date
  let previousStart: Date
  let previousEnd: Date

  switch (periodType) {
    case 'daily':
      currentStart = new Date(end)
      previousEnd = new Date(end)
      previousEnd.setDate(previousEnd.getDate() - 1)
      previousStart = new Date(previousEnd)
      break
    
    case 'weekly':
      currentStart = new Date(end)
      currentStart.setDate(currentStart.getDate() - 6)
      previousEnd = new Date(currentStart)
      previousEnd.setDate(previousEnd.getDate() - 1)
      previousStart = new Date(previousEnd)
      previousStart.setDate(previousStart.getDate() - 6)
      break
    
    case 'monthly':
      currentStart = new Date(end)
      currentStart.setDate(currentStart.getDate() - 29)
      previousEnd = new Date(currentStart)
      previousEnd.setDate(previousEnd.getDate() - 1)
      previousStart = new Date(previousEnd)
      previousStart.setDate(previousStart.getDate() - 29)
      break
    
    default:
      throw new Error('Invalid period type')
  }

  return {
    currentStart: currentStart.toISOString().split('T')[0],
    currentEnd: end.toISOString().split('T')[0],
    previousStart: previousStart.toISOString().split('T')[0],
    previousEnd: previousEnd.toISOString().split('T')[0]
  }
}

async function fetchPeriodMetrics(
  supabase: any,
  artistId: string,
  startDate: string,
  endDate: string
) {
  // Fetch streaming metrics
  const { data: streamingData } = await supabase
    .from('artist_streaming_stats')
    .select('*')
    .eq('artist_id', artistId)
    .gte('date', startDate)
    .lte('date', endDate)

  const streaming = streamingData?.reduce((acc, day) => ({
    totalStreams: acc.totalStreams + (day.stream_count || 0),
    uniqueListeners: Math.max(acc.uniqueListeners, day.unique_listeners || 0),
    totalDuration: acc.totalDuration + (day.total_duration_seconds || 0),
    avgCompletionRate: acc.avgCompletionRate + (day.avg_completion_rate || 0),
    days: acc.days + 1
  }), {
    totalStreams: 0,
    uniqueListeners: 0,
    totalDuration: 0,
    avgCompletionRate: 0,
    days: 0
  }) || { totalStreams: 0, uniqueListeners: 0, totalDuration: 0, avgCompletionRate: 0, days: 0 }

  if (streaming.days > 0) {
    streaming.avgCompletionRate = streaming.avgCompletionRate / streaming.days
  }

  // Fetch engagement metrics
  const { data: engagementData } = await supabase
    .from('artist_engagement_metrics')
    .select('*')
    .eq('artist_id', artistId)
    .gte('date', startDate)
    .lte('date', endDate)

  const engagement = engagementData?.reduce((acc, day) => ({
    totalLikes: acc.totalLikes + (day.likes_count || 0),
    totalComments: acc.totalComments + (day.comments_count || 0),
    totalShares: acc.totalShares + (day.shares_count || 0),
    totalFollows: acc.totalFollows + (day.follows_count || 0),
    totalUnfollows: acc.totalUnfollows + (day.unfollows_count || 0),
    totalVideoViews: acc.totalVideoViews + (day.video_views || 0),
    totalProfileViews: acc.totalProfileViews + (day.profile_views || 0)
  }), {
    totalLikes: 0,
    totalComments: 0,
    totalShares: 0,
    totalFollows: 0,
    totalUnfollows: 0,
    totalVideoViews: 0,
    totalProfileViews: 0
  }) || {
    totalLikes: 0,
    totalComments: 0,
    totalShares: 0,
    totalFollows: 0,
    totalUnfollows: 0,
    totalVideoViews: 0,
    totalProfileViews: 0
  }

  // Fetch revenue metrics
  const { data: revenueData } = await supabase
    .from('artist_revenue_metrics')
    .select('*')
    .eq('artist_id', artistId)
    .gte('date', startDate)
    .lte('date', endDate)

  const revenue = revenueData?.reduce((acc, day) => ({
    streaming: acc.streaming + (day.streaming_revenue || 0),
    merchandise: acc.merchandise + (day.merchandise_revenue || 0),
    tickets: acc.tickets + (day.ticket_revenue || 0),
    subscriptions: acc.subscriptions + (day.subscription_revenue || 0),
    total: acc.total + (day.total_revenue || 0)
  }), {
    streaming: 0,
    merchandise: 0,
    tickets: 0,
    subscriptions: 0,
    total: 0
  }) || {
    streaming: 0,
    merchandise: 0,
    tickets: 0,
    subscriptions: 0,
    total: 0
  }

  return { streaming, engagement, revenue }
}

function calculateGrowthRate(current: number, previous: number): MetricComparison {
  const growthRate = previous > 0 
    ? ((current - previous) / previous) * 100 
    : current > 0 ? 100 : 0

  return {
    current,
    previous,
    growthRate: Math.round(growthRate * 100) / 100
  }
}

function calculateEngagementGrowth(
  currentEngagement: any,
  previousEngagement: any
): MetricComparison {
  // Calculate weighted engagement score
  const calculateScore = (eng: any) => {
    return (
      (eng.totalLikes || 0) * 1 +
      (eng.totalComments || 0) * 2 +
      (eng.totalShares || 0) * 3 +
      (eng.totalFollows || 0) * 5 -
      (eng.totalUnfollows || 0) * 5 +
      (eng.totalVideoViews || 0) * 0.5 +
      (eng.totalProfileViews || 0) * 0.2
    )
  }

  const currentScore = calculateScore(currentEngagement)
  const previousScore = calculateScore(previousEngagement)

  return calculateGrowthRate(currentScore, previousScore)
}

function calculateArtistInterestChange(growth: {
  streamingGrowth: number;
  engagementGrowth: number;
  revenueGrowth: number;
  mlPredictedGrowth: number;
}): number {
  // Weighted average calculation
  const weights = {
    streaming: 0.4,
    engagement: 0.3,
    revenue: 0.2,
    ml: 0.1
  }

  const interestChange = 
    growth.streamingGrowth * weights.streaming +
    growth.engagementGrowth * weights.engagement +
    growth.revenueGrowth * weights.revenue +
    growth.mlPredictedGrowth * weights.ml

  // Apply smoothing to avoid extreme values
  const smoothedChange = Math.max(-50, Math.min(200, interestChange))

  return Math.round(smoothedChange * 100) / 100
}

function calculateEngagementScore(engagement: any): number {
  // Calculate a normalized engagement score (0-100)
  const totalEngagements = 
    (engagement.totalLikes || 0) +
    (engagement.totalComments || 0) * 2 +
    (engagement.totalShares || 0) * 3 +
    (engagement.totalVideoViews || 0) * 0.1

  // Normalize to 0-100 scale (assuming 10,000 engagements = 100 score)
  const score = Math.min(100, (totalEngagements / 10000) * 100)

  return Math.round(score * 100) / 100
}

async function fetchMLPredictions(supabase: any, artistId: string) {
  // In a real implementation, this would fetch from ML service
  // For now, return a simulated prediction
  const randomGrowth = Math.random() * 20 - 5 // -5% to +15%
  
  return {
    growthRate: Math.round(randomGrowth * 100) / 100,
    confidence: 0.75,
    factors: ['viral_potential', 'seasonal_trends', 'genre_momentum']
  }
}

async function storeHistoricalSnapshot(
  supabase: any,
  artistId: string,
  snapshot: any
) {
  const { error } = await supabase
    .from('artist_metrics_history')
    .insert({
      artist_id: artistId,
      snapshot_date: new Date().toISOString(),
      metrics: snapshot
    })

  if (error) {
    console.error('Error storing historical snapshot:', error)
  }
}
