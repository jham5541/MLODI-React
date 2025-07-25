--
-- Supabase Auth Schema Tables Analysis
-- Run this in your Supabase SQL Editor to see all auth tables
--

-- Query 1: List all auth schema tables
SELECT 
    tablename as table_name,
    (SELECT COUNT(*) FROM information_schema.columns 
     WHERE table_name = tablename AND table_schema = 'auth') as column_count,
    CASE tablename
        WHEN 'users' THEN '👤 Core user accounts and profiles'
        WHEN 'sessions' THEN '🔐 Active user login sessions'
        WHEN 'refresh_tokens' THEN '🔄 JWT token refresh management'
        WHEN 'identities' THEN '🆔 External OAuth provider identities'
        WHEN 'instances' THEN '⚙️ Auth instance configuration'
        WHEN 'audit_log_entries' THEN '📋 Authentication audit trail'
        WHEN 'flow_state' THEN '🌊 OAuth flow state tracking'
        WHEN 'mfa_factors' THEN '🔒 Multi-factor authentication factors'
        WHEN 'mfa_challenges' THEN '🎯 MFA challenge verification'
        WHEN 'mfa_amr_claims' THEN '🏷️ Authentication method references'
        WHEN 'sso_providers' THEN '🏢 Single sign-on providers'
        WHEN 'sso_domains' THEN '🌐 SSO domain configuration'
        WHEN 'saml_providers' THEN '📜 SAML provider configuration'
        WHEN 'saml_relay_states' THEN '🔗 SAML relay state tracking'
        WHEN 'schema_migrations' THEN '📦 Auth system migrations'
        ELSE '❓ Other auth table'
    END as description
FROM pg_tables 
WHERE schemaname = 'auth'
ORDER BY tablename;

-- Query 2: Show auth table relationships and purposes
SELECT 
    t.tablename,
    CASE t.tablename
        -- Core Authentication Tables
        WHEN 'users' THEN 'PRIMARY - Stores user accounts, email, encrypted passwords, metadata'
        WHEN 'sessions' THEN 'SESSIONS - Active user sessions with JWT tokens and expiry'
        WHEN 'refresh_tokens' THEN 'TOKENS - Long-lived tokens for refreshing access tokens'
        WHEN 'identities' THEN 'OAUTH - Links users to external providers (Google, GitHub, etc.)'
        
        -- Security & Audit
        WHEN 'audit_log_entries' THEN 'AUDIT - Logs all auth events (login, logout, password change)'
        WHEN 'flow_state' THEN 'OAUTH - Temporary state for OAuth flows (PKCE, etc.)'
        
        -- Multi-Factor Authentication
        WHEN 'mfa_factors' THEN 'MFA - User MFA methods (TOTP, SMS, etc.)'
        WHEN 'mfa_challenges' THEN 'MFA - Active MFA verification challenges'
        WHEN 'mfa_amr_claims' THEN 'MFA - Authentication Method Reference claims'
        
        -- Enterprise Features
        WHEN 'sso_providers' THEN 'SSO - Enterprise SSO provider configurations'
        WHEN 'sso_domains' THEN 'SSO - Domain-based SSO routing'
        WHEN 'saml_providers' THEN 'SAML - SAML 2.0 provider configurations'
        WHEN 'saml_relay_states' THEN 'SAML - SAML authentication relay states'
        
        -- System
        WHEN 'instances' THEN 'CONFIG - Auth instance configuration and settings'
        WHEN 'schema_migrations' THEN 'SYSTEM - Auth schema version tracking'
        
        ELSE 'UNKNOWN - Purpose not documented'
    END as purpose,
    (SELECT COUNT(*) FROM information_schema.columns 
     WHERE table_name = t.tablename AND table_schema = 'auth') as columns
FROM pg_tables t
WHERE schemaname = 'auth'
ORDER BY 
    CASE t.tablename
        WHEN 'users' THEN 1
        WHEN 'sessions' THEN 2
        WHEN 'refresh_tokens' THEN 3
        WHEN 'identities' THEN 4
        WHEN 'audit_log_entries' THEN 5
        WHEN 'flow_state' THEN 6
        WHEN 'mfa_factors' THEN 7
        WHEN 'mfa_challenges' THEN 8
        WHEN 'mfa_amr_claims' THEN 9
        WHEN 'sso_providers' THEN 10
        WHEN 'sso_domains' THEN 11
        WHEN 'saml_providers' THEN 12
        WHEN 'saml_relay_states' THEN 13
        WHEN 'instances' THEN 14
        WHEN 'schema_migrations' THEN 15
        ELSE 99
    END;

-- Query 3: Show sample data structure for key auth tables
-- (Only shows structure, not actual data for security)

-- Users table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'auth' AND table_name = 'users'
ORDER BY ordinal_position;

-- Query 4: Count records in each auth table (if you have permissions)
SELECT 
    'users' as table_name,
    COUNT(*) as record_count,
    '👤 Total registered users' as description
FROM auth.users
UNION ALL
SELECT 
    'sessions' as table_name,
    COUNT(*) as record_count,
    '🔐 Active sessions' as description
FROM auth.sessions
UNION ALL
SELECT 
    'identities' as table_name,
    COUNT(*) as record_count,
    '🆔 OAuth identities' as description
FROM auth.identities
UNION ALL
SELECT 
    'audit_log_entries' as table_name,
    COUNT(*) as record_count,
    '📋 Audit log entries' as description
FROM auth.audit_log_entries
ORDER BY record_count DESC;