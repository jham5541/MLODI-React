# Tour Dates Data Source Confirmation

## ✅ CONFIRMED: Tour Section reads from `public.events_public_view`

### Data Flow:
1. **Source**: `public.events_public_view` 
   - Contains the authoritative `event_date` and `start_time` fields
   - Already filtered for published, upcoming events
   
2. **Application View**: `public.events_view`
   - Reads DIRECTLY from `events_public_view`
   - Uses `epv.event_date` and `epv.start_time` from the public view
   - Only formats these for display, doesn't modify the underlying data

### Key Fields Used from `events_public_view`:

```sql
-- Direct field mappings in events_view:
epv.event_date    --> formatted as 'Mon DD, YYYY' for display
epv.start_time    --> formatted as 'HH12:MI AM/PM' for display
epv.venue_name    --> venue
epv.city          --> used in location
epv.state         --> used in location
epv.country       --> country
epv.artist_id     --> artist_id
epv.artist_name   --> artist_name
epv.total_capacity --> total_capacity
epv.tickets_sold  --> tickets_sold
```

### Current Implementation in `events_view`:

```sql
CREATE OR REPLACE VIEW public.events_view AS
SELECT 
  -- Dates come DIRECTLY from events_public_view
  to_char(epv.event_date, 'Mon DD, YYYY') AS event_date,
  to_char(epv.start_time, 'HH12:MI AM') AS start_time,
  
  -- Calculated times based on start_time from events_public_view
  to_char(epv.start_time - INTERVAL '1 hour', 'HH12:MI AM') AS doors_open_time,
  to_char(epv.start_time + INTERVAL '3 hours', 'HH12:MI AM') AS end_time,
  
  -- All other fields...
FROM public.events_public_view epv
```

### Example Data Flow:

**In `events_public_view`:**
```
event_date: 2025-09-01 02:00:00+00
start_time: 2025-09-01 20:00:00+00
```

**In `events_view` (after formatting):**
```
event_date: "Sep 01, 2025"
start_time: "08:00 PM"
```

**In Mobile App (TourDates.tsx):**
```typescript
// Displays as:
"Sep 01, 2025 at 08:00 PM"
```

### Tour Service Query:

```typescript
// toursService.ts queries events_view which reads from events_public_view
async getArtistUpcomingShows(artistId: string): Promise<EventView[]> {
  const { data, error } = await supabase
    .from('events_view')  // <-- This view reads from events_public_view
    .select('*')
    .eq('artist_id', artistId)
    .order('event_date', { ascending: true });
  
  return data || [];
}
```

## Verification Query

To verify the data is correctly flowing from `events_public_view`:

```sql
-- Check source data
SELECT 
  title,
  event_date,
  start_time
FROM events_public_view
WHERE artist_id = '18e39671-06cc-47ce-a511-fc2a3a95b6f4'
ORDER BY event_date;

-- Check formatted data
SELECT 
  event_title,
  event_date,
  start_time
FROM events_view
WHERE artist_id = '18e39671-06cc-47ce-a511-fc2a3a95b6f4'
ORDER BY event_date;
```

## Summary

✅ **CONFIRMED**: The Tour section correctly reads dates and times from `public.events_public_view`
- `event_date` field from `events_public_view` → formatted for display
- `start_time` field from `events_public_view` → formatted for display
- No data transformation, only formatting for user-friendly display
- The view hierarchy ensures security while maintaining data integrity
