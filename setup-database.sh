#!/bin/bash

echo "🚀 Setting up M3lodi Mobile Database"
echo "===================================="

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "❌ .env.local file not found!"
    echo "Please create a .env.local file with your Supabase credentials:"
    echo ""
    echo "EXPO_PUBLIC_SUPABASE_URL=your_supabase_url"
    echo "EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key"
    echo ""
    exit 1
fi

# Source environment variables
source .env.local

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found!"
    echo "Please install it first:"
    echo "brew install supabase/tap/supabase"
    exit 1
fi

echo "✅ Environment variables loaded"
echo "✅ Supabase CLI found"

# Link to your Supabase project
echo ""
echo "📌 Linking to Supabase project..."
echo "If prompted, enter your Supabase project ref (found in project settings)"
supabase link

# Run migrations
echo ""
echo "🔄 Running database migrations..."
supabase db push

echo ""
echo "✅ Database setup complete!"
echo ""
echo "🎯 Next steps:"
echo "1. Make sure your Supabase project has email auth enabled"
echo "2. Check that RLS is properly configured"
echo "3. Verify the auth.users table trigger is working"
echo ""
echo "If you still have issues, run this SQL in your Supabase SQL editor:"
echo ""
cat << 'EOF'
-- Check if user_profiles table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'user_profiles'
);

-- Check triggers
SELECT * FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
AND event_object_table = 'users';

-- Check RLS policies
SELECT * FROM pg_policies 
WHERE tablename = 'user_profiles';
EOF
