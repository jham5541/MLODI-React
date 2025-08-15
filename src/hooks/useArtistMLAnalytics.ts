import { useState, useEffect } from 'react';
import MLService from '../services/ml/MLService';
import { supabase } from '../lib/supabase/client';

interface ArtistMLMetrics {
  // Growth & Trend Metrics
  growthRate: number;
  viralPotential: number;
  engagementScore: number;
  
  // Predictive Metrics
  predictedMonthlyGrowth: number;
  predictedEngagementTrend: 'increasing' | 'stable' | 'decreasing';
  
  // Audience Analysis
  audienceRetention: number;
  newListenerConversion: number;
  
  // Performance Metrics
  averageCompletionRate: number;
  skipRate: number;
  repeatListenRate: number;
  
  // ML Confidence
  mlConfidence: number;
}

interface StreamAnomaly {
  type: 'bot_behavior' | 'stream_farming' | 'unusual_pattern';
  confidence: number;
  detectedAt: Date;
  affectedStreams: number;
}

export function useArtistMLAnalytics(artistId: string) {
  const [loading, setLoading] = useState(false);
  const [metrics, setMetrics] = useState<ArtistMLMetrics | null>(null);
  const [anomalies, setAnomalies] = useState<StreamAnomaly[]>([]);
  const [isEmergingTalent, setIsEmergingTalent] = useState(false);
  const [similarArtists, setSimilarArtists] = useState<string[]>([]);

  useEffect(() => {
    if (!artistId) return;

    const loadMLAnalytics = async () => {
      setLoading(true);
      try {
        // 1. Get emerging talent insights
        const emergingArtists = await MLService.discoverEmergingTalent();
        const artistInsight = emergingArtists.find(a => a.artistId === artistId);
        
        if (artistInsight) {
          setIsEmergingTalent(true);
          setSimilarArtists(artistInsight.similarToTrending);
        }

        // 2. Fetch artist streaming data for analysis
        const { data: streamingData } = await supabase
          .from('artist_streaming_stats')
          .select('*')
          .eq('artist_id', artistId)
          .order('date', { ascending: false })
          .limit(30);

        // 3. Calculate ML-based metrics
        const mlMetrics = await calculateMLMetrics(artistId, streamingData, artistInsight);
        setMetrics(mlMetrics);

        // 4. Detect anomalies
        const detectedAnomalies = await detectStreamingAnomalies(artistId);
        setAnomalies(detectedAnomalies);

      } catch (error) {
        console.error('Error loading ML analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMLAnalytics();
  }, [artistId]);

  return {
    loading,
    metrics,
    anomalies,
    isEmergingTalent,
    similarArtists,
  };
}

async function calculateMLMetrics(
  artistId: string, 
  streamingData: any[],
  emergingInsight: any
): Promise<ArtistMLMetrics> {
  // Use existing ML insights if available
  const baseMetrics = {
    growthRate: emergingInsight?.growthRate || 0,
    viralPotential: emergingInsight?.viralPotential || 0,
    engagementScore: emergingInsight?.engagementScore || 0,
  };

  // Calculate additional metrics from streaming data
  if (!streamingData || streamingData.length < 2) {
    return {
      ...baseMetrics,
      predictedMonthlyGrowth: 0,
      predictedEngagementTrend: 'stable',
      audienceRetention: 0,
      newListenerConversion: 0,
      averageCompletionRate: 0,
      skipRate: 0,
      repeatListenRate: 0,
      mlConfidence: 0.5,
    };
  }

  // Calculate growth trajectory
  const recentStreams = streamingData.slice(0, 7).reduce((sum, d) => sum + (d.stream_count || 0), 0);
  const previousStreams = streamingData.slice(7, 14).reduce((sum, d) => sum + (d.stream_count || 0), 0);
  const weeklyGrowth = previousStreams > 0 ? (recentStreams - previousStreams) / previousStreams : 0;
  
  // Predict monthly growth using exponential smoothing
  const predictedMonthlyGrowth = weeklyGrowth * 4.3 * (1 + baseMetrics.viralPotential * 0.5);
  
  // Determine engagement trend
  const engagementTrend = weeklyGrowth > 0.1 ? 'increasing' : 
                         weeklyGrowth < -0.1 ? 'decreasing' : 'stable';

  // Calculate audience metrics (mock calculations for demo)
  const audienceRetention = 0.65 + (baseMetrics.engagementScore * 0.25);
  const newListenerConversion = 0.35 + (baseMetrics.viralPotential * 0.15);
  
  // Performance metrics from ML service data
  const avgCompletionRate = emergingInsight?.metrics?.completionRate || 0.75;
  const skipRate = 1 - avgCompletionRate;
  const repeatListenRate = emergingInsight?.metrics?.shareRate || 0.25;

  // Calculate ML confidence based on data availability
  const dataPoints = streamingData.length;
  const mlConfidence = Math.min(0.5 + (dataPoints / 60), 0.95);

  return {
    ...baseMetrics,
    predictedMonthlyGrowth: Math.round(predictedMonthlyGrowth * 100) / 100,
    predictedEngagementTrend: engagementTrend,
    audienceRetention: Math.round(audienceRetention * 100) / 100,
    newListenerConversion: Math.round(newListenerConversion * 100) / 100,
    averageCompletionRate: avgCompletionRate,
    skipRate: Math.round(skipRate * 100) / 100,
    repeatListenRate: repeatListenRate,
    mlConfidence: mlConfidence,
  };
}

async function detectStreamingAnomalies(artistId: string): Promise<StreamAnomaly[]> {
  try {
    // Get recent tracks for this artist
    const { data: tracks } = await supabase
      .from('tracks')
      .select('id')
      .eq('artist_id', artistId)
      .limit(10);

    if (!tracks || tracks.length === 0) return [];

    // Check for anomalies in recent tracks
    const anomalyPromises = tracks.map(track => 
      MLService.detectStreamAnomalies(track.id, 86400000) // Last 24 hours
    );

    const allAnomalies = await Promise.all(anomalyPromises);
    const flatAnomalies = allAnomalies.flat();

    // Transform to our format
    return flatAnomalies.map(anomaly => ({
      type: anomaly.anomalyType === 'BOT_BEHAVIOR' ? 'bot_behavior' :
            anomaly.anomalyType === 'STREAM_FARMING' ? 'stream_farming' : 
            'unusual_pattern',
      confidence: anomaly.confidence,
      detectedAt: anomaly.timestamp,
      affectedStreams: anomaly.metadata?.streamCount || 0,
    }));
  } catch (error) {
    console.error('Error detecting anomalies:', error);
    return [];
  }
}
