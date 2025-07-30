import { create } from 'zustand';
import { supabase } from '../lib/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';

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
            
            // Only include fields that exist in the users table
            const profileData: any = {
              id: data.user.id,
              subscription_tier: 'free',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
            
            // Add optional fields with safe defaults
            const optionalFields = {
              username: null,
              display_name: null,
              bio: null,
              avatar_url: null,
              location: null,
              website_url: null,
              social_links: {},
              preferences: {},
              total_listening_time_ms: 0
            };
            
            // Only add fields that might exist
            Object.assign(profileData, optionalFields);
            
            await get().updateUserProfile(profileData);
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
  
  
  signInWithApple: async (credential?: any) => {
    set({ loading: true, error: null });
    try {
      if (!credential) {
        throw new Error('No Apple credential provided');
      }

      // Sign in with Apple ID token
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken,
        nonce: credential.nonce || 'nonce', // You might need to generate a proper nonce
      });
      
      if (error) throw error;
      
      set({ 
        user: data?.user || null, 
        session: data?.session || null, 
        loading: false 
      });

      // Get or create profile
      await get().getProfile();
      
      // If no profile exists, create one with Apple data
      if (!get().profile && data?.user) {
        const fullName = credential.fullName;
        const displayName = fullName ? 
          `${fullName.givenName || ''} ${fullName.familyName || ''}`.trim() : 
          credential.email?.split('@')[0] || 'User';

        await get().updateUserProfile({
          id: data.user.id,
          display_name: displayName,
          email: credential.email || data.user.email,
          subscription_tier: 'free',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
      
      return true;
    } catch (error: any) {
      console.error('Apple Sign In error:', error);
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