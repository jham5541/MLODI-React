// Mock Supabase client for Expo Go
export const supabase = {
  auth: {
    signInWithPassword: () => Promise.resolve({ data: null, error: new Error('Expo Go limitation') }),
    signUp: () => Promise.resolve({ data: null, error: new Error('Expo Go limitation') }),
    signOut: () => Promise.resolve({ error: null }),
    getSession: () => Promise.resolve({ data: { session: null } }),
    getUser: () => Promise.resolve({ data: { user: null } }),
    onAuthStateChange: () => ({ data: { subscription: null } }),
  },
  from: () => ({
    select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }),
    insert: () => Promise.resolve({ data: null, error: null }),
    update: () => Promise.resolve({ data: null, error: null }),
    delete: () => Promise.resolve({ data: null, error: null }),
  }),
};