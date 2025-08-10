import { create } from 'zustand';
import { supabase } from '../lib/supabase/client';
import { Session, User } from '@supabase/supabase-js';

interface Profile {
  id: string;
  username?: string;
  display_name?: string;
  email?: string;
  avatar_url?: string;
  onboarding_completed: boolean;
  onboarding_step: string;
  created_at?: string;
  updated_at?: string;
}

interface UserSettings {
  notification_preferences: Record<string, any>;
  audio_quality: string;
  download_quality: string;
  crossfade_enabled: boolean;
  crossfade_duration: number;
  gapless_playback: boolean;
  volume_normalization: boolean;
}

type OnboardingStep = 'welcome' | 'profile' | 'preferences' | 'completed';

interface AuthState {
  // State
  user: User | null;
  profile: Profile | null;
  settings: UserSettings | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  
  // Auth methods
  signUpWithEmail: (email: string, password: string) => Promise<boolean>;
  signInWithEmail: (email: string, password: string) => Promise<boolean>;
  signInWithApple: (credential?: any) => Promise<boolean>;
  signOut: () => Promise<void>;
  
  // Profile methods
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  updateSettings: (updates: Partial<UserSettings>) => Promise<void>;
  completeOnboardingStep: (step: OnboardingStep) => Promise<void>;
  
  // Session methods
  checkSession: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  settings: null,
  session: null,
  loading: false,
  error: null,

  signUpWithEmail: async (email: string, password: string) => {
    set({ loading: true, error: null });
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;

      set({
        user: authData?.user || null,
        session: authData?.session || null,
        loading: false,
      });

      // Fetch initial profile and settings
      if (authData?.user) {
        await get().checkSession();
      }

      return true;
    } catch (error: any) {
      console.error('Signup error:', error);
      set({ error: error.message, loading: false });
      return false;
    }
  },

  signInWithEmail: async (email: string, password: string) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      set({
        user: data?.user || null,
        session: data?.session || null,
        loading: false,
      });

      await get().checkSession();
      return true;
    } catch (error: any) {
      console.error('Sign in error:', error);
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

      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken,
        nonce: credential.nonce,
      });

      if (error) throw error;

      set({
        user: data?.user || null,
        session: data?.session || null,
        loading: false,
      });

      await get().checkSession();
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
      set({
        user: null,
        profile: null,
        settings: null,
        session: null,
        loading: false,
      });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  updateProfile: async (updates: Partial<Profile>) => {
    if (!get().user) return;
    
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', get().user!.id)
        .select()
        .single();

      if (error) throw error;

      set(state => ({
        profile: { ...state.profile, ...data } as Profile,
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateSettings: async (updates: Partial<UserSettings>) => {
    if (!get().user) return;
    
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', get().user!.id)
        .select()
        .single();

      if (error) throw error;

      set(state => ({
        settings: { ...state.settings, ...data } as UserSettings,
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  completeOnboardingStep: async (step: OnboardingStep) => {
    if (!get().user) return;

    try {
      let updates: Partial<Profile> = {
        onboarding_step: step,
      };

      if (step === 'completed') {
        updates.onboarding_completed = true;
      }

      await get().updateProfile(updates);
    } catch (error: any) {
      console.error('Error completing onboarding step:', error);
      throw error;
    }
  },

  checkSession: async () => {
    try {
      // Get session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        // Get profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        // Get settings
        const { data: settings } = await supabase
          .from('user_settings')
          .select('*')
          .eq('user_id', session.user.id)
          .single();

        set({
          user: session.user,
          session,
          profile: profile || null,
          settings: settings || null,
        });
      }
    } catch (error) {
      console.error('Session check error:', error);
    }
  },

  refreshSession: async () => {
    try {
      const { data: { session }, error } = await supabase.auth.refreshSession();
      if (error) throw error;
      
      if (session) {
        set({
          user: session.user,
          session,
        });
        await get().checkSession();
      }
    } catch (error) {
      console.error('Session refresh error:', error);
    }
  },
}));

// Listen for auth changes
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
    useAuthStore.getState().checkSession();
  } else if (event === 'SIGNED_OUT') {
    useAuthStore.setState({
      user: null,
      profile: null,
      settings: null,
      session: null,
    });
  }
});
