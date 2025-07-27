const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testUserCreation() {
  console.log('🧪 Testing user creation and profile setup...\n');

  // Generate a unique test email
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';

  try {
    console.log('1. Testing user signup...');
    console.log(`📧 Creating user: ${testEmail}`);
    
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword
    });

    if (signUpError) {
      console.error('❌ Signup failed:', signUpError.message);
      console.error('Error details:', JSON.stringify(signUpError, null, 2));
      return;
    }

    console.log('✅ User signup successful');
    console.log(`👤 User ID: ${signUpData.user?.id}`);
    console.log(`📧 Email confirmed: ${signUpData.user?.email_confirmed_at ? 'Yes' : 'No'}`);

    if (!signUpData.user?.id) {
      console.error('❌ No user ID returned from signup');
      return;
    }

    // Wait a moment for the trigger to execute
    console.log('\n2. Waiting for auto-profile creation trigger...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check if profile was auto-created by trigger
    console.log('\n3. Checking auto-created profile...');
    const { data: autoProfile, error: autoProfileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', signUpData.user.id)
      .single();

    if (autoProfileError && autoProfileError.code !== 'PGRST116') {
      console.error('❌ Error checking auto-created profile:', autoProfileError.message);
    } else if (autoProfile) {
      console.log('✅ Profile was auto-created by trigger');
      console.log('📄 Auto-profile data:', JSON.stringify(autoProfile, null, 2));
    } else {
      console.log('ℹ️  No auto-profile created (this might be expected)');
    }

    // Test manual profile creation/update
    console.log('\n4. Testing manual profile creation...');
    const profileData = {
      id: signUpData.user.id,
      username: `testuser_${Date.now()}`,
      display_name: 'Test User',
      bio: 'This is a test user profile',
      updated_at: new Date().toISOString()
    };

    const { data: manualProfile, error: manualProfileError } = await supabase
      .from('user_profiles')
      .upsert(profileData)
      .select()
      .single();

    if (manualProfileError) {
      console.error('❌ Manual profile creation failed:', manualProfileError.message);
      console.error('Error details:', JSON.stringify(manualProfileError, null, 2));
      
      // Check specific error types
      if (manualProfileError.code === '23505') {
        console.log('💡 This is a unique constraint violation (username might already exist)');
      } else if (manualProfileError.code === '42501') {
        console.log('💡 This is a permission error (RLS policy blocking)');
      } else if (manualProfileError.code === '23502') {
        console.log('💡 This is a NOT NULL constraint violation (missing required field)');
      }
    } else {
      console.log('✅ Manual profile creation successful');
      console.log('📄 Profile data:', JSON.stringify(manualProfile, null, 2));
    }

    // Clean up - delete the test user profile
    console.log('\n5. Cleaning up test data...');
    await supabase.from('user_profiles').delete().eq('id', signUpData.user.id);
    console.log('✅ Test profile cleaned up');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    console.error('Full error:', error);
  }

  console.log('\n🎉 User creation test complete!');
}

testUserCreation();
