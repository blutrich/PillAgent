// ClimbingPill AI Coach API functions - Connected to Mastra Backend
const MASTRA_API_BASE = process.env.NODE_ENV === 'production' 
  ? 'https://pillagent.mastra.cloud/api'
  : 'http://localhost:4111/api';

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
      const { data, error } = await supabase
        .from('training_programs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.log('No training program found for user:', userId);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error getting latest program:', error);
      return null;
    }
  },

  // Chat with the AI coach
  async chat(message: string, userId: string, threadId: string = 'main-conversation') {
    try {
      const response = await fetch(`${MASTRA_API_BASE}/agents/climbingPillAgent/generate`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ 
          messages: [{ role: 'user', content: message }],
          resourceId: userId,    // Enable memory!
          threadId: threadId     // Enable memory!
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }
      
      const data = await response.json();
      console.log('API Response:', data);
      
      return {
        role: 'assistant',
        content: data.text || data.content || 'Sorry, I encountered an error.',
        confidence: 0.9
      };
    } catch (error) {
      console.error('Error chatting with AI coach:', error);
      return {
        role: 'assistant',
        content: 'Sorry, I\'m having trouble connecting right now. Please try again.',
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
        return {
          name: program.program_name || "ClimbingPill Training Program",
          currentWeek: 1,
          totalWeeks: 6,
          nextSession: "Training Session",
          todayComplete: false,
          detailedProgram: program.program_data
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
          messages: [{ 
            role: 'user', 
            content: `Start onboarding for new user: ${JSON.stringify(userData)}` 
          }],
          resourceId: userId,
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

      const response = await fetch(`${MASTRA_API_BASE}/agents/climbingPillAgent/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ 
            role: 'user', 
            content: `Please conduct a comprehensive ClimbingPill assessment using the climbing-assessment tool with this data: ${JSON.stringify(structuredData)}`
          }],
          resourceId: structuredData.userId,
          threadId: `assessment-${structuredData.userId}`
        })
      });
      return await response.json();
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
          messages: [{ 
            role: 'user', 
            content: `Set goals: ${JSON.stringify(goalData)}` 
          }]
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
      const programData = {
        userId: userPreferences.userId || 'anonymous',
        assessmentResults: {
          predictedGrade: assessmentResults.predictedGrade,
          compositeScore: assessmentResults.compositeScore,
          weaknesses: [assessmentResults.weakestArea, assessmentResults.secondWeakestArea || 'General'],
          strongestArea: assessmentResults.strongestArea,
          weakestArea: assessmentResults.weakestArea,
          fingerStrengthRatio: assessmentResults.fingerStrengthRatio,
          pullUpRatio: assessmentResults.pullUpRatio,
          pushUpRatio: assessmentResults.pushUpRatio,
          toeToBarRatio: assessmentResults.toeToBarRatio,
          flexibilityRatio: assessmentResults.flexibilityRatio,
        },
        programType: 'optimized' as const,
        userPreferences: {
          availableDays: userPreferences.availableDays || [1, 2, 3, 4, 5, 6], // Mon-Sat
          sessionLengthMinutes: userPreferences.sessionLength || 90,
          equipmentAccess: userPreferences.equipment || ['fingerboard', 'gym'],
          primaryGoals: userPreferences.goals || ['strength', 'technique'],
          climbingStyle: userPreferences.style || 'bouldering',
          injuryHistory: userPreferences.injuries || [],
        },
        detailedContext: {
          current80PercentGrade: assessmentResults.eightyPercentGrade || assessmentResults.currentGrade,
          currentLeadGrade: assessmentResults.leadGrade,
          fingboardMaxWeight: assessmentResults.addedWeight || 0,
          trainingHistory: userPreferences.experience || 'Intermediate',
          climberName: userPreferences.name || 'ClimbingPill User',
        },
      };

      const response = await fetch(`${MASTRA_API_BASE}/agents/climbingPillAgent/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ 
            role: 'user', 
            content: `Please generate a detailed 6-week training program using the generate-training-program tool with this data: ${JSON.stringify(programData)}`
          }]
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Program generation response:', result);
      return result;
    } catch (error) {
      console.error('Error generating program:', error);
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
          messages: [{ 
            role: 'user', 
            content: `Analyze retention: ${JSON.stringify(retentionData)}` 
          }]
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