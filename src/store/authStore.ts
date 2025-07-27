import { create } from 'zustand';
import { supabase } from '../lib/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import { googleAuthService } from '../services/googleAuth';

interface Profile {
  id: string;
  username?: string;
  display_name?: string;
  bio?: string;
  avatar_url?: string;
  cover_url?: string;
  location?: string;
  website_url?: string;
  social_links?: Record<string, any>;
  preferences?: Record<string, any>;
  subscription_tier?: string;
  subscription_expires_at?: string;
  total_listening_time_ms?: number;
  created_at?: string;
  updated_at?: string;
}

interface AuthState {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  hasCompletedOnboarding: boolean;
  needsProfileCompletion: boolean;
  
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
  
  // Onboarding management
  completeOnboarding: () => void;
  completeProfileSetup: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  session: null,
  loading: false,
  error: null,
  hasCompletedOnboarding: false,
  needsProfileCompletion: false,
  
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
      console.log('🔐 Starting signup for:', email);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password
      });
      
      if (error) {
        console.error('❌ Supabase auth signup error:', error);
        throw error;
      }
      
      console.log('✅ Supabase auth signup success:', { 
        userId: data?.user?.id, 
        hasSession: !!data?.session,
        emailConfirmed: data?.user?.email_confirmed_at
      });
      
      set({ 
        user: data?.user || null, 
        session: data?.session || null, 
        loading: false 
      });
      
      // Only try to create profile if we have a confirmed user
      if (data?.user?.id) {
        console.log('🔍 Checking for existing profile...');
        await get().getProfile();
        
        // If no profile exists, create a basic one
        if (!get().profile) {
          console.log('📝 Creating new user profile...');
          try {
            // Wait a moment for auth to fully process
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            await get().updateUserProfile({
              id: data.user.id,
              subscription_tier: 'free',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
            console.log('✅ User profile created successfully');
          } catch (profileError: any) {
            console.error('❌ Failed to create user profile:', profileError);
            console.error('Profile error details:', {
              message: profileError.message,
              code: profileError.code,
              details: profileError.details,
              hint: profileError.hint
            });
            // Don't fail signup if profile creation fails
          }
        } else {
          console.log('✅ Profile already exists');
        }
      }
      
      return true; // New user
    } catch (error: any) {
      console.error('❌ Signup failed:', error);
      set({ error: error.message, loading: false });
      return false;
    }
  },
  
  signInWithGoogle: async () => {
    set({ loading: true, error: null });
    try {
      console.log('🔐 Starting Google Sign-In...');
      
      const result = await googleAuthService.signIn();
      
      if (result.success && result.user) {
        set({ 
          user: result.user, 
          session: result.session,
          loading: false 
        });
        
        // Check if profile exists, create if not
        await get().getProfile();
        
        if (!get().profile && result.user.id) {
          console.log('📝 Creating Google user profile...');
          try {
            await get().updateUserProfile({
              id: result.user.id,
              display_name: result.user.user_metadata?.full_name || result.user.email?.split('@')[0],
              avatar_url: result.user.user_metadata?.avatar_url,
              subscription_tier: 'free',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
            console.log('✅ Google user profile created successfully');
          } catch (profileError) {
            console.error('❌ Failed to create Google user profile:', profileError);
          }
        }
        
        return true;
      }
      
      return false;
    } catch (error: any) {
      console.error('❌ Google Sign-In failed:', error);
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
    if (!get().user) {
      console.error('❌ No user found for profile update');
      return;
    }
    
    console.log('📝 Updating user profile:', { userId: get().user!.id, updates });
    set({ loading: true, error: null });
    
    try {
      const profileData = {
        id: get().user!.id,
        ...updates,
        updated_at: new Date().toISOString()
      };
      
      console.log('📤 Sending to database:', profileData);
      
      const { data, error } = await supabase
        .from('users')
        .upsert(profileData)
        .select()
        .single();
      
      if (error) {
        console.error('❌ Database error:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }
      
      console.log('✅ Profile updated successfully:', data);
      
      set(state => ({
        profile: {
          ...state.profile,
          ...updates,
          id: get().user!.id
        } as Profile,
        loading: false
      }));
    } catch (error: any) {
      console.error('❌ updateUserProfile failed:', error);
      set({ error: error.message, loading: false });
      throw error; // Re-throw so UI can handle it
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
        console.error('Error fetching profile:', error);
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
  },
  
  completeOnboarding: () => {
    set({ hasCompletedOnboarding: true });
  },
  
  completeProfileSetup: () => {
    set({ needsProfileCompletion: false });
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