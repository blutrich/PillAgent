'use client';

import React, { useState, useEffect, useCallback, memo } from 'react';
import { climbingPillAPI } from '../lib/mastra-client';
import { useAuth } from '../lib/auth-context';
import AssessmentView from '../components/AssessmentView';
import AuthModal from '../components/AuthModal';
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
  RotateCcw,
  LogOut
} from 'lucide-react';

const ClimbingPillApp = () => {
  const { user, userProfile, loading, signOut } = useAuth();
  const [activeView, setActiveView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMinimized, setChatMinimized] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('login');
  const [messages, setMessages] = useState<Array<{role: string; content: string; confidence?: number}>>([
    { role: 'assistant', content: "Hi! I'm your ClimbingPill AI coach. Ready to crush your climbing goals today?", confidence: 0.95 },
  ]);
  // inputMessage moved to AIChat component
  const [isTyping, setIsTyping] = useState(false);

  // User data - loaded from Mastra backend or defaults
  const [userData, setUserData] = useState({
    name: userProfile?.first_name ? `${userProfile.first_name} ${userProfile.last_name || ''}`.trim() : "Climber",
    currentGrade: "V7",
    targetGrade: "V8", 
    assessmentScore: 0.82,
    programProgress: 65,
    subscription: userProfile?.subscription_tier || "free",
    avatar: userProfile?.first_name ? userProfile.first_name.charAt(0).toUpperCase() + (userProfile.last_name?.charAt(0).toUpperCase() || '') : "C"
  });

  const [programData, setProgramData] = useState<{
    name: string;
    currentWeek: number;
    totalWeeks: number;
    nextSession: string;
    todayComplete: boolean;
    detailedProgram: {
      weeks?: Array<{
        week: number;
        focus: string;
        sessions: Array<{
          day: string;
          type: string;
          exercises: Array<{
            name: string;
            sets: string;
            reps: string;
            notes: string;
          }>;
        }>;
      }>;
      aiInsights?: string[];
    } | null;
  }>({
    name: "V8 Power Development",
    currentWeek: 3,
    totalWeeks: 6,
    nextSession: "Fingerboard + Projects",
    todayComplete: false,
    detailedProgram: null
  });

  // Assessment state
  const [assessmentStep, setAssessmentStep] = useState(1);
  const [assessmentData, setAssessmentData] = useState({
    // Physical measurements
    bodyWeight: '',
    height: '',
    
    // Performance metrics
    addedWeight: '', // Weight added for 20mm edge hang
    hangTime: '', // Dead hang time (for reference)
    pullUpsMax: '',
    pushUpsMax: '',
    toeToBarMax: '',
    legSpread: '', // Flexibility measurement
    
    // Climbing grades
    currentGrade: '',
    targetGrade: '',
    eightyPercentGrade: '', // 80% success rate grade
    
    // Experience
    experience: '',
    weaknesses: [],
    
    // Training Preferences
    availableDays: '[]',
    sessionDuration: '',
    equipmentAvailable: '[]',
    trainingFocus: '[]',
    primaryWeakness: ''
  });
  const [isGeneratingProgram, setIsGeneratingProgram] = useState(false);

  // Load user data from Mastra when user is authenticated
  useEffect(() => {
    const loadUserData = async () => {
      if (!user) return;
      
      try {
        const [userProfileData, trainingProgram] = await Promise.all([
          climbingPillAPI.getUserProfile(user.id),
          climbingPillAPI.getTrainingProgram(user.id)
        ]);
        
        // Update userData with real profile data
        setUserData(prev => ({
          ...prev,
          name: userProfile?.first_name ? `${userProfile.first_name} ${userProfile.last_name || ''}`.trim() : userProfileData.name || "Climber",
          subscription: userProfile?.subscription_tier || userProfileData.subscription || "free",
          avatar: userProfile?.first_name ? userProfile.first_name.charAt(0).toUpperCase() + (userProfile.last_name?.charAt(0).toUpperCase() || '') : userProfileData.avatar || "C"
        }));
        setProgramData(trainingProgram);
      } catch (error) {
        console.error('Error loading user data:', error);
        // Keep default mock data as fallback
      }
    };

    loadUserData();
  }, [user, userProfile]);

  const navigation = [
    { id: 'dashboard', label: 'Dashboard', icon: ProgressChartIcon },
    { id: 'assessment', label: 'Assessment', icon: AssessmentIcon },
    { id: 'training', label: 'Training', icon: TrainingPlanIcon },
    { id: 'progress', label: 'Progress', icon: StrengthMeterIcon },
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
        alert('Please enter your leg spread distance.');
        return;
      }
    } else if (assessmentStep === 5) {
      if (!assessmentData.currentGrade || !assessmentData.targetGrade || !assessmentData.eightyPercentGrade) {
        alert('Please select all climbing grades (current, target, and 80% success rate).');
        return;
      }
    } else if (assessmentStep === 6) {
      if (!assessmentData.experience) {
        alert('Please select your climbing experience level.');
        return;
      }
    } else if (assessmentStep === 7) {
      const availableDays = JSON.parse(assessmentData.availableDays || '[]');
      if (availableDays.length === 0) {
        alert('Please select at least one available training day.');
        return;
      }
      if (!assessmentData.sessionDuration) {
        alert('Please select your preferred session duration.');
        return;
      }
      if (!assessmentData.primaryWeakness) {
        alert('Please select your primary training focus.');
        return;
      }
    }

    if (assessmentStep < 8) {
      setAssessmentStep(assessmentStep + 1);
    } else {
      // Complete assessment and generate program
      completeAssessment();
    }
  };

  const prevAssessmentStep = () => {
    if (assessmentStep > 1) {
      setAssessmentStep(assessmentStep - 1);
    }
  };

  const completeAssessment = async () => {
    if (!user) {
      alert('Please sign in to complete your assessment.');
      setAuthModalOpen(true);
      return;
    }

    setIsGeneratingProgram(true);
    
    try {
      console.log('Starting assessment with data:', assessmentData);
      
      // Validate all required fields
      const requiredFields = ['bodyWeight', 'height', 'addedWeight', 'pullUpsMax', 'pushUpsMax', 'toeToBarMax', 'legSpread', 'currentGrade', 'targetGrade', 'eightyPercentGrade', 'experience', 'sessionDuration', 'primaryWeakness'];
      const missingFields = requiredFields.filter(field => !assessmentData[field as keyof typeof assessmentData]);
      
      // Check if at least one training day is selected
      const trainingDays = JSON.parse(assessmentData.availableDays || '[]');
      if (trainingDays.length === 0) {
        missingFields.push('availableDays');
      }
      
      if (missingFields.length > 0) {
        alert(`Please fill in all required fields: ${missingFields.join(', ')}`);
        setIsGeneratingProgram(false);
        return;
      }
      
      // Calculate composite score using ClimbingPill methodology
      const { compositeScore, normalizedMetrics } = calculateCompositeScore(assessmentData);
      const predictedGrade = predictGrade(compositeScore);
      
      console.log('Composite Score:', compositeScore);
      console.log('Predicted Grade:', predictedGrade);
      console.log('Normalized Metrics:', normalizedMetrics);
      
      // Prepare comprehensive assessment data for Mastra API
      const comprehensiveAssessment = {
        ...assessmentData,
        userId: user.id, // Add the real user ID
        compositeScore: compositeScore.toFixed(3),
        predictedGrade,
        normalizedMetrics,
        assessmentMethodology: 'ClimbingPill Scientific Assessment',
        timestamp: new Date().toISOString()
      };
      
      // Call Mastra API to conduct assessment with full data
      const response = await climbingPillAPI.conductAssessment(comprehensiveAssessment);
      console.log('Assessment response:', response);
      
      // Generate detailed training program based on assessment
      console.log('Generating detailed training program...');
      
      // Parse training preferences
      const selectedDays = JSON.parse(assessmentData.availableDays || '[]');
      const equipmentAvailable = JSON.parse(assessmentData.equipmentAvailable || '[]');
      
      // Map day names to numbers for API
      const dayMapping: { [key: string]: number } = {
        'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 
        'Friday': 5, 'Saturday': 6, 'Sunday': 7
      };
      const availableDayNumbers = selectedDays.map((day: string) => dayMapping[day]).filter(Boolean);
      
      // Map equipment to API format
      const equipmentMapping: { [key: string]: string } = {
        'Home Fingerboard': 'fingerboard',
        'Gym Access': 'gym',
        'Pull-up Bar': 'pullup_bar',
        'Resistance Bands': 'bands',
        'Weights/Dumbbells': 'weights',
        'Campus Board': 'campus_board'
      };
      const mappedEquipment = equipmentAvailable.map((eq: string) => equipmentMapping[eq]).filter(Boolean);
      
      const programResponse = await climbingPillAPI.generateProgram(
        {
          predictedGrade,
          compositeScore,
          strongestArea: `Finger Strength (${normalizedMetrics.fingerStrength.toFixed(2)})`,
          weakestArea: `Core Strength (${normalizedMetrics.coreStrength.toFixed(2)})`,
          fingerStrengthRatio: normalizedMetrics.fingerStrength,
          pullUpRatio: normalizedMetrics.pullUps,
          pushUpRatio: normalizedMetrics.pushUps,
          toeToBarRatio: normalizedMetrics.coreStrength,
          flexibilityRatio: normalizedMetrics.flexibility,
          currentGrade: assessmentData.currentGrade,
          eightyPercentGrade: assessmentData.eightyPercentGrade,
          addedWeight: parseFloat(assessmentData.addedWeight)
        },
        {
          userId: user.id, // Add the real user ID
          availableDays: availableDayNumbers,
          sessionLength: parseInt(assessmentData.sessionDuration),
          equipment: mappedEquipment.length > 0 ? mappedEquipment : ['fingerboard', 'gym'],
          goals: [assessmentData.primaryWeakness.replace('_', ' ')],
          style: 'bouldering',
          experience: assessmentData.experience,
          name: 'ClimbingPill User'
        }
      );
      console.log('Program generation response:', programResponse);
      console.log('Program structure check:', {
        hasText: !!programResponse?.text,
        hasWeeks: !!programResponse?.weeks,
        hasProgramData: !!programResponse?.programData,
        fullStructure: Object.keys(programResponse || {})
      });
      
      // Update user data with assessment results
      setUserData(prev => ({
        ...prev,
        currentGrade: assessmentData.currentGrade,
        targetGrade: assessmentData.targetGrade,
        assessmentScore: compositeScore
      }));

      // Parse program response if it's in text format
      let parsedProgram = programResponse;
      if (programResponse?.text && !programResponse?.weeks) {
        try {
          // Try to extract JSON from the text response
          const jsonMatch = programResponse.text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            parsedProgram = JSON.parse(jsonMatch[0]);
          }
        } catch (e) {
          console.log('Could not parse program JSON from text, using raw response');
        }
      }

      // Update program data with detailed program
      setProgramData(prev => ({
        ...prev,
        name: `${assessmentData.targetGrade} Power Development`,
        currentWeek: 1,
        totalWeeks: 6,
        detailedProgram: parsedProgram
      }));

      // Switch to dashboard to show results
      setActiveView('dashboard');
      
      // Show success message with detailed analysis
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `🎯 Assessment Complete! Your composite score is ${compositeScore.toFixed(2)}, predicting ${predictedGrade} capability. Based on your target of ${assessmentData.targetGrade}, I've generated a comprehensive 6-week training program with detailed daily workouts, progressive loading, and personalized recommendations. Check the Training Program tab to see your complete plan with specific exercises, sets, reps, and coaching notes for each session.`,
        confidence: 0.95
      }]);
      setChatOpen(true);
      
    } catch (error) {
      console.error('Error completing assessment:', error);
      alert('There was an error generating your program. Please try again.');
    } finally {
      setIsGeneratingProgram(false);
    }
  };

  const updateAssessmentData = useCallback((field: string, value: string) => {
    setAssessmentData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  // handleInputChange moved to AIChat component

  // Calculate composite score according to ClimbingPill methodology
  const calculateCompositeScore = (data: typeof assessmentData) => {
    const bodyWeight = parseFloat(data.bodyWeight);
    const height = parseFloat(data.height);
    const addedWeight = parseFloat(data.addedWeight);
    const pullUps = parseFloat(data.pullUpsMax);
    const pushUps = parseFloat(data.pushUpsMax);
    const toeToBar = parseFloat(data.toeToBarMax);
    const legSpread = parseFloat(data.legSpread);

    // Normalize metrics
    const normalizedFingerStrength = (addedWeight + bodyWeight) / bodyWeight;
    const normalizedPullUps = pullUps / bodyWeight;
    const normalizedPushUps = pushUps / bodyWeight;
    const normalizedCoreStrength = toeToBar / bodyWeight;
    const normalizedFlexibility = legSpread / height;

    // Calculate weighted composite score
    const compositeScore = 
      (0.45 * normalizedFingerStrength) +
      (0.20 * normalizedPullUps) +
      (0.10 * normalizedPushUps) +
      (0.15 * normalizedCoreStrength) +
      (0.10 * normalizedFlexibility);

    return {
      compositeScore,
      normalizedMetrics: {
        fingerStrength: normalizedFingerStrength,
        pullUps: normalizedPullUps,
        pushUps: normalizedPushUps,
        coreStrength: normalizedCoreStrength,
        flexibility: normalizedFlexibility
      }
    };
  };

  // Predict grade based on composite score
  const predictGrade = (compositeScore: number) => {
    if (compositeScore > 1.45) return 'V12';
    if (compositeScore >= 1.30) return 'V11';
    if (compositeScore >= 1.15) return 'V10';
    if (compositeScore >= 1.05) return 'V9';
    if (compositeScore >= 0.95) return 'V8';
    if (compositeScore >= 0.85) return 'V7';
    if (compositeScore >= 0.75) return 'V6';
    if (compositeScore >= 0.65) return 'V5';
    return 'V4';
  };



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
        {programData.detailedProgram ? (
          <div className="space-y-4">
            {/* Current Week Details */}
            {programData.detailedProgram.weeks?.find((w: any) => w.weekNumber === programData.currentWeek)?.days?.map((dayData: any, index: number) => (
              <div key={dayData.day} className={`p-4 rounded-lg border transition-all hover:scale-[1.02] ${
                index === 2 ? 'bg-white text-black border-white shadow-md' : 'surface-primary border-contrast'
              }`}>
                <div className="flex justify-between items-start mb-2">
                  <h3 className={`font-semibold ${index === 2 ? 'text-black' : 'text-white'}`}>
                    {dayData.day}
                    {index === 2 && <span className="ml-2 text-xs bg-black text-white px-2 py-1 rounded">Today</span>}
                  </h3>
                </div>
                {dayData.sessions?.map((session: any, sessionIndex: number) => (
                  <div key={sessionIndex} className="mb-3 last:mb-0">
                    <p className={`text-sm font-medium ${index === 2 ? 'text-gray-700' : 'text-gray-300'}`}>
                      {session.type} • {session.duration}min • {session.intensity}
                    </p>
                    <div className={`text-xs mt-1 ${index === 2 ? 'text-gray-600' : 'text-gray-400'}`}>
                      {session.exercises?.slice(0, 2).join(' • ')}
                      {session.exercises?.length > 2 && ` • +${session.exercises.length - 2} more`}
                    </div>
                    {session.notes && (
                      <p className={`text-xs mt-1 italic ${index === 2 ? 'text-gray-500' : 'text-gray-500'}`}>
                        {session.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )) || (
              <div className="text-center text-gray-400 py-8">
                <p>Detailed program loading...</p>
                {programData.detailedProgram && (
                  <div className="mt-4 text-xs">
                    <p>Debug: Program data structure:</p>
                    <pre className="text-left bg-gray-800 p-2 rounded mt-2 overflow-auto max-h-32">
                      {JSON.stringify(Object.keys(programData.detailedProgram), null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          // Fallback to simple schedule if detailed program not loaded
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

      const userMessage = { role: 'user', content: localInputMessage };
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
      if (e.key === 'Enter') {
        handleSendMessage();
      }
    }, [handleSendMessage]);

    const handleSuggestionClick = useCallback((suggestion: string) => {
      setLocalInputMessage(suggestion);
    }, []);

    return (
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
                  onClick={() => handleSuggestionClick(suggestion)}
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
                value={localInputMessage}
                onChange={handleLocalInputChange}
                placeholder="Ask about training, exercises, or climbing..."
                className="flex-1 px-3 py-2 surface-tertiary border border-contrast rounded-lg focus:outline-none focus:ring-2 focus:ring-white text-sm text-white placeholder-gray-400"
                onKeyPress={handleKeyPress}
                aria-label="Chat input"
              />
              <button 
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Voice input"
              >
                <Mic className="w-5 h-5" />
              </button>
              <button 
                onClick={handleSendMessage}
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
  });

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

      {/* User Profile / Auth */}
      <div className="absolute bottom-6 left-6 right-6">
        {user ? (
          <div className="space-y-3">
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
              <button
                onClick={signOut}
                className="text-gray-400 hover:text-white transition-colors"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <button
              onClick={() => {
                setAuthModalMode('login');
                setAuthModalOpen(true);
              }}
              className="w-full bg-white text-black font-semibold py-3 px-4 rounded-xl hover:bg-gray-100 transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setAuthModalMode('signup');
                setAuthModalOpen(true);
              }}
              className="w-full border border-gray-600 text-white font-medium py-3 px-4 rounded-xl hover:bg-gray-800 transition-colors"
            >
              Sign Up
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const renderView = () => {
    switch (activeView) {
      case 'assessment': return (
        <AssessmentView 
          assessmentStep={assessmentStep}
          assessmentData={assessmentData}
          updateAssessmentData={updateAssessmentData}
          nextAssessmentStep={nextAssessmentStep}
          prevAssessmentStep={prevAssessmentStep}
          isGeneratingProgram={isGeneratingProgram}
          setChatOpen={setChatOpen}
        />
      );
      case 'training': return <TrainingView />;
      case 'progress': return <div className="text-center text-gray-400 mt-20">Progress tracking with AI insights coming soon...</div>;
      case 'schedule': return <div className="text-center text-gray-400 mt-20">Smart scheduling with AI optimization coming soon...</div>;
      default: return <DashboardView />;
    }
  };

  // Show loading screen while auth is initializing
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <svg className="w-12 h-12" viewBox="0 0 100 100" fill="none">
              <path d="M20 20 C20 10, 30 0, 40 0 L60 0 C70 0, 80 10, 80 20 L80 40 C80 50, 70 60, 60 60 L40 60 C30 60, 20 50, 20 40 Z" fill="#ff4d6d"></path>
              <circle cx="65" cy="35" r="25" fill="#a3d977"></circle>
              <path d="M30 40 C20 40, 10 50, 10 60 L10 70 C10 80, 20 90, 30 90 L60 90 C70 90, 80 80, 80 70 L80 60 C80 50, 70 40, 60 40 Z" fill="#2d9596"></path>
            </svg>
            <h1 className="text-3xl font-bold text-white">ClimbingPill</h1>
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
              {user ? (
                <>
                  <div className="text-right">
                    <p className="text-sm text-gray-400">Current Grade</p>
                    <p className="font-bold text-white">{userData.currentGrade}</p>
                  </div>
                  <div className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center font-medium">
                    {userData.avatar}
                  </div>
                </>
              ) : (
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => {
                      setAuthModalMode('login');
                      setAuthModalOpen(true);
                    }}
                    className="text-white hover:text-gray-300 transition-colors font-medium"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => {
                      setAuthModalMode('signup');
                      setAuthModalOpen(true);
                    }}
                    className="bg-white text-black font-semibold px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    Sign Up
                  </button>
                </div>
              )}
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

      {/* Authentication Modal */}
      <AuthModal 
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authModalMode}
      />
    </div>
  );
};

export default ClimbingPillApp;
