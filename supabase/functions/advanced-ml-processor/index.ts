import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface MLRequest {
  mode: 'emerging_artists' | 'top_performing_artists';
  limit?: number;
  topPercentage?: number;
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
      mode, 
      limit = 10,
      topPercentage = 0.01
    }: MLRequest = await req.json()

    console.log(`🚀 ML Service invoked in '${mode}' mode`);

    let rpc_name = '';
    let rpc_params = {};

    if (mode === 'emerging_artists') {
      rpc_name = 'get_emerging_artists';
      rpc_params = { limit_count: limit };
    } else if (mode === 'top_performing_artists') {
      rpc_name = 'get_top_performing_artists';
      rpc_params = { top_percentage: topPercentage, limit_count: limit };
    } else {
      throw new Error('Invalid mode specified');
    }

    const { data, error } = await supabase.rpc(rpc_name, rpc_params);

    if (error) {
      console.error(`❌ Supabase RPC error in ${rpc_name}:`, error);
      throw error;
    }

    // The RPC functions will return artists with calculated scores
    const artists = data.map((artist: any) => ({
      artistId: artist.artist_id,
      name: artist.name || `Artist ${artist.artist_id.slice(-4)}`,
      coverUrl: artist.avatar_url || `https://picsum.photos/150/120?random=${artist.artist_id}`,
      growthRate: artist.growth_rate || 0,
      engagementScore: artist.engagement_score || 0,
      viralPotential: artist.viral_potential || 0,
      isVerified: artist.is_verified || false,
      metrics: {
        weeklyListenerGrowth: artist.weekly_growth || 0,
        playlistAdditions: artist.playlist_adds || 0,
        shareRate: artist.share_rate || 0,
        completionRate: artist.completion_rate || 0
      }
    }));

    return new Response(
      JSON.stringify({ success: true, artists }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 },
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 },
    )
  }
})

