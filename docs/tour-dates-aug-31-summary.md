# Tour Dates - August 31, 2025 Events

## ✅ Updated Events for August 31, 2025

The Tour section now correctly shows events for **August 31, 2025** as requested.

### Events on August 31, 2025:

| Event Title | Date | Time | Venue | Location | Price |
|------------|------|------|-------|----------|-------|
| **Fall Out Tour** | Aug 31, 2025 | 8:00 PM | Madison Square Garden | New York, NY | $80 |
| **Fall out** | Aug 31, 2025 | 8:00 PM | MSG | New York, NY | $80 |
| **Summer End Bash** | Aug 31, 2025 | 9:00 PM | Hollywood Bowl | Los Angeles, CA | $65 |

### Data Flow Confirmation:

1. **Source (`public.events`)**:
   - `event_date`: 2025-08-31 00:00:00+00
   - `start_time`: 2025-08-31 20:00:00+00 (8 PM)
   - `doors_open_time`: 2025-08-31 19:00:00+00 (7 PM)
   - `end_time`: 2025-08-31 23:00:00+00 (11 PM)

2. **Public View (`public.events_public_view`)**:
   - Exposes the Aug 31 events (they're >= CURRENT_DATE)
   - Shows all events with status = 'published'

3. **App View (`public.events_view`)**:
   - Formats as: "Aug 31, 2025"
   - Times as: "8:00 PM", "9:00 PM"
   - Doors open: "7:00 PM", "8:00 PM"

### Additional Events (Future Dates):

- **Virtual Concert Experience** - Sep 25, 2025 at 9:00 PM
- **Summer Vibes Festival** - Oct 15, 2025 at 7:00 PM  
- **Acoustic Night** - Nov 20, 2025 at 8:30 PM
- **Fall Out Tour** - Dec 01, 2025 at 7:30 PM
- **New Year Eve Spectacular** - Dec 31, 2025 at 10:00 PM

## Mobile App Display

The Tour section in the mobile app will show:

```
Fall Out Tour
Madison Square Garden
New York, NY • Aug 31, 2025 at 8:00 PM
Tickets: $80

Fall out
MSG
New York, NY • Aug 31, 2025 at 8:00 PM
Tickets: $80

Summer End Bash
Hollywood Bowl
Los Angeles, CA • Aug 31, 2025 at 9:00 PM
Tickets: $65
```

## Query to Verify

```sql
-- Check Aug 31 events
SELECT * FROM events_view 
WHERE event_date LIKE 'Aug 31%'
ORDER BY start_time;
```
