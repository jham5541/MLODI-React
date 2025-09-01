# Tour Section Data Flow Documentation

## Overview
The Tour section in the M3LODI mobile app displays upcoming events/concerts for artists. It reads event data through a carefully structured view hierarchy that ensures proper security and data consistency.

## Database View Hierarchy

### 1. Base Table: `events`
The foundation table that stores all event information:
- Contains raw event data (id, title, description, dates, venue info, etc.)
- Has RLS (Row Level Security) policies applied
- Not directly accessed by the mobile app

### 2. Public View: `events_public_view`
**Purpose**: Security-filtered view that enforces access control
**Location**: `public.events_public_view`

**What it does**:
- Joins `events` table with `artists` table to get artist names
- Filters to show only published events (`status = 'published'`)
- Shows only upcoming events (`event_date >= CURRENT_DATE`)
- Provides basic event information with artist details

**Key columns**:
```sql
- id (uuid) - Event ID
- title (text) - Event title
- description (text) - Event description
- event_type (text) - Type of event
- event_date (timestamp) - Date of the event
- start_time (timestamp) - Start time
- venue_name (text) - Venue name
- venue_address (text) - Venue address
- city (text) - City
- state (text) - State/Province
- country (text) - Country
- cover_image_url (text) - Cover image
- artist_id (uuid) - Artist ID
- status (text) - Event status
- total_capacity (integer) - Total venue capacity
- tickets_sold (integer) - Number of tickets sold
- artist_name (text) - Artist's name (from join)
```

### 3. Application View: `events_view`
**Purpose**: Formats data for mobile app consumption
**Location**: `public.events_view`
**Used by**: `toursService.ts` in the mobile app

**What it does**:
- Reads from `events_public_view` (inherits all security filters)
- Adds computed columns for the mobile app
- Formats dates and times for display
- Calculates additional fields like available capacity
- Joins with `ticket_tiers` table to get pricing information

**Additional/Transformed columns**:
```sql
- event_id (renamed from id)
- event_title (renamed from title)
- event_description (renamed from description)
- event_date (formatted as 'MM-DD-YYYY')
- start_time (formatted as 'HH12:MI PM')
- doors_open_time (calculated: start_time - 1 hour, formatted)
- end_time (calculated: start_time + 3 hours, formatted)
- venue (renamed from venue_name)
- location (formatted: "city, state" or just city/state)
- available_capacity (calculated: total_capacity - tickets_sold)
- min_ticket_price (from ticket_tiers table)
- currency (from ticket_tiers, defaults to 'USD')
- Special fields for virtual events (is_virtual, stream_url)
```

## Data Flow in the Mobile App

### 1. Tour Component (`TourDates.tsx`)
```typescript
// Component calls the tours service
const upcomingShows = await toursService.getArtistUpcomingShows(artistId);
```

### 2. Tours Service (`toursService.ts`)
```typescript
// Service queries the events_view
async getArtistUpcomingShows(artistId: string): Promise<EventView[]> {
  const { data, error } = await supabase
    .from('events_view')  // <-- Reads from the formatted view
    .select('*')
    .eq('artist_id', artistId)
    .order('event_date', { ascending: true });
  
  return data || [];
}
```

### 3. Data Transformation
The service transforms the view data into display format:
```typescript
transformShowToDisplay(event: EventView): {
  id: string;          // event_id from view
  venue: string;       // venue from view
  city: string;        // location from view
  date: string;        // event_date from view (already formatted)
  time: string;        // start_time from view (already formatted)
  price: number;       // min_ticket_price from view
  availableTickets: number; // available_capacity from view
}
```

## Related Tables (Not Part of View Hierarchy)

### `ticket_tiers` Table
- Contains pricing tiers for each event
- Referenced by `events_view` to calculate `min_ticket_price`
- Structure includes: event_id, name, price, quantity_available, quantity_sold, benefits, etc.

### `venues` Table (if exists separately)
- May contain detailed venue information
- Currently, venue data is embedded in the events table

### `ticket_purchases` Table
- Tracks which users have purchased tickets
- Used by the app to show "View Tickets" vs "Buy Now" buttons
- Not part of the view hierarchy but queried separately

## Security Model

1. **Row Level Security (RLS)**:
   - Applied at the `events` table level
   - Inherited by `events_public_view`
   - Ensures users only see appropriate events

2. **Status Filtering**:
   - Only `published` events are shown
   - Cancelled, draft, or private events are filtered out

3. **Date Filtering**:
   - Only future events are shown (event_date >= CURRENT_DATE)
   - Past events are automatically excluded

4. **Ticket Availability**:
   - The view joins with ticket_tiers to show only events with available tickets
   - Shows minimum price from active, available tiers

## Benefits of This Architecture

1. **Security**: Multiple layers ensure data access control
2. **Performance**: Views are optimized with proper indexes
3. **Consistency**: All apps read from the same views
4. **Maintainability**: Changes to business logic can be made in views without changing app code
5. **Flexibility**: Different views can format data differently for different clients

## Example Query Flow

When a user opens an artist's profile and the Tour section loads:

1. Mobile app calls `toursService.getArtistUpcomingShows(artistId)`
2. Service queries `events_view` with artist_id filter
3. `events_view` reads from `events_public_view`
4. `events_public_view` reads from `events` table with RLS policies
5. Data flows back up through the views with formatting applied
6. Service transforms data to component format
7. Component displays formatted tour dates

## Ticket Tier Integration

The `events_public_view` now includes ticket tier information as a JSON array:
- `ticket_tiers`: Array of tier objects with pricing and availability
- `min_ticket_price`: Lowest available price
- `max_ticket_price`: Highest available price
- Each tier includes: id, name, price, quantity_available, benefits, color_code

This allows the Tour section to show pricing ranges and tier options without additional queries.
