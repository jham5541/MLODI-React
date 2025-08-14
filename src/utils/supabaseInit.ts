import { supabase } from '../lib/supabase/client';

// Test and initialize Supabase connection
export async function testSupabaseConnection(): Promise<boolean> {
  try {
    // Test basic connection
    const { data, error } = await supabase
      .from('artists_public_view')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('❌ Supabase connection test failed:', error.message);
      return false;
    }
    
    console.log('✅ Supabase connection successful');
    return true;
  } catch (error) {
    console.error('❌ Supabase connection error:', error);
    return false;
  }
}

// Initialize required database functions
export async function initializeDatabase() {
  try {
    // Test auth
    const { data: { user } } = await supabase.auth.getUser();
    console.log('🔐 Auth status:', user ? 'Authenticated' : 'Not authenticated');
    
    // Test realtime subscriptions
    const channel = supabase.channel('test-channel');
    await channel.subscribe((status) => {
      console.log('📡 Realtime subscription status:', status);
      if (status === 'SUBSCRIBED') {
        channel.unsubscribe();
      }
    });
    
    return true;
  } catch (error) {
    console.error('❌ Database initialization error:', error);
    return false;
  }
}

// Verify all required tables exist
export async function verifyDatabaseSchema() {
  const requiredTables = [
    'artists',
    'albums', 
    'songs',
    'playlists',
    'users',
    'user_likes',
    'products',
    'carts',
    'orders'
  ];
  
  // These tables are optional or not yet implemented
  const optionalTables = [
    'play_history',
    'fan_scores',
    'engagements',
    'user_follows'  // Changed to user_likes in current schema
  ];
  
  const missingTables: string[] = [];
  const existingTables: string[] = [];
  const missingOptional: string[] = [];
  
  // Check required tables
  for (const table of requiredTables) {
    try {
      const { error } = await supabase
        .from(table)
        .select('id')
        .limit(1);
        
      if (error && (error.code === '42P01' || error.code === '42501')) { // Table doesn't exist or permission denied
        missingTables.push(table);
      } else if (!error) {
        existingTables.push(table);
      }
    } catch (error) {
      console.error(`Error checking table ${table}:`, error);
    }
  }
  
  // Check optional tables (don't report as errors)
  for (const table of optionalTables) {
    try {
      const { error } = await supabase
        .from(table)
        .select('id')
        .limit(1);
        
      if (error) {
        missingOptional.push(table);
      } else {
        existingTables.push(table);
      }
    } catch (error) {
      // Silently ignore optional table errors
    }
  }
  
  console.log('📊 Database Schema Status:');
  console.log(`✅ Existing tables (${existingTables.length}):`, existingTables.join(', '));
  
  if (missingOptional.length > 0) {
    console.log(`ℹ️  Optional tables not yet implemented (${missingOptional.length}):`, missingOptional.join(', '));
  }
  
  if (missingTables.length > 0) {
    console.error(`❌ Missing required tables (${missingTables.length}):`, missingTables.join(', '));
    console.log('\n🔧 To fix this issue:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Navigate to the SQL Editor');
    console.log('3. Run the migration files in order:');
    console.log('   - 20240124000001_create_music_tables.sql');
    console.log('   - 20240125000001_create_marketplace_tables.sql');
    console.log('\nAlternatively, run: ./apply-migrations.sh');
    return false;
  }
  
  console.log('✅ All required tables exist');
  return true;
}

// Create sample data if needed
export async function createSampleData() {
  try {
    // Check if we have any artists
    const { data: artists, error } = await supabase
      .from('artists')
      .select('id')
      .limit(1);
      
    if (error) {
      console.error('Error checking artists:', error);
      return;
    }
    
    if (!artists || artists.length === 0) {
      console.log('📝 Creating sample artists...');
      
      const sampleArtists = [
        {
          name: 'The Melodics',
          bio: 'Innovative electronic music collective',
          genres: ['Electronic', 'Ambient'],
          is_verified: true,
          followers_count: 50000,
          monthly_listeners: 100000,
        },
        {
          name: 'Luna Waves',
          bio: 'Dream pop sensation',
          genres: ['Pop', 'Indie'],
          is_verified: true,
          followers_count: 75000,
          monthly_listeners: 150000,
        },
        {
          name: 'Cyber Beats',
          bio: 'Future bass producer',
          genres: ['EDM', 'Future Bass'],
          is_verified: false,
          followers_count: 25000,
          monthly_listeners: 50000,
        }
      ];
      
      const { error: insertError } = await supabase
        .from('artists')
        .insert(sampleArtists);
        
      if (insertError) {
        console.error('Error creating sample artists:', insertError);
      } else {
        console.log('✅ Sample artists created');
      }
    }
  } catch (error) {
    console.error('Error in createSampleData:', error);
  }
}

// Full initialization routine
export async function initializeApp() {
  console.log('🚀 Initializing M3lodi app...');
  
  // Test connection
  const isConnected = await testSupabaseConnection();
  if (!isConnected) {
    console.error('⚠️  Running in offline mode - Supabase connection failed');
    return false;
  }
  
  // Verify schema
  const schemaValid = await verifyDatabaseSchema();
  if (!schemaValid) {
    console.error('⚠️  Database schema incomplete');
  }
  
  // Initialize database features
  await initializeDatabase();
  
  // Create sample data if needed
  await createSampleData();
  
  console.log('✅ App initialization complete');
  return true;
}
