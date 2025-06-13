'use client'

import React, { useState } from 'react'
import { useAuth } from '../lib/auth-context'
import { X, Eye, EyeOff, Mail, Lock, User, AlertCircle, CheckCircle } from 'lucide-react'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  initialMode?: 'login' | 'signup'
}

export default function AuthModal({ isOpen, onClose, initialMode = 'login' }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>(initialMode)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null)
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    confirmPassword: ''
  })

  const { signIn, signUp, resetPassword } = useAuth()

  if (!isOpen) return null

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
    // Clear message when user starts typing
    if (message) setMessage(null)
  }

  const validateForm = () => {
    if (!formData.email || !formData.email.includes('@')) {
      setMessage({ type: 'error', text: 'Please enter a valid email address' })
      return false
    }

    if (mode === 'signup') {
      if (!formData.firstName.trim()) {
        setMessage({ type: 'error', text: 'First name is required' })
        return false
      }
      if (formData.password.length < 6) {
        setMessage({ type: 'error', text: 'Password must be at least 6 characters' })
        return false
      }
      if (formData.password !== formData.confirmPassword) {
        setMessage({ type: 'error', text: 'Passwords do not match' })
        return false
      }
    } else if (mode === 'login') {
      if (!formData.password) {
        setMessage({ type: 'error', text: 'Password is required' })
        return false
      }
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setLoading(true)
    setMessage(null)

    try {
      if (mode === 'login') {
        const { error } = await signIn(formData.email, formData.password)
        if (error) {
          setMessage({ type: 'error', text: error.message })
        } else {
          onClose()
        }
      } else if (mode === 'signup') {
        const { error } = await signUp(formData.email, formData.password, {
          firstName: formData.firstName,
          lastName: formData.lastName
        })
        if (error) {
          setMessage({ type: 'error', text: error.message })
        } else {
          setMessage({ type: 'success', text: 'Account created! Please check your email to verify your account.' })
        }
      } else if (mode === 'forgot') {
        const { error } = await resetPassword(formData.email)
        if (error) {
          setMessage({ type: 'error', text: error.message })
        } else {
          setMessage({ type: 'success', text: 'Password reset email sent! Check your inbox.' })
        }
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An unexpected error occurred' })
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      confirmPassword: ''
    })
    setMessage(null)
    setShowPassword(false)
  }

  const switchMode = (newMode: 'login' | 'signup' | 'forgot') => {
    setMode(newMode)
    resetForm()
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-black border border-gray-800 rounded-3xl p-8 w-full max-w-md relative shadow-2xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors"
        >
          <X className="h-6 w-6" />
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <svg className="w-8 h-8" viewBox="0 0 100 100" fill="none">
              <path d="M20 20 C20 10, 30 0, 40 0 L60 0 C70 0, 80 10, 80 20 L80 40 C80 50, 70 60, 60 60 L40 60 C30 60, 20 50, 20 40 Z" fill="#ff4d6d"></path>
              <circle cx="65" cy="35" r="25" fill="#a3d977"></circle>
              <path d="M30 40 C20 40, 10 50, 10 60 L10 70 C10 80, 20 90, 30 90 L60 90 C70 90, 80 80, 80 70 L80 60 C80 50, 70 40, 60 40 Z" fill="#2d9596"></path>
            </svg>
            <h1 className="text-2xl font-bold text-white">ClimbingPill</h1>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">
            {mode === 'login' && 'Welcome back'}
            {mode === 'signup' && 'Create your account'}
            {mode === 'forgot' && 'Reset your password'}
          </h2>
          <p className="text-gray-400">
            {mode === 'login' && 'Sign in to continue your climbing journey'}
            {mode === 'signup' && 'Join thousands of climbers improving their skills'}
            {mode === 'forgot' && 'Enter your email to receive a reset link'}
          </p>
        </div>

        {/* Message */}
        {message && (
          <div className={`flex items-center space-x-2 p-4 rounded-xl mb-6 ${
            message.type === 'error' 
              ? 'bg-red-500/10 border border-red-500/20 text-red-400' 
              : 'bg-green-500/10 border border-green-500/20 text-green-400'
          }`}>
            {message.type === 'error' ? (
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
            ) : (
              <CheckCircle className="h-5 w-5 flex-shrink-0" />
            )}
            <p className="text-sm">{message.text}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {mode === 'signup' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  First Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                    placeholder="John"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Last Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                    placeholder="Doe"
                  />
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                placeholder="john@example.com"
                required
              />
            </div>
          </div>

          {mode !== 'forgot' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-12 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
          )}

          {mode === 'signup' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-black font-semibold py-3 px-6 rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Please wait...' : (
              mode === 'login' ? 'Sign In' :
              mode === 'signup' ? 'Create Account' :
              'Send Reset Link'
            )}
          </button>
        </form>

        {/* Footer links */}
        <div className="mt-6 text-center space-y-2">
          {mode === 'login' && (
            <>
              <button
                onClick={() => switchMode('forgot')}
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Forgot your password?
              </button>
              <div className="text-sm text-gray-400">
                Don't have an account?{' '}
                <button
                  onClick={() => switchMode('signup')}
                  className="text-white hover:underline font-medium"
                >
                  Sign up
                </button>
              </div>
            </>
          )}
          
          {mode === 'signup' && (
            <div className="text-sm text-gray-400">
              Already have an account?{' '}
              <button
                onClick={() => switchMode('login')}
                className="text-white hover:underline font-medium"
              >
                Sign in
              </button>
            </div>
          )}
          
          {mode === 'forgot' && (
            <div className="text-sm text-gray-400">
              Remember your password?{' '}
              <button
                onClick={() => switchMode('login')}
                className="text-white hover:underline font-medium"
              >
                Sign in
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 