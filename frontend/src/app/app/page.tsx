'use client'

import React, { useEffect, useState } from 'react'
import { useAuth } from '../../lib/auth-context'
import { useRouter } from 'next/navigation'
import ChatInterface from '../../components/ChatInterface'

const ClimbingPillApp = () => {
  const { user, userProfile, loading, signOut } = useAuth()
  const router = useRouter()
  
  // Add loading timeout state
  const [loadingTimeout, setLoadingTimeout] = useState(false)
  
  // Add timeout for loading state
  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading) {
        console.log('⏰ Loading timeout reached, forcing app to load')
        setLoadingTimeout(true)
      }
    }, 15000) // 15 second timeout
    
    return () => clearTimeout(timer)
  }, [loading])
  
  // Redirect to landing if not authenticated
  useEffect(() => {
    if ((!loading || loadingTimeout) && !user) {
      console.log('🔄 Redirecting to landing page - no user found')
      router.push('/')
    }
  }, [user, loading, loadingTimeout, router])

  // Show loading state
  if (loading && !loadingTimeout) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <img 
              src="/climbingpill-logo.svg" 
              alt="ClimbingPill" 
              className="h-12"
            />
          </div>
          <div className="flex space-x-1 justify-center">
            <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
            <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
          </div>
          <p className="text-gray-400 mt-4">Loading your climbing journey...</p>
        </div>
      </div>
    );
  }

  // Show chat interface for authenticated users
  if (user) {
    return <ChatInterface />;
  }

  // Fallback - shouldn't be reached due to redirect
  return null;
}

export default ClimbingPillApp 