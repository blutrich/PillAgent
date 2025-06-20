import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../lib/auth-context'
import { climbingPillAPI } from '../lib/mastra-client-v2'
import ReactMarkdown from 'react-markdown'
import AssessmentModal from './AssessmentModal'
import { Send, Mic, User, Bot, Timer, Play, Pause, RotateCcw, CheckCircle, BarChart3, Calendar, Target, Zap, ClipboardList } from 'lucide-react'

// Rich rendering components for chat
const ProgramChart = ({ programData }: { programData: any }) => {
  if (!programData?.weeks) return null;
  
  return (
    <div className="bg-gray-800 rounded-lg p-4 my-4">
      <div className="flex items-center gap-2 mb-3">
        <BarChart3 className="w-5 h-5 text-lime-400" />
        <h3 className="text-white font-medium">Training Program Overview</h3>
      </div>
      <div className="grid grid-cols-6 gap-2">
        {programData.weeks.map((week: any, index: number) => (
          <div key={index} className="bg-gray-700 rounded p-2 text-center">
            <div className="text-xs text-gray-400">Week {week.weekNumber}</div>
            <div className="text-sm text-white font-medium">{week.focus}</div>
            <div className="text-xs text-lime-400">{week.sessions?.length || 0} sessions</div>
          </div>
        ))}
      </div>
    </div>
  )
}

const SessionTimer = ({ session }: { session: any }) => {
  // Handle both interval and duration timers
  const isIntervalTimer = session?.workTime && session?.restTime && session?.rounds
  
  // For interval timers
  const [currentRound, setCurrentRound] = useState(1)
  const [isWorkPhase, setIsWorkPhase] = useState(true) // true = work, false = rest
  const [timeLeft, setTimeLeft] = useState(
    isIntervalTimer 
      ? session.workTime 
      : (session?.duration ? session.duration * 60 : 5400)
  )
  const [isRunning, setIsRunning] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  
  // Dynamic editing state
  const [isEditing, setIsEditing] = useState(false)
  const [editWorkTime, setEditWorkTime] = useState(session?.workTime || 30)
  const [editRestTime, setEditRestTime] = useState(session?.restTime || 60)
  const [editRounds, setEditRounds] = useState(session?.rounds || 4)
  
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time: number) => {
          if (time <= 1) {
            if (isIntervalTimer) {
              // Handle interval transitions
              if (isWorkPhase) {
                // Work phase ending, switch to rest
                setIsWorkPhase(false)
                return session.restTime
              } else {
                // Rest phase ending
                if (currentRound < session.rounds) {
                  // Start next round
                  setCurrentRound(prev => prev + 1)
                  setIsWorkPhase(true)
                  return session.workTime
                } else {
                  // All rounds complete
                  setIsRunning(false)
                  setIsCompleted(true)
                  return 0
                }
              }
            } else {
              // Simple timer complete
              setIsRunning(false)
              setIsCompleted(true)
              return 0
            }
          }
          return time - 1
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isRunning, timeLeft, isWorkPhase, currentRound, session, isIntervalTimer])
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }
  
  const resetTimer = () => {
    if (isIntervalTimer) {
      setCurrentRound(1)
      setIsWorkPhase(true)
      setTimeLeft(session.workTime)
    } else {
      setTimeLeft(session?.duration * 60 || 5400)
    }
    setIsRunning(false)
    setIsCompleted(false)
  }
  
  const applyEdits = () => {
    // Update session data with new values
    session.workTime = editWorkTime
    session.restTime = editRestTime
    session.rounds = editRounds
    session.totalTime = (editWorkTime + editRestTime) * editRounds
    session.name = `${editWorkTime}s on ${editRestTime}s off × ${editRounds}`
    
    // Reset timer with new values
    setCurrentRound(1)
    setIsWorkPhase(true)
    setTimeLeft(editWorkTime)
    setIsRunning(false)
    setIsCompleted(false)
    setIsEditing(false)
  }
  
  return (
    <div className="bg-gray-800 rounded-lg p-4 my-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Timer className="w-5 h-5 text-pink-400" />
          <h3 className="text-white font-medium">
            {session?.name || 'Session Timer'}
          </h3>
        </div>
        {isIntervalTimer && (
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="text-gray-400 hover:text-white text-sm"
          >
            {isEditing ? 'Cancel' : 'Edit'}
          </button>
        )}
      </div>
      
      {isIntervalTimer && !isEditing && (
        <div className="text-center mb-4">
          <div className="flex items-center justify-center gap-4 mb-2">
            <div className={`px-3 py-1 rounded-full text-sm ${
              isWorkPhase ? 'bg-pink-500 text-white' : 'bg-gray-600 text-gray-300'
            }`}>
              WORK
            </div>
            <div className={`px-3 py-1 rounded-full text-sm ${
              !isWorkPhase ? 'bg-teal-500 text-white' : 'bg-gray-600 text-gray-300'
            }`}>
              REST
            </div>
          </div>
          <div className="text-sm text-gray-400">
            Round {currentRound} of {session.rounds}
          </div>
        </div>
      )}
      
      {isIntervalTimer && isEditing && (
        <div className="mb-4 p-3 bg-gray-700 rounded-lg">
          <div className="grid grid-cols-3 gap-3 mb-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Work (sec)</label>
              <input
                type="number"
                value={editWorkTime}
                onChange={(e) => setEditWorkTime(parseInt(e.target.value) || 0)}
                className="w-full bg-gray-600 text-white rounded px-2 py-1 text-sm"
                min="1"
                max="3600"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Rest (sec)</label>
              <input
                type="number"
                value={editRestTime}
                onChange={(e) => setEditRestTime(parseInt(e.target.value) || 0)}
                className="w-full bg-gray-600 text-white rounded px-2 py-1 text-sm"
                min="1"
                max="3600"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Rounds</label>
              <input
                type="number"
                value={editRounds}
                onChange={(e) => setEditRounds(parseInt(e.target.value) || 1)}
                className="w-full bg-gray-600 text-white rounded px-2 py-1 text-sm"
                min="1"
                max="50"
              />
            </div>
          </div>
          <div className="text-center">
            <button
              onClick={applyEdits}
              className="px-4 py-2 bg-lime-500 hover:bg-lime-600 text-white rounded-lg text-sm"
            >
              Apply Changes
            </button>
          </div>
          <div className="text-xs text-gray-400 text-center mt-2">
            Total: {Math.floor(((editWorkTime + editRestTime) * editRounds) / 60)}:{(((editWorkTime + editRestTime) * editRounds) % 60).toString().padStart(2, '0')}
          </div>
        </div>
      )}
      
      {!isEditing && (
        <div className="text-center">
          <div className={`text-4xl font-bold mb-4 ${
            isIntervalTimer 
              ? (isWorkPhase ? 'text-pink-400' : 'text-teal-400')
              : 'text-white'
          }`}>
            {formatTime(timeLeft)}
          </div>
          
          <div className="flex justify-center gap-2">
            <button
              onClick={() => setIsRunning(!isRunning)}
              className="flex items-center gap-2 px-4 py-2 bg-pink-500 hover:bg-pink-600 rounded-lg text-white"
            >
              {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {isRunning ? 'Pause' : 'Start'}
            </button>
            <button
              onClick={resetTimer}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-white"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
          </div>
          
          {isCompleted && (
            <div className="flex items-center justify-center gap-2 mt-4 text-lime-400">
              <CheckCircle className="w-5 h-5" />
              <span>
                {isIntervalTimer ? `${session.rounds} rounds complete!` : 'Session Complete!'}
              </span>
            </div>
          )}
          
          {isIntervalTimer && !isCompleted && (
            <div className="mt-4 text-sm text-gray-400">
              Total time: {formatTime(session.totalTime)}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const DrillCard = ({ drill }: { drill: any }) => (
  <div className="bg-gray-800 rounded-lg p-4 my-2">
    <div className="flex items-start justify-between mb-2">
      <h4 className="text-white font-medium">{drill.name}</h4>
      <span className="text-xs bg-teal-500 text-white px-2 py-1 rounded">
        {drill.sets}x{drill.reps} @ {drill.intensity}
      </span>
    </div>
    <p className="text-gray-300 text-sm mb-3">{drill.description}</p>
    {drill.tips && (
      <div className="text-xs text-lime-400 bg-gray-700 rounded p-2">
        💡 Tip: {drill.tips}
      </div>
    )}
  </div>
)

const WeeklySchedule = ({ week }: { week: any }) => (
  <div className="bg-gray-800 rounded-lg p-4 my-4">
    <div className="flex items-center gap-2 mb-3">
      <Calendar className="w-5 h-5 text-teal-400" />
      <h3 className="text-white font-medium">Week {week.weekNumber} Schedule</h3>
    </div>
    <div className="space-y-2">
      {week.days?.map((day: any, index: number) => (
        <div key={index} className="flex items-center justify-between p-2 bg-gray-700 rounded">
          <span className="text-white font-medium">{day.day}</span>
          <span className="text-sm text-gray-300">
            {day.sessions?.[0]?.type || 'Rest Day'}
          </span>
          {day.sessions?.[0] && (
            <span className="text-xs text-lime-400">
              {day.sessions[0].duration}min
            </span>
          )}
        </div>
      ))}
    </div>
  </div>
)

const AssessmentResults = ({ assessment }: { assessment: any }) => (
  <div className="bg-gray-800 rounded-lg p-4 my-4">
    <div className="flex items-center gap-2 mb-3">
      <Target className="w-5 h-5 text-pink-400" />
      <h3 className="text-white font-medium">Assessment Results</h3>
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div className="text-center">
        <div className="text-2xl font-bold text-pink-400">
          {assessment.predicted_grade || assessment.predictedGrade}
        </div>
        <div className="text-xs text-gray-400">Predicted Grade</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-lime-400">
          {Math.round(assessment.composite_score || assessment.compositeScore || 0)}
        </div>
        <div className="text-xs text-gray-400">Composite Score</div>
      </div>
    </div>
    <div className="mt-4 space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-gray-400">Finger Strength</span>
        <span className="text-white">{assessment.finger_strength_score || 'N/A'}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-gray-400">Pull-up Score</span>
        <span className="text-white">{assessment.pullup_score || 'N/A'}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-gray-400">Core Strength</span>
        <span className="text-white">{assessment.core_score || 'N/A'}</span>
      </div>
    </div>
  </div>
)

const ProgressChart = ({ progress }: { progress: any }) => (
  <div className="bg-gray-800 rounded-lg p-4 my-4">
    <div className="flex items-center gap-2 mb-3">
      <Zap className="w-5 h-5 text-lime-400" />
      <h3 className="text-white font-medium">Training Progress</h3>
    </div>
    <div className="space-y-3">
      {progress?.weeks?.map((week: any, index: number) => (
        <div key={index} className="flex items-center gap-3">
          <span className="text-sm text-gray-400 w-16">Week {week.number}</span>
          <div className="flex-1 bg-gray-700 rounded-full h-2">
            <div 
              className="bg-lime-400 h-2 rounded-full transition-all duration-300"
              style={{ width: `${week.completion}%` }}
            />
          </div>
          <span className="text-sm text-white">{week.completion}%</span>
        </div>
      ))}
    </div>
  </div>
)

interface Message {
  role: 'user' | 'assistant'
  content: string
  richContent?: {
    type: 'program' | 'timer' | 'drill' | 'schedule' | 'assessment' | 'progress'
    data: any
  }
  timestamp?: Date
}

interface ChatInterfaceProps {
  initialMessages?: Message[]
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ initialMessages = [] }) => {
  const { user, userProfile } = useAuth()
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Hey ${userProfile?.first_name || 'there'}! 👋 I'm your ClimbingPill AI coach. I can help you with:\n\n🎯 **Assessment & Goal Setting**\n📊 **Training Program Generation**\n⏱️ **Session Timers & Tracking**\n📈 **Progress Analysis**\n🧗 **Technique & Drill Guidance**\n\nWhat would you like to work on today?`,
      timestamp: new Date()
    },
    ...initialMessages
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [showAssessmentModal, setShowAssessmentModal] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Enhanced message parsing to detect rich content requests
  const parseMessageForRichContent = (content: string, isAssistant: boolean = false) => {
    // For user messages, only check for timer patterns
    if (!isAssistant) {
              // First check for interval timer patterns (these can exist without the word "timer")
        const timerMatch = content.match(/(\d+)\s*(sec|second|min|minute|mi)s?\s*on\s*(\d+)\s*(sec|second|min|minute|mi)s?\s*off\s*(?:x|×)?(\d+)?/i)
        
        if (timerMatch) {
          const [, workTime, workUnit, restTime, restUnit, rounds] = timerMatch
          const workSeconds = (workUnit.startsWith('min') || workUnit === 'mi') ? parseInt(workTime) * 60 : parseInt(workTime)
          const restSeconds = (restUnit.startsWith('min') || restUnit === 'mi') ? parseInt(restTime) * 60 : parseInt(restTime)
          
          // Default to 4 rounds if not specified
          const roundCount = rounds ? parseInt(rounds) : 4
          
          return { 
            type: 'timer' as const, 
            data: { 
              workTime: workSeconds,
              restTime: restSeconds,
              rounds: roundCount,
              totalTime: (workSeconds + restSeconds) * roundCount,
              name: rounds ? `${workTime}${workUnit.substring(0,3)} on ${restTime}${restUnit.substring(0,3)} off × ${rounds}` : `${workTime}${workUnit.substring(0,3)} on ${restTime}${restUnit.substring(0,3)} off × ${roundCount}`
            } 
          }
        }
      
              // Then check for general timer requests (very restrictive for assistant responses)
        const lowerContent = content.toLowerCase()
        if (lowerContent.includes('session time') || 
            lowerContent.includes('start session') ||
            (lowerContent.includes('timer') && lowerContent.includes('start') && !lowerContent.includes('set up') && !lowerContent.includes('how'))) {
          // Smart defaults for specific timer types
          if (lowerContent.includes('max hang') || lowerContent.includes('hangboard')) {
            return { 
              type: 'timer' as const, 
              data: { 
                workTime: 10,
                restTime: 180, // 3 minutes
                rounds: 6,
                totalTime: (10 + 180) * 6, // 19 minutes
                name: 'Max Hang Timer (10s on 3min off × 6)'
              } 
            }
          }
          
          // Default timer for simple requests
          return { type: 'timer' as const, data: { duration: 90, name: 'Training Session' } }
        }
      
      return null
    }

    const lowerContent = content.toLowerCase()
    
    // Check for timer tool responses - look for **Timer Configuration:** format
    const timerConfigMatch = content.match(/\*\*Timer Configuration:\*\*[\s\S]*?Type:\s*(interval|simple|max_hang|endurance|custom)/i)
    
    if (timerConfigMatch) {
      const [, timerType] = timerConfigMatch
      
      // Extract timer data from the structured response
      const workTimeMatch = content.match(/Work Time:\s*(\d+)\s*seconds/i)
      const restTimeMatch = content.match(/Rest Time:\s*(\d+)\s*seconds/i)
      const roundsMatch = content.match(/Rounds:\s*(\d+)/i)
      const durationMatch = content.match(/Duration:\s*(\d+)\s*(?:seconds|minutes)/i)
      const totalDurationMatch = content.match(/Total Duration:\s*(\d+)\s*minutes/i)
      
      if (timerType === 'simple' && durationMatch) {
        const duration = durationMatch[1].includes('minute') ? parseInt(durationMatch[1]) * 60 : parseInt(durationMatch[1])
        return {
          type: 'timer' as const,
          data: {
            duration,
            name: 'Training Timer'
          }
        }
      } else if ((timerType === 'interval' || timerType === 'max_hang' || timerType === 'endurance') && workTimeMatch && restTimeMatch && roundsMatch) {
        const workTime = parseInt(workTimeMatch[1])
        const restTime = parseInt(restTimeMatch[1])
        const rounds = parseInt(roundsMatch[1])
        const totalTime = totalDurationMatch ? parseInt(totalDurationMatch[1]) * 60 : (workTime + restTime) * rounds
        
        return {
          type: 'timer' as const,
          data: {
            workTime,
            restTime,
            rounds,
            totalTime,
            name: `${timerType === 'max_hang' ? 'Max Hang' : timerType === 'endurance' ? 'Endurance' : 'Interval'} Timer`,
            isMaxHang: timerType === 'max_hang',
            isEndurance: timerType === 'endurance'
          }
        }
      }
    }
    
    // Detect program-related content
    if (lowerContent.includes('program') || lowerContent.includes('training plan') || lowerContent.includes('weeks')) {
      return { type: 'program' as const, data: null }
    }
    
    // First check for interval timer patterns (these can exist without the word "timer")
    const timerMatch = content.match(/(\d+)\s*(sec|second|min|minute|mi)s?\s*on\s*(\d+)\s*(sec|second|min|minute|mi)s?\s*off\s*(?:x|×)?(\d+)?/i)
    
    if (timerMatch) {
      const [, workTime, workUnit, restTime, restUnit, rounds] = timerMatch
      const workSeconds = (workUnit.startsWith('min') || workUnit === 'mi') ? parseInt(workTime) * 60 : parseInt(workTime)
      const restSeconds = (restUnit.startsWith('min') || restUnit === 'mi') ? parseInt(restTime) * 60 : parseInt(restTime)
      
      // Default to 4 rounds if not specified
      const roundCount = rounds ? parseInt(rounds) : 4
      
      return { 
        type: 'timer' as const, 
        data: { 
          workTime: workSeconds,
          restTime: restSeconds,
          rounds: roundCount,
          totalTime: (workSeconds + restSeconds) * roundCount,
          name: rounds ? `${workTime}${workUnit.substring(0,3)} on ${restTime}${restUnit.substring(0,3)} off × ${rounds}` : `${workTime}${workUnit.substring(0,3)} on ${restTime}${restUnit.substring(0,3)} off × ${roundCount}`
        } 
      }
    }
    
    // Then check for general timer requests (but be more specific to avoid false positives)
    if ((lowerContent.includes('timer') && (lowerContent.includes('start') || lowerContent.includes('create') || lowerContent.includes('set'))) || 
        lowerContent.includes('session time') || 
        lowerContent.includes('start session')) {
      // Smart defaults for specific timer types
      if (lowerContent.includes('max hang') || lowerContent.includes('hangboard')) {
        return { 
          type: 'timer' as const, 
          data: { 
            workTime: 10,
            restTime: 180, // 3 minutes
            rounds: 6,
            totalTime: (10 + 180) * 6, // 19 minutes
            name: 'Max Hang Timer (10s on 3min off × 6)'
          } 
        }
      }
      
      // Default timer for simple requests
      return { type: 'timer' as const, data: { duration: 90, name: 'Training Session' } }
    }
    
    // Detect assessment content
    if (lowerContent.includes('assessment') || lowerContent.includes('grade prediction') || lowerContent.includes('score')) {
      return { type: 'assessment' as const, data: null }
    }
    
    return null
  }

  // Handle assessment completion
  const handleAssessmentComplete = async (assessmentData: any) => {
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: `Great! I've completed your assessment. Your predicted grade is **${assessmentData.predictedGrade}** with a composite score of **${assessmentData.compositeScore.toFixed(2)}**.\n\nNow I'll generate your personalized training program. This may take a moment...`,
      richContent: { type: 'assessment', data: assessmentData },
      timestamp: new Date()
    }])

    // Generate training program
    try {
      const programResponse = await climbingPillAPI.generateProgram(assessmentData)
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `🎉 Your personalized training program is ready! This 6-week program is designed to help you progress from ${assessmentData.currentGrade} to ${assessmentData.targetGrade}.\n\nYour program focuses on your identified weaknesses and includes structured progression with proper deload and assessment phases.`,
        richContent: { type: 'program', data: programResponse },
        timestamp: new Date()
      }])
    } catch (error) {
      console.error('Program generation error:', error)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'I encountered an issue generating your program. Let me try a different approach or you can ask me to try again.',
        timestamp: new Date()
      }])
    }
  }

  // Handle user messages that might trigger assessment
  const handleUserMessage = (message: string) => {
    const lowerMessage = message.toLowerCase()
    
    // Check if user is asking about assessment
    if ((lowerMessage.includes('assessment') || lowerMessage.includes('evaluate') || lowerMessage.includes('test')) && 
        (lowerMessage.includes('take') || lowerMessage.includes('start') || lowerMessage.includes('do'))) {
      setShowAssessmentModal(true)
      return true
    }
    
    return false
  }

  const sendMessage = async () => {
    if (!inputMessage.trim() || !user) return

    const messageContent = inputMessage.trim()
    
    // Check if this message should trigger assessment modal
    if (handleUserMessage(messageContent)) {
      setInputMessage('')
      return
    }

    // Check if user message contains timer patterns and create rich content immediately
    const userTimerContent = parseMessageForRichContent(messageContent, false)
    
    const userMessage: Message = {
      role: 'user',
      content: messageContent,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsTyping(true)

        try {
      // Send message to AI coach
      const response = await climbingPillAPI.chat(messageContent, user.id)
       
             // Parse response for rich content - response.content is the correct field from mastra-client
      const responseContent = response.content || 'No response received'
      const richContent = parseMessageForRichContent(responseContent, true)
     
     // If user message contained timer pattern, use ONLY that - ignore assistant timer content
     let enhancedRichContent = userTimerContent
     if (!userTimerContent) {
       enhancedRichContent = richContent
     }
      if (richContent?.type === 'program') {
        try {
          const programData = await climbingPillAPI.getLatestProgram(user.id)
          if (programData?.program_data) {
            enhancedRichContent = { type: 'program', data: JSON.parse(programData.program_data) }
          }
        } catch (error) {
          console.warn('Could not fetch program data:', error)
        }
      }
      
      if (richContent?.type === 'assessment') {
        try {
          const assessmentData = await climbingPillAPI.getLatestAssessment(user.id)
          if (assessmentData) {
            enhancedRichContent = { type: 'assessment', data: assessmentData }
          }
        } catch (error) {
          console.warn('Could not fetch assessment data:', error)
        }
      }

             const assistantMessage: Message = {
         role: 'assistant',
         content: responseContent,
         richContent: enhancedRichContent || undefined,
         timestamp: new Date()
       }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Chat error:', error)
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again in a moment.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsTyping(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const renderRichContent = (richContent: Message['richContent']) => {
    if (!richContent) return null

    switch (richContent.type) {
      case 'program':
        return richContent.data ? <ProgramChart programData={richContent.data} /> : null
      case 'timer':
        return <SessionTimer session={richContent.data} />
      case 'schedule':
        return <WeeklySchedule week={richContent.data} />
      case 'assessment':
        return richContent.data ? <AssessmentResults assessment={richContent.data} /> : null
      case 'progress':
        return <ProgressChart progress={richContent.data} />
      case 'drill':
        return <DrillCard drill={richContent.data} />
      default:
        return null
    }
  }

  const renderMessage = (message: Message, index: number) => (
    <div key={index} className={`flex gap-3 mb-6 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
      {message.role === 'assistant' && (
        <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-teal-500 rounded-full flex items-center justify-center flex-shrink-0">
          <Bot className="w-4 h-4 text-white" />
        </div>
      )}
      
      <div className={`max-w-[80%] ${message.role === 'user' ? 'order-1' : ''}`}>
        <div className={`rounded-2xl px-4 py-3 ${
          message.role === 'user' 
            ? 'bg-gradient-to-r from-pink-500 to-pink-600 text-white ml-auto' 
            : 'bg-gray-800 text-white'
        }`}>
                     <ReactMarkdown 
             components={{
               p: ({ children }) => <p className="mb-2">{children}</p>,
               ul: ({ children }) => <ul className="list-disc pl-4 mb-2">{children}</ul>,
               ol: ({ children }) => <ol className="list-decimal pl-4 mb-2">{children}</ol>,
               li: ({ children }) => <li className="mb-1">{children}</li>,
               strong: ({ children }) => <strong className="font-bold">{children}</strong>,
               em: ({ children }) => <em className="italic">{children}</em>,
               code: ({ children }) => <code className="bg-gray-700 px-1 rounded text-sm">{children}</code>,
               h1: ({ children }) => <h1 className="text-xl font-bold mb-2">{children}</h1>,
               h2: ({ children }) => <h2 className="text-lg font-bold mb-2">{children}</h2>,
               h3: ({ children }) => <h3 className="text-md font-bold mb-2">{children}</h3>,
             }}
           >
             {message.content}
           </ReactMarkdown>
        </div>
        
        {message.richContent && renderRichContent(message.richContent)}
        
        {message.timestamp && (
          <div className={`text-xs text-gray-500 mt-1 ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        )}
      </div>
      
      {message.role === 'user' && (
        <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0 order-2">
          <User className="w-4 h-4 text-white" />
        </div>
      )}
    </div>
  )

  return (
    <div className="flex flex-col h-screen bg-black">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <img src="/climbingpill-logo.svg" alt="ClimbingPill" className="h-8" />
          <div>
            <h1 className="text-white font-semibold">ClimbingPill AI Coach</h1>
            <p className="text-gray-400 text-sm">Your personal climbing training assistant</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-lime-400 rounded-full"></div>
          <span className="text-sm text-gray-400">Online</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => renderMessage(message, index))}
        
        {/* Quick Actions */}
        {messages.length === 1 && (
          <div className="flex flex-wrap gap-2 justify-center">
            <button
              onClick={() => setShowAssessmentModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-full text-white text-sm transition-colors"
            >
              <ClipboardList className="w-4 h-4" />
              Take Assessment
            </button>
            <button
              onClick={() => setInputMessage('Show my training program')}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-full text-white text-sm transition-colors"
            >
              <BarChart3 className="w-4 h-4" />
              View Program
            </button>
            <button
              onClick={() => setInputMessage('Start session timer')}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-full text-white text-sm transition-colors"
            >
              <Timer className="w-4 h-4" />
              Start Timer
            </button>
          </div>
        )}
        
        {isTyping && (
          <div className="flex gap-3 mb-6">
            <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-teal-500 rounded-full flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-gray-800 rounded-2xl px-4 py-3">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center gap-3 bg-gray-800 rounded-full px-4 py-2">
          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about training, programs, assessments, or anything climbing..."
            className="flex-1 bg-transparent text-white placeholder-gray-400 focus:outline-none"
            disabled={isTyping}
          />
          <button
            onClick={() => setIsListening(!isListening)}
            className={`p-2 rounded-full transition-colors ${
              isListening ? 'bg-pink-500 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Mic className="w-4 h-4" />
          </button>
          <button
            onClick={sendMessage}
            disabled={!inputMessage.trim() || isTyping}
            className="p-2 bg-gradient-to-r from-pink-500 to-teal-500 rounded-full text-white hover:from-pink-600 hover:to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <div className="flex justify-center mt-2">
          <div className="flex gap-2 text-xs text-gray-500">
            <span>💡 Try: "Show my program"</span>
            <span>•</span>
            <span>"Start session timer"</span>
            <span>•</span>
            <span>"Take assessment"</span>
          </div>
        </div>
      </div>

      {/* Assessment Modal */}
      <AssessmentModal
        isOpen={showAssessmentModal}
        onClose={() => setShowAssessmentModal(false)}
        onComplete={handleAssessmentComplete}
      />
    </div>
  )
}

export default ChatInterface 