import { supabase } from '../lib/supabase/client';

interface ArtistAnalytics {
  interestChangePercentage: number;
  monthlyGrowth: number;
  streamingStats: {
    totalStreams: number;
    uniqueListeners: number;
    avgCompletionRate: number;
  };
  engagementStats: {
    totalLikes: number;
    totalComments: number;
    totalShares: number;
    engagementScore: number;
  };
  revenueStats: {
    streamingRevenue: number;
    merchandiseRevenue: number;
    ticketRevenue: number;
    subscriptionRevenue: number;
    totalRevenue: number;
  };
}

interface ArtistMetricBreakdown {
  streaming: {
    plays: number;
    revenue?: number;
  };
  merchandise: {
    available: number;
    total: number;
    revenue?: number;
  };
  tickets: {
    sold: number;
    revenue?: number;
  };
  subscriptions: {
    active: number;
    revenue?: number;
  };
}

class ArtistAnalyticsService {
  /**
   * Fetch the latest artist analytics summary
   */
  async getArtistAnalytics(artistId: string): Promise<ArtistAnalytics | null> {
    try {
      // First, try to get the pre-aggregated summary
      const { data: summary, error: summaryError } = await supabase
        .from('artist_analytics_summary')
        .select('*')
        .eq('artist_id', artistId)
        .eq('period_type', 'monthly')
        .order('period_end', { ascending: false })
        .limit(1)
        .single();

      if (summaryError && summaryError.code !== 'PGRST116') {
        console.error('Error fetching artist analytics summary:', summaryError);
      }

      // If we have a summary, use it
      if (summary) {
        return this.formatAnalyticsFromSummary(summary);
      }

      // Otherwise, calculate from raw data
      return await this.calculateAnalyticsFromRawData(artistId);
    } catch (error) {
      console.error('Error in getArtistAnalytics:', error);
      return null;
    }
  }

  /**
   * Get breakdown metrics for the Revenue Insights component
   */
  async getArtistMetricBreakdown(artistId: string): Promise<ArtistMetricBreakdown | null> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      // Fetch streaming data
      const { data: streamingData } = await supabase
        .from('artist_streaming_stats')
        .select('stream_count')
        .eq('artist_id', artistId)
        .gte('date', thirtyDaysAgo)
        .lte('date', today);

      const totalStreams = streamingData?.reduce((sum, day) => sum + (day.stream_count || 0), 0) || 0;
      
      // Calculate streaming revenue (assuming $0.003 per stream)
      const streamingRevenue = totalStreams * 0.003;

      // Fetch merchandise data - real data from merchandise table
      const { data: merchandiseData } = await supabase
        .from('merchandise')
        .select('inventory_count')
        .eq('artist_id', artistId)
        .eq('is_active', true);

      const totalInventory = merchandiseData?.reduce((sum, item) => sum + (item.inventory_count || 0), 0) || 0;
      
      // Fetch merchandise orders to calculate sold items and revenue
      const { data: merchandiseOrders } = await supabase
        .from('merchandise_orders')
        .select('quantity, total_price, merchandise(artist_id)')
        .eq('merchandise.artist_id', artistId)
        .gte('created_at', thirtyDaysAgo);

      const soldMerchandise = merchandiseOrders?.reduce((sum, order) => sum + (order.quantity || 0), 0) || 0;
      const merchandiseRevenue = merchandiseOrders?.reduce((sum, order) => sum + (Number(order.total_price) || 0), 0) || 0;
      
      const merchandiseInventory = {
        available: totalInventory,
        total: totalInventory + soldMerchandise,
        revenue: merchandiseRevenue
      };

      // Fetch ticket sales from events
      const { data: eventsData } = await supabase
        .from('events')
        .select('tickets_sold, ticket_price')
        .eq('artist_id', artistId)
        .gte('event_date', thirtyDaysAgo);

      const ticketsSold = eventsData?.reduce((sum, event) => sum + (event.tickets_sold || 0), 0) || 0;
      const ticketRevenue = eventsData?.reduce((sum, event) => sum + ((event.tickets_sold || 0) * (Number(event.ticket_price) || 0)), 0) || 0;

      // Fetch active subscriptions
      const { count: activeSubscriptions } = await supabase
        .from('artist_subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('artist_id', artistId)
        .eq('status', 'active');
      
      // Calculate subscription revenue (assuming $5/month per subscription)
      const subscriptionRevenue = (activeSubscriptions || 0) * 5;

      return {
        streaming: {
          plays: totalStreams,
          revenue: streamingRevenue
        },
        merchandise: merchandiseInventory,
        tickets: {
          sold: ticketsSold,
          revenue: ticketRevenue
        },
        subscriptions: {
          active: activeSubscriptions || 0,
          revenue: subscriptionRevenue
        }
      };
    } catch (error) {
      console.error('Error fetching artist metric breakdown:', error);
      return null;
    }
  }

  /**
   * Trigger analytics aggregation for an artist
   */
  async triggerAnalyticsAggregation(artistId: string, periodType: 'daily' | 'weekly' | 'monthly' = 'monthly') {
    try {
      const { data, error } = await supabase.functions.invoke('aggregate-artist-analytics', {
        body: { artistId, periodType }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error triggering analytics aggregation:', error);
      return null;
    }
  }

  /**
   * Collect metrics for an artist (can be called periodically)
   */
  async collectArtistMetrics(artistId: string) {
    try {
      const { data, error } = await supabase.functions.invoke('collect-artist-metrics', {
        body: { artistId, metricType: 'all' }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error collecting artist metrics:', error);
      return null;
    }
  }

  private formatAnalyticsFromSummary(summary: any): ArtistAnalytics {
    return {
      interestChangePercentage: summary.interest_change_percentage || 0,
      monthlyGrowth: summary.interest_change_percentage || 0,
      streamingStats: {
        totalStreams: summary.total_streams || 0,
        uniqueListeners: summary.unique_listeners || 0,
        avgCompletionRate: 0.75 // Default value, could be calculated
      },
      engagementStats: {
        totalLikes: 0, // Would need to fetch separately
        totalComments: 0,
        totalShares: 0,
        engagementScore: summary.avg_engagement_score || 0
      },
      revenueStats: {
        streamingRevenue: 0, // Would need to fetch separately
        merchandiseRevenue: 0,
        ticketRevenue: 0,
        subscriptionRevenue: 0,
        totalRevenue: 0
      }
    };
  }

  private async calculateAnalyticsFromRawData(artistId: string): Promise<ArtistAnalytics> {
    const today = new Date();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

    // Fetch current period data
    const [streaming, engagement, revenue] = await Promise.all([
      this.fetchStreamingData(artistId, thirtyDaysAgo, today),
      this.fetchEngagementData(artistId, thirtyDaysAgo, today),
      this.fetchRevenueData(artistId, thirtyDaysAgo, today)
    ]);

    // Fetch previous period data for comparison
    const [prevStreaming, prevEngagement, prevRevenue] = await Promise.all([
      this.fetchStreamingData(artistId, sixtyDaysAgo, thirtyDaysAgo),
      this.fetchEngagementData(artistId, sixtyDaysAgo, thirtyDaysAgo),
      this.fetchRevenueData(artistId, sixtyDaysAgo, thirtyDaysAgo)
    ]);

    // Calculate growth rates
    const streamingGrowth = this.calculateGrowthRate(streaming.totalStreams, prevStreaming.totalStreams);
    const engagementGrowth = this.calculateGrowthRate(
      engagement.totalLikes + engagement.totalComments + engagement.totalShares,
      prevEngagement.totalLikes + prevEngagement.totalComments + prevEngagement.totalShares
    );
    const revenueGrowth = this.calculateGrowthRate(revenue.totalRevenue, prevRevenue.totalRevenue);

    // Calculate overall interest change (weighted average)
    const interestChange = (streamingGrowth * 0.4) + (engagementGrowth * 0.3) + (revenueGrowth * 0.3);

    return {
      interestChangePercentage: Math.round(interestChange * 100) / 100,
      monthlyGrowth: Math.round(interestChange * 100) / 100,
      streamingStats: streaming,
      engagementStats: engagement,
      revenueStats: revenue
    };
  }

  private async fetchStreamingData(artistId: string, startDate: Date, endDate: Date) {
    const { data } = await supabase
      .from('artist_streaming_stats')
      .select('*')
      .eq('artist_id', artistId)
      .gte('date', startDate.toISOString().split('T')[0])
      .lte('date', endDate.toISOString().split('T')[0]);

    const stats = data?.reduce((acc, day) => ({
      totalStreams: acc.totalStreams + (day.stream_count || 0),
      uniqueListeners: Math.max(acc.uniqueListeners, day.unique_listeners || 0),
      avgCompletionRate: acc.avgCompletionRate + (day.avg_completion_rate || 0),
      days: acc.days + 1
    }), {
      totalStreams: 0,
      uniqueListeners: 0,
      avgCompletionRate: 0,
      days: 0
    }) || { totalStreams: 0, uniqueListeners: 0, avgCompletionRate: 0, days: 0 };

    if (stats.days > 0) {
      stats.avgCompletionRate = stats.avgCompletionRate / stats.days;
    }

    return {
      totalStreams: stats.totalStreams,
      uniqueListeners: stats.uniqueListeners,
      avgCompletionRate: stats.avgCompletionRate
    };
  }

  private async fetchEngagementData(artistId: string, startDate: Date, endDate: Date) {
    const { data } = await supabase
      .from('artist_engagement_metrics')
      .select('*')
      .eq('artist_id', artistId)
      .gte('date', startDate.toISOString().split('T')[0])
      .lte('date', endDate.toISOString().split('T')[0]);

    const stats = data?.reduce((acc, day) => ({
      totalLikes: acc.totalLikes + (day.likes_count || 0),
      totalComments: acc.totalComments + (day.comments_count || 0),
      totalShares: acc.totalShares + (day.shares_count || 0)
    }), {
      totalLikes: 0,
      totalComments: 0,
      totalShares: 0
    }) || { totalLikes: 0, totalComments: 0, totalShares: 0 };

    // Calculate engagement score
    const engagementScore = Math.min(100, 
      ((stats.totalLikes + stats.totalComments * 2 + stats.totalShares * 3) / 1000) * 100
    );

    return {
      ...stats,
      engagementScore: Math.round(engagementScore * 100) / 100
    };
  }

  private async fetchRevenueData(artistId: string, startDate: Date, endDate: Date) {
    const { data } = await supabase
      .from('artist_revenue_metrics')
      .select('*')
      .eq('artist_id', artistId)
      .gte('date', startDate.toISOString().split('T')[0])
      .lte('date', endDate.toISOString().split('T')[0]);

    const stats = data?.reduce((acc, day) => ({
      streamingRevenue: acc.streamingRevenue + (day.streaming_revenue || 0),
      merchandiseRevenue: acc.merchandiseRevenue + (day.merchandise_revenue || 0),
      ticketRevenue: acc.ticketRevenue + (day.ticket_revenue || 0),
      subscriptionRevenue: acc.subscriptionRevenue + (day.subscription_revenue || 0),
      totalRevenue: acc.totalRevenue + (day.total_revenue || 0)
    }), {
      streamingRevenue: 0,
      merchandiseRevenue: 0,
      ticketRevenue: 0,
      subscriptionRevenue: 0,
      totalRevenue: 0
    }) || {
      streamingRevenue: 0,
      merchandiseRevenue: 0,
      ticketRevenue: 0,
      subscriptionRevenue: 0,
      totalRevenue: 0
    };

    return stats;
  }

  private calculateGrowthRate(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }
}

export const artistAnalyticsService = new ArtistAnalyticsService();
export default artistAnalyticsService;
