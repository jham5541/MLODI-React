#!/bin/bash

echo "🚀 Deploying Superfan Tier Changes"
echo "================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

echo "📦 Step 1: Building the application..."
npm run build || { echo "❌ Build failed"; exit 1; }

echo ""
echo "🗄️  Step 2: Applying database migration..."
echo "Note: If using Supabase CLI, run:"
echo "  npx supabase db push"
echo ""
echo "Or apply this migration manually in your Supabase dashboard:"
echo "----------------------------------------"
cat supabase/migrations/20250815000000_rename_enterprise_to_superfan.sql
echo "----------------------------------------"

echo ""
echo "📱 Step 3: Deploy to your hosting platform"
echo "For Expo/React Native apps:"
echo "  - Development: expo start"
echo "  - Production: eas build --platform all && eas submit"

echo ""
echo "✅ Deployment script complete!"
echo ""
echo "🧪 Next: Run the test script to verify the changes"
echo "  ./scripts/test-superfan-access.sh"
