'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ArrowRight, 
  CheckCircle, 
  Star, 
  TrendingUp, 
  Target, 
  Zap,
  Users,
  Award,
  BarChart3,
  Brain,
  Dumbbell,
  Calendar
} from 'lucide-react'
import AuthModal from '../../components/AuthModal'

const LandingPage = () => {
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('signup')
  const router = useRouter()

  const openAuthModal = (mode: 'login' | 'signup') => {
    setAuthModalMode(mode)
    setAuthModalOpen(true)
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-md border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <img 
                src="/climbingpill-logo.svg" 
                alt="ClimbingPill" 
                className="h-8"
              />
            </div>
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => openAuthModal('login')}
                className="text-gray-300 hover:text-white transition-colors"
              >
                Sign In
              </button>
              <button 
                onClick={() => openAuthModal('signup')}
                className="bg-white text-black px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
              Your AI Climbing Coach
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Get personalized training programs, track your progress, and break through plateaus with AI-powered climbing coaching.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button 
                onClick={() => openAuthModal('signup')}
                className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-8 py-4 rounded-2xl font-semibold text-lg hover:shadow-lg hover:shadow-pink-500/25 transition-all transform hover:scale-105 flex items-center"
              >
                Start Your Journey
                <ArrowRight className="ml-2 h-5 w-5" />
              </button>
              <button 
                onClick={() => openAuthModal('login')}
                className="border border-gray-600 text-white px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-gray-800 transition-colors"
              >
                Sign In
              </button>
            </div>
            <p className="text-sm text-gray-400 mt-4">Free assessment • No credit card required</p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Everything You Need to Climb Stronger</h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Our AI analyzes your strengths and weaknesses to create the perfect training program for your goals.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard 
              icon={Brain}
              title="AI Assessment"
              description="Comprehensive strength and technique analysis to identify your unique climbing profile"
              color="from-pink-500 to-rose-500"
            />
            <FeatureCard 
              icon={Target}
              title="Personalized Programs"
              description="Custom 6-week training plans tailored to your current grade and target goals"
              color="from-green-400 to-emerald-500"
            />
            <FeatureCard 
              icon={BarChart3}
              title="Progress Tracking"
              description="Detailed analytics and insights to monitor your improvement over time"
              color="from-teal-400 to-cyan-500"
            />
            <FeatureCard 
              icon={Dumbbell}
              title="Strength Training"
              description="Fingerboard protocols, core work, and antagonist training for balanced development"
              color="from-purple-500 to-violet-500"
            />
            <FeatureCard 
              icon={Calendar}
              title="Smart Scheduling"
              description="Adaptive training schedules that fit your lifestyle and recovery needs"
              color="from-orange-500 to-amber-500"
            />
            <FeatureCard 
              icon={Users}
              title="Coach Support"
              description="Access to certified climbing coaches for program reviews and guidance"
              color="from-blue-500 to-indigo-500"
            />
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Trusted by Climbers Worldwide</h2>
            <div className="flex justify-center items-center space-x-8 text-gray-400">
              <div className="text-center">
                <div className="text-3xl font-bold text-white">10,000+</div>
                <div className="text-sm">Active Users</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">50,000+</div>
                <div className="text-sm">Programs Generated</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">4.9/5</div>
                <div className="text-sm flex items-center">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                  Rating
                </div>
              </div>
            </div>
          </div>

          {/* Testimonials */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <TestimonialCard 
              name="Sarah Chen"
              grade="V8 → V10"
              text="ClimbingPill helped me break through my V8 plateau. The AI identified my core weakness and created a program that got me sending V10 in just 8 weeks!"
              avatar="SC"
            />
            <TestimonialCard 
              name="Mike Rodriguez"
              grade="V5 → V7"
              text="As a beginner, I was overwhelmed by training advice. ClimbingPill gave me a clear, structured path that actually works. Highly recommend!"
              avatar="MR"
            />
            <TestimonialCard 
              name="Emma Thompson"
              grade="V6 → V8"
              text="The fingerboard protocols are game-changing. My finger strength improved dramatically, and I'm now projecting grades I never thought possible."
              avatar="ET"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-teal-500/10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Climb Your Next Grade?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Join thousands of climbers who have transformed their training with AI-powered coaching.
          </p>
          <button 
            onClick={() => openAuthModal('signup')}
            className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-12 py-4 rounded-2xl font-semibold text-xl hover:shadow-lg hover:shadow-pink-500/25 transition-all transform hover:scale-105 inline-flex items-center"
          >
            Start Free Assessment
            <ArrowRight className="ml-3 h-6 w-6" />
          </button>
          <p className="text-sm text-gray-400 mt-4">No credit card required • Get results in 5 minutes</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <svg className="w-6 h-6" viewBox="0 0 100 100" fill="none">
                <path d="M20 20 C20 10, 30 0, 40 0 L60 0 C70 0, 80 10, 80 20 L80 40 C80 50, 70 60, 60 60 L40 60 C30 60, 20 50, 20 40 Z" fill="#ff4d6d"></path>
                <circle cx="65" cy="35" r="25" fill="#a3d977"></circle>
                <path d="M30 40 C20 40, 10 50, 10 60 L10 70 C10 80, 20 90, 30 90 L60 90 C70 90, 80 80, 80 70 L80 60 C80 50, 70 40, 60 40 Z" fill="#2d9596"></path>
              </svg>
              <span className="font-semibold">ClimbingPill</span>
            </div>
            <div className="flex space-x-6 text-sm text-gray-400">
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-white transition-colors">Support</a>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-400 text-sm">
            © 2025 ClimbingPill. All rights reserved.
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      {authModalOpen && (
        <AuthModal 
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          initialMode={authModalMode}
        />
      )}
    </div>
  )
}

const FeatureCard = ({ icon: Icon, title, description, color }: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  color: string
}) => (
  <div className="bg-gray-800/50 rounded-2xl p-6 hover:bg-gray-800/70 transition-colors border border-gray-700">
    <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${color} flex items-center justify-center mb-4`}>
      <Icon className="h-6 w-6 text-white" />
    </div>
    <h3 className="text-xl font-semibold mb-2">{title}</h3>
    <p className="text-gray-300">{description}</p>
  </div>
)

const TestimonialCard = ({ name, grade, text, avatar }: {
  name: string
  grade: string
  text: string
  avatar: string
}) => (
  <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
    <div className="flex items-center mb-4">
      <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-teal-500 rounded-full flex items-center justify-center text-white font-semibold mr-3">
        {avatar}
      </div>
      <div>
        <div className="font-semibold">{name}</div>
        <div className="text-sm text-green-400">{grade}</div>
      </div>
    </div>
    <p className="text-gray-300 italic">"{text}"</p>
    <div className="flex mt-4">
      {[...Array(5)].map((_, i) => (
        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
      ))}
    </div>
  </div>
)

export default LandingPage 