#!/bin/bash

# Deploy Edge Functions Script for M3lodi
# This script deploys all essential edge functions to Supabase

echo "🚀 Deploying M3lodi Edge Functions..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it first:"
    echo "npm install -g supabase"
    exit 1
fi

# Check if we're in a Supabase project
if [ ! -f "supabase/config.toml" ]; then
    echo "❌ Not in a Supabase project directory"
    echo "Make sure you're in the project root with supabase/config.toml"
    exit 1
fi

echo "📋 Found the following functions to deploy:"
ls -la supabase/functions/

# Deploy functions one by one with error handling
functions=(
    "audio-analyzer"
    "music-recommendations" 
    "trending-calculator"
    "fan-tier-processor"
    "notification-dispatcher"
)

deployed=0
failed=0

for func in "${functions[@]}"; do
    echo ""
    echo "📦 Deploying $func..."
    
    if [ -d "supabase/functions/$func" ]; then
        if supabase functions deploy $func --no-verify-jwt; then
            echo "✅ $func deployed successfully"
            ((deployed++))
        else
            echo "❌ Failed to deploy $func"
            ((failed++))
        fi
    else
        echo "⚠️  Function directory $func not found, skipping..."
    fi
done

echo ""
echo "🎯 Deployment Summary:"
echo "✅ Successfully deployed: $deployed"
echo "❌ Failed deployments: $failed"

if [ $failed -eq 0 ]; then
    echo ""
    echo "🎉 All functions deployed successfully!"
    echo ""
    echo "📖 Function URLs:"
    echo "🎵 Audio Analyzer: $(supabase status | grep 'API URL' | awk '{print $3}')/functions/v1/audio-analyzer"
    echo "🤖 Music Recommendations: $(supabase status | grep 'API URL' | awk '{print $3}')/functions/v1/music-recommendations"
    echo "📈 Trending Calculator: $(supabase status | grep 'API URL' | awk '{print $3}')/functions/v1/trending-calculator"
    echo "🏆 Fan Tier Processor: $(supabase status | grep 'API URL' | awk '{print $3}')/functions/v1/fan-tier-processor"
    echo "📧 Notification Dispatcher: $(supabase status | grep 'API URL' | awk '{print $3}')/functions/v1/notification-dispatcher"
    echo ""
    echo "🔑 Next steps:"
    echo "1. Set up environment variables for external services (Expo, SendGrid, etc.)"
    echo "2. Test functions with the provided test scripts"
    echo "3. Integrate functions into your React Native app"
else
    echo ""
    echo "⚠️  Some functions failed to deploy. Check the errors above."
    echo "Common issues:"
    echo "- Network connectivity"
    echo "- Missing dependencies in function code"
    echo "- Insufficient permissions"
    echo ""
    echo "Try running: supabase functions deploy <function-name> --debug"
fi

echo ""
echo "🔧 Useful commands:"
echo "supabase functions list                    # List deployed functions"
echo "supabase logs --type edge                  # View function logs"  
echo "supabase functions delete <function-name>  # Delete a function"

echo ""