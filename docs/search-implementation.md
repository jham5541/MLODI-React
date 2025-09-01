# Search Implementation Documentation

## Overview
The M3LODI search functionality is designed to search across artists, albums, and tracks, but **only returns content from artists with active paid subscriptions**. This ensures that only premium content is discoverable through the search feature.

## Architecture

### Database Layer

#### 1. `visible_artists` View
This view filters artists to only include those with active paid subscriptions:
```sql
SELECT * FROM artists 
WHERE subscription_status = 'active' 
AND subscription_tier IS NOT NULL 
AND subscription_tier NOT IN ('free', 'Free', 'FREE');
```

#### 2. Search Views
Three views provide searchable content, all filtered through `visible_artists`:

- **`searchable_artists`**: Artists with active paid subscriptions
- **`searchable_albums`**: Albums from visible artists only
- **`searchable_tracks`**: Tracks from visible artists only

#### 3. Search Function
`search_music_content(query, limit, type)` - PostgreSQL function that:
- Searches across all three content types
- Ranks results by relevance (exact match > starts with > contains)
- Returns unified results with metadata
- Prioritizes artists > albums > tracks

### Frontend Layer

#### Components
1. **SearchModal** (`src/components/search/SearchModal.tsx`)
   - Main search interface
   - Handles user input and displays results
   - Supports database and sample data modes

2. **SearchService** (`src/services/searchService.ts`)
   - Interfaces with database search function
   - Converts results to UI format
   - Handles errors with fallback to sample data

## How It Works

### Search Flow
1. User types in search bar
2. SearchModal calls `searchService.searchMusic()`
3. Service executes `search_music_content` database function
4. Function queries only content from visible artists
5. Results are ranked and returned
6. UI displays artists, albums, and tracks separately

### Result Structure
```typescript
interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  image_url: string | null;
  result_type: 'artist' | 'album' | 'track';
  artist_id: string;
  artist_name: string;
  extra_info: {
    // Type-specific metadata
  };
}
```

## Business Rules

### Visibility Criteria
Content is searchable only if:
1. Artist has `subscription_status = 'active'`
2. Artist has a non-null `subscription_tier`
3. Subscription tier is NOT 'free' (case-insensitive)

### Content Filtering
- **Tracks**: Must be published (`is_published = true`)
- **Albums**: Must be published (`is_published = true`)
- **Artists**: Automatically filtered by `visible_artists` view

## Search Features

### Supported Search Types
- `all` - Search across all content types (default)
- `artists` - Search only artists
- `albums` - Search only albums
- `tracks` or `songs` - Search only tracks

### Ranking Algorithm
Results are ranked by:
1. **Match Quality**:
   - Exact match (rank = 1)
   - Starts with query (rank = 2)
   - Contains query (rank = 3)

2. **Content Type Priority**:
   - Artists (priority 1)
   - Albums (priority 2)
   - Tracks (priority 3)

3. **Alphabetical** (title)

### Search Fields
- **Artists**: name, display_name, genres
- **Albums**: title, artist_name
- **Tracks**: title, artist_name, genre

## Testing

### Test Search Function
```sql
-- Search for content (only from paid artists)
SELECT * FROM search_music_content('jay', 20, 'all');

-- Search only artists
SELECT * FROM search_music_content('r&b', 10, 'artists');

-- Search only tracks
SELECT * FROM search_music_content('love', 15, 'tracks');
```

### Verify Visible Artists
```sql
-- Check which artists are searchable
SELECT id, name, subscription_status, subscription_tier 
FROM visible_artists;
```

### Frontend Testing
The SearchModal includes a toggle to switch between:
- **Database Mode**: Real search from paid artists only
- **Sample Data Mode**: Testing with mock data

## Performance Considerations

### Optimizations
1. **Pre-filtered Views**: Content is pre-filtered by subscription status
2. **Indexed Searches**: Uses PostgreSQL's text search capabilities
3. **Result Limiting**: Default limit of 20 results
4. **Lazy Loading**: Additional results can be loaded on demand

### Caching Strategy
- Search results are not cached to ensure real-time subscription status
- Recent searches are stored locally for quick access

## Error Handling

### Database Errors
- Service catches all database errors
- Falls back to sample data automatically
- Logs errors for debugging

### Empty Results
- Clear messaging when no results found
- Indicates that only paid artists are searchable
- Suggests alternative search terms

## Future Enhancements

### Planned Features
1. **Full-text Search**: Implement PostgreSQL's full-text search
2. **Search Filters**: Add genre, year, mood filters
3. **Search History**: Sync search history across devices
4. **Trending Searches**: Show popular searches
5. **Fuzzy Matching**: Handle typos and similar terms

### Performance Improvements
1. **Elasticsearch Integration**: For advanced search capabilities
2. **Result Caching**: Smart caching with subscription awareness
3. **Predictive Search**: Show suggestions while typing
4. **Search Analytics**: Track popular searches for insights

## API Reference

### Database Function
```sql
search_music_content(
  search_query TEXT,      -- Search term
  result_limit INTEGER,   -- Max results (default: 20)
  search_type TEXT        -- 'all', 'artists', 'albums', 'tracks'
) RETURNS TABLE (
  id UUID,
  title TEXT,
  subtitle TEXT,
  image_url TEXT,
  result_type TEXT,
  artist_id UUID,
  artist_name TEXT,
  extra_info JSONB
)
```

### Frontend Service
```typescript
searchService.searchMusic(
  query: string,
  searchType: 'all' | 'artists' | 'albums' | 'tracks',
  limit: number
): Promise<SearchResults>
```

## Troubleshooting

### No Search Results
1. Verify artists have active paid subscriptions
2. Check `visible_artists` view has data
3. Ensure content is published
4. Test with known artist names

### Search Not Working
1. Check database connection
2. Verify search function exists
3. Check permissions on views/functions
4. Review console for errors

---

Last Updated: 2025-01-20
Version: 1.0.0
