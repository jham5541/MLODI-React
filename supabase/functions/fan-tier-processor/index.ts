import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface FanTierRequest {
  userId: string;
  artistId: string;
  activity: {
    type: 'song_play' | 'song_like' | 'song_share' | 'playlist_create' | 'nft_purchase' | 'concert_attend';
    value: number; // Duration for plays, 1 for likes/shares, price for purchases
    metadata?: any;
  };
}

interface TierUpdateResult {
  previousTier: string;
  newTier: string;
  pointsEarned: number;
  totalPoints: number;
  tierChanged: boolean;
  achievementsUnlocked: string[];
  milestonesReached: string[];
  nextTierProgress: {
    current: number;
    required: number;
    percentage: number;
  };
}

const TIER_THRESHOLDS = {
  Bronze: { min: 0, max: 999 },
  Silver: { min: 1000, max: 4999 },
  Gold: { min: 5000, max: 14999 },
  Diamond: { min: 15000, max: 39999 },
  Platinum: { min: 40000, max: Infinity },
}

const ACTIVITY_POINTS = {
  song_play: (duration: number) => Math.min(Math.floor(duration / 30000) * 5, 25), // 5 points per 30s, max 25
  song_like: () => 10,
  song_share: () => 15,
  playlist_create: () => 50,
  nft_purchase: (price: number) => Math.min(price * 100, 1000), // 100 points per unit, max 1000
  concert_attend: () => 500,
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

    const { userId, artistId, activity }: FanTierRequest = await req.json()

    console.log('Processing fan tier update:', { userId, artistId, activity })

    // Get current fan tier
    const { data: currentTier, error: tierError } = await supabase
      .from('fan_tiers')
      .select('*')
      .eq('user_id', userId)
      .eq('artist_id', artistId)
      .single()

    if (tierError && tierError.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw tierError
    }

    // Calculate points earned from activity
    const pointsEarned = ACTIVITY_POINTS[activity.type](activity.value)
    const previousPoints = currentTier?.points || 0
    const newTotalPoints = previousPoints + pointsEarned

    // Determine tier based on points
    const previousTierName = currentTier?.tier || 'Bronze'
    const newTierName = calculateTier(newTotalPoints)
    const tierChanged = previousTierName !== newTierName

    // Update fan tier data
    const fanTierData = {
      user_id: userId,
      artist_id: artistId,
      tier: newTierName,
      points: newTotalPoints,
      total_listening_time_ms: currentTier?.total_listening_time_ms || 0,
      songs_liked: currentTier?.songs_liked || 0,
      songs_shared: currentTier?.songs_shared || 0,
      playlists_created: currentTier?.playlists_created || 0,
      nfts_purchased: currentTier?.nfts_purchased || 0,
      streak_days: currentTier?.streak_days || 0,
      last_activity_at: new Date().toISOString(),
    }

    // Update activity-specific counters
    switch (activity.type) {
      case 'song_play':
        fanTierData.total_listening_time_ms += activity.value
        break
      case 'song_like':
        fanTierData.songs_liked += 1
        break
      case 'song_share':
        fanTierData.songs_shared += 1
        break
      case 'playlist_create':
        fanTierData.playlists_created += 1
        break
      case 'nft_purchase':
        fanTierData.nfts_purchased += 1
        break
    }

    // Update streak if activity is today
    const lastActivity = currentTier?.last_activity_at ? new Date(currentTier.last_activity_at) : null
    const today = new Date()
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
    
    if (!lastActivity || lastActivity < yesterday) {
      fanTierData.streak_days = 1 // Reset streak
    } else if (lastActivity.toDateString() === yesterday.toDateString()) {
      fanTierData.streak_days = (currentTier?.streak_days || 0) + 1 // Continue streak
    }

    // Upsert fan tier
    const { error: upsertError } = await supabase
      .from('fan_tiers')
      .upsert(fanTierData, {
        onConflict: 'user_id,artist_id'
      })

    if (upsertError) {
      throw upsertError
    }

    // Check for achievements and milestones
    const achievementsUnlocked = await checkAchievements(supabase, userId, artistId, fanTierData, activity)
    const milestonesReached = await checkMilestones(supabase, userId, artistId, newTotalPoints)

    // Log fan activity for real-time updates
    await supabase
      .from('fan_activity_log')
      .insert({
        user_id: userId,
        artist_id: artistId,
        activity_type: activity.type,
        points_earned: pointsEarned,
        tier_updated: tierChanged,
        achievement_unlocked: achievementsUnlocked.length > 0 ? achievementsUnlocked[0] : null,
        data: {
          ...activity.metadata,
          previous_tier: previousTierName,
          new_tier: newTierName,
          achievements: achievementsUnlocked,
          milestones: milestonesReached
        }
      })

    // Send notifications if tier changed or achievements unlocked
    if (tierChanged || achievementsUnlocked.length > 0) {
      await sendTierNotifications(supabase, userId, artistId, {
        tierChanged,
        previousTier: previousTierName,
        newTier: newTierName,
        achievementsUnlocked
      })
    }

    // Calculate next tier progress
    const nextTierProgress = calculateNextTierProgress(newTotalPoints, newTierName)

    const result: TierUpdateResult = {
      previousTier: previousTierName,
      newTier: newTierName,
      pointsEarned,
      totalPoints: newTotalPoints,
      tierChanged,
      achievementsUnlocked,
      milestonesReached,
      nextTierProgress
    }

    return new Response(
      JSON.stringify({
        success: true,
        result,
        message: tierChanged 
          ? `Congratulations! You've reached ${newTierName} tier!`
          : `You earned ${pointsEarned} points!`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Fan tier processing error:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        result: null
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})

function calculateTier(points: number): string {
  for (const [tier, threshold] of Object.entries(TIER_THRESHOLDS)) {
    if (points >= threshold.min && points <= threshold.max) {
      return tier
    }
  }
  return 'Bronze'
}

function calculateNextTierProgress(points: number, currentTier: string) {
  const tierNames = Object.keys(TIER_THRESHOLDS)
  const currentIndex = tierNames.indexOf(currentTier)
  
  if (currentIndex === tierNames.length - 1) {
    // Already at highest tier
    return {
      current: points,
      required: points,
      percentage: 100
    }
  }
  
  const nextTier = tierNames[currentIndex + 1]
  const nextThreshold = TIER_THRESHOLDS[nextTier].min
  const currentThreshold = TIER_THRESHOLDS[currentTier].min
  
  const progress = points - currentThreshold
  const required = nextThreshold - currentThreshold
  const percentage = Math.min((progress / required) * 100, 100)
  
  return {
    current: progress,
    required: required,
    percentage: Math.round(percentage)
  }
}

async function checkAchievements(
  supabase: any,
  userId: string,
  artistId: string,
  fanData: any,
  activity: any
): Promise<string[]> {
  // Get available achievements for this artist
  const { data: achievements } = await supabase
    .from('achievements')
    .select('*')
    .or(`artist_id.eq.${artistId},artist_id.is.null`) // Artist-specific or global achievements

  // Get user's existing achievements
  const { data: userAchievements } = await supabase
    .from('user_achievements')
    .select('achievement_id')
    .eq('user_id', userId)
    .eq('artist_id', artistId)

  const unlockedAchievementIds = new Set(userAchievements?.map(ua => ua.achievement_id) || [])
  const newlyUnlocked: string[] = []

  for (const achievement of achievements || []) {
    if (unlockedAchievementIds.has(achievement.id)) continue

    const criteria = achievement.unlock_criteria
    let unlocked = false

    // Check various achievement criteria
    switch (criteria.type) {
      case 'points_total':
        unlocked = fanData.points >= criteria.value
        break
      case 'listening_time':
        unlocked = fanData.total_listening_time_ms >= criteria.value
        break
      case 'songs_liked':
        unlocked = fanData.songs_liked >= criteria.value
        break
      case 'streak_days':
        unlocked = fanData.streak_days >= criteria.value
        break
      case 'tier_reached':
        unlocked = fanData.tier === criteria.value
        break
      case 'activity_count':
        const activityCount = getActivityCount(fanData, criteria.activity_type)
        unlocked = activityCount >= criteria.value
        break
    }

    if (unlocked) {
      // Insert user achievement
      await supabase
        .from('user_achievements')
        .insert({
          user_id: userId,
          achievement_id: achievement.id,
          artist_id: artistId,
          progress_data: {
            unlocked_by: activity.type,
            unlocked_value: getActivityCount(fanData, criteria.type)
          },
          unlocked_at: new Date().toISOString()
        })

      newlyUnlocked.push(achievement.title)
    }
  }

  return newlyUnlocked
}

async function checkMilestones(
  supabase: any,
  userId: string,
  artistId: string,
  points: number
): Promise<string[]> {
  // Get available milestones
  const { data: milestones } = await supabase
    .from('milestones')
    .select('*')
    .lte('required_points', points)

  // Get user's existing milestone progress
  const { data: userMilestones } = await supabase
    .from('user_milestone_progress')
    .select('milestone_id, is_completed')
    .eq('user_id', userId)
    .eq('artist_id', artistId)

  const completedMilestoneIds = new Set(
    userMilestones?.filter(um => um.is_completed).map(um => um.milestone_id) || []
  )

  const newlyReached: string[] = []

  for (const milestone of milestones || []) {
    if (completedMilestoneIds.has(milestone.id)) continue

    // Complete the milestone
    await supabase
      .from('user_milestone_progress')
      .upsert({
        user_id: userId,
        milestone_id: milestone.id,
        artist_id: artistId,
        is_completed: true,
        completed_at: new Date().toISOString(),
        reward_claimed: false
      }, {
        onConflict: 'user_id,milestone_id,artist_id'
      })

    newlyReached.push(milestone.title)
  }

  return newlyReached
}

function getActivityCount(fanData: any, activityType: string): number {
  const mapping = {
    points_total: fanData.points,
    listening_time: fanData.total_listening_time_ms,
    songs_liked: fanData.songs_liked,
    songs_shared: fanData.songs_shared,
    playlists_created: fanData.playlists_created,
    nfts_purchased: fanData.nfts_purchased,
    streak_days: fanData.streak_days
  }
  
  return mapping[activityType] || 0
}

async function sendTierNotifications(
  supabase: any,
  userId: string,
  artistId: string,
  updateInfo: any
) {
  const notifications = []

  if (updateInfo.tierChanged) {
    notifications.push({
      type: 'tier_upgrade',
      title: `🎉 Tier Upgrade!`,
      message: `You've reached ${updateInfo.newTier} tier!`,
      data: {
        artistId,
        previousTier: updateInfo.previousTier,
        newTier: updateInfo.newTier
      }
    })
  }

  for (const achievement of updateInfo.achievementsUnlocked) {
    notifications.push({
      type: 'achievement',
      title: `🏆 Achievement Unlocked!`,
      message: achievement,
      data: {
        artistId,
        achievement
      }
    })
  }

  // Send notifications via the notification dispatcher
  for (const notification of notifications) {
    try {
      await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/notification-dispatcher`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
        },
        body: JSON.stringify({
          ...notification,
          userId,
          channels: ['push', 'in_app']
        })
      })
    } catch (error) {
      console.error('Failed to send notification:', error)
    }
  }
}