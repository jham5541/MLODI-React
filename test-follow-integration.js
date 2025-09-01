// Test file to verify artist follow integration
// Run this with: node test-follow-integration.js

import { createClient } from '@supabase/supabase-js';

// Replace with your Supabase credentials
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'your-supabase-url';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testFollowSystem() {
  console.log('🧪 Testing Artist Follow System...\n');
  
  try {
    // 1. Check if user_follows table exists
    console.log('1️⃣ Checking table structure...');
    const { data: columns, error: columnsError } = await supabase
      .rpc('get_table_columns', { table_name: 'user_follows' });
    
    if (columnsError) {
      console.error('❌ Error checking table:', columnsError);
    } else {
      console.log('✅ Table exists with columns:', columns);
    }
    
    // 2. Test authentication
    console.log('\n2️⃣ Testing authentication...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.log('⚠️  No authenticated user. Please sign in first.');
      return;
    }
    console.log('✅ Authenticated as:', user.email);
    
    // 3. Get a test artist
    console.log('\n3️⃣ Finding test artist...');
    const { data: artists, error: artistError } = await supabase
      .from('profiles')
      .select('id, username, display_name, follower_count')
      .not('username', 'is', null)
      .limit(1);
    
    if (artistError || !artists || artists.length === 0) {
      console.error('❌ No artists found:', artistError);
      return;
    }
    
    const testArtist = artists[0];
    console.log('✅ Test artist:', testArtist);
    
    // 4. Check current follow status
    console.log('\n4️⃣ Checking current follow status...');
    const { data: existingFollow } = await supabase
      .from('user_follows')
      .select('*')
      .eq('user_id', user.id)
      .eq('followed_type', 'artist')
      .eq('followed_id', testArtist.id)
      .single();
    
    console.log('Current status:', existingFollow ? 'Following' : 'Not following');
    
    // 5. Test follow/unfollow
    console.log('\n5️⃣ Testing follow/unfollow...');
    
    if (existingFollow) {
      // Unfollow
      console.log('Unfollowing artist...');
      const { error: unfollowError } = await supabase
        .from('user_follows')
        .delete()
        .eq('user_id', user.id)
        .eq('followed_type', 'artist')
        .eq('followed_id', testArtist.id);
      
      if (unfollowError) {
        console.error('❌ Unfollow failed:', unfollowError);
      } else {
        console.log('✅ Successfully unfollowed');
      }
    } else {
      // Follow
      console.log('Following artist...');
      const { data: newFollow, error: followError } = await supabase
        .from('user_follows')
        .insert({
          user_id: user.id,
          followed_type: 'artist',
          followed_id: testArtist.id
        })
        .select()
        .single();
      
      if (followError) {
        console.error('❌ Follow failed:', followError);
      } else {
        console.log('✅ Successfully followed:', newFollow);
      }
    }
    
    // 6. Verify follower count updated
    console.log('\n6️⃣ Verifying follower count...');
    const { data: updatedArtist } = await supabase
      .from('profiles')
      .select('follower_count')
      .eq('id', testArtist.id)
      .single();
    
    console.log('Previous count:', testArtist.follower_count);
    console.log('Updated count:', updatedArtist?.follower_count);
    
    // 7. Test helper functions
    console.log('\n7️⃣ Testing helper functions...');
    
    // Test get_artist_follower_count
    const { data: followerCount } = await supabase
      .rpc('get_artist_follower_count', { artist_uuid: testArtist.id });
    console.log('Follower count from function:', followerCount);
    
    // Test is_following_artist
    const { data: isFollowing } = await supabase
      .rpc('is_following_artist', { 
        user_uuid: user.id, 
        artist_uuid: testArtist.id 
      });
    console.log('Is following from function:', isFollowing);
    
    console.log('\n✨ All tests completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testFollowSystem();
