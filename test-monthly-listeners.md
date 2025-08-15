# Monthly Listeners Implementation Test Guide

## Summary

I've successfully implemented a dynamic monthly listeners counter for the artist profile page that functions similar to Spotify's monthly listener counter. Here's what was implemented:

### 1. Monthly Listeners Service (`src/services/monthlyListenersService.ts`)
- Fetches monthly listeners data from multiple sources (artists table, streaming stats, analytics summary)
- Implements real-time subscriptions to database changes
- Provides caching for performance
- Includes methods to update and simulate growth

### 2. Updated Artist Type (`src/types/music.ts`)
- Added `monthlyListeners?: number` field to the Artist interface
- Added other optional fields like `bannerUrl`, `subscriptionPrice`, etc.

### 3. Updated Artist Service (`src/services/artistService.ts`)
- Integrated monthly listeners fetching when retrieving artist details
- Ensures data is always up-to-date

### 4. Updated Artist Header Component (`src/components/artists/ArtistHeader.tsx`)
- Displays monthly listeners count with proper formatting (e.g., 2.5M, 750K)
- Subscribes to real-time updates
- Updates automatically when data changes in the database

### 5. Demo Component (`src/components/dev/MonthlyListenersDemo.tsx`)
- Provides buttons to simulate growth and set random counts
- Only visible in development mode
- Allows testing of real-time updates

## How It Works

1. **Initial Load**: When the artist profile loads, it fetches the current monthly listeners count from the database
2. **Real-time Updates**: The component subscribes to database changes for the artist's monthly listeners
3. **Multiple Data Sources**: The service checks multiple tables in order:
   - `artists.monthly_listeners` column
   - `artist_streaming_stats` table (last 30 days)
   - `artist_analytics_summary` table (monthly aggregates)
4. **Caching**: Data is cached for 5 minutes to reduce database queries
5. **Formatting**: Numbers are formatted for readability (1.2M instead of 1200000)

## Testing the Feature

1. Navigate to any artist profile page
2. The monthly listeners count will be displayed below the artist name
3. In development mode, you'll see demo controls to:
   - Simulate growth (1-10% random increase)
   - Set a random count (100K to 5M)
4. Changes update in real-time across all devices/sessions

## Database Requirements

For this to work with real data, ensure your Supabase database has:

1. `artists` table with `monthly_listeners` column (INTEGER)
2. `artist_streaming_stats` table with:
   - `artist_id` (UUID)
   - `unique_listeners` (INTEGER)
   - `date` (DATE)
3. `artist_analytics_summary` table with:
   - `artist_id` (UUID)
   - `unique_listeners` (INTEGER)
   - `period_type` (TEXT)
   - `period_end` (DATE)

## Example Usage

```typescript
// Get monthly listeners for an artist
const listeners = await monthlyListenersService.getMonthlyListeners(artistId);

// Subscribe to real-time updates
const unsubscribe = monthlyListenersService.subscribeToArtist(artistId, (data) => {
  console.log('New monthly listeners:', data.monthlyListeners);
});

// Simulate growth (dev only)
await monthlyListenersService.simulateGrowth(artistId, 5); // 5% growth

// Update manually (dev only)
await monthlyListenersService.updateMonthlyListeners(artistId, 2500000);
```

## Notes

- The implementation uses Supabase real-time subscriptions for live updates
- Sample artists in the app already have monthlyListeners data
- The counter updates automatically when data changes in the database
- Performance is optimized with caching and efficient queries
