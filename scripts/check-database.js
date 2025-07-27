const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Make sure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkDatabase() {
  console.log('🔍 Checking database connection and tables...\n');

  try {
    // Test basic connection
    console.log('1. Testing database connection...');
    const { data, error } = await supabase.from('user_profiles').select('count', { count: 'exact', head: true });
    
    if (error) {
      console.error('❌ Database connection failed:', error.message);
      
      // Check if it's a table existence issue
      if (error.code === 'PGRST106') {
        console.log('\n💡 The user_profiles table does not exist.');
        console.log('Run the database migrations to create the required tables:');
        console.log('1. Go to your Supabase dashboard');
        console.log('2. Navigate to SQL Editor');
        console.log('3. Run the migration files in the supabase/migrations/ folder');
        return;
      }
      
      // Check if it's a permissions issue
      if (error.code === 'PGRST301') {
        console.log('\n💡 Permission denied. The user_profiles table exists but RLS policies may be blocking access.');
        console.log('Make sure Row Level Security (RLS) policies are properly configured.');
        return;
      }
      
      return;
    }

    console.log('✅ Database connection successful');
    console.log(`📊 user_profiles table exists with ${data?.length || 0} records\n`);

    // Test auth functionality
    console.log('2. Testing authentication...');
    const { data: session } = await supabase.auth.getSession();
    
    if (session?.session) {
      console.log('✅ User is authenticated');
      console.log(`👤 User ID: ${session.session.user.id}`);
      
      // Test profile read
      console.log('\n3. Testing profile read...');
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', session.session.user.id)
        .single();
        
      if (profileError && profileError.code !== 'PGRST116') {
        console.error('❌ Profile read failed:', profileError.message);
      } else {
        console.log('✅ Profile read successful');
        console.log('📄 Profile data:', profile ? 'Profile exists' : 'No profile found (this is normal for new users)');
      }
      
      // Test profile write
      console.log('\n4. Testing profile write...');
      const testData = {
        id: session.session.user.id,
        username: 'test_user',
        updated_at: new Date().toISOString()
      };
      
      const { error: writeError } = await supabase
        .from('user_profiles')
        .upsert(testData)
        .select()
        .single();
        
      if (writeError) {
        console.error('❌ Profile write failed:', writeError.message);
        console.log('\n💡 Common issues:');
        console.log('- RLS policies not allowing INSERT/UPDATE');
        console.log('- Username constraint violations');
        console.log('- Missing required fields');
      } else {
        console.log('✅ Profile write successful');
      }
      
    } else {
      console.log('ℹ️  No authenticated user (this is normal)');
      console.log('The database appears to be working correctly.');
    }

    console.log('\n🎉 Database diagnostic complete!');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

checkDatabase();
