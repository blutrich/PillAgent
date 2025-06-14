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
      const { user: currentUser } = await auth.getCurrentUser()
      setUser(currentUser)
      
      if (currentUser) {
        // Load user profile
        const { data: profile } = await db.getUserProfile(currentUser.id)
        setUserProfile(profile)
      }
      
      setLoading(false)
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null)
      
      if (session?.user) {
        // Load or create user profile
        let { data: profile, error } = await db.getUserProfile(session.user.id)
        
        if (error && error.code === 'PGRST116') {
          // Profile doesn't exist, create it
          const { data: newProfile } = await db.createUserProfile(
            session.user.id,
            session.user.email!,
            {
              firstName: session.user.user_metadata?.first_name,
              lastName: session.user.user_metadata?.last_name
            }
          )
          profile = newProfile
        }
        
        setUserProfile(profile)
      } else {
        setUserProfile(null)
      }
      
      setLoading(false)
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