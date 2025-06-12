'use client';

import React, { useState, useEffect } from 'react';
import { climbingPillAPI } from '../lib/mastra-client';
import { 
  ClimbingPillLogo,
  ClimbingGradeIcon,
  StrengthMeterIcon,
  PowerTrainingIcon,
  AssessmentIcon,
  ProgressChartIcon,
  TrainingPlanIcon,
  ScheduleIcon,
  AICoachIcon,
  ClimbingMountainIcon
} from '../components/icons';
import {
  MessageCircle, 
  Menu,
  X,
  ChevronRight,
  Send,
  Mic,
  Minimize2,
  Maximize2,
  PlayCircle,
  CheckCircle,
  Award,
  RotateCcw
} from 'lucide-react';

const ClimbingPillApp = () => {
  const [activeView, setActiveView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMinimized, setChatMinimized] = useState(false);
  const [messages, setMessages] = useState<Array<{role: string; content: string; confidence?: number}>>([
    { role: 'assistant', content: "Hi! I'm your ClimbingPill AI coach. Ready to crush your climbing goals today?", confidence: 0.95 },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // User data - loaded from Mastra backend
  const [userData, setUserData] = useState({
    name: "Alex Chen",
    currentGrade: "V7",
    targetGrade: "V8", 
    assessmentScore: 0.82,
    programProgress: 65,
    subscription: "premium",
    avatar: "AC"
  });

  const [programData, setProgramData] = useState({
    name: "V8 Power Development",
    currentWeek: 3,
    totalWeeks: 6,
    nextSession: "Fingerboard + Projects",
    todayComplete: false
  });

  // Load user data from Mastra on component mount
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userId = 'demo-user'; // In real app, get from auth
        const [userProfile, trainingProgram] = await Promise.all([
          climbingPillAPI.getUserProfile(userId),
          climbingPillAPI.getTrainingProgram(userId)
        ]);
        
        setUserData(userProfile);
        setProgramData(trainingProgram);
      } catch (error) {
        console.error('Error loading user data:', error);
        // Keep default mock data as fallback
      }
    };

    loadUserData();
  }, []);

  const navigation = [
    { id: 'dashboard', label: 'Dashboard', icon: ProgressChartIcon },
    { id: 'assessment', label: 'Assessment', icon: AssessmentIcon },
    { id: 'training', label: 'Training', icon: TrainingPlanIcon },
    { id: 'progress', label: 'Progress', icon: StrengthMeterIcon },
    { id: 'schedule', label: 'Schedule', icon: ScheduleIcon },
  ];

  // AI Chat Functions - connected to Mastra backend
  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = { role: 'user', content: inputMessage };
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    try {
      // Call real Mastra API
      const response = await climbingPillAPI.chat(inputMessage);
      
      setMessages(prev => [...prev, response]);
      setIsTyping(false);
    } catch (error) {
      console.error('Error sending message:', error);
      // Fallback response
      const fallbackMessage = { 
        role: 'assistant', 
        content: "I'm having trouble connecting right now. Please try again in a moment.",
        confidence: 0.1
      };
      
      setMessages(prev => [...prev, fallbackMessage]);
      setIsTyping(false);
    }
  };

  // Helper Components
  const StatCard = ({ icon: Icon, label, value, sublabel, trend }: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: string;
    sublabel: string;
    trend?: string;
  }) => (
    <div className="glass rounded-2xl p-6 hover-lift">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-400 font-medium">{label}</p>
          <p className="text-3xl font-bold mt-2 text-white tracking-tight">{value}</p>
          <p className="text-sm text-gray-400 mt-1">{sublabel}</p>
          {trend && <p className="text-sm text-white mt-2 font-medium">{trend}</p>}
        </div>
        <div className="p-3 rounded-2xl bg-gray-800 border border-gray-700">
          <Icon className="h-8 w-8 text-white" />
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
      className="glass-subtle rounded-2xl p-5 text-left hover-lift group"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-start space-x-4">
          <div className="p-2 rounded-xl bg-gray-800 group-hover:bg-gray-700 transition-colors border border-gray-700">
            <Icon className="h-6 w-6 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold text-white text-mastra-base">{title}</h3>
              {aiSuggested && (
                <span className="text-xs bg-white text-black px-2.5 py-1 rounded-full font-medium">AI</span>
              )}
            </div>
            <p className="text-mastra-sm text-gray-400 mt-1">{subtitle}</p>
          </div>
        </div>
        <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-white transition-colors" />
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

  // Dashboard View
  const DashboardView = () => (
    <div className="space-y-6">
      {/* Welcome Header with AI Integration */}
      <div className="gradient-accent rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl border border-gray-800">
        <div className="relative z-10">
          <h1 className="text-mastra-2xl font-semibold mb-3">Welcome back, {userData.name}</h1>
                      <p className="text-gray-300 mb-6 text-mastra-base">Ready to crush your climbing goals today?</p>
          <button 
            onClick={() => setChatOpen(true)}
            className="bg-white text-black font-semibold px-6 py-3 rounded-2xl hover-lift hover:bg-gray-100 transition-colors"
          >
            💬 Ask your AI coach
          </button>
        </div>
        <ClimbingMountainIcon className="absolute top-6 right-6 w-28 h-28 text-white/10" />
      </div>

      {/* Smart Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard 
          icon={ClimbingGradeIcon}
          label="Current Grade"
          value={userData.currentGrade}
          sublabel={`Target: ${userData.targetGrade}`}
          trend="+1 grade in 8 weeks"
        />
        <StatCard 
          icon={StrengthMeterIcon}
          label="Assessment Score"
          value={userData.assessmentScore.toFixed(2)}
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

      {/* AI-Enhanced Today's Session */}
      <div className="gradient-lime-teal rounded-3xl p-8 text-white shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center mb-3">
              <div className="p-2 rounded-xl bg-white/20 mr-3">
                <AICoachIcon className="w-5 h-5" />
              </div>
              <span className="text-white/90 font-medium">AI Optimized Session</span>
            </div>
            <h2 className="text-2xl font-bold mb-3 tracking-tight">Today&apos;s Training</h2>
            <p className="text-white/90 text-lg mb-2">{programData.nextSession}</p>
            <p className="text-white/80 leading-relaxed">Targeting finger strength weakness • 90 min</p>
          </div>
          <div className="flex flex-col space-y-3">
            <button className="bg-white text-blue-600 px-8 py-4 rounded-2xl font-semibold hover-lift flex items-center shadow-lg">
              <PlayCircle className="w-5 h-5 mr-2" />
              Start Session
            </button>
            <button 
              onClick={() => setChatOpen(true)}
              className="glass-subtle text-white px-6 py-3 rounded-2xl font-medium hover-lift border-white/20"
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            onClick={() => setChatOpen(true)}
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

  // Assessment View with AI Guidance
  const AssessmentView = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-mastra-2xl font-semibold mb-2 text-white">Physical Assessment</h1>
        <p className="text-gray-400">Get your personalized training program based on scientific analysis</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Assessment Form */}
        <div className="lg:col-span-2">
          <div className="glass rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-mastra-xl font-semibold text-white">Assessment Progress</h2>
              <span className="text-sm text-gray-400">Step 1 of 5</span>
            </div>
            
            <div className="w-full bg-gray-800 rounded-full h-2 mb-6">
              <div className="bg-white h-2 rounded-full transition-all duration-300" style={{width: '20%'}}></div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Body Weight (kg)
                </label>
                <input 
                  type="number" 
                  placeholder="70"
                  className="w-full px-4 py-3 surface-tertiary border border-contrast rounded-lg focus:ring-2 focus:ring-white focus:border-white text-white placeholder-gray-400"
                />
                <p className="text-xs text-gray-400 mt-1">💬 Ask AI: &quot;Why do you need my weight?&quot;</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Pull-ups Maximum
                </label>
                <input 
                  type="number" 
                  placeholder="15"
                  className="w-full px-4 py-3 surface-tertiary border border-contrast rounded-lg focus:ring-2 focus:ring-white focus:border-white text-white placeholder-gray-400"
                />
                <p className="text-xs text-gray-400 mt-1">💡 AI Tip: Test when fresh, go to failure</p>
              </div>

              <button className="w-full bg-white text-black py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors">
                Continue Assessment
              </button>
            </div>
          </div>
        </div>

        {/* AI Assessment Assistant */}
        <div className="lg:col-span-1">
          <div className="glass-strong rounded-xl p-6">
            <div className="flex items-center mb-4">
              <AICoachIcon className="w-6 h-6 text-white mr-2" />
              <h3 className="font-semibold text-white">AI Assessment Guide</h3>
            </div>
            <div className="space-y-3 text-sm">
              <div className="surface-tertiary p-3 rounded-lg border border-contrast">
                <p className="font-medium text-white">Current Test: Pull-ups</p>
                <p className="text-gray-300">This measures your pulling power - crucial for steep climbing.</p>
              </div>
              <div className="surface-tertiary p-3 rounded-lg border border-contrast">
                <p className="font-medium text-white">Pro Tip:</p>
                <p className="text-gray-300">Warm up with 5-10 easy pull-ups before testing your max.</p>
              </div>
              <button 
                onClick={() => setChatOpen(true)}
                className="w-full bg-white text-black py-2 rounded-lg text-sm hover:bg-gray-200 transition-colors"
              >
                💬 Ask about this test
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Training View
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
        <div className="grid grid-cols-2 md:grid-cols-7 gap-2">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => (
            <div key={day} className={`p-3 rounded-lg text-center transition-all hover:scale-105 ${
              index === 2 ? 'bg-white text-black border-2 border-white shadow-md' : 
              index < 2 ? 'surface-tertiary border border-contrast' : 'surface-primary border border-contrast hover:bg-gray-800'
            }`}>
              <p className={`text-xs font-medium ${index === 2 ? 'text-gray-600' : 'text-gray-400'}`}>{day}</p>
              <p className={`text-sm mt-1 font-medium ${index === 2 ? 'text-black' : 'text-white'}`}>
                {index === 0 ? 'Fingerboard' :
                 index === 1 ? 'Rest' :
                 index === 2 ? 'Projects' :
                 index === 3 ? 'Flash' :
                 index === 4 ? 'Rest' :
                 index === 5 ? 'Endurance' :
                 'Rest'}
              </p>
              {index === 2 && (
                <div className="mt-2">
                  <span className="text-xs bg-black text-white px-2 py-1 rounded">Today</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // AI Chat Component
  const AIChat = () => (
    <div className={`fixed transition-all duration-300 z-50 ${
      chatMinimized 
        ? 'bottom-6 right-6 w-80 h-12' 
        : 'bottom-6 right-6 w-96 h-[500px]'
    } surface-secondary rounded-lg shadow-2xl border border-contrast overflow-hidden`}>
      {/* Chat Header */}
      <div className="bg-white text-black p-4 flex items-center justify-between border-b border-contrast">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
            <AICoachIcon className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-medium">AI Climbing Coach</p>
            <p className="text-xs text-gray-600">Ready to help • {userData.subscription}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => setChatMinimized(!chatMinimized)}
            className="text-gray-600 hover:text-black transition-colors"
          >
            {chatMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </button>
          <button 
            onClick={() => setChatOpen(false)}
            className="text-gray-600 hover:text-black transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!chatMinimized && (
        <>
          {/* Messages Area */}
          <div 
            className="flex-1 overflow-y-auto p-4 space-y-4 h-80"
            role="log"
            aria-live="polite"
            aria-label="AI conversation"
          >
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] px-4 py-2 rounded-lg ${
                  msg.role === 'user' 
                    ? 'bg-white text-black' 
                    : 'surface-tertiary text-white border border-contrast'
                }`}>
                  <p className="text-sm">{msg.content}</p>
                  {msg.role === 'assistant' && msg.confidence && (
                    <ConfidenceIndicator confidence={msg.confidence} />
                  )}
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="surface-tertiary px-4 py-2 rounded-lg border border-contrast">
                  <div className="flex items-center space-x-1">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                    <span className="text-xs text-gray-400 ml-2">AI is thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Suggestions */}
          <div className="px-4 py-2 border-t border-contrast">
            <div className="flex space-x-2 overflow-x-auto">
              {['Explain my weakness', 'Why this exercise?', 'Modify program'].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setInputMessage(suggestion)}
                  className="whitespace-nowrap text-xs surface-tertiary text-gray-300 px-3 py-1 rounded-full hover:bg-gray-700 hover:text-white transition-colors border border-contrast"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-contrast">
            <div className="flex space-x-2">
              <input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask about training, exercises, or climbing..."
                className="flex-1 px-3 py-2 surface-tertiary border border-contrast rounded-lg focus:outline-none focus:ring-2 focus:ring-white text-sm text-white placeholder-gray-400"
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                aria-label="Chat input"
              />
              <button 
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Voice input"
              >
                <Mic className="w-5 h-5" />
              </button>
              <button 
                onClick={sendMessage}
                className="bg-white text-black p-2 rounded-lg hover:bg-gray-200 transition-colors"
                aria-label="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );

  const Sidebar = () => (
    <div className={`fixed inset-y-0 left-0 z-40 w-64 surface-secondary border-r border-contrast transform transition-transform duration-300 ${
      sidebarOpen ? 'translate-x-0' : '-translate-x-full'
    } lg:translate-x-0 lg:static lg:inset-0`}>
      <div className="p-6">
        <div className="flex items-center justify-between lg:justify-center">
                  <div className="flex items-center space-x-2">
          <ClimbingPillLogo className="w-8 h-8" />
          <h1 className="text-mastra-lg font-semibold text-white">
            ClimbingPill
          </h1>
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
            <span className="text-mastra-base font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* User Profile */}
      <div className="absolute bottom-6 left-6 right-6">
        <div className="flex items-center space-x-3 p-3 surface-tertiary rounded-lg border border-contrast">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-black font-medium">
            {userData.avatar}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-mastra-sm font-medium truncate text-white">{userData.name}</p>
            <div className="flex items-center space-x-2">
              <p className="text-xs text-gray-400 capitalize">{userData.subscription}</p>
              <AICoachIcon className="w-3 h-3 text-white" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderView = () => {
    switch (activeView) {
      case 'assessment': return <AssessmentView />;
      case 'training': return <TrainingView />;
      case 'progress': return <div className="text-center text-gray-400 mt-20">Progress tracking with AI insights coming soon...</div>;
      case 'schedule': return <div className="text-center text-gray-400 mt-20">Smart scheduling with AI optimization coming soon...</div>;
      default: return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen bg-black flex">
      <Sidebar />
      
      {/* Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 lg:ml-0">
        {/* Header */}
        <header className="surface-secondary border-b border-contrast px-6 py-4 sticky top-0 z-20">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-white hover:text-gray-300"
              aria-label="Open sidebar"
            >
              <Menu className="h-6 w-6" />
            </button>
            
            <div className="flex items-center space-x-4 ml-auto">
              <div className="text-right">
                <p className="text-sm text-gray-400">Current Grade</p>
                <p className="font-bold text-white">{userData.currentGrade}</p>
              </div>
              <div className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center font-medium">
                {userData.avatar}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="p-6 max-w-7xl mx-auto">
          {renderView()}
        </main>
      </div>

      {/* Floating AI Chat Button */}
      {!chatOpen && (
        <button 
          onClick={() => setChatOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-white text-black rounded-full shadow-lg hover:scale-110 transition-transform z-40 flex items-center justify-center border border-gray-300"
          aria-label="Open AI chat"
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
