import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NFTDropsRequest {
  status?: 'upcoming' | 'live' | 'ended' | 'all';
  limit?: number;
  artistId?: string;
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

    const { status = 'upcoming', limit = 20, artistId }: NFTDropsRequest = await req.json()

    console.log('Fetching NFT drops:', { status, limit, artistId })

    // Build query for NFT drops
    let query = supabase
      .from('nft_drops')
      .select(`
        *,
        artists(id, name, avatar_url, is_verified),
        products(id, title, cover_url, price, type)
      `)
      .order('drop_date', { ascending: true })
      .limit(limit)

    // Filter by status
    const now = new Date().toISOString()
    switch (status) {
      case 'upcoming':
        query = query.gt('drop_date', now)
        break
      case 'live':
        query = query.lte('drop_date', now).gt('end_date', now)
        break
      case 'ended':
        query = query.lt('end_date', now)
        break
      // 'all' doesn't need additional filtering
    }

    // Filter by artist if specified
    if (artistId) {
      query = query.eq('artist_id', artistId)
    }

    const { data: drops, error } = await query

    if (error) throw error

    // Add computed fields to drops
    const enrichedDrops = drops?.map(drop => {
      const currentTime = new Date()
      const dropTime = new Date(drop.drop_date)
      const endTime = new Date(drop.end_date)
      
      let dropStatus: string
      if (currentTime < dropTime) {
        dropStatus = 'upcoming'
      } else if (currentTime >= dropTime && currentTime < endTime) {
        dropStatus = 'live'
      } else {
        dropStatus = 'ended'
      }

      const timeUntilDrop = dropTime.getTime() - currentTime.getTime()
      const timeUntilEnd = endTime.getTime() - currentTime.getTime()

      return {
        ...drop,
        status: dropStatus,
        timeUntilDrop: timeUntilDrop > 0 ? timeUntilDrop : 0,
        timeUntilEnd: timeUntilEnd > 0 ? timeUntilEnd : 0,
        isNotifiable: dropStatus === 'upcoming' && timeUntilDrop > 0,
        canPurchase: dropStatus === 'live'
      }
    }) || []

    // Get notification status for authenticated user
    const authHeader = req.headers.get('Authorization')
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '')
      const { data: { user } } = await supabase.auth.getUser(token)
      
      if (user) {
        // Get user's notification preferences for these drops
        const dropIds = enrichedDrops.map(drop => drop.id)
        const { data: notifications } = await supabase
          .from('drop_notifications')
          .select('drop_id')
          .eq('user_id', user.id)
          .in('drop_id', dropIds)

        const notifiedDropIds = new Set(notifications?.map(n => n.drop_id) || [])
        
        // Add notification status to each drop
        enrichedDrops.forEach(drop => {
          drop.isNotified = notifiedDropIds.has(drop.id)
        })
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        drops: enrichedDrops,
        count: enrichedDrops.length,
        status,
        fetchedAt: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('NFT drops fetch error:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        drops: []
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})
