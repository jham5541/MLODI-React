import { create } from 'zustand';


interface AuthState {
  user: any | null;
  loading: boolean;
  error: string | null;
  
  // Auth methods
  signInWithEmail: (email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: false,
  error: null,
  
  signInWithEmail: async (email: string, password: string) => {
    Alert.alert('Expo Go Limitation', 'Authentication requires a development build. This is a demo.');
    return false;
  },
  
  signOut: async () => {
    set({ user: null, loading: false });
  },
}));