// ClimbingPill AI Coach API functions - Connected to Mastra Backend
// Last updated: 2025-01-15 - Fixed timeout issues and .single() queries
// Cache bust: 2025-01-15T22:15:00Z - Added generateProgram and saveTrainingProgram methods
// CRITICAL FIX: Assessment error resolved with missing API methods
const MASTRA_API_BASE = process.env.NEXT_PUBLIC_MASTRA_API_URL || 'https://pill_agent.mastra.cloud/api';

// Import Supabase client for direct database access
import { supabase } from './supabase';

export const climbingPillAPI = {
  // Debug method to verify API methods exist
  _debugMethods() {
    console.log('🔍 Available API methods:', Object.keys(this));
    console.log('✅ generateProgram exists:', typeof this.generateProgram === 'function');
    console.log('✅ saveTrainingProgram exists:', typeof this.saveTrainingProgram === 'function');
    return {
      generateProgram: typeof this.generateProgram === 'function',
      saveTrainingProgram: typeof this.saveTrainingProgram === 'function'
    };
  },
  // Get latest assessment data directly from Supabase
  async getLatestAssessment(userId: string) {
    try {
      const { data, error } = await supabase
        .from('assessments')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.log('No assessment found for user:', userId);
        return null;
      }

      if (!data || data.length === 0) {
        console.log('No assessment found for user:', userId);
        return null;
      }

      return data[0]; // Get first item from array
    } catch (error) {
      console.error('Error getting latest assessment:', error);
      return null;
    }
  },

  // Get latest training program directly from Supabase with improved error handling
  async getLatestProgram(userId: string) {
    try {
      console.log('getLatestProgram: Querying for user:', userId);
      
      // Add fast-fail for chat context (don't block chat with long timeouts)
      const isChatContext = new Error().stack?.includes('chat');
      const maxRetries = isChatContext ? 1 : 3; // Only 1 attempt for chat context
      let retryCount = 0;
      
      while (retryCount < maxRetries) {
        try {
          // Optimized query with specific column selection for better performance
          const queryPromise = supabase
            .from('training_programs')
            .select('id, user_id, program_name, program_data, created_at, updated_at, status')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle(); // Use maybeSingle for better performance when expecting 0 or 1 result
          
          // Reduced timeout since database is now optimized (0.075ms execution time)
          const timeoutDuration = isChatContext ? 3000 : (10000 + (retryCount * 5000)); // 3s for chat, 10s/15s/20s for normal
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Query timeout')), timeoutDuration)
          );
          
          const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as any;

          if (error) {
            console.error(`getLatestProgram: Supabase error (attempt ${retryCount + 1}):`, error);
            
            // If it's a timeout or connection error, retry
            if (error.message.includes('timeout') || error.message.includes('connection')) {
              retryCount++;
              if (retryCount < maxRetries) {
                console.log(`Retrying in ${500 * retryCount}ms...`);
                await new Promise(resolve => setTimeout(resolve, 500 * retryCount));
                continue;
              }
            }
            
            console.log('No training program found for user:', userId);
            return null;
          }

          if (!data) {
            console.log('getLatestProgram: No programs found for user:', userId);
            return null;
          }

          const latestProgram = data; // maybeSingle returns the object directly, not an array
          console.log('getLatestProgram: Found program:', latestProgram);
          return latestProgram;
          
        } catch (attemptError) {
          console.error(`getLatestProgram: Attempt ${retryCount + 1} failed:`, attemptError);
          retryCount++;
          
          if (retryCount >= maxRetries) {
            throw attemptError;
          }
          
          // Reduced backoff since database is now fast
          await new Promise(resolve => setTimeout(resolve, 500 * retryCount));
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error getting latest program after all retries:', error);
      return null;
    }
  },

  // Chat with the AI coach
  async chat(message: string, userId: string, threadId: string = 'main-conversation') {
    try {
      // Get user's current program and assessment data to provide context
      // Make this non-blocking with fast timeout - if context fails, continue with just the message
      let contextMessage = message;
      
      try {
        console.log('Chat: Getting program and assessment data for user:', userId);
        
                  // Add fast timeout for context fetching (reduced since DB is optimized)
        const contextPromise = Promise.all([
          this.getTrainingProgram(userId).catch(e => {
            console.warn('Failed to get training program:', e.message);
            return null;
          }),
          this.getLatestAssessment(userId).catch(e => {
            console.warn('Failed to get assessment:', e.message);
            return null;
          })
        ]);
        
        // Race against timeout - reduced timeout since database is now optimized
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Context timeout')), 3000) // 3 seconds max for chat context
        );
        
        const [programData, assessmentData] = await Promise.race([
          contextPromise,
          timeoutPromise
        ]) as [any, any];

        console.log('Chat: Program data retrieved:', programData);
        console.log('Chat: Assessment data retrieved:', assessmentData);
        console.log('Chat: Program has detailedProgram?', !!programData?.detailedProgram);
        console.log('Chat: Program structure:', programData ? Object.keys(programData) : 'null');

        // Build context message with user's current program and assessment
        if (programData?.detailedProgram || programData?.name || assessmentData) {
          const context = {
            userMessage: message,
            currentProgram: programData?.detailedProgram,
            programName: programData?.name,
            currentWeek: programData?.currentWeek,
            totalWeeks: programData?.totalWeeks,
            nextSession: programData?.nextSession,
            programProgress: programData?.programProgress,
            assessmentData: assessmentData ? {
              predictedGrade: assessmentData.predicted_grade,
              compositeScore: assessmentData.composite_score,
              currentGrade: assessmentData.current_grade,
              targetGrade: assessmentData.target_grade
            } : null,
            // Add fallback program info if detailed program isn't available
            programSummary: programData ? {
              hasProgram: true,
              name: programData.name,
              currentWeek: programData.currentWeek,
              totalWeeks: programData.totalWeeks,
              nextSession: programData.nextSession
            } : null
          };
          contextMessage = `User question: "${message}"\n\nUser Context:\n${JSON.stringify(context, null, 2)}`;
          console.log('Chat: Sending context message with program data');
          console.log('Chat: Context includes program?', !!context.programSummary?.hasProgram);
          console.log('Chat: Context includes detailed program?', !!context.currentProgram);
        } else {
          console.log('Chat: No program or assessment data found, instructing agent to use tools');
          contextMessage = `User question: "${message}"\n\nIMPORTANT: No program context loaded due to database timeout. Please use your available tools to access the user's current training program and assessment data:
          - Use queryJournal tool to check training history
          - Use getUserProfile tool to get user preferences
          - Use climbingAssessment tool if needed for current metrics
          Then provide a personalized response based on that data.`;
        }
      } catch (error) {
        console.warn('Chat: Context fetching failed or timed out, continuing without context:', error instanceof Error ? error.message : String(error));
        // Continue with just the message - don't let context issues block the chat
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

  // Generate training program
  async generateProgram(programData: Record<string, unknown>) {
    try {
      console.log('Generating program with preferences:', programData);

      const response = await fetch(`${MASTRA_API_BASE}/agents/climbingPillAgent/generate`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          messages: [`Please generate a comprehensive ClimbingPill training program using the programGeneration tool with this data: ${JSON.stringify(programData)}`],
          resourceid: programData.userId as string,
          threadId: `program-${programData.userId}`
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Program generation API error:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }

      const result = await response.json();
      console.log('Program generation success:', result);
      return result;
    } catch (error) {
      console.error('Error generating program:', error);
      throw error;
    }
  },

  // Save training program to database
  async saveTrainingProgram(programData: Record<string, unknown>, userId: string) {
    try {
      console.log('Saving training program:', programData);

      // Save program data to Supabase via the agent
      const response = await fetch(`${MASTRA_API_BASE}/agents/climbingPillAgent/generate`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          messages: [`Please save this training program to the database: ${JSON.stringify(programData)}`],
          resourceid: userId,
          threadId: `save-program-${userId}`
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Save program API error:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }

      const result = await response.json();
      console.log('Program saved successfully:', result);
      return result;
    } catch (error) {
      console.error('Error saving program:', error);
      throw error;
    }
  }
};

export default climbingPillAPI;