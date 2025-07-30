# ML Metrics: Viral Potential & Growth Rate Calculation

## Overview
The ML system calculates **Viral Potential** and **Growth Rate** using multiple data sources and sophisticated algorithms to identify emerging artists before they become mainstream.

## 1. Viral Potential (0-100%)

### Data Sources Used:
- **Streaming velocity**: Rate of stream increase over time windows
- **Social sharing**: Track/artist mentions across social platforms
- **Playlist additions**: Rate of playlist inclusions by users
- **Geographic spread**: How quickly music spreads across regions
- **Cross-platform engagement**: Activity on multiple music platforms
- **Influencer engagement**: Mentions by verified users/influencers

### Calculation Algorithm:

```python
def calculate_viral_potential(artist_data):
    # 1. Streaming Velocity Score (30% weight)
    recent_streams = get_streams_last_30_days(artist_data.id)
    previous_streams = get_streams_previous_30_days(artist_data.id)
    velocity_score = (recent_streams - previous_streams) / max(previous_streams, 1)
    
    # 2. Social Engagement Score (25% weight)
    social_mentions = get_social_mentions(artist_data.id)
    social_sentiment = analyze_sentiment(social_mentions)
    social_score = (social_mentions.count * social_sentiment) / baseline_social_activity
    
    # 3. Playlist Penetration Score (20% weight)
    playlist_adds_rate = get_playlist_additions_rate(artist_data.id)
    playlist_diversity = get_playlist_genre_diversity(artist_data.id)
    playlist_score = (playlist_adds_rate * playlist_diversity) / average_playlist_metric
    
    # 4. Geographic Spread Score (15% weight)
    regions_active = get_active_regions(artist_data.id)
    region_growth_rate = calculate_region_expansion_rate(artist_data.id)
    geo_score = (regions_active * region_growth_rate) / max_regions
    
    # 5. Cross-Platform Activity Score (10% weight)
    platform_presence = get_platform_activity(artist_data.id)
    cross_platform_score = platform_presence / total_platforms
    
    # Weighted combination
    viral_potential = (
        velocity_score * 0.30 +
        social_score * 0.25 +
        playlist_score * 0.20 +
        geo_score * 0.15 +
        cross_platform_score * 0.10
    )
    
    # Normalize to 0-1 range and apply sigmoid function for realistic distribution
    return min(1.0, max(0.0, sigmoid(viral_potential)))
```

### Key Indicators for High Viral Potential:
- **Exponential stream growth** in the last 7-14 days
- **High completion rates** (users listening to full tracks)
- **Rapid playlist adoption** by diverse user groups
- **Cross-demographic appeal** (multiple age groups, regions)

## 2. Growth Rate (0-100%)

### Data Sources Used:
- **Listener growth**: New followers/monthly listeners
- **Stream progression**: Week-over-week stream increases
- **Track performance**: Performance of recent releases vs older tracks
- **Engagement metrics**: Likes, shares, saves per stream
- **Discovery metrics**: How users find the artist (organic vs promoted)

### Calculation Algorithm:

```python
def calculate_growth_rate(artist_data, time_window_days=30):
    # 1. Listener Growth Rate (40% weight)
    current_listeners = get_monthly_listeners(artist_data.id)
    previous_listeners = get_monthly_listeners_previous_period(artist_data.id)
    listener_growth = (current_listeners - previous_listeners) / max(previous_listeners, 1)
    
    # 2. Stream Growth Rate (30% weight)
    current_streams = get_total_streams_period(artist_data.id, time_window_days)
    previous_streams = get_total_streams_previous_period(artist_data.id, time_window_days)
    stream_growth = (current_streams - previous_streams) / max(previous_streams, 1)
    
    # 3. Engagement Growth Rate (20% weight)
    current_engagement = calculate_engagement_score(artist_data.id, time_window_days)
    previous_engagement = calculate_engagement_score_previous(artist_data.id, time_window_days)
    engagement_growth = (current_engagement - previous_engagement) / max(previous_engagement, 1)
    
    # 4. Discovery Rate (10% weight)
    organic_discovery = get_organic_discovery_rate(artist_data.id)
    discovery_score = organic_discovery / max_organic_discovery_rate
    
    # Weighted combination
    growth_rate = (
        listener_growth * 0.40 +
        stream_growth * 0.30 +
        engagement_growth * 0.20 +
        discovery_score * 0.10
    )
    
    # Apply smoothing and normalization
    smoothed_growth = apply_moving_average(growth_rate, window=7)
    return min(1.0, max(0.0, sigmoid(smoothed_growth)))
```

## 3. Advanced ML Techniques

### Time Series Analysis:
- **ARIMA models** for trend prediction
- **Seasonal decomposition** to account for music industry cycles
- **Changepoint detection** to identify viral moments

### Feature Engineering:
```python
def extract_advanced_features(artist_data):
    features = {
        # Temporal features
        'day_of_week_streams': get_streaming_by_day(artist_data.id),
        'hour_of_day_peaks': get_peak_listening_hours(artist_data.id),
        'seasonal_trends': analyze_seasonal_patterns(artist_data.id),
        
        # Network features
        'artist_similarity_score': calculate_similarity_to_trending(artist_data.id),
        'collaboration_network': analyze_featured_artists(artist_data.id),
        'genre_crossover_potential': measure_genre_flexibility(artist_data.id),
        
        # User behavior features
        'skip_rate': calculate_skip_rate(artist_data.id),
        'repeat_listen_ratio': get_repeat_listening_rate(artist_data.id),
        'playlist_context': analyze_playlist_positioning(artist_data.id),
        
        # Content features
        'audio_features_trend': analyze_audio_feature_evolution(artist_data.id),
        'release_frequency': calculate_release_cadence(artist_data.id),
        'content_diversity': measure_track_diversity(artist_data.id)
    }
    return features
```

### Machine Learning Models:
- **Gradient Boosting** (XGBoost/LightGBM) for viral prediction
- **Neural Networks** for complex pattern recognition
- **Ensemble methods** combining multiple algorithms

## 4. Real-time Updates

The system updates these metrics using:
- **Streaming data pipelines** processing events in real-time
- **Batch processing** for complex calculations (hourly/daily)
- **Incremental learning** to adapt to new trends

## 5. Validation & Accuracy

### Historical Validation:
- Backtest against known viral successes
- Compare predictions with actual breakthrough artists
- Measure prediction accuracy over different time horizons

### Success Metrics:
- **Precision**: % of predicted viral artists that actually break through
- **Recall**: % of actual breakthrough artists that were predicted
- **Early Detection**: How many days/weeks before mainstream success

## Example Calculation

For an artist with:
- 50% month-over-month stream growth
- 15% playlist addition rate increase  
- High social media engagement
- Expanding to 3 new geographic markets

**Viral Potential**: 0.78 → **78%**
**Growth Rate**: 0.65 → **65%**

This indicates strong viral potential with solid, sustained growth patterns.

## Implementation in Production

```sql
-- Database stored procedure example
CREATE OR REPLACE FUNCTION get_emerging_artists(limit_count INTEGER)
RETURNS TABLE (
    artist_id UUID,
    viral_potential DECIMAL(3,2),
    growth_rate DECIMAL(3,2),
    engagement_score DECIMAL(3,2),
    weekly_growth INTEGER,
    playlist_adds INTEGER,
    share_rate DECIMAL(3,2)
) AS $$
BEGIN
    RETURN QUERY
    WITH artist_metrics AS (
        SELECT 
            a.id,
            calculate_viral_potential(a.id) as viral_pot,
            calculate_growth_rate(a.id) as growth_rt,
            calculate_engagement_score(a.id) as engagement,
            get_weekly_listener_growth(a.id) as weekly_growth,
            get_playlist_additions(a.id) as playlist_adds,
            get_share_rate(a.id) as share_rate
        FROM artists a
        WHERE a.created_at >= NOW() - INTERVAL '2 years'
        AND get_total_streams(a.id) > 1000 -- Minimum threshold
    )
    SELECT * FROM artist_metrics
    WHERE viral_pot > 0.6 OR growth_rt > 0.5 -- High potential threshold
    ORDER BY (viral_pot * 0.6 + growth_rt * 0.4) DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;
```

This comprehensive approach ensures that the viral potential and growth percentages are based on real behavioral data and predictive analytics rather than arbitrary numbers.
