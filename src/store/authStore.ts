import { create } from 'zustand';
import { supabase } from '../lib/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';

interface Profile {
  id: string;
  username?: string;
  avatar_url?: string;
  email?: string;
}

interface AuthState {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  
  // Auth methods
  signInWithEmail: (email: string, password: string) => Promise<boolean>;
  signUpWithEmail: (email: string, password: string) => Promise<boolean>;
  signInWithGoogle: () => Promise<boolean>;
  signInWithApple: () => Promise<boolean>;
  signOut: () => Promise<void>;
  
  // Profile methods
  updateUserProfile: (updates: Partial<Profile>) => Promise<void>;
  getProfile: () => Promise<void>;
  
  // Session management
  checkSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  session: null,
  loading: false,
  error: null,
  
  signInWithEmail: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      
      set({ 
        user: data?.user || null, 
        session: data?.session || null, 
        loading: false 
      });
      
      await get().getProfile();
      
      return get().profile?.username ? false : true; // Return if new user (no username)
    } catch (error: any) {
      set({ error: error.message, loading: false });
      return false;
    }
  },
  
  signUpWithEmail: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password
      });
      
      if (error) throw error;
      
      set({ 
        user: data?.user || null, 
        session: data?.session || null, 
        loading: false 
      });
      
      await get().getProfile();
      
      return true; // New user
    } catch (error: any) {
      set({ error: error.message, loading: false });
      return false;
    }
  },
  
  signInWithGoogle: async () => {
    set({ loading: true, error: null });
    try {
      const redirectUrl = Linking.createURL('/auth/callback');
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
        }
      });
      
      if (error) throw error;
      
      set({ loading: false });
      return false;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      return false;
    }
  },
  
  signInWithApple: async () => {
    set({ loading: true, error: null });
    try {
      const redirectUrl = Linking.createURL('/auth/callback');
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: redirectUrl,
        }
      });
      
      if (error) throw error;
      
      set({ loading: false });
      return false;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      return false;
    }
  },
  
  signOut: async () => {
    set({ loading: true });
    try {
      await supabase.auth.signOut();
      set({ user: null, profile: null, session: null, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
  
  updateUserProfile: async (updates) => {
    if (!get().user) return;
    
    set({ loading: true, error: null });
    
    try {
      const { error } = await supabase
        .from('users')
        .upsert({
          id: get().user!.id,
          ...updates,
          updated_at: new Date()
        })
        .select()
        .single();
      
      if (error) throw error;
      
      set(state => ({
        profile: {
          ...state.profile,
          ...updates
        } as Profile,
        loading: false
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
  
  getProfile: async () => {
    if (!get().user) return;
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', get().user!.id)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      set({ profile: data || null });
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  },
  
  checkSession: async () => {
    try {
      const { data } = await supabase.auth.getSession();
      
      if (data.session) {
        set({ 
          user: data.session.user, 
          session: data.session
        });
        
        await get().getProfile();
      }
    } catch (error) {
      console.error('Session check error:', error);
    }
  }
}));

// Initialize authentication state
supabase.auth.onAuthStateChange((event, session) => {
  const authStore = useAuthStore.getState();
  
  if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
    authStore.checkSession();
  } else if (event === 'SIGNED_OUT') {
    useAuthStore.setState({ user: null, profile: null, session: null });
  }
});