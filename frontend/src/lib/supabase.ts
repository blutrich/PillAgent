import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://lxeggioigpyzmkrjdmne.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4ZWdnaW9pZ3B5em1rcmpkbW5lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxMjkxMDEsImV4cCI6MjA2NDcwNTEwMX0.t4wwIUCkFEAmqhswwVD-24aK3VOo1edn2IWcufok7xA'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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
    const { data: { user }, error } = await supabase.auth.getUser()
    return { user, error }
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