# Tour/Event Data Creation and Fetching Flow

## Event Creation Flow

### 1. Primary Tables Written During Event Creation

#### `public.events` Table
**Purpose**: Main event storage

**Creation Process**:
```sql
-- Step 1: INSERT new event
INSERT INTO public.events (
  id,
  title,
  description,
  event_type,
  event_date,
  start_time,
  doors_open_time,
  end_time,
  venue_name,
  venue_address,
  city,
  state,
  country,
  artist_id,
  status,
  total_capacity,
  tickets_sold
) VALUES (
  gen_random_uuid(),
  'Concert Name',
  'Concert Description',
  'concert',
  '2025-08-31 00:00:00+00',
  '2025-08-31 20:00:00+00',
  '2025-08-31 19:00:00+00',
  '2025-08-31 23:00:00+00',
  'Madison Square Garden',
  '4 Pennsylvania Plaza',
  'New York',
  'NY',
  'USA',
  'artist-uuid',
  'published',
  20000,
  0
);

-- Step 2: UPDATE to add cover image URL (after upload)
UPDATE public.events 
SET cover_image_url = 'https://[project-id].supabase.co/storage/v1/object/public/event-covers/[image-file]'
WHERE id = 'event-uuid';
```

#### `public.ticket_tiers` Table
**Purpose**: Define pricing tiers for the event

**Creation Process**:
```sql
-- INSERT one row per ticket tier
INSERT INTO public.ticket_tiers (
  id,
  event_id,
  name,
  price,
  quantity_available,
  quantity_sold,
  benefits,
  color_code,
  is_active,
  sale_starts_at,
  sale_ends_at,
  currency
) VALUES 
  -- General Admission tier
  (gen_random_uuid(), 'event-uuid', 'General Admission', 75.00, 10000, 0, 
   ARRAY['General standing area', 'Access to venue'], '#6B7280', 
   true, NOW(), '2025-08-31 00:00:00+00', 'USD'),
  
  -- VIP tier
  (gen_random_uuid(), 'event-uuid', 'VIP', 150.00, 500, 0,
   ARRAY['Premium seating', 'Meet & greet', 'Exclusive merchandise'], '#FFD700',
   true, NOW(), '2025-08-31 00:00:00+00', 'USD'),
  
  -- Premium tier
  (gen_random_uuid(), 'event-uuid', 'Premium', 250.00, 100, 0,
   ARRAY['Front row seats', 'Backstage access', 'All VIP benefits'], '#8B008B',
   true, NOW(), '2025-08-31 00:00:00+00', 'USD');
```

### 2. Supabase Storage Integration

#### `event-covers` Bucket
**Purpose**: Store event cover images

**Process**:
1. Upload image to Supabase Storage
2. Get public URL
3. Update `events.cover_image_url` with the public URL

```javascript
// Example upload process
const { data, error } = await supabase.storage
  .from('event-covers')
  .upload(`events/${eventId}/cover.jpg`, imageFile);

const publicUrl = supabase.storage
  .from('event-covers')
  .getPublicUrl(`events/${eventId}/cover.jpg`).data.publicUrl;

// Update event with image URL
await supabase
  .from('events')
  .update({ cover_image_url: publicUrl })
  .eq('id', eventId);
```

### 3. Tables NOT Written During Event Creation

These tables exist but are NOT modified when creating an event:
- `public.venues` - Venue information is embedded in events table
- `public.tours` - Tours are separate from individual events
- `public.shows` - Alternative show tracking system (not used for events)
- `public.artists` - Artist must already exist
- `public.artist_profiles` - Artist profile not modified

## Event Fetching Flow

### 1. Data Retrieval Path

```
Mobile App (TourDates.tsx)
    ↓
toursService.getArtistUpcomingShows()
    ↓
SELECT * FROM events_view
    ↓
events_view (formatting layer)
    ↓
events_public_view (security layer)
    ↓
events table + ticket_tiers table (source data)
```

### 2. Service Method

```typescript
// toursService.ts
async getArtistUpcomingShows(artistId: string): Promise<EventView[]> {
  const { data, error } = await supabase
    .from('events_view')  // Reads from the view
    .select('*')
    .eq('artist_id', artistId)
    .order('event_date', { ascending: true });
  
  return data || [];
}
```

### 3. View Hierarchy

#### `events_public_view`
- Joins `events` with `artists` table
- Filters: `status = 'published' AND event_date >= CURRENT_DATE`
- Exposes event data to listeners

#### `events_view`
- Reads from `events_public_view`
- Joins with `ticket_tiers` for pricing
- Formats dates and times for display
- Calculates `min_ticket_price` from active tiers

### 4. Data Returned to App

```typescript
interface EventView {
  event_id: string;
  event_title: string;
  event_date: string;      // "Aug 31, 2025"
  start_time: string;       // "08:00 PM"
  venue: string;
  location: string;         // "New York, NY"
  min_ticket_price: number; // 75.00
  available_capacity: number;
  // ... other fields
}
```

## Complete Example: Creating and Fetching an Event

### Step 1: Create Event
```sql
-- Insert event
INSERT INTO events (id, title, event_date, start_time, venue_name, city, state, artist_id, status, total_capacity)
VALUES ('evt-123', 'Summer Concert', '2025-08-31', '2025-08-31 20:00:00', 'MSG', 'New York', 'NY', 'artist-123', 'published', 20000);

-- Add ticket tiers
INSERT INTO ticket_tiers (event_id, name, price, quantity_available)
VALUES 
  ('evt-123', 'General', 75.00, 15000),
  ('evt-123', 'VIP', 150.00, 5000);

-- Upload and update image
UPDATE events SET cover_image_url = 'https://storage.url/image.jpg' WHERE id = 'evt-123';
```

### Step 2: Data Available in Views
```sql
-- In events_public_view
SELECT * FROM events_public_view WHERE id = 'evt-123';
-- Returns: Raw event data with artist name

-- In events_view
SELECT * FROM events_view WHERE event_id = 'evt-123';
-- Returns: Formatted data with min_ticket_price = 75.00
```

### Step 3: Fetch in App
```typescript
const shows = await toursService.getArtistUpcomingShows('artist-123');
// Returns array including the new event, formatted for display
```

## Summary

✅ **Event Creation writes to**:
- `public.events` (INSERT, then UPDATE for image)
- `public.ticket_tiers` (INSERT per tier)
- `event-covers` storage bucket (image upload)

✅ **Event Fetching reads from**:
- `events_view` → `events_public_view` → `events` + `ticket_tiers`

✅ **Does NOT write to**:
- venues, tours, shows, artists, artist_profiles tables
