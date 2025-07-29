import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// These should be set in your environment variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

let supabase: any;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase environment variables. Like functionality will use local storage fallback.');
  console.warn('EXPO_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
  console.warn('EXPO_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Set' : 'Missing');
  
  // Create a mock client that will always fail gracefully
  supabase = {
    auth: {
      getUser: () => Promise.resolve({ data: { user: null }, error: new Error('Supabase not configured') })
    },
    from: () => ({
      select: () => ({ error: new Error('Supabase not configured') }),
      insert: () => ({ error: new Error('Supabase not configured') }),
      delete: () => ({ error: new Error('Supabase not configured') }),
      update: () => ({ error: new Error('Supabase not configured') })
    })
  };
} else {
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false, // Disable for React Native
    },
  });
}

export { supabase };
