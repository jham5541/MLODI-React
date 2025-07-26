import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase environment variables are not set');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Expo Go compatible auth settings
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});