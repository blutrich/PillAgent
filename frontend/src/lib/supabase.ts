import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('Environment check:', {
  supabaseUrl: supabaseUrl ? 'SET' : 'MISSING',
  supabaseAnonKey: supabaseAnonKey ? 'SET' : 'MISSING',
  nodeEnv: process.env.NODE_ENV
})

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables:', {
    NEXT_PUBLIC_SUPABASE_URL: supabaseUrl,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseAnonKey ? 'SET' : 'MISSING'
  })
  throw new Error(`Missing Supabase environment variables: URL=${supabaseUrl ? 'SET' : 'MISSING'}, KEY=${supabaseAnonKey ? 'SET' : 'MISSING'}`)
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  db: {
    schema: 'public',
  },
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'x-my-custom-header': 'climbingpill-app',
    },
  },
  // Add timeout configuration to prevent query timeouts
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})

// Auth helper functions
export const auth = {
  // Sign up with email and password
  async signUp(email: string, password: string, userData?: { firstName?: string; lastName?: string }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: userData?.firstName,
          last_name: userData?.lastName,
        }
      }
    })
    return { data, error }
  },

  // Sign in with email and password
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  },

  // Sign out
  async signOut() {
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  // Get current user
  async getCurrentUser() {
    try {
      console.log('🔍 Attempting to get current user...')
      const { data: { user }, error } = await supabase.auth.getUser()
      console.log('🔍 getCurrentUser result:', { user: user ? 'Found' : 'None', error: error ? error.message : 'None' })
      return { user, error }
    } catch (err) {
      console.error('🔍 getCurrentUser exception:', err)
      return { user: null, error: err }
    }
  },

  // Listen to auth state changes
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback)
  },

  // Reset password
  async resetPassword(email: string) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    return { data, error }
  }
}

// Database helper functions for user profiles
export const db = {
  // Create user profile after signup
  async createUserProfile(userId: string, email: string, userData?: { firstName?: string; lastName?: string }) {
    const { data, error } = await supabase
      .from('user_profiles')
      .insert({
        user_id: userId,
        email,
        first_name: userData?.firstName,
        last_name: userData?.lastName,
        onboarding_completed: false,
        onboarding_step: 1
      })
      .select()
      .single()
    
    return { data, error }
  },

  // Get user profile
  async getUserProfile(userId: string) {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()
    
    return { data, error }
  },

  // Update user profile
  async updateUserProfile(userId: string, updates: any) {
    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single()
    
    return { data, error }
  }
} 