#!/usr/bin/env node

/**
 * Database Analysis Script for M3lodi Supabase Instance
 * This script connects to your Supabase database and analyzes all tables
 */

const { createClient } = require('@supabase/supabase-js');

// Your Supabase configuration
const SUPABASE_URL = 'https://riesezhwmiklpcnrbjkb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpZXNlemh3bWlrbHBjbnJiamtiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5MzgyNTMsImV4cCI6MjA1MDUxNDI1M30.tSRxLR-uG1tfr3k3DhmAUHThZ8Eh98NgOiaUT6leDxY';

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function analyzeDatabase() {
  console.log('🔍 Analyzing Supabase Database Tables...\n');
  console.log('Project ID: riesezhwmiklpcnrbjkb');
  console.log('URL:', SUPABASE_URL);
  console.log('=' * 80);

  try {
    // Query 1: Get all tables with their schemas
    console.log('\n📊 ALL TABLES BY SCHEMA:\n');
    
    const { data: allTables, error: tablesError } = await supabase.rpc('get_all_tables');
    
    if (tablesError) {
      // If the function doesn't exist, we'll use a direct query
      console.log('Using direct SQL query method...\n');
      
      // Get all tables using information_schema
      const { data: tables, error } = await supabase
        .from('information_schema.tables')
        .select('table_schema, table_name, table_type')
        .eq('table_catalog', 'postgres')
        .order('table_schema', { ascending: true })
        .order('table_name', { ascending: true });

      if (error) {
        console.error('❌ Error fetching tables:', error.message);
        
        // Fallback: Try to query some known tables
        console.log('\n🔄 Trying fallback method...\n');
        await fallbackAnalysis();
        return;
      }

      // Group tables by schema
      const tablesBySchema = {};
      tables.forEach(table => {
        if (!tablesBySchema[table.table_schema]) {
          tablesBySchema[table.table_schema] = [];
        }
        tablesBySchema[table.table_schema].push({
          name: table.table_name,
          type: table.table_type
        });
      });

      // Display results
      let totalTables = 0;
      Object.keys(tablesBySchema).forEach(schema => {
        const schemaTables = tablesBySchema[schema];
        console.log(`\n📂 ${schema.toUpperCase()} SCHEMA (${schemaTables.length} tables):`);
        console.log('-'.repeat(50));
        
        schemaTables.forEach((table, index) => {
          const icon = getTableIcon(schema, table.name);
          console.log(`${icon} ${table.name} (${table.type})`);
        });
        
        totalTables += schemaTables.length;
      });

      console.log('\n' + '='.repeat(80));
      console.log(`📋 TOTAL TABLES: ${totalTables}`);
      
      // Show schema breakdown
      console.log('\n📊 SCHEMA BREAKDOWN:');
      Object.keys(tablesBySchema).forEach(schema => {
        console.log(`   ${schema}: ${tablesBySchema[schema].length} tables`);
      });

    } else {
      console.log('Tables found:', allTables);
    }

  } catch (error) {
    console.error('❌ Error analyzing database:', error.message);
    console.log('\n🔄 Trying alternative approach...\n');
    await fallbackAnalysis();
  }
}

async function fallbackAnalysis() {
  console.log('🔍 FALLBACK ANALYSIS - Testing Known Tables:\n');
  
  // List of tables we expect to exist based on our migrations
  const expectedTables = [
    'artists', 'albums', 'songs', 'playlists', 'playlist_songs', 'playlist_collaborators',
    'user_profiles', 'user_follows', 'user_likes', 'play_history',
    'fan_tiers', 'achievements', 'user_achievements', 'challenges', 'user_challenge_progress',
    'milestones', 'user_milestone_progress', 'user_analytics', 'artist_analytics',
    'nft_collections', 'nft_listings', 'nft_transactions', 'marketplace_stats',
    'listening_sessions', 'fan_activity_log', 'artist_activity', 'user_notifications',
    'radio_stations', 'radio_listeners', 'live_chat_messages'
  ];

  console.log('📋 CHECKING CUSTOM APPLICATION TABLES:\n');
  
  let existingTables = 0;
  let missingTables = 0;

  for (const tableName of expectedTables) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);

      if (error) {
        console.log(`❌ ${tableName} - NOT FOUND (${error.message})`);
        missingTables++;
      } else {
        console.log(`✅ ${tableName} - EXISTS`);
        existingTables++;
      }
    } catch (err) {
      console.log(`❌ ${tableName} - ERROR (${err.message})`);
      missingTables++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`📊 CUSTOM TABLES SUMMARY:`);
  console.log(`   ✅ Existing: ${existingTables}`);
  console.log(`   ❌ Missing: ${missingTables}`);
  console.log(`   📋 Total Expected: ${expectedTables.length}`);

  if (missingTables > 0) {
    console.log('\n⚠️  Some tables are missing. You may need to run migrations:');
    console.log('   supabase db push');
  }
}

function getTableIcon(schema, tableName) {
  // Custom table icons based on schema and table name
  if (schema === 'public') {
    if (tableName.includes('artist')) return '🎤';
    if (tableName.includes('song') || tableName.includes('album')) return '🎵';
    if (tableName.includes('playlist')) return '📝';
    if (tableName.includes('user')) return '👤';
    if (tableName.includes('nft') || tableName.includes('marketplace')) return '💎';
    if (tableName.includes('fan') || tableName.includes('achievement')) return '🏆';
    if (tableName.includes('radio') || tableName.includes('chat')) return '📻';
    return '📊';
  }
  if (schema === 'auth') return '🔐';
  if (schema === 'storage') return '💾';
  if (schema === 'realtime') return '⚡';
  return '🔧';
}

// Run the analysis
if (require.main === module) {
  analyzeDatabase()
    .then(() => {
      console.log('\n✨ Analysis complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Analysis failed:', error);
      process.exit(1);
    });
}

module.exports = { analyzeDatabase };