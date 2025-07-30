#!/bin/bash

echo "🔧 Fixing users table constraint issue..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Please create one with your Supabase credentials."
    exit 1
fi

# Load environment variables
export $(cat .env | grep -v '^#' | xargs)

# Extract project reference from Supabase URL
SUPABASE_PROJECT_REF=$(echo $EXPO_PUBLIC_SUPABASE_URL | sed -n 's/https:\/\/\([^.]*\)\.supabase\.co/\1/p')

echo "📝 Project reference: $SUPABASE_PROJECT_REF"
echo "🚀 Applying constraint fix migration..."

# Apply the migration using Supabase CLI
supabase db push --include-all

echo "✅ Migration applied successfully!"
echo ""
echo "You can now try signing up again. The constraint error should be resolved."
