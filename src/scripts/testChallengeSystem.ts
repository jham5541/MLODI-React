import { supabase } from '../lib/supabase';

async function createTestChallenge() {
  try {
    // Create a test listening challenge
    const { data: challenge, error } = await supabase
      .from('challenges')
      .insert({
        title: 'Artist Fan Challenge',
        description: 'Listen to 5 songs by this artist',
        icon: 'musical-notes',
        category: 'listening',
        difficulty: 'easy',
        challenge_type: 'daily',
        target_value: 5,
        points_reward: 50,
        badge_reward: 'Dedicated Listener',
        unlock_level: 1,
        requirements: JSON.stringify(['Listen to any 5 songs by the artist', 'Songs must be played at least 80% through']),
        tips: JSON.stringify(['Check out their latest album', 'Explore their popular tracks']),
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        is_active: true
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating challenge:', error);
      return;
    }

    console.log('Challenge created:', challenge);
    return challenge;
  } catch (error) {
    console.error('Error:', error);
  }
}

async function testChallengeProgress(userId: string, challengeId: string) {
  try {
    // Check if challenge progress exists
    const { data: progress, error } = await supabase
      .from('challenge_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('challenge_id', challengeId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking progress:', error);
      return;
    }

    console.log('Current progress:', progress);

    // Simulate song plays
    for (let i = 1; i <= 5; i++) {
      console.log(`Simulating song play ${i}...`);
      
      // Update progress
      const { data: updated, error: updateError } = await supabase
        .from('challenge_progress')
        .upsert({
          user_id: userId,
          challenge_id: challengeId,
          current_value: i,
          target_value: 5,
          status: i >= 5 ? 'completed' : 'active',
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (updateError) {
        console.error('Error updating progress:', updateError);
        return;
      }

      console.log(`Progress updated: ${updated.current_value}/${updated.target_value}`);
      
      // If completed, check wallet
      if (updated.status === 'completed') {
        const { data: wallet } = await supabase
          .from('user_wallets')
          .select('*')
          .eq('user_id', userId)
          .single();

        console.log('User wallet:', wallet);
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

export { createTestChallenge, testChallengeProgress };
