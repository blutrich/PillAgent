// ClimbingPill AI Coach API functions - Connected to Mastra Backend
const MASTRA_API_BASE = process.env.NEXT_PUBLIC_MASTRA_API_URL || 'https://pill_agent.mastra.cloud/api';

// Import Supabase client for direct database access
import { supabase } from './supabase';

export const climbingPillAPI = {
  // Get latest assessment data directly from Supabase
  async getLatestAssessment(userId: string) {
    try {
      const { data, error } = await supabase
        .from('assessments')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.log('No assessment found for user:', userId);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error getting latest assessment:', error);
      return null;
    }
  },

  // Get latest training program directly from Supabase
  async getLatestProgram(userId: string) {
    try {
      console.log('getLatestProgram: Querying for user:', userId);
      const { data, error } = await supabase
        .from('training_programs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.error('getLatestProgram: Supabase error:', error);
        console.log('No training program found for user:', userId);
        return null;
      }

      console.log('getLatestProgram: Found program:', data);
      return data;
    } catch (error) {
      console.error('Error getting latest program:', error);
      return null;
    }
  },

  // Chat with the AI coach
  async chat(message: string, userId: string, threadId: string = 'main-conversation') {
    try {
      // Get user's current program and assessment data to provide context
      // Make this non-blocking - if context fails, continue with just the message
      let contextMessage = message;
      
      try {
        console.log('Chat: Getting program and assessment data for user:', userId);
        const [programData, assessmentData] = await Promise.all([
          this.getTrainingProgram(userId).catch(e => {
            console.warn('Failed to get training program:', e.message);
            return null;
          }),
          this.getLatestAssessment(userId).catch(e => {
            console.warn('Failed to get assessment:', e.message);
            return null;
          })
        ]);

        console.log('Chat: Program data retrieved:', programData);
        console.log('Chat: Assessment data retrieved:', assessmentData);

        // Build context message with user's current program and assessment
        if (programData?.detailedProgram || assessmentData) {
          const context = {
            userMessage: message,
            currentProgram: programData?.detailedProgram,
            programName: programData?.name,
            currentWeek: programData?.currentWeek,
            assessmentData: assessmentData ? {
              predictedGrade: assessmentData.predicted_grade,
              compositeScore: assessmentData.composite_score,
              currentGrade: assessmentData.current_grade,
              targetGrade: assessmentData.target_grade
            } : null
          };
          contextMessage = `User question: "${message}"\n\nUser Context: ${JSON.stringify(context)}`;
          console.log('Chat: Sending context message:', contextMessage);
        } else {
          console.log('Chat: No program or assessment data found, sending message without context');
        }
      } catch (contextError) {
        console.warn('Chat: Context building failed, proceeding with message only:', contextError);
        // Continue with just the original message
      }

      const response = await fetch(`${MASTRA_API_BASE}/agents/climbingPillAgent/generate`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ 
          messages: [{ role: 'user', content: contextMessage }],  // Fix: Send proper message object format
          resourceid: userId,   // API uses lowercase 'resourceid'
          threadId: threadId    // Thread ID for conversation context
        }),
        signal: AbortSignal.timeout(30000) // 30 second timeout
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }
      
      const data = await response.json();
      console.log('API Response:', data);
      
      // Check if we got a valid response
      if (data.text || data.content) {
        return {
          role: 'assistant',
          content: data.text || data.content,
          confidence: 0.9
        };
      } else {
        console.warn('API returned empty response:', data);
        return {
          role: 'assistant',
          content: 'Sorry, I received an empty response. Please try again.',
          confidence: 0.1
        };
      }
    } catch (error) {
      console.error('Error chatting with AI coach:', error);
      
      // Check for timeout errors
      if (error instanceof Error && error.name === 'TimeoutError') {
        return {
          role: 'assistant',
          content: 'Sorry, the AI coach is taking longer than usual to respond. Please try again.',
          confidence: 0.1
        };
      }
      
      // Check for abort errors (timeout)
      if (error instanceof Error && error.name === 'AbortError') {
        return {
          role: 'assistant',
          content: 'The request timed out. Please try again.',
          confidence: 0.1
        };
      }
      
      // Check if it's a network error vs API error
      if (error instanceof TypeError && error.message.includes('fetch')) {
        return {
          role: 'assistant',
          content: 'Sorry, I\'m having trouble connecting to the server right now. Please check your internet connection and try again.',
          confidence: 0.1
        };
      }
      
      // For other errors, try to extract meaningful error message
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('HTTP error')) {
        return {
          role: 'assistant',
          content: 'Sorry, there was a server error. Please try again in a moment.',
          confidence: 0.1
        };
      }
      
      // Log the full error for debugging
      console.error('Full error details:', {
        message: errorMessage,
        stack: error instanceof Error ? error.stack : 'No stack trace',
        type: typeof error,
        error: error
      });
      
      // Generic fallback
      return {
        role: 'assistant',
        content: 'Sorry, I encountered an unexpected error. Please try again.',
        confidence: 0.1
      };
    }
  },

  // Get user profile data from Supabase
  async getUserProfile(userId: string) {
    try {
      // Get the latest assessment for this user
      const assessment = await this.getLatestAssessment(userId);
      
      if (assessment) {
        const currentGrade = assessment.predicted_grade || "V4";
        const gradeNum = parseInt(currentGrade.replace('V', ''));
        const targetGrade = `V${gradeNum + 1}`;
        const assessmentScore = parseFloat(assessment.composite_score) || 0.07;
        
        return {
          name: "ClimbingPill User",
          currentGrade,
          targetGrade,
          assessmentScore,
          programProgress: 25, // Based on having completed assessment
          subscription: "premium",
          avatar: "CU"
        };
      }
      
      // Return default data if no assessment found
      return {
        name: "ClimbingPill User",
        currentGrade: "V4",
        targetGrade: "V5", 
        assessmentScore: 0.07,
        programProgress: 0,
        subscription: "free",
        avatar: "CU"
      };
    } catch (error) {
      console.error('Error getting user profile:', error);
      // Return default data as fallback
      return {
        name: "ClimbingPill User",
        currentGrade: "V4",
        targetGrade: "V5", 
        assessmentScore: 0.07,
        programProgress: 0,
        subscription: "free",
        avatar: "CU"
      };
    }
  },

  // Get training program data from Supabase
  async getTrainingProgram(userId: string) {
    try {
      // Get the latest training program and assessment
      const [program, assessment] = await Promise.all([
        this.getLatestProgram(userId),
        this.getLatestAssessment(userId)
      ]);
      
      if (program) {
        console.log('Raw program from Supabase:', program);
        console.log('Program data type:', typeof program.program_data);
        
        // Parse program_data if it's a string (from JSONB field)
        let programData = program.program_data;
        if (typeof programData === 'string') {
          try {
            programData = JSON.parse(programData);
            console.log('Parsed program data:', programData);
          } catch (e) {
            console.error('Error parsing program data:', e);
            programData = null;
          }
        } else {
          console.log('Program data is already an object:', programData);
        }
        
        return {
          name: program.program_name || "ClimbingPill Training Program",
          currentWeek: 1,
          totalWeeks: 6,
          nextSession: "Training Session",
          todayComplete: false,
          detailedProgram: programData
        };
      }
      
      // If no program but has assessment, suggest program generation
      if (assessment) {
        const grade = assessment.predicted_grade || "V4";
        return {
          name: `${grade} Development Program`,
          currentWeek: 1,
          totalWeeks: 6,
          nextSession: "Generate Your Program",
          todayComplete: false,
          detailedProgram: null
        };
      }
      
      // Return default data if no program or assessment found
      return {
        name: "ClimbingPill Training Program",
        currentWeek: 1,
        totalWeeks: 6,
        nextSession: "Complete Assessment First",
        todayComplete: false,
        detailedProgram: null
      };
    } catch (error) {
      console.error('Error getting training program:', error);
      // Return default data as fallback
      return {
        name: "ClimbingPill Training Program",
        currentWeek: 1,
        totalWeeks: 6,
        nextSession: "Complete Assessment First",
        todayComplete: false,
        detailedProgram: null
      };
    }
  },

  // Run onboarding flow
  async startOnboarding(userData: Record<string, unknown>, userId: string) {
    try {
      const response = await fetch(`${MASTRA_API_BASE}/agents/climbingPillAgent/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [`Start onboarding for new user: ${JSON.stringify(userData)}`],
          resourceid: userId,
          threadId: `onboarding-${userId}`
        })
      });
      return await response.json();
    } catch (error) {
      console.error('Error starting onboarding:', error);
      throw error;
    }
  },

  // Conduct physical assessment
  async conductAssessment(assessmentData: Record<string, unknown>) {
    try {
      // Convert string values to numbers for the backend tool
      const structuredData = {
        userId: assessmentData.userId || 'anonymous', // Use real user ID from assessment data
        bodyWeight: parseFloat(assessmentData.bodyWeight as string),
        height: parseFloat(assessmentData.height as string),
        addedWeight: parseFloat(assessmentData.addedWeight as string),
        maxPullUps: parseFloat(assessmentData.pullUpsMax as string),
        maxPushUps: parseFloat(assessmentData.pushUpsMax as string),
        maxToeToBar: parseFloat(assessmentData.toeToBarMax as string),
        legSpreadDistance: parseFloat(assessmentData.legSpread as string),
        eightyPercentGrade: assessmentData.eightyPercentGrade as string,
        assessmentType: 'complete' as const,
        climberName: 'ClimbingPill User',
        // Additional context from frontend
        currentGrade: assessmentData.currentGrade as string,
        targetGrade: assessmentData.targetGrade as string,
        experience: assessmentData.experience as string,
        compositeScore: assessmentData.compositeScore as string,
        predictedGrade: assessmentData.predictedGrade as string,
        normalizedMetrics: assessmentData.normalizedMetrics,
        assessmentMethodology: assessmentData.assessmentMethodology as string,
        timestamp: assessmentData.timestamp as string
      };

      console.log('Making API call to:', `${MASTRA_API_BASE}/agents/climbingPillAgent/generate`);
      console.log('With payload:', {
        messages: [`Please conduct a comprehensive ClimbingPill assessment using the climbingAssessment tool with this data: ${JSON.stringify(structuredData)}`],
        resourceid: structuredData.userId,
        threadId: `assessment-${structuredData.userId}`
      });

      const response = await fetch(`${MASTRA_API_BASE}/agents/climbingPillAgent/generate`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          messages: [`Please conduct a comprehensive ClimbingPill assessment using the climbingAssessment tool with this data: ${JSON.stringify(structuredData)}`],
          resourceid: structuredData.userId,
          threadId: `assessment-${structuredData.userId}`
        })
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }

      const result = await response.json();
      console.log('API Success Response:', result);
      return result;
    } catch (error) {
      console.error('Error conducting assessment:', error);
      throw error;
    }
  },

  // Set climbing goals
  async setGoals(goalData: Record<string, unknown>) {
    try {
      const response = await fetch(`${MASTRA_API_BASE}/agents/climbingPillAgent/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [`Set goals: ${JSON.stringify(goalData)}`]
        })
      });
      return await response.json();
    } catch (error) {
      console.error('Error setting goals:', error);
      throw error;
    }
  },

  // Generate detailed training program
  async generateProgram(assessmentResults: any, userPreferences: any) {
    try {
      // Convert availableDays from day names to numbers (1=Monday, 7=Sunday)
      const dayNameToNumber = {
        'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 
        'Friday': 5, 'Saturday': 6, 'Sunday': 7
      };
      
      let availableDaysNumbers = [1, 3, 5]; // Default: Mon, Wed, Fri
      if (Array.isArray(userPreferences.availableDays)) {
        if (typeof userPreferences.availableDays[0] === 'string') {
          // Convert day names to numbers
          availableDaysNumbers = userPreferences.availableDays
            .map((day: string) => dayNameToNumber[day as keyof typeof dayNameToNumber])
            .filter((dayNum: number | undefined): dayNum is number => dayNum !== undefined);
        } else {
          // Already numbers
          availableDaysNumbers = userPreferences.availableDays.filter((day: number) => day >= 1 && day <= 7);
        }
      }

      const programData = {
        userId: userPreferences.userId || 'anonymous',
        assessmentResults: {
          predictedGrade: assessmentResults.predictedGrade || 'V6',
          compositeScore: parseFloat(assessmentResults.compositeScore) || 0.7,
          weaknesses: [assessmentResults.weakestArea || 'Core Strength', assessmentResults.secondWeakestArea || 'Flexibility'],
          strongestArea: assessmentResults.strongestArea || 'Finger Strength',
          weakestArea: assessmentResults.weakestArea || 'Core Strength',
          fingerStrengthRatio: parseFloat(assessmentResults.fingerStrengthRatio) || 1.2,
          pullUpRatio: parseFloat(assessmentResults.pullUpRatio) || 0.8,
          pushUpRatio: parseFloat(assessmentResults.pushUpRatio) || 0.6,
          toeToBarRatio: parseFloat(assessmentResults.toeToBarRatio) || 0.4,
          flexibilityRatio: parseFloat(assessmentResults.flexibilityRatio) || 0.9,
        },
        programType: 'optimized' as const,
        userPreferences: {
          availableDays: availableDaysNumbers,
          sessionLengthMinutes: parseInt(userPreferences.sessionLength) || 90,
          equipmentAccess: userPreferences.equipment || ['fingerboard', 'gym'],
          primaryGoals: userPreferences.goals || ['strength', 'technique'],
          climbingStyle: userPreferences.style || 'bouldering',
          injuryHistory: userPreferences.injuries || [],
        },
        detailedContext: {
          current80PercentGrade: assessmentResults.eightyPercentGrade || assessmentResults.currentGrade || 'V5',
          currentLeadGrade: assessmentResults.leadGrade || undefined,
          fingboardMaxWeight: parseFloat(assessmentResults.addedWeight) || 0,
          trainingHistory: userPreferences.experience || 'Intermediate',
          climberName: userPreferences.name || 'ClimbingPill User',
        },
      };

      console.log('Sending program generation data:', programData);

      const response = await fetch(`${MASTRA_API_BASE}/agents/climbingPillAgent/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [`Please generate a detailed 6-week training program using the programGeneration tool with this data: ${JSON.stringify(programData)}`],
          resourceid: programData.userId,
          threadId: `program-${programData.userId}`
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Program generation API error:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }

      const result = await response.json();
      console.log('Program generation response:', result);
      return result;
    } catch (error) {
      console.error('Error generating program:', error);
      throw error;
    }
  },

  // Save training program to database
  async saveTrainingProgram(programData: any, userId: string, assessmentId?: string) {
    try {
      const { data, error } = await supabase
        .from('training_programs')
        .insert({
          user_id: userId,
          assessment_id: assessmentId,
          program_name: programData.name || 'ClimbingPill Training Program',
          duration_weeks: programData.totalWeeks || 6,
          difficulty_level: 'intermediate',
          focus_areas: ['strength', 'technique'],
          target_grade: programData.targetGrade || 'V7',
          program_data: programData.detailedProgram || programData,
          status: 'active',
          progress_percentage: 0,
          completed_sessions: 0,
          total_sessions: programData.totalSessions || 18,
          initial_grade: programData.initialGrade || 'V6',
          current_grade: programData.initialGrade || 'V6',
          grade_improvements: 0
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving training program:', error);
        throw error;
      }

      console.log('Training program saved successfully:', data);
      return data;
    } catch (error) {
      console.error('Error saving training program:', error);
      throw error;
    }
  },

  // Run retention analysis
  async analyzeRetention(retentionData: Record<string, unknown>) {
    try {
      const response = await fetch(`${MASTRA_API_BASE}/agents/climbingPillAgent/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [`Analyze retention: ${JSON.stringify(retentionData)}`]
        })
      });
      return await response.json();
    } catch (error) {
      console.error('Error analyzing retention:', error);
      throw error;
    }
  }
};

export default climbingPillAPI; 