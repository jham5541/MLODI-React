# Artist-Listener Integration Rules

## Overview
This document defines the comprehensive rules and guidelines for safely connecting artist-side features to the listener/user side of the M3LODI platform without disrupting existing functionality.

## Core Principles

### 1. Data Isolation and Security
- **Never expose artist-internal data** to listeners unless explicitly marked as public
- **Maintain strict RLS policies** to prevent unauthorized access
- **Use separate views** for listener-facing data vs artist-internal data
- **Preserve existing listener functionality** - all changes must be additive, not destructive

### 2. Database Architecture Rules

#### 2.1 Table Relationships
- **Artists table** (`artists`): 
  - Primary key: `id` (UUID)
  - Foreign key: `created_by` → `auth.users.id`
  - Listeners access through `artists_public_view` (filtered by `is_active = true`)
  
- **Profiles table** (`profiles`):
  - Primary key: `id` (UUID, matches `auth.users.id`)
  - Single source of truth for user profiles
  - Both artists and listeners use this table
  
- **Tracks table** (`tracks`):
  - Foreign key: `artist_id` → `profiles.id` (NOT `artists.id`)
  - Listeners only see tracks where `is_published = true`
  
#### 2.2 View Creation Rules
```sql
-- Pattern for creating listener-safe views
CREATE VIEW [entity]_listener_view AS
SELECT 
    -- Only expose necessary fields
    id, title, artist_id, created_at, 
    -- Computed fields safe for listeners
    play_count, like_count
FROM [entity]
WHERE 
    -- Always filter by published/active status
    COALESCE(is_published, true) = true
    AND COALESCE(is_active, true) = true
    -- Additional business logic filters
    AND release_date <= NOW();
```

#### 2.3 Foreign Key Rules
- **NEVER create direct foreign keys** from listener tables to artist-internal tables
- **Use `profiles.id`** as the bridge between artist and listener data
- **Maintain referential integrity** through proper cascading rules

### 3. API and Access Control

#### 3.1 RLS Policy Patterns
```sql
-- Listener read-only access pattern
CREATE POLICY "[entity]_listener_view" ON [entity]
FOR SELECT TO listener
USING (
    COALESCE(is_published, true) = true 
    AND COALESCE(is_active, true) = true
);

-- Artist full access pattern
CREATE POLICY "[entity]_artist_manage" ON [entity]
FOR ALL TO artist
USING (artist_id = auth.uid())
WITH CHECK (artist_id = auth.uid());

-- Hybrid access pattern (listeners read, artists write)
CREATE POLICY "[entity]_public_read" ON [entity]
FOR SELECT TO authenticated
USING (
    CASE 
        WHEN auth.jwt() ->> 'role' = 'artist' THEN true
        WHEN auth.jwt() ->> 'role' = 'listener' THEN is_published = true
        ELSE false
    END
);
```

#### 3.2 Data Visibility Rules
| Entity | Listener Access | Artist Access | Notes |
|--------|----------------|---------------|-------|
| Artists | Public fields only via `artists_public_view` | Full access to own profile | Hide sensitive data like revenue |
| Tracks | Published tracks only | All own tracks | Include preview for unpublished |
| Albums | Published albums only | All own albums | Show release schedule to artist |
| Analytics | Aggregated public stats | Detailed analytics | Never expose individual user data |
| Comments | Public comments | All comments + moderation | Filter inappropriate content |
| Merchandise | Active products only | All products + inventory | Hide stock levels from listeners |

### 4. Frontend Integration Rules

#### 4.1 Component Sharing
- **Create separate components** for artist and listener views
- **Use shared base components** with role-specific wrappers
- **Never mix artist-admin components** with listener-facing UI

#### 4.2 Navigation Guards
```typescript
// Pattern for role-based navigation
const ArtistRoute = ({ children }) => {
  const { user } = useAuth();
  
  if (user?.role !== 'artist') {
    return <Navigate to="/listener/home" />;
  }
  
  return children;
};

const ListenerRoute = ({ children }) => {
  const { user } = useAuth();
  
  if (user?.role === 'artist') {
    // Artists can view listener pages but with their artist context
    return <ArtistAsListenerWrapper>{children}</ArtistAsListenerWrapper>;
  }
  
  return children;
};
```

#### 4.3 Data Fetching Rules
```typescript
// Always use role-aware queries
const useArtistData = (artistId: string) => {
  const { user } = useAuth();
  
  // Listeners get public data
  if (user?.role === 'listener') {
    return useQuery({
      queryKey: ['artist', 'public', artistId],
      queryFn: () => fetchPublicArtistData(artistId)
    });
  }
  
  // Artists get full data for their own profile
  if (user?.role === 'artist' && user.id === artistId) {
    return useQuery({
      queryKey: ['artist', 'private', artistId],
      queryFn: () => fetchPrivateArtistData(artistId)
    });
  }
  
  // Other artists get limited peer data
  return useQuery({
    queryKey: ['artist', 'peer', artistId],
    queryFn: () => fetchPeerArtistData(artistId)
  });
};
```

### 5. Migration and Deployment Rules

#### 5.1 Migration Safety Checklist
- [ ] Create migrations with rollback capability
- [ ] Test on development branch first
- [ ] Verify no breaking changes to existing listener queries
- [ ] Ensure all new foreign keys are properly indexed
- [ ] Check that RLS policies don't conflict
- [ ] Validate that existing API endpoints still work

#### 5.2 Safe Migration Pattern
```sql
-- Step 1: Create new structures without affecting existing
BEGIN;

-- Add new columns with defaults
ALTER TABLE artists 
ADD COLUMN IF NOT EXISTS listener_visible_bio TEXT,
ADD COLUMN IF NOT EXISTS artist_internal_notes TEXT;

-- Create new views
CREATE OR REPLACE VIEW artist_public_profile AS
SELECT id, name, listener_visible_bio, avatar_url
FROM artists
WHERE is_active = true;

-- Add new RLS policies
CREATE POLICY "artist_public_profile_read" 
ON artists FOR SELECT 
TO authenticated
USING (is_active = true);

COMMIT;

-- Step 2: Migrate data (separate transaction)
BEGIN;

UPDATE artists 
SET listener_visible_bio = bio 
WHERE listener_visible_bio IS NULL;

COMMIT;

-- Step 3: Deprecate old structures (after verification)
-- This happens in a future migration after confirming everything works
```

### 6. Testing Requirements

#### 6.1 Required Test Scenarios
1. **Listener Experience Preservation**
   - Existing listener features work unchanged
   - No performance degradation
   - No new required permissions

2. **Artist Data Isolation**
   - Listener cannot access artist-internal data
   - Artist can only modify own data
   - Cross-artist data protection

3. **Role Transition Testing**
   - User upgrading from listener to artist
   - Artist viewing platform as listener
   - Permission boundary enforcement

#### 6.2 Test Implementation Pattern
```typescript
describe('Artist-Listener Integration', () => {
  describe('Data Access Control', () => {
    it('should prevent listeners from accessing artist revenue data', async () => {
      const listener = await createTestUser({ role: 'listener' });
      const artist = await createTestArtist();
      
      const response = await supabase
        .from('artist_revenue_metrics')
        .select('*')
        .eq('artist_id', artist.id)
        .single();
      
      expect(response.error).toBeDefined();
      expect(response.error.code).toBe('42501'); // Insufficient privilege
    });
    
    it('should allow listeners to view published tracks', async () => {
      const listener = await createTestUser({ role: 'listener' });
      const track = await createTestTrack({ is_published: true });
      
      const response = await supabase
        .from('tracks')
        .select('*')
        .eq('id', track.id)
        .single();
      
      expect(response.data).toBeDefined();
      expect(response.data.id).toBe(track.id);
    });
  });
});
```

### 7. Monitoring and Rollback

#### 7.1 Key Metrics to Monitor
- Query performance (especially JOINs between artist and listener data)
- RLS policy evaluation time
- API response times
- Error rates by user role
- Data access violations (logged but blocked)

#### 7.2 Rollback Triggers
- 5% increase in listener-side error rates
- 20% degradation in query performance
- Any data access violation
- Critical business logic failure

#### 7.3 Rollback Process
```bash
# Immediate rollback procedure
1. Revert database migrations
   supabase db reset --branch=production
   
2. Restore previous API version
   git checkout [last-stable-tag]
   npm run deploy:api
   
3. Clear CDN cache
   npm run cache:clear
   
4. Notify team and users
   npm run notify:rollback
```

### 8. Common Pitfalls to Avoid

#### 8.1 Database Anti-Patterns
- ❌ Creating circular foreign key dependencies
- ❌ Using the same table for artist and listener profiles
- ❌ Exposing internal IDs in public APIs
- ❌ Forgetting to add indexes on foreign keys
- ❌ Missing CASCADE rules on deletions

#### 8.2 Frontend Anti-Patterns
- ❌ Sharing state between artist and listener contexts
- ❌ Client-side role checking without server validation
- ❌ Caching artist data in listener's local storage
- ❌ Using the same API endpoints for both roles
- ❌ Mixing admin and public components

#### 8.3 Security Anti-Patterns
- ❌ Relying only on frontend for access control
- ❌ Using predictable IDs that can be enumerated
- ❌ Storing sensitive data in JWT tokens
- ❌ Forgetting to sanitize user-generated content
- ❌ Not rate-limiting artist-specific endpoints

### 9. Implementation Checklist

Before connecting any artist feature to the listener side:

- [ ] **Design Review**
  - [ ] Data model reviewed by team
  - [ ] RLS policies documented
  - [ ] API endpoints specified
  - [ ] UI/UX mockups approved

- [ ] **Development**
  - [ ] Database migrations created with rollback
  - [ ] RLS policies implemented and tested
  - [ ] API endpoints created with proper validation
  - [ ] Frontend components built with role awareness
  - [ ] Unit tests written and passing
  - [ ] Integration tests written and passing

- [ ] **Testing**
  - [ ] Tested on development branch
  - [ ] Load testing performed
  - [ ] Security testing completed
  - [ ] Cross-role scenarios tested
  - [ ] Rollback procedure tested

- [ ] **Deployment**
  - [ ] Migrations run on staging
  - [ ] Staging testing completed
  - [ ] Monitoring alerts configured
  - [ ] Rollback plan documented
  - [ ] Team notified of changes

### 10. Communication Rules

#### 10.1 Notification Requirements
When artist data becomes visible to listeners:
1. Notify artist via in-app notification
2. Provide opt-out mechanism where applicable
3. Clear explanation of what data is shared
4. Link to privacy settings

#### 10.2 Privacy Considerations
- Always provide artists control over what listeners see
- Default to private for new artist features
- Require explicit opt-in for data sharing
- Maintain audit log of visibility changes

## Conclusion

Following these rules ensures:
1. **Listener experience remains stable** and performant
2. **Artist data stays secure** and properly isolated
3. **Platform scales effectively** with clear boundaries
4. **Development velocity maintained** through clear patterns
5. **Rollback capability preserved** for risk mitigation

Any deviation from these rules requires:
- Architecture team review
- Security team approval
- Performance impact analysis
- Rollback plan documentation

Remember: **When in doubt, create a new view or table rather than modifying existing listener-facing structures.**
