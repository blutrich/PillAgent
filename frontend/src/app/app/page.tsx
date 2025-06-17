'use client'

import React, { useState, useEffect, useCallback, memo, useRef } from 'react'
import { useAuth } from '../../lib/auth-context'
import { useRouter } from 'next/navigation'
import { climbingPillAPI } from '../../lib/mastra-client'
import AuthModal from '../../components/AuthModal'
import AssessmentView from '../../components/AssessmentView'
import JournalNotice from '../../components/JournalNotice'
import ReactMarkdown from 'react-markdown'

// Icons
import { 
  Menu, X, ChevronRight, PlayCircle, MessageCircle, Send, Mic, 
  CheckCircle, Award, RotateCcw, Maximize2, Minimize2, LogOut
} from 'lucide-react'

// Custom Icons
const ClimbingPillLogo = ({ className }: { className?: string }) => (
  <img 
    src="/climbingpill-logo.svg" 
    alt="ClimbingPill" 
    className={className}
  />
);

const ProgressChartIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const AssessmentIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const TrainingPlanIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
  </svg>
);

const StrengthMeterIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const ScheduleIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const ClimbingGradeIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-6 5 6M7 11v8a1 1 0 001 1h8a1 1 0 001-1v-8" />
  </svg>
);

const PowerTrainingIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const AICoachIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
  </svg>
);

const ClimbingMountainIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M14 6l-3.75 5 2.85 3.8-1.6 1.2C9.81 13.75 7 10 7 10l-6 8h22l-9-12z"/>
  </svg>
);

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

  const [activeView, setActiveView] = useState('dashboard')
  const [chatOpen, setChatOpen] = useState(false)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('login')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [chatMinimized, setChatMinimized] = useState(false)

  // Assessment state
  const [assessmentStep, setAssessmentStep] = useState(1)
  const [assessmentData, setAssessmentData] = useState({
    bodyWeight: '',
    height: '',
    addedWeight: '',
    hangTime: '',
    pullUpsMax: '',
    pushUpsMax: '',
    toeToBarMax: '',
    legSpread: '',
    currentGrade: '',
    targetGrade: '',
    eightyPercentGrade: '',
    experience: '',
    weaknesses: [],
    availableDays: '[]',
    sessionDuration: '',
    equipmentAvailable: '[]',
    trainingFocus: '[]',
    primaryWeakness: ''
  })

  // User data state
  const [userData, setUserData] = useState({
    name: userProfile?.first_name ? `${userProfile.first_name} ${userProfile.last_name || ''}`.trim() : "Climber",
    currentGrade: null as string | null, // Will be null for new users
    targetGrade: null as string | null,
    assessmentScore: null as number | null,
    programProgress: 0,
    subscription: userProfile?.subscription_tier || "free",
    avatar: userProfile?.first_name ? userProfile.first_name.charAt(0).toUpperCase() + (userProfile.last_name?.charAt(0).toUpperCase() || '') : "C",
    hasCompletedAssessment: false
  })

  // Program data state
  const [programData, setProgramData] = useState({
    name: "ClimbingPill Training Program",
    currentWeek: 1,
    totalWeeks: 6,
    nextSession: "Complete Assessment First",
    todayComplete: false,
    detailedProgram: null as any
  })

  // Chat state
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hi! I'm your ClimbingPill AI coach. Ready to crush your climbing goals today?", confidence: 0.95 },
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isGeneratingProgram, setIsGeneratingProgram] = useState(false)

  // Function to get today's session details
  const getTodaysSession = () => {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    
    // If we have detailed program data, find today's session
    if (programData.detailedProgram?.weeks) {
      const currentWeek = programData.detailedProgram.weeks.find((week: any) => 
        week.weekNumber === programData.currentWeek
      );
      
      if (currentWeek?.days) {
        const todaySession = currentWeek.days.find((day: any) => 
          day.day === today
        );
        
        if (todaySession?.sessions?.[0]) {
          return todaySession.sessions[0];
        }
      }
    }
    
    // Fallback to generic session info
    return {
      type: programData.nextSession || "Training Session",
      duration: 90,
      intensity: "Moderate",
      focus: "Finger strength weakness"
    };
  };

  // Function to open chat with prepopulated session question
  const askAboutTodaysSession = () => {
    const session = getTodaysSession();
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    
    const sessionQuestion = `Can you explain today's ${today} training session? I see it's "${session.type}" for ${session.duration} minutes. What should I focus on and how should I approach this session?`;
    
    // Add the question to messages and open chat
    setMessages(prev => [...prev, { 
      role: 'user', 
      content: sessionQuestion, 
      confidence: 1.0 
    }]);
    
    setChatOpen(true);
    
    // Automatically send the message to get AI response
    if (user) {
      setIsTyping(true);
      climbingPillAPI.chat(sessionQuestion, user.id)
        .then(response => {
          setMessages(prev => [...prev, response]);
          setIsTyping(false);
        })
        .catch(error => {
          console.error('Error getting session advice:', error);
          const fallbackMessage = { 
            role: 'assistant', 
            content: "I'm having trouble connecting right now. Please try asking about your session again.",
            confidence: 0.1
          };
          setMessages(prev => [...prev, fallbackMessage]);
          setIsTyping(false);
        });
    }
  };

  // Load user data when user changes
  useEffect(() => {
    if (!user) return;
    
    const loadUserData = async () => {
      if (!user) return;
      
      try {
        const [userProfileData, trainingProgram] = await Promise.all([
          climbingPillAPI.getUserProfile(user.id),
          climbingPillAPI.getTrainingProgram(user.id)
        ]);
        
        // Update userData with real profile data including assessment status
        setUserData(prev => ({
          ...prev,
          name: userProfile?.first_name ? `${userProfile.first_name} ${userProfile.last_name || ''}`.trim() : userProfileData.name || "Climber",
          subscription: userProfile?.subscription_tier || userProfileData.subscription || "free",
          avatar: userProfile?.first_name ? userProfile.first_name.charAt(0).toUpperCase() + (userProfile.last_name?.charAt(0).toUpperCase() || '') : userProfileData.avatar || "C",
          // Assessment-related data from API
          currentGrade: userProfileData.currentGrade,
          targetGrade: userProfileData.targetGrade,
          assessmentScore: userProfileData.assessmentScore,
          programProgress: userProfileData.programProgress,
          hasCompletedAssessment: !!userProfileData.currentGrade // If we have a current grade, assessment is complete
        }));
        console.log('Loaded training program:', trainingProgram);
        console.log('User profile data:', userProfileData);
        console.log('Updated userData will be:', {
          currentGrade: userProfileData.currentGrade,
          hasCompletedAssessment: !!userProfileData.currentGrade
        });
        setProgramData(trainingProgram);
      } catch (error) {
        console.error('Error loading user data:', error);
        // Keep default mock data as fallback
      }
    };

    loadUserData();
  }, [user, userProfile]);

  const navigation = [
    { id: 'dashboard', label: 'Dashboard', icon: ClimbingMountainIcon },
    { id: 'training', label: 'Training', icon: PowerTrainingIcon },
    { id: 'assessment', label: 'Assessment', icon: AssessmentIcon },
    { id: 'progress', label: 'Progress', icon: ProgressChartIcon },
    { id: 'schedule', label: 'Schedule', icon: ScheduleIcon },
  ];

  // AI Chat Functions - moved to memoized AIChat component

  // Helper Components
  const StatCard = ({ icon: Icon, label, value, sublabel, trend }: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: string;
    sublabel: string;
    trend?: string;
  }) => (
    <div className="card-mobile hover-lift">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-mastra-sm text-gray-400 font-medium">{label}</p>
          <p className="text-2xl lg:text-3xl font-bold mt-1 lg:mt-2 text-white tracking-tight">{value}</p>
          <p className="text-mastra-xs lg:text-mastra-sm text-gray-400 mt-1">{sublabel}</p>
          {trend && <p className="text-mastra-sm text-white mt-2 font-medium">{trend}</p>}
        </div>
        <div className="p-2 lg:p-3 rounded-xl lg:rounded-2xl bg-gray-800 border border-gray-700 flex-shrink-0">
          <Icon className="h-6 w-6 lg:h-8 lg:w-8 text-white" />
        </div>
      </div>
    </div>
  );

  const ActionButton = ({ icon: Icon, title, subtitle, onClick, aiSuggested = false }: {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    subtitle: string;
    onClick: () => void;
    aiSuggested?: boolean;
  }) => (
    <button 
      onClick={onClick}
      className="btn-mobile glass-subtle text-left hover-lift group w-full"
    >
      <div className="flex items-center justify-between w-full">
        <div className="flex items-start space-x-3 lg:space-x-4 flex-1 min-w-0">
          <div className="p-2 rounded-xl bg-gray-800 group-hover:bg-gray-700 transition-colors border border-gray-700 flex-shrink-0">
            <Icon className="h-5 w-5 lg:h-6 lg:w-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="font-semibold text-white text-mastra-base truncate">{title}</h3>
              {aiSuggested && (
                <span className="text-xs bg-white text-black px-2 py-0.5 rounded-full font-medium flex-shrink-0">AI</span>
              )}
            </div>
            <p className="text-mastra-sm text-gray-400 line-clamp-2">{subtitle}</p>
          </div>
        </div>
        <ChevronRight className="h-4 w-4 lg:h-5 lg:w-5 text-gray-400 group-hover:text-white transition-colors flex-shrink-0 ml-2" />
      </div>
    </button>
  );

  const ActivityItem = ({ icon: Icon, text, time, aiInsight }: {
    icon: React.ComponentType<{ className?: string }>;
    text: string;
    time: string;
    aiInsight?: string;
  }) => (
    <div className="flex items-start space-x-3 p-3 hover:bg-gray-800 rounded-lg transition-colors">
      <Icon className="h-5 w-5 text-white mt-1" />
      <div className="flex-1">
        <p className="text-sm font-medium text-white">{text}</p>
        <p className="text-xs text-gray-400">{time}</p>
        {aiInsight && (
          <p className="text-xs text-gray-300 mt-1 italic">💡 {aiInsight}</p>
        )}
      </div>
    </div>
  );

  const ConfidenceIndicator = ({ confidence }: { confidence: number }) => (
    <div className="flex items-center mt-2 text-xs text-gray-400">
      <div className={`w-2 h-2 rounded-full mr-2 ${
        confidence > 0.8 ? 'bg-white' : 
        confidence > 0.6 ? 'bg-gray-400' : 'bg-gray-600'
      }`}></div>
      <span>
        {confidence > 0.8 ? 'High confidence' : 
         confidence > 0.6 ? 'Medium confidence' : 'Low confidence - verify with coach'}
      </span>
    </div>
  );

  const TodaysSessionDisplay = () => {
    const session = getTodaysSession();
    return (
      <>
        <p className="text-white/90 text-lg mb-2">{session.type}</p>
        <p className="text-white/80 leading-relaxed">
          {session.focus || "Targeting finger strength weakness"} • {session.duration} min
        </p>
      </>
    );
  };

  // Dashboard View
  const DashboardView = () => {
    const isNewUser = !userData.hasCompletedAssessment || !userData.currentGrade;
    
    if (isNewUser) {
      return (
        <div className="space-y-6">
          {/* New User Welcome */}
          <div className="bg-gradient-to-r from-pink-500 to-teal-500 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl">
            <div className="relative z-10">
              <h1 className="text-2xl font-semibold mb-3">Welcome to ClimbingPill, {userData.name}!</h1>
              <p className="text-gray-100 mb-6">Let's start by assessing your current climbing abilities to create your personalized training program.</p>
              <button 
                onClick={() => setActiveView('assessment')}
                className="bg-white text-black font-semibold px-8 py-4 rounded-2xl hover:bg-gray-100 transition-colors text-lg"
              >
                🎯 Take Your First Assessment
              </button>
            </div>
            <ClimbingMountainIcon className="absolute top-6 right-6 w-28 h-28 text-white/10" />
          </div>

          {/* Getting Started Steps */}
          <div className="bg-gray-800 rounded-3xl p-8 border border-gray-700">
            <h2 className="text-xl font-bold text-white mb-6">Getting Started</h2>
            <div className="space-y-4">
              <div className="flex items-center space-x-4 p-4 bg-gray-700 rounded-xl">
                <div className="w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center text-white font-bold">1</div>
                <div>
                  <h3 className="font-semibold text-white">Complete Assessment</h3>
                  <p className="text-gray-300 text-sm">Tell us about your current climbing abilities and goals</p>
                </div>
              </div>
              <div className="flex items-center space-x-4 p-4 bg-gray-800 rounded-xl opacity-50">
                <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center text-white font-bold">2</div>
                <div>
                  <h3 className="font-semibold text-gray-400">Get Your Program</h3>
                  <p className="text-gray-500 text-sm">Receive a personalized training program</p>
                </div>
              </div>
              <div className="flex items-center space-x-4 p-4 bg-gray-800 rounded-xl opacity-50">
                <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center text-white font-bold">3</div>
                <div>
                  <h3 className="font-semibold text-gray-400">Start Training</h3>
                  <p className="text-gray-500 text-sm">Begin your journey to the next grade</p>
                </div>
              </div>
            </div>
          </div>

          {/* AI Coach Introduction */}
          <div className="bg-gray-800 rounded-3xl p-8 border border-gray-700">
            <div className="flex items-start space-x-4">
              <div className="p-3 rounded-xl bg-gray-700">
                <AICoachIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white mb-2">Meet Your AI Climbing Coach</h3>
                <p className="text-gray-300 text-sm mb-4">
                  I'm here to help you improve your climbing with personalized training programs, 
                  technique analysis, and 24/7 support. Once you complete your assessment, 
                  I'll create a custom program just for you.
                </p>
                <button 
                  onClick={() => setChatOpen(true)}
                  className="text-white text-sm hover:text-gray-300 transition-colors"
                >
                  💬 Say hello to your AI coach →
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Welcome Header with AI Integration */}
        <div className="bg-gradient-to-r from-pink-500 to-teal-500 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl">
          <div className="relative z-10">
            <h1 className="text-2xl font-semibold mb-3">Welcome back, {userData.name}</h1>
            <p className="text-gray-100 mb-6">Ready to crush your climbing goals today?</p>
            <button 
              onClick={() => setChatOpen(true)}
              className="bg-white text-black font-semibold px-6 py-3 rounded-2xl hover:bg-gray-100 transition-colors"
            >
              💬 Ask your AI coach
            </button>
          </div>
          <ClimbingMountainIcon className="absolute top-6 right-6 w-28 h-28 text-white/10" />
        </div>

        {/* Smart Stats Grid - Mobile First */}
        <div className="grid-mobile-1">
          <StatCard 
            icon={ClimbingGradeIcon}
            label="Current Grade"
            value={userData.currentGrade || "Not Set"}
            sublabel={userData.targetGrade ? `Target: ${userData.targetGrade}` : "Complete assessment"}
            trend="+1 grade in 8 weeks"
          />
          <StatCard 
            icon={StrengthMeterIcon}
            label="Assessment Score"
            value={userData.assessmentScore ? userData.assessmentScore.toFixed(2) : "0.00"}
            sublabel="Strong performance"
            trend="↗ +12% from last assessment"
          />
          <StatCard 
            icon={PowerTrainingIcon}
            label="Program Progress"
            value={`${userData.programProgress}%`}
            sublabel="Week 3 of 6"
            trend="On track for V8"
          />
        </div>

      {/* AI-Enhanced Today's Session - Mobile First */}
      <div className="bg-gradient-to-r from-lime-500 to-teal-500 rounded-2xl lg:rounded-3xl p-6 lg:p-8 text-white shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex-1">
            <div className="flex items-center mb-3">
              <div className="p-2 rounded-xl bg-white/20 mr-3">
                <AICoachIcon className="w-4 h-4 lg:w-5 lg:h-5" />
              </div>
              <span className="text-white/90 font-medium text-sm lg:text-base">AI Optimized Session</span>
            </div>
            <h2 className="text-xl lg:text-2xl font-bold mb-3 tracking-tight">Today&apos;s Training</h2>
            <TodaysSessionDisplay />
          </div>
          <div className="flex flex-col sm:flex-row lg:flex-col space-y-2 sm:space-y-0 sm:space-x-3 lg:space-x-0 lg:space-y-3">
            <button className="btn-mobile bg-white text-teal-600 font-semibold hover-lift shadow-lg">
              <PlayCircle className="w-5 h-5" />
              Start Session
            </button>
            <button 
              onClick={askAboutTodaysSession}
              className="btn-mobile bg-white/20 text-white font-medium hover-lift border border-white/20"
            >
              💬 Ask about this session
            </button>
          </div>
        </div>
      </div>

      {/* Quick Actions with AI Suggestions */}
      <div className="glass-strong rounded-3xl p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-primary">Quick Actions</h2>
          <span className="text-sm bg-purple-100 text-purple-700 px-3 py-1.5 rounded-full font-semibold">AI Suggested</span>
        </div>
        <div className="grid-mobile-2">
          <ActionButton 
            icon={AssessmentIcon}
            title="Reassess Strength"
            subtitle="Due for finger strength retest"
            onClick={() => setActiveView('assessment')}
            aiSuggested={true}
          />
          <ActionButton 
            icon={RotateCcw}
            title="Adjust Program"
            subtitle="AI noticed plateau pattern"
            onClick={() => {
              const adjustQuestion = "I'd like to adjust my training program. Can you help me modify it based on my current progress and any issues I'm experiencing?";
              setMessages(prev => [...prev, { 
                role: 'user', 
                content: adjustQuestion, 
                confidence: 1.0 
              }]);
              setChatOpen(true);
              
              if (user) {
                setIsTyping(true);
                climbingPillAPI.chat(adjustQuestion, user.id)
                  .then(response => {
                    setMessages(prev => [...prev, response]);
                    setIsTyping(false);
                  })
                  .catch(error => {
                    console.error('Error getting program adjustment advice:', error);
                    setIsTyping(false);
                  });
              }
            }}
            aiSuggested={true}
          />
        </div>
      </div>

      {/* Recent Activity with AI Insights */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h2 className="text-lg font-semibold mb-4">Recent Activity & AI Insights</h2>
        <div className="space-y-3">
          <ActivityItem 
            icon={CheckCircle}
            text="Completed fingerboard session"
            time="2 hours ago"
            aiInsight="15% stronger than last week!"
          />
          <ActivityItem 
            icon={Award}
            text="Sent first V7 project!"
            time="Yesterday"
            aiInsight="Ready for V8 attempts"
          />
          <ActivityItem 
            icon={AICoachIcon}
            text="AI updated your program"
            time="3 days ago"
            aiInsight="Added core focus based on video analysis"
          />
        </div>
      </div>
    </div>
    );
  };

  // Assessment functions
  const nextAssessmentStep = () => {
    // Validate current step before proceeding
    if (assessmentStep === 1) {
      if (!assessmentData.bodyWeight || !assessmentData.height) {
        alert('Please fill in your body weight and height.');
        return;
      }
    } else if (assessmentStep === 2) {
      if (!assessmentData.addedWeight) {
        alert('Please enter the added weight for your 10-second hang test.');
        return;
      }
    } else if (assessmentStep === 3) {
      if (!assessmentData.pullUpsMax || !assessmentData.pushUpsMax || !assessmentData.toeToBarMax) {
        alert('Please fill in all strength metrics (pull-ups, push-ups, toe-to-bar).');
        return;
      }
    } else if (assessmentStep === 4) {
      if (!assessmentData.legSpread) {
        alert('Please enter your leg spread measurement.');
        return;
      }
    } else if (assessmentStep === 5) {
      if (!assessmentData.currentGrade || !assessmentData.targetGrade) {
        alert('Please select your current and target climbing grades.');
        return;
      }
    } else if (assessmentStep === 6) {
      if (assessmentData.availableDays.length === 0) {
        alert('Please select at least one available training day.');
        return;
      }
    } else if (assessmentStep === 7) {
      if (!assessmentData.sessionDuration) {
        alert('Please select your preferred session duration.');
        return;
      }
    }

    if (assessmentStep < 8) {
      setAssessmentStep(assessmentStep + 1);
    } else if (assessmentStep === 8) {
      // Generate program when on final step
      setIsGeneratingProgram(true);
      completeAssessment();
    }
  };

  const prevAssessmentStep = () => {
    if (assessmentStep > 1) {
      setAssessmentStep(assessmentStep - 1);
    }
  };

  const generateWeeksFromText = (text: string) => {
    try {
      console.log('Parsing AI program text:', text.substring(0, 200) + '...');
      
      // Extract program structure from the AI text response
      const weeks = [];
      
      // Look for week patterns in the text
      const weekPattern = /Week\s*(\d+)[-:]?\s*([^\n]*)/gi;
      const weekMatches = [...text.matchAll(weekPattern)];
      
      if (weekMatches.length === 0) {
        // Try alternative patterns
        const altPattern = /(\d+)[-.]?\s*(week|Week)/gi;
        const altMatches = [...text.matchAll(altPattern)];
        
        if (altMatches.length > 0) {
          console.log('Found alternative week patterns:', altMatches.length);
          // Generate basic structure based on mentioned weeks
          for (let i = 1; i <= 6; i++) {
            weeks.push({
              weekNumber: i,
              focus: i <= 4 ? 'Progressive Loading' : i === 5 ? 'Deload' : 'Assessment',
              days: generateDaysFromText(text, i)
            });
          }
        }
      } else {
        console.log('Found week patterns:', weekMatches.length);
        
        // Parse each found week
        for (const match of weekMatches) {
          const weekNumber = parseInt(match[1]);
          const weekTitle = match[2]?.trim() || 'Training Week';
          
          if (weekNumber >= 1 && weekNumber <= 6) {
            weeks.push({
              weekNumber,
              focus: weekTitle,
              days: generateDaysFromText(text, weekNumber)
            });
          }
        }
      }
      
      // If no weeks were parsed, create a basic structure with the AI insights
      if (weeks.length === 0) {
        console.log('No weeks parsed, creating basic structure with AI content');
        for (let i = 1; i <= 6; i++) {
          weeks.push({
            weekNumber: i,
            focus: i <= 4 ? 'Progressive Loading' : i === 5 ? 'Deload' : 'Assessment',
            days: [
              {
                day: 'Monday',
                sessions: [{
                  type: 'Fingerboard + Boulder Projects',
                  exercises: ['Max hangs', 'Boulder projects', 'Core strength'],
                  duration: 90,
                  intensity: 'High',
                  notes: 'Based on your assessment - focus on finger strength and V8+ projects'
                }]
              },
              {
                day: 'Wednesday', 
                sessions: [{
                  type: 'Technical Practice',
                  exercises: ['Movement drills', 'Pull-ups', 'Push-ups', 'Flexibility work'],
                  duration: 60,
                  intensity: 'Moderate',
                  notes: 'Technique refinement and supplemental training'
                }]
              },
              {
                day: 'Friday',
                sessions: [{
                  type: 'Boulder Projects',
                  exercises: ['Project attempts', 'Core work', 'Cool-down stretching'],
                  duration: 90,
                  intensity: 'High',
                  notes: 'Apply techniques from the week'
                }]
              }
            ]
          });
        }
      }
      
      console.log(`Generated ${weeks.length} weeks from AI text`);
      return weeks;
      
    } catch (error) {
      console.error('Error parsing AI text:', error);
      return [];
    }
  };

  const generateDaysFromText = (text: string, weekNumber: number) => {
    // Extract training days mentioned in the text
    const days = [];
    
    // Look for day patterns
    const dayPatterns = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const mentionedDays = dayPatterns.filter(day => 
      text.toLowerCase().includes(day.toLowerCase())
    );
    
    // Default to Monday, Wednesday, Friday if no specific days found
    const targetDays = mentionedDays.length > 0 ? mentionedDays.slice(0, 3) : ['Monday', 'Wednesday', 'Friday'];
    
    for (const day of targetDays) {
      const isRestDay = text.toLowerCase().includes('rest') && text.toLowerCase().includes(day.toLowerCase());
      
      if (isRestDay) {
        days.push({
          day,
          sessions: [{
            type: 'Rest Day',
            exercises: ['Light stretching', 'Mobility work'],
            duration: 0,
            intensity: 'Recovery',
            notes: 'Active recovery and preparation'
          }]
        });
      } else {
        // Extract exercises mentioned in the AI response
        const exercises = [];
        if (text.toLowerCase().includes('fingerboard')) exercises.push('Fingerboard max hangs');
        if (text.toLowerCase().includes('boulder') || text.toLowerCase().includes('project')) exercises.push('Boulder projects');
        if (text.toLowerCase().includes('pull-up') || text.toLowerCase().includes('pullup')) exercises.push('Pull-ups');
        if (text.toLowerCase().includes('push-up') || text.toLowerCase().includes('pushup')) exercises.push('Push-ups');
        if (text.toLowerCase().includes('core')) exercises.push('Core strength');
        if (text.toLowerCase().includes('stretch') || text.toLowerCase().includes('flexibility')) exercises.push('Cool-down stretching');
        
        // Default exercises if none found
        if (exercises.length === 0) {
          exercises.push('Training session', 'Strength work', 'Technique practice');
        }
        
        days.push({
          day,
          sessions: [{
            type: 'Training Session',
            exercises: exercises.slice(0, 4), // Limit to 4 exercises
            duration: day === 'Wednesday' ? 60 : 90,
            intensity: weekNumber <= 4 ? 'High' : weekNumber === 5 ? 'Moderate' : 'High',
            notes: `Week ${weekNumber} focus based on your assessment and goals`
          }]
        });
      }
    }
    
    return days;
  };

  const extractInsightsFromText = (text: string) => {
    // Extract insights from AI response text
    const insights = [];
    if (text.includes('fingerboard')) insights.push('Focus on fingerboard training for strength gains');
    if (text.includes('core')) insights.push('Core strength identified as key improvement area');
    if (text.includes('technique')) insights.push('Technical skills development recommended');
    return insights.length > 0 ? insights : ['Comprehensive training program generated'];
  };

  const generateBasicProgram = () => {
    // Generate a basic 6-week program structure
    const weeks = [];
    for (let i = 1; i <= 6; i++) {
      const week = {
        weekNumber: i,
        focus: i <= 4 ? 'Progressive Loading' : i === 5 ? 'Deload' : 'Assessment',
        days: [
          {
            day: 'Monday',
            sessions: [{
              type: 'Fingerboard Training',
              exercises: ['Max Hangs', 'Repeaters'],
              duration: 30,
              intensity: 'Moderate',
              notes: 'Focus on form and consistency'
            }]
          },
          {
            day: 'Tuesday',
            sessions: [{
              type: 'Rest Day',
              exercises: ['Light stretching'],
              duration: 0,
              intensity: 'Recovery',
              notes: 'Active recovery'
            }]
          },
          {
            day: 'Wednesday',
            sessions: [{
              type: 'Boulder Projects',
              exercises: ['V6-V7 Projects', 'Core Work'],
              duration: 90,
              intensity: 'High',
              notes: 'Work on limit moves'
            }]
          },
          {
            day: 'Thursday',
            sessions: [{
              type: 'Flash Training',
              exercises: ['V4-V5 Flash', 'Technique'],
              duration: 60,
              intensity: 'Moderate',
              notes: 'Focus on reading and efficiency'
            }]
          },
          {
            day: 'Friday',
            sessions: [{
              type: 'Rest Day',
              exercises: ['Mobility work'],
              duration: 0,
              intensity: 'Recovery',
              notes: 'Prepare for weekend'
            }]
          }
        ]
      };
      weeks.push(week);
    }
    return { weeks, aiInsights: [] as string[] };
  };

  const completeAssessment = async () => {
    if (!user) {
      alert('Please sign in to complete your assessment.');
      setAuthModalOpen(true);
      return;
    }

    try {
      // Calculate composite score
      const compositeScore = calculateCompositeScore(assessmentData);
      const predictedGrade = predictGrade(compositeScore);
      
      // Calculate individual ratios for weakness analysis
      const bodyWeight = parseFloat(assessmentData.bodyWeight) || 70;
      const fingerStrengthRatio = (bodyWeight + parseFloat(assessmentData.addedWeight)) / bodyWeight;
      const pullUpRatio = parseInt(assessmentData.pullUpsMax) / bodyWeight * 100;
      const pushUpRatio = parseInt(assessmentData.pushUpsMax) / bodyWeight * 100;
      const coreStrengthRatio = parseInt(assessmentData.toeToBarMax) / bodyWeight * 100;
      const flexibilityRatio = parseFloat(assessmentData.legSpread) / parseFloat(assessmentData.height);

      // Determine weaknesses based on ratios
      const metrics = [
        { name: 'Finger Strength', ratio: fingerStrengthRatio },
        { name: 'Pull-ups', ratio: pullUpRatio },
        { name: 'Push-ups', ratio: pushUpRatio },
        { name: 'Core Strength', ratio: coreStrengthRatio },
        { name: 'Flexibility', ratio: flexibilityRatio }
      ];
      
      // Sort by ratio (ascending = weakest first)
      metrics.sort((a, b) => a.ratio - b.ratio);
      const weakestArea = metrics[0].name;
      const secondWeakestArea = metrics[1].name;
      const strongestArea = metrics[metrics.length - 1].name;

      // Prepare assessment data for API
      const assessmentPayload = {
        userId: user.id, // Add the actual user ID
        bodyWeight: parseFloat(assessmentData.bodyWeight),
        height: parseFloat(assessmentData.height),
        addedWeight: parseFloat(assessmentData.addedWeight),
        pullUpsMax: parseInt(assessmentData.pullUpsMax),
        pushUpsMax: parseInt(assessmentData.pushUpsMax),
        toeToBarMax: parseInt(assessmentData.toeToBarMax),
        legSpread: parseFloat(assessmentData.legSpread),
        currentGrade: assessmentData.currentGrade,
        targetGrade: assessmentData.targetGrade,
        availableDays: assessmentData.availableDays,
        sessionDuration: parseInt(assessmentData.sessionDuration),
        compositeScore,
        predictedGrade,
        // Add the 80% grade (typically one grade below current max)
        eightyPercentGrade: assessmentData.currentGrade, // Use current grade as 80% grade for now
        // Add weakness analysis
        weakestArea,
        secondWeakestArea,
        strongestArea,
        fingerStrengthRatio,
        pullUpRatio,
        pushUpRatio,
        toeToBarRatio: coreStrengthRatio,
        flexibilityRatio
      };

      console.log('Submitting assessment:', assessmentPayload);

      // Call the assessment API
      const response = await climbingPillAPI.conductAssessment(assessmentPayload);
      console.log('Assessment response:', response);

      // Update user data with assessment results
      setUserData(prev => ({
        ...prev,
        currentGrade: assessmentData.currentGrade,
        targetGrade: assessmentData.targetGrade,
        assessmentScore: compositeScore,
        programProgress: 25 // Assessment completed
      }));

      // Generate training program
      const userPreferences = {
        userId: user.id, // Add the actual user ID
        goals: ['strength', 'technique'], // Use 'goals' instead of 'primaryGoals'
        availableDays: Array.isArray(assessmentData.availableDays) 
          ? assessmentData.availableDays 
          : assessmentData.availableDays?.split(',').map((d: string) => d.trim()) || ['Monday', 'Wednesday', 'Friday'],
        style: 'bouldering', // Use 'style' instead of 'climbingStyle'
        injuries: [], // Use 'injuries' instead of 'injuryHistory'
        equipment: ['fingerboard', 'gym'], // Use 'equipment' instead of 'equipmentAccess'
        sessionLength: parseInt(assessmentData.sessionDuration), // Use 'sessionLength' instead of 'sessionDurationMinutes'
        experience: assessmentData.experience || 'Intermediate',
        name: 'ClimbingPill User'
      };

      console.log('Generating program with preferences:', userPreferences);
      // Combine assessment and preferences for the API call
      const combinedProgramData = {
        ...assessmentPayload,
        ...userPreferences
      };
      
      console.log('Calling generateProgram API with combined data...');
      const programResponse = await climbingPillAPI.generateProgram(combinedProgramData);
      console.log('Program response received:', programResponse);

      // Handle program response - check if it has structured data or needs parsing
      let programData;
      console.log('Processing program response...');
      
      if (programResponse && typeof programResponse === 'object') {
        if (programResponse.weeks) {
          console.log('Program response has structured weeks data');
          programData = programResponse;
        } else if (programResponse.text || programResponse.content) {
          console.log('Program response has text content, parsing...');
          // AI response format - try to extract structure
          const responseText = programResponse.text || programResponse.content;
          const weeks = generateWeeksFromText(responseText);
          const insights = extractInsightsFromText(responseText);
          
          if (weeks.length > 0) {
            console.log(`Successfully parsed ${weeks.length} weeks from AI response`);
            programData = { weeks, aiInsights: insights };
          } else {
            console.log('Could not parse weeks from AI response, using basic program');
            // Fallback to basic program
            programData = generateBasicProgram();
            programData.aiInsights = insights;
          }
        } else {
          console.log('Program response has unknown format, using basic program');
          // Unknown format, use basic program
          programData = generateBasicProgram();
        }
      } else {
        console.log('No valid program response, using basic program');
        // No valid response, use basic program
        programData = generateBasicProgram();
      }
      
      console.log('Final program data:', programData);

      // Prepare program data for saving
      const programToSave = {
        name: `${predictedGrade} Development Program`,
        currentWeek: 1,
        totalWeeks: 6,
        nextSession: "Fingerboard + Projects",
        todayComplete: false,
        detailedProgram: programData,
        targetGrade: assessmentData.targetGrade,
        initialGrade: assessmentData.currentGrade,
        totalSessions: 18 // 6 weeks * 3 sessions per week
      };

      // Update program data in state
      setProgramData(programToSave);

      // Save program to database (non-blocking)
      console.log('Attempting to save program to database...');
      try {
        // Get the latest assessment ID for this user
        const latestAssessment = await climbingPillAPI.getLatestAssessment(user.id);
        const assessmentId = latestAssessment?.id;
        console.log('Retrieved assessment ID:', assessmentId);
        
        await climbingPillAPI.saveTrainingProgram(
          {
            ...programToSave,
            userId: user.id,
            assessmentId: assessmentId // Link to the assessment that was just completed
          }, 
          user.id
        );
        console.log('Training program saved to database successfully');
      } catch (saveError) {
        console.error('Failed to save training program to database:', saveError);
        console.error('Save error details:', saveError);
        // Continue anyway - the program is still available in the frontend
        console.log('Continuing with frontend program data despite save error');
      }

      // Update user data to show assessment completed
      setUserData(prev => ({
        ...prev,
        hasCompletedAssessment: true
      }));

      // Reset generating state and switch to training view
      console.log('Assessment and program generation completed successfully');
      setIsGeneratingProgram(false);
      setActiveView('training');

    } catch (error) {
      console.error('Error completing assessment:', error);
      console.error('Error details:', error);
      alert('There was an error processing your assessment. Please try again.');
      setIsGeneratingProgram(false);
    }
  };

  const calculateCompositeScore = (data: typeof assessmentData) => {
    const bodyWeight = parseFloat(data.bodyWeight) || 70;
    const height = parseFloat(data.height) || 170;
    const addedWeight = parseFloat(data.addedWeight) || 0;
    const pullUps = parseInt(data.pullUpsMax) || 0;
    const pushUps = parseInt(data.pushUpsMax) || 0;
    const toeToBar = parseInt(data.toeToBarMax) || 0;
    const legSpread = parseFloat(data.legSpread) || 160;

    // Normalize metrics by body weight and height
    const fingerStrengthRatio = (bodyWeight + addedWeight) / bodyWeight;
    const pullUpRatio = pullUps / bodyWeight * 100;
    const pushUpRatio = pushUps / bodyWeight * 100;
    const coreStrengthRatio = toeToBar / bodyWeight * 100;
    const flexibilityRatio = legSpread / height;

    // Weighted composite score (ClimbingPill methodology)
    const compositeScore = (
      fingerStrengthRatio * 0.45 +  // 45% finger strength
      pullUpRatio * 0.20 +          // 20% pull-ups
      pushUpRatio * 0.10 +          // 10% push-ups  
      coreStrengthRatio * 0.15 +    // 15% core strength
      flexibilityRatio * 0.10       // 10% flexibility
    );

    return Math.round(compositeScore * 100) / 100;
  };

  const predictGrade = (compositeScore: number) => {
    // Grade prediction based on composite score thresholds
    if (compositeScore >= 1.2) return "V12";
    if (compositeScore >= 1.1) return "V11";
    if (compositeScore >= 1.0) return "V10";
    if (compositeScore >= 0.9) return "V9";
    if (compositeScore >= 0.8) return "V8";
    if (compositeScore >= 0.7) return "V7";
    if (compositeScore >= 0.6) return "V6";
    if (compositeScore >= 0.5) return "V5";
    return "V4";
  };

  const TrainingView = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-mastra-2xl font-semibold text-white">Training Program</h1>
          <p className="text-gray-400">{programData.name}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-400">Week {programData.currentWeek} of {programData.totalWeeks}</p>
          <div className="w-24 bg-gray-800 rounded-full h-2 mt-1">
            <div 
              className="bg-white h-2 rounded-full" 
              style={{width: `${(programData.currentWeek / programData.totalWeeks) * 100}%`}}
            ></div>
          </div>
        </div>
      </div>

      {/* AI Program Insights */}
      <div className="glass-strong rounded-xl p-6">
        <div className="flex items-start space-x-3">
          <AICoachIcon className="w-6 h-6 text-white mt-1" />
          <div>
            <h3 className="font-semibold text-white mb-2">AI Program Analysis</h3>
            <p className="text-gray-300 text-sm mb-3">
              Your program is optimized for V8 progression, targeting your finger strength weakness. 
              Current adherence: 85% - excellent! The AI detected improvement in your last session.
            </p>
            <button 
              onClick={() => setChatOpen(true)}
              className="text-white text-sm hover:text-gray-300 transition-colors"
            >
              💬 Ask AI to explain this program →
            </button>
          </div>
        </div>
      </div>

      {/* Week Overview */}
      <div className="glass rounded-xl p-6">
        <h2 className="text-mastra-lg font-semibold mb-4 text-white">This Week&apos;s Schedule</h2>
        {programData.detailedProgram ? (
          <div className="space-y-4">
            {/* Current Week Details */}
            {programData.detailedProgram.weeks?.find((w: any) => w.weekNumber === programData.currentWeek)?.days?.map((dayData: any, index: number) => {
              const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
              const isToday = dayData.day === today;
              
              return (
                <div key={dayData.day} className={`p-4 rounded-lg border transition-all hover:scale-[1.02] ${
                  isToday ? 'bg-white text-black border-white shadow-md' : 'surface-primary border-contrast'
                }`}>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className={`font-semibold ${isToday ? 'text-black' : 'text-white'}`}>
                      {dayData.day}
                      {isToday && <span className="ml-2 text-xs bg-black text-white px-2 py-1 rounded">Today</span>}
                    </h3>
                  </div>
                  {dayData.sessions?.map((session: any, sessionIndex: number) => (
                    <div key={sessionIndex} className="mb-3 last:mb-0">
                      <p className={`text-sm font-medium ${isToday ? 'text-gray-700' : 'text-gray-300'}`}>
                        {session.type} • {session.duration}min • {session.intensity}
                      </p>
                      <div className={`text-xs mt-1 ${isToday ? 'text-gray-600' : 'text-gray-400'}`}>
                        {session.exercises?.slice(0, 2).join(' • ')}
                        {session.exercises?.length > 2 && ` • +${session.exercises.length - 2} more`}
                      </div>
                      {session.notes && (
                        <p className={`text-xs mt-1 italic ${isToday ? 'text-gray-500' : 'text-gray-500'}`}>
                          {session.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              );
            }) || (
              <div className="text-center text-gray-400 py-8">
                <p>Detailed program loading...</p>
                {programData.detailedProgram && (
                  <div className="mt-4 text-xs">
                    <p>Debug: Program data structure:</p>
                    <pre className="text-left bg-gray-800 p-2 rounded mt-2 overflow-auto max-h-32">
                      {JSON.stringify(programData.detailedProgram, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          // Fallback to simple schedule if detailed program not loaded
          <div className="grid grid-cols-2 md:grid-cols-7 gap-2">
            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((fullDay, index) => {
              const shortDay = fullDay.substring(0, 3);
              const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
              const isToday = fullDay === today;
              
              return (
                <div key={fullDay} className={`p-3 rounded-lg text-center transition-all hover:scale-105 ${
                  isToday ? 'bg-white text-black border-2 border-white shadow-md' : 
                  index < new Date().getDay() - 1 ? 'surface-tertiary border border-contrast' : 'surface-primary border border-contrast hover:bg-gray-800'
                }`}>
                  <p className={`text-xs font-medium ${isToday ? 'text-gray-600' : 'text-gray-400'}`}>{shortDay}</p>
                  <p className={`text-sm mt-1 font-medium ${isToday ? 'text-black' : 'text-white'}`}>
                    {index === 0 ? 'Fingerboard' :
                     index === 1 ? 'Rest' :
                     index === 2 ? 'Projects' :
                     index === 3 ? 'Flash' :
                     index === 4 ? 'Rest' :
                     index === 5 ? 'Endurance' :
                     'Rest'}
                  </p>
                  {isToday && (
                    <div className="mt-2">
                      <span className="text-xs bg-black text-white px-2 py-1 rounded">Today</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detailed Program View */}
      {programData.detailedProgram && (
        <div className="glass rounded-xl p-6">
          <h2 className="text-mastra-lg font-semibold mb-4 text-white">Complete 6-Week Program</h2>
          <div className="space-y-6">
            {programData.detailedProgram.weeks?.map((week: any) => (
              <div key={week.weekNumber} className={`border rounded-lg p-4 ${
                week.weekNumber === programData.currentWeek ? 'border-white bg-gray-800/50' : 'border-gray-600'
              }`}>
                <h3 className="text-white font-semibold mb-2">
                  Week {week.weekNumber} - {week.focus}
                  {week.weekNumber === programData.currentWeek && (
                    <span className="ml-2 text-xs bg-white text-black px-2 py-1 rounded">Current</span>
                  )}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {week.days?.map((day: any) => (
                    <div key={day.day} className="surface-primary border border-contrast rounded p-3">
                      <h4 className="text-white text-sm font-medium mb-2">{day.day}</h4>
                      {day.sessions?.map((session: any, idx: number) => (
                        <div key={idx} className="text-xs text-gray-300 mb-2 last:mb-0">
                          <p className="font-medium">{session.type}</p>
                          <p className="text-gray-400">{session.duration}min • {session.intensity}</p>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          {/* AI Insights */}
          {programData.detailedProgram.aiInsights && (
            <div className="mt-6 p-4 bg-gray-800/30 rounded-lg border border-gray-600">
              <h4 className="text-white font-semibold mb-2">AI Program Insights</h4>
              <ul className="text-gray-300 text-sm space-y-1">
                {programData.detailedProgram.aiInsights.map((insight: string, idx: number) => (
                  <li key={idx} className="flex items-start">
                    <span className="text-gray-500 mr-2">•</span>
                    {insight}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );

  // AI Chat Component - Memoized to prevent re-renders
  const AIChat = memo(function AIChat() {
    const [localInputMessage, setLocalInputMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    
    // Auto-scroll to bottom when messages change
    useEffect(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);
    
    const handleLocalInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      setLocalInputMessage(e.target.value);
    }, []);
    
    const handleSendMessage = useCallback(async () => {
      if (!localInputMessage.trim()) return;

      if (!user) {
        alert('Please sign in to chat with your AI coach.');
        setAuthModalOpen(true);
        return;
      }

      const userMessage = { role: 'user', content: localInputMessage, confidence: 1.0 };
      setMessages(prev => [...prev, userMessage]);
      setLocalInputMessage('');
      setIsTyping(true);

      try {
        const response = await climbingPillAPI.chat(localInputMessage, user.id);
        setMessages(prev => [...prev, response]);
        setIsTyping(false);
      } catch (error) {
        console.error('Error sending message:', error);
        const fallbackMessage = { 
          role: 'assistant', 
          content: "I'm having trouble connecting right now. Please try again in a moment.",
          confidence: 0.1
        };
        setMessages(prev => [...prev, fallbackMessage]);
        setIsTyping(false);
      }
    }, [localInputMessage, user]);

    const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
      }
    }, [handleSendMessage]);

    return (
      <div className="modal-mobile">
        <div className="modal-content-mobile">
          <div className="h-full max-h-[80vh] flex flex-col">
            {/* Header - Mobile Optimized */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-800">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-gradient-to-r from-pink-500 to-teal-500 flex items-center justify-center">
                  <AICoachIcon className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-mastra-base">AI Climbing Coach</h3>
                  <p className="text-mastra-xs text-gray-400">Always here to help</p>
                </div>
              </div>
              <button 
                onClick={() => setChatOpen(false)}
                className="text-gray-400 hover:text-white transition-colors touch-target-comfortable"
              >
                <X className="h-5 w-5 lg:h-6 lg:w-6" />
              </button>
            </div>

            {/* Messages - Mobile Optimized */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4 scroll-smooth hide-scrollbar">
              {messages.map((message, index) => (
                <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] lg:max-w-[80%] p-3 lg:p-4 rounded-2xl ${
                    message.role === 'user' 
                      ? 'bg-white text-black' 
                      : 'bg-gray-800 text-white border border-gray-700'
                  }`}>
                    <div className="text-mastra-sm lg:text-mastra-base leading-relaxed prose prose-invert prose-sm max-w-none">
                      {message.role === 'assistant' ? (
                        <JournalNotice content={message.content} />
                      ) : (
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                      )}
                    </div>
                    {message.role === 'assistant' && message.confidence && (
                      <ConfidenceIndicator confidence={message.confidence} />
                    )}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-gray-800 text-white p-3 lg:p-4 rounded-2xl border border-gray-700">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                  </div>
                </div>
              )}
              {/* Invisible element to scroll to */}
              <div ref={messagesEndRef} />
            </div>

            {/* Input - Mobile Optimized */}
            <div className="pt-4 border-t border-gray-800 safe-area-bottom">
              <div className="flex space-x-3">
                <input
                  type="text"
                  value={localInputMessage}
                  onChange={handleLocalInputChange}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask your AI coach anything..."
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-2xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent text-mastra-base"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!localInputMessage.trim() || isTyping}
                  className="bg-white text-black p-3 rounded-2xl hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-target-comfortable"
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  });

  // Sidebar Component
  const Sidebar = () => (
    <div className={`fixed inset-y-0 left-0 z-40 w-64 bg-gray-900 border-r border-gray-800 transform transition-transform duration-300 ${
      sidebarOpen ? 'translate-x-0' : '-translate-x-full'
    } lg:translate-x-0 lg:static lg:inset-0`}>
      <div className="p-6">
        <div className="flex items-center justify-between lg:justify-center">
          <div className="flex items-center">
            <ClimbingPillLogo className="h-8" />
          </div>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-white hover:text-gray-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
      </div>
      
      <nav className="px-6 space-y-2">
        {navigation.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              setActiveView(item.id);
              setSidebarOpen(false);
            }}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
              activeView === item.id
                ? 'bg-white text-black border border-gray-300'
                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
            }`}
          >
            <item.icon className="h-5 w-5" />
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* User Profile */}
      <div className="absolute bottom-6 left-6 right-6">
        <div className="flex items-center space-x-3 p-3 bg-gray-800 rounded-lg border border-gray-700">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-black font-medium">
            {userData.avatar}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate text-white">{userData.name}</p>
            <p className="text-xs text-gray-400 capitalize">{userData.subscription}</p>
          </div>
          <button
            onClick={async () => {
              try {
                await signOut();
              } catch (error) {
                console.error('Logout error:', error);
              }
            }}
            className="text-gray-400 hover:text-white transition-colors"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  // Main render function
  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardView />;
      case 'assessment':
        return <AssessmentView 
          assessmentStep={assessmentStep}
          assessmentData={assessmentData}
          updateAssessmentData={(field, value) => setAssessmentData(prev => ({ ...prev, [field]: value }))}
          nextAssessmentStep={nextAssessmentStep}
          prevAssessmentStep={prevAssessmentStep}
          isGeneratingProgram={isGeneratingProgram}
          setChatOpen={setChatOpen}
        />;
      case 'training':
        return <TrainingView />;
      case 'progress':
        return <div className="text-center py-12">
          <ProgressChartIcon className="h-16 w-16 mx-auto text-gray-600 mb-4" />
          <h3 className="text-mastra-xl text-white mb-2">Progress Tracking</h3>
          <p className="text-gray-400">Coming soon - Track your climbing progress over time</p>
        </div>;
      case 'schedule':
        return <div className="text-center py-12">
          <ScheduleIcon className="h-16 w-16 mx-auto text-gray-600 mb-4" />
          <h3 className="text-mastra-xl text-white mb-2">Training Schedule</h3>
          <p className="text-gray-400">Coming soon - Manage your training calendar</p>
        </div>;
      default:
        return <DashboardView />;
    }
  };

  // Show loading state
  if (loading && !loadingTimeout) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <div className="flex items-center justify-center mb-4">
            <ClimbingPillLogo className="h-12" />
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

  // Show timeout fallback
  if (loadingTimeout && !user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-center max-w-md mx-auto px-4">
          <div className="flex items-center justify-center mb-4">
            <ClimbingPillLogo className="h-12" />
          </div>
          <h2 className="text-xl font-bold mb-4">Connection Issue</h2>
          <p className="text-gray-400 mb-6">
            We're having trouble connecting to your account. This might be a temporary network issue.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => {
                setLoadingTimeout(false)
                window.location.reload()
              }}
              className="w-full bg-white text-black py-3 px-6 rounded-lg font-medium hover:bg-gray-100 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => router.push('/')}
              className="w-full border border-gray-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-gray-800 transition-colors"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show auth modal if not authenticated
  if (!user) {
    return null; // Will redirect to landing page
  }

  return (
    <div className="min-h-screen bg-black flex flex-col lg:flex-row safe-area-top">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>
      
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="lg:hidden">
            <Sidebar />
          </div>
        </>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen lg:min-h-0">
        {/* Mobile-First Header */}
        <header className="bg-gray-900 border-b border-gray-800 px-4 lg:px-6 py-3 lg:py-4 sticky top-0 z-20 safe-area-top">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-white hover:text-gray-300 touch-target-comfortable"
              >
                <Menu className="h-6 w-6" />
              </button>
              <div className="lg:hidden">
                <ClimbingPillLogo className="h-6" />
              </div>
            </div>
            
            <div className="flex items-center space-x-3 lg:space-x-4">
              <div className="text-right hidden sm:block">
                <p className="text-xs lg:text-sm text-gray-400">Current Grade</p>
                <p className="font-bold text-white text-sm lg:text-base">{userData.currentGrade || 'Not Set'}</p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 lg:w-10 lg:h-10 bg-white text-black rounded-full flex items-center justify-center font-medium text-sm lg:text-base">
                  {userData.avatar}
                </div>
                {/* Mobile Sign Out Button */}
                <button
                  onClick={async () => {
                    try {
                      await signOut();
                    } catch (error) {
                      console.error('Logout error:', error);
                    }
                  }}
                  className="lg:hidden text-gray-400 hover:text-white transition-colors touch-target-comfortable"
                  title="Sign out"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area - Mobile First */}
        <main className="flex-1 p-4 lg:p-6 max-w-7xl mx-auto w-full mobile-nav-spacing lg:pb-6">
          {renderView()}
        </main>

        {/* Mobile Bottom Navigation */}
        <nav className="mobile-nav lg:hidden">
          <div className="flex justify-around items-center">
            {navigation.slice(0, 4).map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveView(item.id);
                  setSidebarOpen(false);
                }}
                className={`flex flex-col items-center space-y-1 py-2 px-3 rounded-lg transition-colors touch-target-comfortable ${
                  activeView === item.id
                    ? 'text-white bg-gray-800'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <item.icon className="h-5 w-5" />
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            ))}
            <button
              onClick={() => setChatOpen(true)}
              className="flex flex-col items-center space-y-1 py-2 px-3 rounded-lg transition-colors touch-target-comfortable text-gray-400 hover:text-white"
            >
              <MessageCircle className="h-5 w-5" />
              <span className="text-xs font-medium">Coach</span>
            </button>
          </div>
        </nav>
      </div>

      {/* Desktop Floating AI Chat Button - Hidden on mobile since Coach is in bottom nav */}
      {!chatOpen && (
        <button 
          onClick={() => setChatOpen(true)}
          className="hidden lg:flex fixed floating-bottom-mobile right-6 w-14 h-14 bg-white text-black rounded-full shadow-lg hover:scale-110 transition-transform z-40 items-center justify-center"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {/* AI Chat Interface */}
      {chatOpen && <AIChat />}
    </div>
  );
};

export default ClimbingPillApp; 