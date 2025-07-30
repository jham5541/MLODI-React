#!/bin/bash

echo "🚀 Applying database migrations to Supabase..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Please create one with your Supabase credentials."
    echo "Copy .env.example to .env and fill in your values."
    exit 1
fi

# Load environment variables
export $(cat .env | grep -v '^#' | xargs)

# Check if Supabase URL and key are set
if [ -z "$EXPO_PUBLIC_SUPABASE_URL" ] || [ -z "$EXPO_PUBLIC_SUPABASE_ANON_KEY" ]; then
    echo "❌ Supabase credentials not found in .env file"
    echo "Please set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY"
    exit 1
fi

echo "📝 Applying migrations..."

# Run migrations using Supabase CLI or direct SQL
# Note: This requires Supabase CLI to be installed
if command -v supabase &> /dev/null; then
    echo "✅ Supabase CLI found"
    supabase db push
else
    echo "⚠️  Supabase CLI not found. You need to apply migrations manually."
    echo ""
    echo "To apply migrations manually:"
    echo "1. Go to your Supabase dashboard"
    echo "2. Navigate to SQL Editor"
    echo "3. Run each migration file in order:"
    echo ""
    ls -1 supabase/migrations/*.sql | sort
    echo ""
    echo "Or install Supabase CLI:"
    echo "brew install supabase/tap/supabase"
fi
