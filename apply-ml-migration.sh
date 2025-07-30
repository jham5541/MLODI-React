#!/bin/bash

echo "🚀 Applying ML features migration to Supabase..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Please create one with your Supabase credentials."
    exit 1
fi

# Load environment variables
export $(cat .env | grep -v '^#' | xargs)

# Check if Supabase URL and key are set
if [ -z "$EXPO_PUBLIC_SUPABASE_URL" ] || [ -z "$EXPO_PUBLIC_SUPABASE_ANON_KEY" ]; then
    echo "❌ Supabase credentials not found in .env file"
    exit 1
fi

# Apply the migration using Supabase CLI
supabase db push --include-all

if [ $? -eq 0 ]; then
    echo "✅ Migration applied successfully!"
else
    echo "❌ Migration failed. Please check the errors above."
fi

# Provide manual fallback instructions
echo ""
echo "If the migration failed, you can run the SQL script manually in your Supabase dashboard's SQL Editor."
echo "The script is located at: supabase/migrations/20240131000000_add_ml_features.sql"
