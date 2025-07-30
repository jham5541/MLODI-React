#!/bin/bash

echo "🔧 Starting comprehensive codebase fix and optimization..."

# Create backup
echo "📦 Creating backup..."
cp -r src src.backup

# Install missing dependencies
echo "📦 Installing missing dependencies..."
npm install @tanstack/react-query @tanstack/react-query-persist-client @tanstack/query-async-storage-persister expo-notifications expo-blur

# Create environment file if not exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "⚠️  Please update .env with your Supabase credentials"
fi

echo "✅ Initial setup complete. Run 'npm run fix-types' to fix TypeScript errors"
