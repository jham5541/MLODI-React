# Artist Follow System Documentation

## Overview
The artist follow system allows users to follow artists and automatically tracks follower counts in the database.

## Database Structure

### Tables

#### 1. `user_follows` Table
Stores all follow relationships between users and artists.

```sql
CREATE TABLE public.user_follows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,              -- The user who is following
    followed_type VARCHAR(50) NOT NULL, -- Type: 'artist' or 'user'
    followed_id UUID NOT NULL,          -- The artist being followed
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, followed_type, followed_id)
);
```

#### 2. `profiles` Table - Follower Count Column
Stores the cached follower count for quick access.

```sql
ALTER TABLE public.profiles 
ADD COLUMN follower_count INTEGER DEFAULT 0;
```

### Automatic Count Updates

The `update_artist_follower_count_trigger` automatically maintains the follower count:
- **On Follow (INSERT)**: Increments the artist's `follower_count` by 1
- **On Unfollow (DELETE)**: Decrements the artist's `follower_count` by 1

## Implementation

### Frontend Components

#### 1. **useArtistFollow Hook** (`src/hooks/useArtistFollow.ts`)
Custom React hook that manages follow state with database integration:
- Checks if user is following an artist
- Provides `followArtist()` and `unfollowArtist()` functions
- Subscribes to real-time updates
- Returns `isFollowing` state and `toggleFollow()` function

#### 2. **ArtistDropdownMenu** (`src/components/artists/ArtistDropdownMenu.tsx`)
UI component for follow/unfollow actions:
- Uses `musicService` for database operations
- Shows success/error alerts
- Updates UI state after successful operations

#### 3. **ArtistHeader** (`src/components/artists/ArtistHeader.tsx`)
Main artist profile header:
- Uses `useArtistFollow` hook for follow state
- Displays follower count from `profiles.follower_count`
- Integrates with dropdown menu for follow actions

### Backend Services

#### **musicService** (`src/services/musicService.ts`)
Handles database operations:

```typescript
// Follow an artist
async followArtist(artistId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  
  await supabase
    .from('user_follows')
    .insert({
      user_id: user.id,
      followed_type: 'artist',
      followed_id: artistId,
    });
}

// Unfollow an artist
async unfollowArtist(artistId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  
  await supabase
    .from('user_follows')
    .delete()
    .eq('user_id', user.id)
    .eq('followed_type', 'artist')
    .eq('followed_id', artistId);
}
```

## Data Flow

1. **User clicks Follow button** → `ArtistDropdownMenu.handleFollowToggle()`
2. **Call database service** → `musicService.followArtist(artistId)`
3. **Insert into database** → New row in `user_follows` table
4. **Trigger fires** → `update_artist_follower_count_trigger`
5. **Count updated** → `profiles.follower_count` incremented
6. **UI updates** → Follow state changes, count displays new value

## Helper Functions

### SQL Functions

```sql
-- Get follower count for an artist
SELECT get_artist_follower_count('artist-id');

-- Check if user follows an artist
SELECT is_following_artist('user-id', 'artist-id');
```

### Views

```sql
-- View all followers of artists
SELECT * FROM public.artist_followers WHERE artist_id = 'artist-id';

-- View popular artists by follower count
SELECT * FROM public.popular_artists ORDER BY follower_count DESC;
```

## RLS Policies

The system has Row Level Security policies that:
- Allow anyone to view follows (for counting)
- Only authenticated users can create follows
- Users can only delete their own follows
- Users can only update their own follows

## Testing

To test the follow system:

1. **Check if follows are being recorded:**
```sql
SELECT * FROM public.user_follows 
WHERE followed_type = 'artist' 
ORDER BY created_at DESC;
```

2. **Verify follower counts are accurate:**
```sql
SELECT 
    p.username,
    p.follower_count as stored_count,
    COUNT(f.id) as actual_count
FROM public.profiles p
LEFT JOIN public.user_follows f ON f.followed_id = p.id AND f.followed_type = 'artist'
GROUP BY p.id, p.username, p.follower_count;
```

3. **Test follow/unfollow:**
```sql
-- Follow
INSERT INTO public.user_follows (user_id, followed_type, followed_id)
VALUES ('user-id', 'artist', 'artist-id');

-- Check count increased
SELECT follower_count FROM public.profiles WHERE id = 'artist-id';

-- Unfollow
DELETE FROM public.user_follows 
WHERE user_id = 'user-id' AND followed_id = 'artist-id';

-- Check count decreased
SELECT follower_count FROM public.profiles WHERE id = 'artist-id';
```

## Troubleshooting

### Follows not being recorded
1. Check user authentication: User must be logged in
2. Verify RLS policies are correctly set
3. Check for unique constraint violations (can't follow same artist twice)
4. Review console logs for error messages

### Follower counts not updating
1. Verify trigger exists: `SELECT * FROM pg_trigger WHERE tgname = 'update_artist_follower_count_trigger';`
2. Check trigger function works manually
3. Ensure `follower_count` column exists in `profiles` table

### Real-time updates not working
1. Check Supabase realtime is enabled for `user_follows` table
2. Verify subscription channel is properly set up in frontend
3. Check WebSocket connection status

## Migration Applied

The complete migration that sets up this system is in:
- `add_artist_follows_functionality` - Creates the user_follows table
- `add_artist_follower_count_column` - Adds follower_count and trigger
- `fix_user_follows_rls_policies` - Sets up proper RLS policies
