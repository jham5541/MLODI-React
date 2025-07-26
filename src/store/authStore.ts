import { create } from 'zustand';
import { supabase } from '../lib/supabase/client';
import { Alert } from 'react-native';

interface User {
  id: string;
  email?: string;
  displayName?: string;
  address?: string;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  
  // Auth methods
  signInWithEmail: (email: string, password: string) => Promise<boolean>;
  signUpWithEmail: (email: string, password: string) => Promise<boolean>;
  signInWithGoogle: () => Promise<boolean>;
  signOut: () => Promise<void>;
  updateProfile: (data: any) => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: false,
  error: null,
  
  signInWithEmail: async (email: string, password: string) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      if (data.user) {
        set({ 
          user: {
            id: data.user.id,
            email: data.user.email,
            displayName: data.user.user_metadata?.display_name,
          }, 
          loading: false 
        });
        return true;
      }
      });
      return false;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      return false;
    }
  },

  signUpWithEmail: async (email: string, password: string) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) {
      if (error) {
        set({ error: error.message, loading: false });
        return false;
      }
        set({ error: error.message, loading: false });
      if (data.user) {
        set({ 
          user: {
            id: data.user.id,
            email: data.user.email,
          }, 
          loading: false 
        });
        return true;
      }
        return false;
      return false;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      return false;
    }
  },
      }
  signInWithGoogle: async () => {
    Alert.alert('Expo Go Limitation', 'Google OAuth requires a development build with proper URL schemes.');
    return false;
  },
  
  signOut: async () => {
    set({ loading: true });
    try {
      await supabase.auth.signOut();
      set({ user: null, loading: false, error: null });
    } catch (error: any) {
  updateProfile: async (data: any) => {
    set({ loading: true });
    try {
      const { error } = await supabase.auth.updateUser({
        data,
      });
      set({ error: error.message, loading: false });
      if (error) {
        set({ error: error.message, loading: false });
        return;
      }
    }
      set(state => ({
        user: state.user ? { ...state.user, ...data } : null,
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
  },
  initialize: async () => {
    set({ loading: true });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        set({ 
          user: {
            id: session.user.id,
            email: session.user.email,
            displayName: session.user.user_metadata?.display_name,
          }, 
          loading: false 
        });
      } else {
        set({ user: null, loading: false });
      }
  },
      // Listen for auth changes
      supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          set({ 
            user: {
              id: session.user.id,
              email: session.user.email,
              displayName: session.user.user_metadata?.display_name,
            }
          });
        } else {
          set({ user: null });
        }
      });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
}));