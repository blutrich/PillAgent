'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { auth, db } from './supabase'

interface AuthContextType {
  user: User | null
  userProfile: any | null
  loading: boolean
  signUp: (email: string, password: string, userData?: { firstName?: string; lastName?: string }) => Promise<{ data: any; error: any }>
  signIn: (email: string, password: string) => Promise<{ data: any; error: any }>
  signOut: () => Promise<{ error: any }>
  resetPassword: (email: string) => Promise<{ data: any; error: any }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        console.log('🔄 Getting initial session...')
        
        // Add timeout to prevent infinite loading
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Auth timeout')), 10000)
        )
        
        const authPromise = auth.getCurrentUser()
        
        const { user: currentUser, error } = await Promise.race([authPromise, timeoutPromise]) as any
        console.log('👤 Current user:', currentUser ? 'Found' : 'None', error ? `Error: ${error.message}` : '')
        setUser(currentUser)
        
        if (currentUser) {
          console.log('📋 Loading user profile for:', currentUser.id)
          const { data: profile, error: profileError } = await db.getUserProfile(currentUser.id)
          console.log('📋 Profile result:', profile ? 'Found' : 'None', profileError ? `Error: ${profileError.message}` : '')
          setUserProfile(profile)
        }
        
        console.log('✅ Auth initialization complete, setting loading to false')
        setLoading(false)
      } catch (error) {
        console.error('❌ Auth initialization error:', error)
        console.log('⚠️ Setting loading to false due to error/timeout')
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = auth.onAuthStateChange(async (event, session) => {
      try {
        console.log('🔔 Auth state change:', event, session?.user ? 'User present' : 'No user')
        setUser(session?.user ?? null)
        
        if (session?.user) {
          console.log('📋 Loading profile for user:', session.user.id)
          // Load or create user profile
          let { data: profile, error } = await db.getUserProfile(session.user.id)
          console.log('📋 Profile query result:', profile ? 'Found' : 'None', error ? `Error: ${error.message}` : '')
          
          if (error && error.code === 'PGRST116') {
            console.log('📝 Creating new profile...')
            // Profile doesn't exist, create it
            const { data: newProfile, error: createError } = await db.createUserProfile(
              session.user.id,
              session.user.email!,
              {
                firstName: session.user.user_metadata?.first_name,
                lastName: session.user.user_metadata?.last_name
              }
            )
            console.log('📝 Profile creation result:', newProfile ? 'Success' : 'Failed', createError ? `Error: ${createError.message}` : '')
            profile = newProfile
          }
          
          setUserProfile(profile)
        } else {
          setUserProfile(null)
        }
        
        console.log('✅ Auth state change complete, setting loading to false')
        setLoading(false)
      } catch (error) {
        console.error('❌ Auth state change error:', error)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email: string, password: string, userData?: { firstName?: string; lastName?: string }) => {
    const result = await auth.signUp(email, password, userData)
    return result
  }

  const signIn = async (email: string, password: string) => {
    const result = await auth.signIn(email, password)
    return result
  }

  const signOut = async () => {
    try {
      console.log('Attempting to sign out...')
      const result = await auth.signOut()
      console.log('SignOut result:', result)
      
      if (!result.error) {
        setUser(null)
        setUserProfile(null)
        console.log('Successfully signed out')
      } else {
        console.error('SignOut error:', result.error)
      }
      return result
    } catch (error) {
      console.error('SignOut exception:', error)
      return { error }
    }
  }

  const resetPassword = async (email: string) => {
    return await auth.resetPassword(email)
  }

  const value = {
    user,
    userProfile,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 