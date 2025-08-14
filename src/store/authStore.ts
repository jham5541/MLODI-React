import { create } from 'zustand';
import { supabase } from '../lib/supabase/client';
import { Session, User, AuthError } from '@supabase/supabase-js';
import { userService, UserProfile } from '../services/userService';

type OnboardingStep = 'welcome' | 'profile' | 'preferences' | 'completed';

interface UserSettings {
  notification_preferences: Record<string, any>;
  audio_quality: string;
  download_quality: string;
  crossfade_enabled: boolean;
  crossfade_duration: number;
  gapless_playback: boolean;
  volume_normalization: boolean;
}

interface AuthState {
  // State
  user: User | null;
  profile: UserProfile | null;
  settings: UserSettings | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  
  // Auth methods
  signUp: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signInWithApple: () => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  
  // Profile methods
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  updateSettings: (updates: Partial<UserSettings>) => Promise<void>;
  completeOnboardingStep: (step: OnboardingStep) => Promise<void>;
  // Backward-compatibility helper for components expecting this API
  completeProfileSetup: () => Promise<void>;
  
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

  signUp: async (email: string, password: string) => {
    set({ loading: true, error: null });
    try {
      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password
      });

      if (authError) throw authError;

      // 2. Profile and settings will be created by the database trigger
      set({
        user: authData?.user || null,
        session: authData?.session || null,
        loading: false,
      });

      // 3. Fetch initial profile and settings
      if (authData?.user) {
        await get().checkSession();

        // 4. Ensure a free-tier subscription exists for new users
        try {
          const userId = authData.user.id;

          // Check for existing active subscription
          const { data: existingSub, error: subError } = await supabase
            .from('user_subscriptions')
            .select('id')
            .eq('user_id', userId)
            .eq('status', 'active')
            .maybeSingle();

          if (!subError && !existingSub) {
            const FREE_PLAN_ID = '00000000-0000-0000-0000-000000000001';
            const startDate = new Date();
            const endDate = new Date(startDate.getTime() + 365 * 24 * 60 * 60 * 1000);

            // Create free subscription
            await supabase
              .from('user_subscriptions')
              .insert({
                user_id: userId,
                plan_id: FREE_PLAN_ID,
                tier: 'free',
                status: 'active',
                start_date: startDate.toISOString(),
                end_date: endDate.toISOString(),
                auto_renew: false,
                payment_method: 'card',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              });

            // Mark user's subscription tier as free
            await userService.updateUserMetadata(userId, {
              subscription_tier: 'free',
              updated_at: new Date().toISOString()
            });
          }
        } catch (e) {
          console.warn('Failed to ensure free subscription on sign up:', e);
        }
      }

      return { success: true };
    } catch (error: any) {
      console.error('Signup error:', error);
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  signIn: async (email: string, password: string) => {
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
      
      return { success: true };
    } catch (error: any) {
      console.error('Sign in error:', error);
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  signInWithApple: async () => {
    set({ loading: true, error: null });
    try {
      // Implement Apple Sign In
      return { success: false, error: 'Not implemented' };
    } catch (error: any) {
      console.error('Apple Sign In error:', error);
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
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

  updateProfile: async (updates: Partial<UserProfile>) => {
    const userId = get().user?.id;
    if (!userId) return;
    
    set({ loading: true, error: null });
    try {
      await userService.updateUserMetadata(userId, updates);
      
      // Refresh the profile
      await get().checkSession();
      
      set({ loading: false });
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
      let updates: Partial<UserProfile> = {
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

  // Backward compatibility for components calling completeProfileSetup()
  completeProfileSetup: async () => {
    const userId = get().user?.id;
    if (!userId) return;
    try {
      await userService.updateUserMetadata(userId, {
        onboarding_completed: true,
        onboarding_step: 'completed',
      } as Partial<UserProfile>);
      await get().checkSession();
    } catch (error) {
      console.error('Error completing profile setup:', error);
    }
  },

  checkSession: async () => {
    try {
      // Get session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        // Get profile using the new user service
        const profile = await userService.getUserProfile(session.user.id);

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
