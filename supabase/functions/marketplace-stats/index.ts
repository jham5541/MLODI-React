import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface MarketplaceStatsRequest {
  timeWindow?: 'day' | 'week' | 'month' | 'all';
  category?: string;
  type?: 'song' | 'album' | 'video' | 'merch';
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

    const { timeWindow = 'all', category, type }: MarketplaceStatsRequest = await req.json()

    console.log('Calculating marketplace stats:', { timeWindow, category, type })

    // Calculate time threshold
    const getTimeThreshold = (window: string) => {
      const now = new Date()
      switch (window) {
        case 'day':
          return new Date(now.getTime() - 24 * 60 * 60 * 1000)
        case 'week':
          return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        case 'month':
          return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        default:
          return new Date('1900-01-01')
      }
    }

    const timeThreshold = getTimeThreshold(timeWindow)

    // Get total volume (sum of order totals)
    let volumeQuery = supabase
      .from('orders')
      .select('total_amount')
      .eq('payment_status', 'paid')
      .gte('created_at', timeThreshold.toISOString())

    const { data: volumeData } = await volumeQuery
    const totalVolume = volumeData?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0

    // Get total sales count
    let salesQuery = supabase
      .from('orders')
      .select('id')
      .eq('payment_status', 'paid')
      .gte('created_at', timeThreshold.toISOString())

    const { data: salesData } = await salesQuery
    const totalSales = salesData?.length || 0

    // Get listed items count
    let listedQuery = supabase
      .from('products')
      .select('id')
      .eq('is_active', true)

    if (type) {
      listedQuery = listedQuery.eq('type', type)
    }

    const { data: listedData } = await listedQuery
    const listedItems = listedData?.length || 0

    // Get unique owners count
    const { data: ownersData } = await supabase
      .from('user_library')
      .select('user_id', { count: 'exact' })
      .gte('purchased_at', timeThreshold.toISOString())

    const uniqueOwners = new Set(ownersData?.map(item => item.user_id)).size

    // Get floor price (minimum price of active products)
    let floorQuery = supabase
      .from('products')
      .select('price')
      .eq('is_active', true)
      .gt('price', 0)
      .order('price', { ascending: true })
      .limit(1)

    if (type) {
      floorQuery = floorQuery.eq('type', type)
    }

    const { data: floorData } = await floorQuery
    const floorPrice = floorData?.[0]?.price || 0

    // Calculate average price
    let avgQuery = supabase
      .from('products')
      .select('price')
      .eq('is_active', true)
      .gt('price', 0)

    if (type) {
      avgQuery = avgQuery.eq('type', type)
    }

    const { data: avgData } = await avgQuery
    const averagePrice = avgData?.length > 0 
      ? avgData.reduce((sum, product) => sum + product.price, 0) / avgData.length 
      : 0

    // Get trending products
    const { data: trendingData } = await supabase
      .from('products')
      .select(`
        id,
        title,
        price,
        cover_url,
        type,
        artists(name, is_verified)
      `)
      .eq('is_active', true)
      .eq('is_featured', true)
      .order('created_at', { ascending: false })
      .limit(10)

    // Get top categories by product count
    const { data: categoryData } = await supabase
      .from('products')
      .select('type')
      .eq('is_active', true)

    const categoryStats = categoryData?.reduce((acc, product) => {
      acc[product.type] = (acc[product.type] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    const topCategories = Object.entries(categoryStats)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }))

    // Get sales by type
    const { data: salesByTypeData } = await supabase
      .from('order_items')
      .select(`
        product_type,
        total_price,
        orders!inner(payment_status, created_at)
      `)
      .eq('orders.payment_status', 'paid')
      .gte('orders.created_at', timeThreshold.toISOString())

    const salesByType = salesByTypeData?.reduce((acc, item) => {
      const type = item.product_type
      if (!acc[type]) {
        acc[type] = { count: 0, revenue: 0 }
      }
      acc[type].count += 1
      acc[type].revenue += item.total_price
      return acc
    }, {} as Record<string, { count: number; revenue: number }>) || {}

    const statistics = {
      totalVolume: Math.round(totalVolume * 100) / 100,
      floorPrice: Math.round(floorPrice * 100) / 100,
      averagePrice: Math.round(averagePrice * 100) / 100,
      listedItems,
      uniqueOwners,
      totalSales,
      trending: trendingData || [],
      topCategories,
      salesByType,
      generatedAt: new Date().toISOString(),
      timeWindow
    }

    return new Response(
      JSON.stringify({
        success: true,
        statistics
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Marketplace stats error:', error)
    
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
