# Security Remediation Guide for Artist-Listener Integration

## Critical Security Issues to Address

### 🔴 ERROR Level Issues (Must Fix Immediately)

#### 1. Exposed Auth Users Data
**Issue**: The `user_profiles` view exposes `auth.users` data to authenticated roles.

**Risk**: User authentication data (emails, passwords hashes, etc.) could be exposed.

**Fix**:
```sql
-- Create a secure profiles view that doesn't expose auth.users directly
CREATE OR REPLACE VIEW user_profiles_secure AS
SELECT 
    p.id,
    p.username,
    p.display_name,
    p.avatar_url,
    p.bio,
    p.location,
    -- Only expose necessary fields
    CASE 
        WHEN p.id = auth.uid() THEN p.email  -- Users can see their own email
        ELSE NULL 
    END as email,
    p.subscription_tier,
    p.profile_created_at,
    p.onboarding_completed
FROM profiles p
WHERE p.id IS NOT NULL;

-- Grant appropriate permissions
GRANT SELECT ON user_profiles_secure TO authenticated;

-- Drop the insecure view
DROP VIEW IF EXISTS user_profiles;
```

#### 2. Security Definer Views
**Issue**: Multiple views use `SECURITY DEFINER` which bypasses RLS.

**Views affected**:
- `user_profiles`
- `user_subscriptions_dashboard`
- `tracks_public_view`
- `albums_public_view`
- `artists_public_view`
- `products_public_view`
- `fan_scores`
- `merchandise`
- `merchandise_variants`

**Fix for each view**:
```sql
-- Example fix for tracks_public_view
DROP VIEW IF EXISTS tracks_public_view CASCADE;

CREATE VIEW tracks_public_view AS
SELECT 
    t.id,
    t.title,
    t.artist_id,
    t.duration,
    t.genre,
    t.play_count,
    t.created_at,
    -- Only show cover_url and audio_url for published tracks
    CASE WHEN t.is_published THEN t.cover_url ELSE NULL END as cover_url,
    CASE WHEN t.is_published THEN t.audio_url ELSE NULL END as audio_url
FROM tracks t
WHERE t.is_published = true;

-- Apply RLS to the base table instead
ALTER TABLE tracks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public tracks are viewable" ON tracks
FOR SELECT 
USING (is_published = true OR artist_id = auth.uid());
```

### 🟡 WARNING Level Issues (Fix Soon)

#### 3. Function Search Path Mutable
**Issue**: 29 functions have mutable search paths, vulnerable to search path injection.

**Fix for all functions**:
```sql
-- Template for fixing functions
ALTER FUNCTION [function_name] SET search_path = public, pg_temp;

-- Example for specific functions
ALTER FUNCTION public.add_points_to_wallet SET search_path = public, pg_temp;
ALTER FUNCTION public.award_artist_points_once SET search_path = public, pg_temp;
ALTER FUNCTION public.award_listening_points SET search_path = public, pg_temp;
ALTER FUNCTION public.calculate_trending_artists SET search_path = public, pg_temp;
ALTER FUNCTION public.current_user_is_artist SET search_path = public, pg_temp;
-- ... apply to all 29 functions listed
```

#### 4. Extension in Public Schema
**Issue**: `pg_trgm` extension is in the public schema.

**Fix**:
```sql
-- Create a dedicated schema for extensions
CREATE SCHEMA IF NOT EXISTS extensions;

-- Move the extension
DROP EXTENSION IF EXISTS pg_trgm CASCADE;
CREATE EXTENSION pg_trgm SCHEMA extensions;

-- Update any functions using pg_trgm
-- Add 'extensions' to their search_path
```

#### 5. Auth Configuration Issues
**Issues**:
- OTP expiry set to more than an hour
- Leaked password protection disabled

**Fix via Supabase Dashboard**:
1. Go to Authentication → Settings
2. Set OTP expiry to 30 minutes (recommended)
3. Enable "Leaked Password Protection"

## Secure Integration Patterns

### Pattern 1: Role-Based Data Access
```sql
-- Create a function to safely get user role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    -- Check if user is an artist
    IF EXISTS (
        SELECT 1 FROM artists 
        WHERE created_by = auth.uid() 
        AND is_active = true
    ) THEN
        RETURN 'artist';
    END IF;
    
    -- Default to listener
    RETURN 'listener';
END;
$$;

-- Use in RLS policies
CREATE POLICY "Content visibility based on role" ON tracks
FOR SELECT
USING (
    CASE get_user_role()
        WHEN 'artist' THEN 
            artist_id = auth.uid() OR is_published = true
        WHEN 'listener' THEN 
            is_published = true
        ELSE 
            false
    END
);
```

### Pattern 2: Secure Artist-Listener Bridge
```sql
-- Create a secure junction table for artist-listener relationships
CREATE TABLE IF NOT EXISTS artist_listener_bridge (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    artist_id UUID REFERENCES artists(id) ON DELETE CASCADE,
    listener_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    relationship_type TEXT CHECK (relationship_type IN ('follower', 'subscriber', 'superfan')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(artist_id, listener_id, relationship_type)
);

-- Enable RLS
ALTER TABLE artist_listener_bridge ENABLE ROW LEVEL SECURITY;

-- Listeners can only see their own relationships
CREATE POLICY "Listeners see own relationships" ON artist_listener_bridge
FOR SELECT
TO authenticated
USING (listener_id = auth.uid());

-- Artists can see their followers
CREATE POLICY "Artists see their followers" ON artist_listener_bridge
FOR SELECT
TO authenticated
USING (
    artist_id IN (
        SELECT id FROM artists WHERE created_by = auth.uid()
    )
);
```

### Pattern 3: Secure Content Sharing
```sql
-- Create a table for artist content visibility settings
CREATE TABLE IF NOT EXISTS artist_content_settings (
    artist_id UUID REFERENCES artists(id) PRIMARY KEY,
    show_unpublished_count BOOLEAN DEFAULT false,
    show_upcoming_releases BOOLEAN DEFAULT true,
    show_revenue_milestone BOOLEAN DEFAULT false,
    show_follower_count BOOLEAN DEFAULT true,
    listener_data_retention_days INTEGER DEFAULT 90,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for settings
ALTER TABLE artist_content_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Artists manage own settings" ON artist_content_settings
FOR ALL
TO authenticated
USING (
    artist_id IN (
        SELECT id FROM artists WHERE created_by = auth.uid()
    )
);

-- Create a secure view for listeners
CREATE VIEW artist_public_data AS
SELECT 
    a.id,
    a.name,
    a.avatar_url,
    a.is_verified,
    CASE 
        WHEN acs.show_follower_count THEN a.followers_count 
        ELSE NULL 
    END as followers_count,
    CASE 
        WHEN acs.show_upcoming_releases THEN (
            SELECT COUNT(*) FROM albums 
            WHERE artist_id = a.id 
            AND release_date > NOW() 
            AND release_date < NOW() + INTERVAL '30 days'
        )
        ELSE NULL
    END as upcoming_releases_count
FROM artists a
LEFT JOIN artist_content_settings acs ON a.id = acs.artist_id
WHERE a.is_active = true;
```

## Security Testing Checklist

### Pre-Deployment Tests
```typescript
// Test suite for security validation
describe('Security Tests', () => {
  describe('Auth.users protection', () => {
    it('should not expose auth.users fields to regular users', async () => {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .limit(1);
      
      // Should not contain sensitive auth fields
      expect(data?.[0]).not.toHaveProperty('encrypted_password');
      expect(data?.[0]).not.toHaveProperty('email_confirmed_at');
      expect(data?.[0]).not.toHaveProperty('raw_app_meta_data');
    });
  });

  describe('RLS enforcement', () => {
    it('should prevent cross-artist data access', async () => {
      const artist1 = await createTestArtist();
      const artist2 = await createTestArtist();
      
      // Artist 1 tries to modify Artist 2's data
      await loginAs(artist1);
      const { error } = await supabase
        .from('artists')
        .update({ name: 'Hacked' })
        .eq('id', artist2.id);
      
      expect(error).toBeDefined();
      expect(error.code).toBe('42501');
    });
  });

  describe('Search path injection', () => {
    it('should be protected against search path attacks', async () => {
      // Attempt to create a malicious schema
      const { error: schemaError } = await supabase.rpc('create_schema', {
        name: 'public'
      });
      
      expect(schemaError).toBeDefined();
      
      // Functions should still work correctly
      const { data, error } = await supabase.rpc('get_user_role');
      expect(error).toBeNull();
      expect(['artist', 'listener']).toContain(data);
    });
  });
});
```

## Monitoring and Alerts

### Set up these database triggers for security monitoring:
```sql
-- Audit log for sensitive operations
CREATE TABLE security_audit_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    table_name TEXT,
    record_id UUID,
    old_data JSONB,
    new_data JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger for monitoring artist data access
CREATE OR REPLACE FUNCTION log_artist_data_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    -- Log access to sensitive artist data
    IF TG_TABLE_NAME IN ('artist_revenue_metrics', 'artist_analytics_summary') THEN
        INSERT INTO security_audit_log (
            user_id,
            action,
            table_name,
            record_id,
            created_at
        ) VALUES (
            auth.uid(),
            TG_OP,
            TG_TABLE_NAME,
            CASE 
                WHEN TG_OP = 'DELETE' THEN OLD.id
                ELSE NEW.id
            END,
            NOW()
        );
    END IF;
    
    RETURN NEW;
END;
$$;

-- Apply to sensitive tables
CREATE TRIGGER audit_artist_revenue_access
AFTER SELECT OR UPDATE OR DELETE ON artist_revenue_metrics
FOR EACH ROW EXECUTE FUNCTION log_artist_data_access();
```

## Emergency Response Plan

### If a security breach is detected:

1. **Immediate Actions** (< 5 minutes)
```sql
-- Revoke all access to sensitive tables
REVOKE ALL ON artist_revenue_metrics FROM authenticated;
REVOKE ALL ON artist_analytics_summary FROM authenticated;

-- Disable problematic functions
ALTER FUNCTION [compromised_function] RENAME TO [compromised_function]_disabled;
```

2. **Investigation** (< 30 minutes)
```sql
-- Check recent access patterns
SELECT 
    user_id,
    action,
    table_name,
    count(*) as access_count,
    max(created_at) as last_access
FROM security_audit_log
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY user_id, action, table_name
ORDER BY access_count DESC;
```

3. **Remediation** (< 2 hours)
- Apply security patches
- Reset affected user sessions
- Notify affected users
- Document incident

## Conclusion

Implementing these security fixes is **mandatory** before connecting artist and listener sides. The current setup has critical vulnerabilities that could expose sensitive user and artist data.

**Priority Order**:
1. Fix `SECURITY DEFINER` views (Critical)
2. Protect auth.users exposure (Critical)
3. Set search_path for all functions (High)
4. Move extensions out of public schema (Medium)
5. Configure auth settings (Medium)

Estimated time to implement all fixes: **4-6 hours**

After implementation, run the full security test suite and verify with:
```bash
# Run security audit
supabase db lint --schema public

# Check for remaining issues
supabase inspect db --include-schemas public
```
