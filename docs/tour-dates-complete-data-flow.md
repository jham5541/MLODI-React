# Tour Dates Complete Data Flow Documentation

## ✅ CONFIRMED: Complete Data Flow from Events Table to Display

### Data Flow Architecture:

```
1. public.events (SOURCE TABLE)
   ↓
2. public.events_public_view (SECURITY LAYER)
   ↓
3. public.events_view (FORMATTING LAYER)
   ↓
4. Mobile App Display
```

## 1. Source Table: `public.events`

**Columns (timestamptz):**
- `event_date` - The date of the event
- `start_time` - When the event starts
- `doors_open_time` - When doors open (optional)
- `end_time` - When the event ends (optional)

**Example Raw Data:**
```sql
event_date: 2025-09-01 02:00:00+00
start_time: 2025-09-01 20:00:00+00
doors_open_time: NULL
end_time: NULL
```

## 2. Public View: `public.events_public_view`

**Purpose:** Exposes event data to listeners with security filtering

**Key Features:**
- Reads directly from `public.events` table
- Exposes all time fields: `event_date`, `start_time`, `doors_open_time`, `end_time`
- Filters: `status = 'published' AND event_date >= CURRENT_DATE`
- Joins with artists table for artist name

**View Definition:**
```sql
CREATE VIEW public.events_public_view AS
SELECT 
    e.event_date,       -- Direct from events table
    e.start_time,       -- Direct from events table
    e.doors_open_time,  -- Direct from events table
    e.end_time,         -- Direct from events table
    -- ... other fields ...
FROM public.events e
LEFT JOIN public.artists a ON e.artist_id = a.id
WHERE e.status = 'published' 
  AND e.event_date >= CURRENT_DATE;
```

**Data in this view:**
```sql
event_date: 2025-09-01 02:00:00+00  -- Same as events table
start_time: 2025-09-01 20:00:00+00  -- Same as events table
doors_open_time: NULL               -- Same as events table
end_time: NULL                       -- Same as events table
```

## 3. Application View: `public.events_view`

**Purpose:** Formats timestamps for user-friendly display

**Key Features:**
- Reads from `public.events_public_view`
- Formats timestamps for display
- Uses actual doors_open_time/end_time if available, otherwise calculates

**View Definition:**
```sql
CREATE VIEW public.events_view AS
SELECT 
  -- Format timestamps from events_public_view
  to_char(epv.event_date, 'Mon DD, YYYY') AS event_date,
  to_char(epv.start_time, 'HH12:MI AM') AS start_time,
  
  -- Use actual doors_open_time if available
  CASE 
    WHEN epv.doors_open_time IS NOT NULL THEN
      to_char(epv.doors_open_time, 'HH12:MI AM')
    WHEN epv.start_time IS NOT NULL THEN
      to_char(epv.start_time - INTERVAL '1 hour', 'HH12:MI AM')
    ELSE '07:00 PM'
  END AS doors_open_time,
  
  -- Use actual end_time if available
  CASE 
    WHEN epv.end_time IS NOT NULL THEN
      to_char(epv.end_time, 'HH12:MI AM')
    WHEN epv.start_time IS NOT NULL THEN
      to_char(epv.start_time + INTERVAL '3 hours', 'HH12:MI AM')
    ELSE '11:00 PM'
  END AS end_time,
  -- ... other fields ...
FROM public.events_public_view epv;
```

**Formatted Data:**
```sql
event_date: "Sep 01, 2025"   -- Formatted from timestamptz
start_time: "08:00 PM"        -- Formatted from timestamptz
doors_open_time: "07:00 PM"   -- Calculated since NULL in source
end_time: "11:00 PM"          -- Calculated since NULL in source
```

## 4. Mobile App Display

**Tour Service Query:**
```typescript
// toursService.ts
async getArtistUpcomingShows(artistId: string) {
  const { data } = await supabase
    .from('events_view')  // Reads formatted data
    .select('*')
    .eq('artist_id', artistId);
  return data;
}
```

**Component Display:**
```typescript
// TourDates.tsx displays:
{date.date} at {date.time}
// "Sep 01, 2025 at 08:00 PM"
```

## Data Integrity Verification

### Query to verify complete chain:
```sql
-- 1. Check source
SELECT event_date, start_time FROM events WHERE id = 'event-id';

-- 2. Check public view
SELECT event_date, start_time FROM events_public_view WHERE id = 'event-id';

-- 3. Check formatted view
SELECT event_date, start_time FROM events_view WHERE event_id = 'event-id';
```

## Summary

✅ **Source Table:** `public.events` contains timestamptz columns
✅ **Public View:** `public.events_public_view` exposes these directly
✅ **App View:** `public.events_view` formats for display only
✅ **Mobile App:** Reads formatted strings ready for display

The Tour section correctly:
1. Sources data from `public.events` table
2. Reads via `public.events_public_view` for security
3. Formats via `public.events_view` for display
4. Shows user-friendly dates and times in the app
