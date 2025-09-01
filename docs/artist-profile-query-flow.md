# Artist Profile Query Flow Documentation

## Overview
This document explains how listeners query and view artist profiles in the M3LODI mobile application. It covers the complete data flow from the frontend React Native app to the Supabase backend.

## Architecture Components

### 1. Frontend (React Native)
- **Main Component**: `src/pages/ArtistProfile.tsx`
- **Service Layer**: `src/services/artistService.ts`
- **Supporting Services**: 
  - `musicService.ts` - For fetching songs/albums
  - `merchandiseService.ts` - For artist merchandise
  - `subscriptionService.ts` - For subscription status

### 2. Backend (Supabase)
- **Primary View**: `artists_public_view`
- **Supporting Tables**:
  - `artists` - Core artist data
  - `profiles` - User profiles linked to artists
  - `tracks` - Artist's songs
  - `albums` - Artist's albums
  - `artist_subscriptions` - Subscription relationships
  - `user_follows` - Follow relationships
  - `artist_streaming_stats` - Streaming statistics

## Data Flow

### Step 1: Navigation to Artist Profile
```typescript
// User navigates to artist profile from various entry points:
// - Search results
// - Trending page
// - Library/Following list
// - Song/Album details

navigation.navigate('ArtistProfile', { artistId: 'uuid-here' });
```

### Step 2: Artist Data Fetching
```typescript
// In ArtistProfile.tsx
const artistId = route.params.artistId;

// artistService.ts fetches from Supabase
async fetchArtistDetails(id: string) {
  const { data } = await supabase
    .from('artists_public_view')
    .select('*')
    .eq('id', id)
    .single();
}
```

### Step 3: Database Query via artists_public_view
The `artists_public_view` aggregates data from multiple tables:

```sql
-- View structure provides listeners with:
SELECT 
    -- Basic artist info
    id, name, display_name, avatar_url, bio,
    genres, country, slug,
    
    -- Statistics
    followers_count,
    monthly_listeners,  -- Calculated from last 30 days
    total_plays,       -- Sum of all track plays
    
    -- Content counts
    total_tracks,      -- Published tracks count
    total_albums,      -- Published albums count
    
    -- User-specific data (if authenticated)
    is_following,      -- Current user follows this artist
    is_subscribed,     -- Current user has active subscription
    subscription_tier, -- Subscription level if subscribed
    
    -- Additional metadata
    social_links,      -- JSON of social media links
    created_at,
    updated_at
FROM artists
WHERE is_active = true;  -- Only show active artists
```

## Available Data for Listeners

### Public Data (Available to All)
- **Profile Information**:
  - Artist name and display name
  - Avatar URL
  - Biography
  - Verification status
  - Country
  - Genres
  - Social media links

- **Statistics**:
  - Follower count
  - Monthly listeners (last 30 days)
  - Total plays across all tracks
  - Number of published tracks
  - Number of published albums

### Authenticated User Data
When a listener is logged in, additional personalized data:
- Whether they follow the artist
- Active subscription status
- Subscription tier/level

### Related Content Queries
After loading the artist profile, the app fetches:

1. **Popular Songs** (`PopularSongs.tsx`):
```typescript
// Fetch artist's top tracks
const tracks = await supabase
  .from('tracks')
  .select('*')
  .eq('artist_id', artistId)
  .eq('is_published', true)
  .order('play_count', { ascending: false })
  .limit(10);
```

2. **Albums** (`DiscographyCarousel.tsx`):
```typescript
// Fetch artist's albums
const albums = await supabase
  .from('albums')
  .select('*')
  .eq('artist_id', artistId)
  .eq('is_published', true)
  .order('release_date', { ascending: false });
```

3. **Videos** (`VideoCarousel.tsx`):
```typescript
// Fetch artist's videos
const videos = await supabase
  .from('videos')
  .select('*')
  .eq('artist_id', artistId)
  .eq('is_published', true);
```

4. **Merchandise** (`merchandiseService.ts`):
```typescript
// Fetch artist merchandise
const merchandise = await supabase
  .from('artist_merchandise_listener')
  .select('*')
  .eq('artist_id', artistId)
  .eq('is_active', true);
```

## Security & Access Control

### Row Level Security (RLS)
The database implements RLS policies to ensure:

1. **Public Access**: Anyone can view active artists
```sql
-- Policy on artists table
CREATE POLICY "artists_public_view" ON artists
FOR SELECT 
TO public
USING (is_active = true);
```

2. **View Permissions**: 
```sql
GRANT SELECT ON artists_public_view TO authenticated;
GRANT SELECT ON artists_public_view TO anon;
```

### Data Privacy
- Sensitive artist data (revenue, internal metrics) is NOT exposed
- User-specific data (following, subscription) only shown to authenticated users
- No write operations allowed through public views

## Performance Optimizations

### 1. View Aggregations
The `artists_public_view` pre-aggregates:
- Track counts
- Album counts  
- Monthly listener calculations
- Subscription status checks

### 2. Caching Strategy
```typescript
// Frontend implements caching via React Query or similar
const cacheKey = `artist-${artistId}`;
const cachedData = queryCache.get(cacheKey);
```

### 3. Fallback Data
The app includes sample data fallback when:
- Database is unavailable
- Network errors occur
- Development/testing mode

## Error Handling

### Frontend Error Handling
```typescript
try {
  const artist = await fetchArtistDetails(artistId);
} catch (error) {
  // Fallback to sample data
  const sampleArtist = sampleArtists.find(a => a.id === artistId);
  if (sampleArtist) return sampleArtist;
  
  // Show error state
  console.error('Failed to load artist:', error);
}
```

### Database Error Scenarios
- Artist not found: Returns 404
- No permission: Returns 403
- Database connection issues: Frontend shows cached/sample data

## Testing the Query Flow

### 1. Test Artist View Access
```sql
-- As anonymous user
SELECT * FROM artists_public_view LIMIT 5;

-- As authenticated user (will show following/subscription status)
SELECT * FROM artists_public_view WHERE id = 'artist-uuid';
```

### 2. Test Related Content
```sql
-- Test tracks for an artist
SELECT * FROM tracks 
WHERE artist_id = 'artist-uuid' 
AND is_published = true;

-- Test albums
SELECT * FROM albums 
WHERE artist_id = 'artist-uuid' 
AND is_published = true;
```

### 3. Test User-Specific Data
```sql
-- Check if user follows artist
SELECT * FROM user_follows 
WHERE follower_id = auth.uid() 
AND followed_id = 'artist-uuid';

-- Check subscription status
SELECT * FROM artist_subscriptions 
WHERE user_id = auth.uid() 
AND artist_id = 'artist-uuid' 
AND status = 'active';
```

## Troubleshooting Common Issues

### Issue 1: Artist Profile Not Loading
**Symptoms**: Blank screen or loading spinner
**Solutions**:
1. Check if `artists_public_view` exists
2. Verify artist ID is valid
3. Check network connectivity
4. Review browser console for errors

### Issue 2: Missing Statistics
**Symptoms**: Zero followers, plays, etc.
**Solutions**:
1. Verify `artist_streaming_stats` has data
2. Check date ranges in monthly listener calculation
3. Ensure tracks have play_count values

### Issue 3: Subscription Status Incorrect
**Symptoms**: User subscribed but not showing
**Solutions**:
1. Check `artist_subscriptions` table
2. Verify subscription hasn't expired
3. Ensure user is authenticated

## Future Enhancements

### Planned Improvements
1. **Real-time Updates**: Use Supabase realtime for live follower counts
2. **Personalized Recommendations**: ML-based similar artists
3. **Enhanced Analytics**: More detailed listening statistics
4. **Social Features**: Comments, reactions on artist profiles
5. **NFT Integration**: Display artist's NFT collections

### Performance Optimizations
1. Implement materialized views for heavy aggregations
2. Add Redis caching layer for frequently accessed profiles
3. Optimize image loading with CDN
4. Implement pagination for large content lists

## Related Documentation
- [Database Schema](./database_schema_summary.md)
- [Authentication Flow](./authentication-flow.md)
- [Subscription System](./subscription-system.md)
- [API Reference](./api-reference.md)

---

Last Updated: 2025-01-19
Version: 1.0.0
