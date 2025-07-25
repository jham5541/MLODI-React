# M3lodi Database Analysis Tools

This directory contains tools to analyze your Supabase database and see all 87 tables.

## 🚀 Quick Start

### Method 1: JavaScript Script (Recommended)
```bash
cd scripts
npm install
npm run analyze
```

### Method 2: SQL Queries (Direct)
1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/riesezhwmiklpcnrbjkb
2. Navigate to "SQL Editor"
3. Copy and paste queries from `analyze-database.sql`
4. Run each query to see different aspects of your database

### Method 3: Supabase CLI
```bash
# List all tables
supabase db dump --schema-only

# Check migration status
supabase migration list
```

## 📊 What You'll Discover

### Expected Table Breakdown:
- **📊 Application Data (public schema)**: ~30 tables
  - Core Music Tables (10): artists, albums, songs, playlists, etc.
  - Fan Engagement (9): fan_tiers, achievements, challenges, etc.
  - NFT Marketplace (4): nft_collections, nft_listings, etc.
  - Real-time Features (7): listening_sessions, artist_activity, etc.

- **🔐 Authentication (auth schema)**: ~15 tables
  - users, sessions, refresh_tokens, identities, etc.

- **💾 Storage (storage schema)**: ~3 tables
  - buckets, objects, migrations

- **⚡ Real-time (realtime schema)**: ~3 tables
  - subscription, schema_migrations, messages

- **🔧 System Tables**: ~36 tables
  - PostgreSQL system tables
  - Supabase internal tables
  - Monitoring and analytics tables

## 🔍 Key Queries

### See All Tables by Schema:
```sql
SELECT schemaname, COUNT(*) as table_count
FROM pg_tables 
GROUP BY schemaname
ORDER BY table_count DESC;
```

### Check Your Custom Tables:
```sql
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;
```

### Verify Migrations Applied:
```sql
SELECT version, name, executed_at
FROM supabase_migrations.schema_migrations 
ORDER BY executed_at DESC;
```

## 🚨 Troubleshooting

### If Tables Are Missing:
```bash
# Push migrations to database
supabase db push

# Or reset and apply all migrations
supabase db reset
```

### If You Get Permission Errors:
- The anon key has limited permissions
- Some system tables may not be accessible
- Use the service role key for full access (be careful!)

## 📝 Files Explained

- **`analyze-database.js`**: Interactive Node.js script to analyze your database
- **`analyze-database.sql`**: SQL queries you can run directly in Supabase
- **`package.json`**: Dependencies for the Node.js script
- **`README.md`**: This documentation

## 🔒 Security Note

The credentials in these scripts use your public anon key, which has limited read permissions. Never share your service role key publicly!