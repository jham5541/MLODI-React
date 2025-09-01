# Artist Profile Components Data Access Documentation

## Overview
This document details how each component on the Artist Profile page queries data from Supabase, ensuring all components use the appropriate public views for secure data access.

## Data Access Architecture

### Public Views for Listener Access
All components on the artist profile page should query data through public views that enforce proper Row Level Security (RLS) policies:

| View Name | Purpose | Key Columns |
|-----------|---------|-------------|
| `artists_public_view` | Artist profile information | id, name, bio, followers_count, monthly_listeners |
| `tracks_listener_view` | Public tracks | id, title, artist_id, duration, play_count |
| `albums_listener_view` | Public albums | id, title, artist_id, release_date, total_tracks |
| `artist_merchandise_listener` | Artist merchandise | product_id, title, price, availability |
| `searchable_artists/albums/tracks` | Search-optimized views | Only content from visible artists |

## Component Data Access Patterns

### 1. ArtistProfile.tsx (Main Page)
**Data Source**: `artists_public_view`
```typescript
// Uses artistService.fetchArtistDetails()
const { data } = await supabase
  .from('artists_public_view')
  .select('*')
  .eq('id', artistId)
  .single();
```
**Status**: ✅ Using public view

### 2. PopularSongs Component
**Data Source**: `tracks_listener_view`
```typescript
// Fetches artist's popular tracks
const { data: tracks } = await supabase
  .from('tracks_listener_view')
  .select('*')
  .eq('artist_id', artistId)
  .order('play_count', { ascending: false })
  .limit(limit);
```
**Status**: ✅ Updated to use public view

### 3. DiscographyCarousel Component
**Data Source**: `albums_listener_view` via `albumService`
```typescript
// Uses albumService.getArtistAlbums()
const { data } = await supabase
  .from('albums_listener_view')
  .select('*')
  .eq('artist_id', artistId)
  .order('release_date', { ascending: false });
```
**Status**: ✅ Updated to use public view

### 4. VideoCarousel Component
**Data Source**: `videos` table (no public view available)
```typescript
// Currently using videoService
const videos = await videoService.getArtistVideos(artistId);
```
**Status**: ⚠️ No public view exists for videos
**Recommendation**: Create `videos_listener_view`

### 5. Merchandise Section
**Data Source**: `artist_merchandise_listener`
```typescript
// Uses merchandiseService.getArtistMerchandise()
const { data } = await supabase
  .from('artist_merchandise_listener')
  .select('*')
  .eq('artist_id', artistId)
  .eq('availability', 'available');
```
**Status**: ✅ Updated to use public view

### 6. EngagementMetrics Component
**Data Source**: Various analytics tables
```typescript
// May query artist_engagement_metrics, artist_analytics_summary
```
**Status**: ⚠️ Needs review for public access

### 7. RevenueInsights Component
**Data Source**: `artist_revenue_metrics`
```typescript
// Queries revenue data - should be restricted
```
**Status**: ⚠️ Should only show to artist owners, not general listeners

### 8. TopFansLeaderboard Component
**Data Source**: User engagement data
```typescript
// Queries fan engagement scores
```
**Status**: ⚠️ Needs public view for fan leaderboard data

### 9. CommentSection Component
**Data Source**: `artist_comments` table
```typescript
// Queries comments related to artist
```
**Status**: ⚠️ Needs public view for comments

### 10. TourDates Component
**Data Source**: `public_tours`, `public_shows`, `public_upcoming_shows`
```typescript
// Uses toursService to fetch from public views
const upcomingShows = await toursService.getArtistUpcomingShows(artistId);
```
**Status**: ✅ Updated to use public views

## Security Considerations

### 1. Row Level Security (RLS)
All public views should enforce RLS policies:
- Only show active/published content
- Hide sensitive data (revenue, internal metrics)
- Respect user privacy settings

### 2. Data Filtering
Views should automatically filter:
- `is_active = true` for artists
- `is_published = true` for tracks/albums
- `availability = 'available'` for merchandise

### 3. User-Specific Data
Authenticated users see additional data:
- Their subscription status
- Following status
- Purchase history

## Best Practices

### 1. Always Use Public Views
```typescript
// ✅ Good
const { data } = await supabase
  .from('tracks_listener_view')
  .select('*');

// ❌ Bad
const { data } = await supabase
  .from('tracks')
  .select('*');
```

### 2. Handle Errors Gracefully
```typescript
try {
  const data = await albumService.getArtistAlbums(artistId);
  // Process data
} catch (error) {
  console.error('Error:', error);
  // Fall back to sample data or empty state
  return [];
}
```

### 3. Transform Data at Service Layer
```typescript
// Service should transform view data to component format
const transformedAlbums = albumsData.map(album => ({
  id: album.id,
  title: album.title,
  coverUrl: album.cover_url || generateDefaultCover(album.id)
}));
```

## Missing Public Views

The following views should be created for complete public access:

### 1. videos_listener_view
```sql
CREATE VIEW videos_listener_view AS
SELECT 
  v.id,
  v.title,
  v.artist_id,
  v.thumbnail_url,
  v.video_url,
  v.duration,
  v.view_count,
  v.created_at
FROM videos v
INNER JOIN artists a ON v.artist_id = a.id
WHERE v.is_published = true
  AND a.is_active = true;
```

### 2. tour_dates_listener_view
```sql
CREATE VIEW tour_dates_listener_view AS
SELECT 
  td.id,
  td.artist_id,
  td.venue_name,
  td.city,
  td.country,
  td.date,
  td.ticket_url
FROM tour_dates td
INNER JOIN artists a ON td.artist_id = a.id
WHERE td.date >= CURRENT_DATE
  AND a.is_active = true;
```

### 3. artist_comments_listener_view
```sql
CREATE VIEW artist_comments_listener_view AS
SELECT 
  c.id,
  c.artist_id,
  c.user_id,
  c.content,
  c.created_at,
  p.username,
  p.avatar_url
FROM artist_comments c
LEFT JOIN profiles p ON c.user_id = p.id
WHERE c.is_visible = true
ORDER BY c.created_at DESC;
```

## Testing Checklist

- [ ] All components load without errors
- [ ] Data is properly filtered (only active/published)
- [ ] Anonymous users can view public content
- [ ] Authenticated users see personalized data
- [ ] No sensitive data exposed to listeners
- [ ] Fallback to sample data works
- [ ] Error handling prevents crashes

## Migration Steps

1. **Identify Direct Table Access**: Search for `.from('table_name')` patterns
2. **Create Missing Views**: Implement views for tables without public access
3. **Update Services**: Modify services to use public views
4. **Test Permissions**: Verify data access as different user types
5. **Monitor Performance**: Ensure views don't impact query performance

## Performance Optimization

### 1. View Indexes
Ensure underlying tables have proper indexes:
```sql
CREATE INDEX idx_tracks_artist_id ON tracks(artist_id);
CREATE INDEX idx_albums_artist_id ON albums(artist_id);
```

### 2. Materialized Views
For complex aggregations, consider materialized views:
```sql
CREATE MATERIALIZED VIEW artist_stats_mv AS
SELECT 
  artist_id,
  COUNT(DISTINCT track_id) as track_count,
  SUM(play_count) as total_plays
FROM tracks
GROUP BY artist_id;

-- Refresh periodically
REFRESH MATERIALIZED VIEW artist_stats_mv;
```

### 3. Query Optimization
- Limit result sets with `.limit()`
- Use pagination for large datasets
- Cache results on frontend when appropriate

## Monitoring

### Query Performance
Monitor slow queries on public views:
```sql
SELECT 
  query,
  calls,
  mean_exec_time,
  total_exec_time
FROM pg_stat_statements
WHERE query LIKE '%listener_view%'
ORDER BY mean_exec_time DESC;
```

### Access Patterns
Track which views are most frequently accessed:
```sql
SELECT 
  schemaname,
  viewname,
  n_tup_fetched
FROM pg_stat_user_tables
WHERE schemaname = 'public'
  AND viewname LIKE '%listener%'
ORDER BY n_tup_fetched DESC;
```

---

Last Updated: 2025-01-20
Version: 1.0.0
