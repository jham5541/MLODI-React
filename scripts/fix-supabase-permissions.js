const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase client with service role key for admin access
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing EXPO_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment variables');
  console.log('Please add SUPABASE_SERVICE_ROLE_KEY to your .env.local file');
  console.log('You can find it in your Supabase dashboard under Settings > API');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixPermissions() {
  console.log('Fixing Supabase permissions...\n');

  const sql = `
    -- Fix permissions for artist_subscriptions table
    ALTER TABLE artist_subscriptions ENABLE ROW LEVEL SECURITY;

    -- Drop existing policies if any
    DROP POLICY IF EXISTS "Users can create artist subscriptions" ON artist_subscriptions;
    DROP POLICY IF EXISTS "Users can view artist subscriptions" ON artist_subscriptions;
    DROP POLICY IF EXISTS "Users can update artist subscriptions" ON artist_subscriptions;

    -- Allow authenticated users to create their own subscriptions
    CREATE POLICY "Users can create artist subscriptions" 
    ON artist_subscriptions FOR INSERT 
    TO authenticated 
    WITH CHECK (auth.uid() = user_id);

    -- Allow users to view their own subscriptions
    CREATE POLICY "Users can view artist subscriptions" 
    ON artist_subscriptions FOR SELECT 
    TO authenticated 
    USING (auth.uid() = user_id);

    -- Allow users to update their own subscriptions
    CREATE POLICY "Users can update artist subscriptions" 
    ON artist_subscriptions FOR UPDATE 
    TO authenticated 
    USING (auth.uid() = user_id);

    -- Fix permissions for transactions table
    ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

    -- Drop existing policies if any
    DROP POLICY IF EXISTS "Users can create transactions" ON transactions;
    DROP POLICY IF EXISTS "Users can view transactions" ON transactions;

    -- Allow authenticated users to create their own transactions
    CREATE POLICY "Users can create transactions" 
    ON transactions FOR INSERT 
    TO authenticated 
    WITH CHECK (auth.uid() = user_id);

    -- Allow users to view their own transactions
    CREATE POLICY "Users can view transactions" 
    ON transactions FOR SELECT 
    TO authenticated 
    USING (auth.uid() = user_id);
  `;

  try {
    // Execute the SQL using Supabase's rpc method
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      console.error('Error executing SQL:', error);
      console.log('\nAlternative: Please run the following SQL in your Supabase SQL Editor:');
      console.log('=' * 60);
      console.log(sql);
      console.log('=' * 60);
    } else {
      console.log('✅ Permissions fixed successfully!');
      console.log('- artist_subscriptions table: RLS enabled with proper policies');
      console.log('- transactions table: RLS enabled with proper policies');
    }
  } catch (err) {
    console.error('Error:', err);
    console.log('\nPlease run the following SQL in your Supabase SQL Editor:');
    console.log('='.repeat(60));
    console.log(sql);
    console.log('='.repeat(60));
  }
}

fixPermissions();
