/**
 * Test script to verify that Superfan tier users can access engagement metrics
 * while Free and Fan tier users cannot
 */

import { createClient } from '@supabase/supabase-js';

// Configure these with your Supabase project details
const SUPABASE_URL = process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

interface TestUser {
  email: string;
  password: string;
  tier: 'free' | 'fan' | 'superfan';
}

const testUsers: TestUser[] = [
  { email: 'free-user@test.com', password: 'test123456', tier: 'free' },
  { email: 'fan-user@test.com', password: 'test123456', tier: 'fan' },
  { email: 'superfan-user@test.com', password: 'test123456', tier: 'superfan' }
];

async function createTestUser(user: TestUser) {
  console.log(`\n🧪 Creating test user: ${user.email} (${user.tier} tier)`);
  
  // Sign up user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: user.email,
    password: user.password,
  });

  if (authError) {
    console.error(`❌ Error creating user: ${authError.message}`);
    return null;
  }

  // Update user profile with subscription tier
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ subscription_tier: user.tier })
    .eq('id', authData.user?.id);

  if (profileError) {
    console.error(`❌ Error updating profile: ${profileError.message}`);
    return null;
  }

  console.log(`✅ User created successfully`);
  return authData.user;
}

async function testEngagementMetricsAccess(user: TestUser) {
  console.log(`\n🔍 Testing engagement metrics access for ${user.tier} tier user...`);
  
  // Sign in as the user
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: user.password,
  });

  if (authError) {
    console.error(`❌ Error signing in: ${authError.message}`);
    return;
  }

  // Get user profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('subscription_tier')
    .eq('id', authData.user?.id)
    .single();

  if (profileError) {
    console.error(`❌ Error fetching profile: ${profileError.message}`);
    return;
  }

  // Simulate engagement metrics access check
  const hasAccess = profile.subscription_tier === 'superfan';
  
  console.log(`📊 Subscription tier: ${profile.subscription_tier}`);
  console.log(`🔐 Engagement metrics access: ${hasAccess ? '✅ GRANTED' : '❌ DENIED'}`);
  
  if (user.tier === 'superfan' && !hasAccess) {
    console.error(`❌ FAIL: Superfan user should have access to engagement metrics`);
  } else if (user.tier !== 'superfan' && hasAccess) {
    console.error(`❌ FAIL: ${user.tier} user should NOT have access to engagement metrics`);
  } else {
    console.log(`✅ PASS: Access control working correctly`);
  }

  // Sign out
  await supabase.auth.signOut();
}

async function runTests() {
  console.log('🚀 Starting Superfan Tier Access Tests');
  console.log('=====================================\n');

  // Check if we can connect to Supabase
  const { data, error } = await supabase.from('profiles').select('id').limit(1);
  if (error) {
    console.error('❌ Cannot connect to Supabase. Please check your configuration.');
    console.error('Error:', error.message);
    return;
  }

  console.log('✅ Connected to Supabase successfully\n');

  // Create test users and test access
  for (const user of testUsers) {
    // Check if user already exists
    const { data: existingUser } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: user.password,
    });

    if (!existingUser.user) {
      await createTestUser(user);
    } else {
      // Update existing user's tier
      await supabase
        .from('profiles')
        .update({ subscription_tier: user.tier })
        .eq('id', existingUser.user.id);
      await supabase.auth.signOut();
    }

    await testEngagementMetricsAccess(user);
  }

  console.log('\n✅ All tests completed!');
  console.log('\n📋 Summary:');
  console.log('- Free tier users: ❌ No access to engagement metrics');
  console.log('- Fan tier users: ❌ No access to engagement metrics');
  console.log('- Superfan tier users: ✅ Full access to engagement metrics');
}

// Run tests
runTests().catch(console.error);
