// ClimbingPill AI Coach API functions - Connected to Mastra Backend
// NEW FILE: v2 to bypass browser cache completely
// CRITICAL FIX: Assessment error resolved with missing API methods
// Cache bust: 2025-01-15T22:20:00Z - Complete new file to force refresh
const MASTRA_API_BASE = (process.env.NEXT_PUBLIC_MASTRA_API_URL || 'https://pill_agent.mastra.cloud') + '/api';

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

  // Get latest assessment data with ultra-fast fallback
  async getLatestAssessment(userId: string) {
    try {
      console.log('💾 V3 API: getLatestAssessment - Ultra-fast query for user:', userId);
      
      // Ultra-fast assessment query with 5-second timeout (increased from 2s)
      const queryPromise = supabase
        .from('assessments')
        .select(`
          id,
          predicted_grade, 
          composite_score, 
          current_boulder_grade,
          fingerboard_max_weight_kg,
          pull_ups_max,
          flexibility_score,
          primary_weaknesses,
          recommended_focus_areas,
          created_at
        `)  // Include all fields needed by the UI
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1);

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Assessment query timeout')), 5000)
      );

      const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as any;

      if (error) {
        console.error('💾 V3 API: Assessment query error:', error);
        return null;
      }

      if (!data || data.length === 0) {
        console.log('📭 V3 API: No assessment found for user');
        return null;
      }

      console.log('✅ V3 API: Found assessment quickly:', {
        grade: data[0].predicted_grade,
        score: data[0].composite_score,
        current: data[0].current_boulder_grade
      });
      return data; // Returns array for compatibility
    } catch (error) {
      console.error('⚡ V3 API: Assessment query failed:', error);
      return null;
    }
  },

  // Get latest training program with ultra-fast fallback strategy
  async getLatestProgram(userId: string) {
    try {
      console.log('💾 V3 API: getLatestProgram - Ultra-fast query for user:', userId);
      
      // Increased timeout to 5 seconds for better reliability
      const queryPromise = supabase
        .from('training_programs')
        .select('id, user_id, program_name, program_data, created_at, status, target_grade, focus_areas')  // Include program_data and other important fields
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      // Increased timeout from 2s to 5s
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Program query timeout')), 5000)
      );
      
      const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as any;

      if (error) {
        console.error('💾 V3 API: Program query error:', error);
        return null;
      }

      if (!data) {
        console.log('📭 V3 API: No program found for user');
        return null;
      }

      console.log('✅ V3 API: Found program quickly:', data.program_name);
      console.log('📊 V3 API: Program has data:', !!data.program_data);
      
      return data;
      
    } catch (error) {
      console.error('⚡ V3 API: Program query failed:', error);
      return null;
    }
  },

  // Chat with the AI coach (streaming version) - Updated to match Mastra API specs
  async chatStream(message: string, userId: string, threadId?: string, onChunk?: (chunk: string) => void) {
    try {
      // Use user-specific thread ID to avoid conflicts between users
      const actualThreadId = threadId || `user-${userId}-conversation`;
      
      // Get user's current program and assessment data to provide context
      let contextMessage = message;
      
      try {
        console.log('Chat Stream: Getting program and assessment data for user:', userId);
        
        // Ultra-fast context fetching (3 seconds max total for streaming)
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
        
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Context timeout')), 3000)
        );
        
        const [programData, assessmentData] = await Promise.race([
          contextPromise,
          timeoutPromise
        ]) as [any, any];

        console.log('Chat Stream: Program data retrieved:', programData);
        console.log('Chat Stream: Assessment data retrieved:', assessmentData);

        // Build context with user info
        const context = {
          userMessage: message,
          userId: userId,
          isExistingUser: true,
          currentProgram: programData?.detailedProgram,
          programName: programData?.name,
          currentWeek: programData?.currentWeek,
          assessmentData: assessmentData && assessmentData.length > 0 ? {
            predictedGrade: assessmentData[0].predicted_grade,
            compositeScore: assessmentData[0].composite_score,
            currentGrade: assessmentData[0].current_boulder_grade,
            targetGrade: assessmentData[0].target_grade
          } : null
        };
        contextMessage = `User question: "${message}"\n\nUser Context: ${JSON.stringify(context)}`;
        console.log('Chat Stream: Sending context message:', contextMessage);
      } catch (error) {
        console.warn('Chat Stream: Context fetching failed, using fallback:', error instanceof Error ? error.message : String(error));
        const fallbackContext = {
          userMessage: message,
          userId: userId,
          isExistingUser: true,
          note: "Context fetching timed out, but this is an authenticated existing user"
        };
        contextMessage = `User question: "${message}"\n\nUser Context: ${JSON.stringify(fallbackContext)}`;
        console.log('Chat Stream: Using fallback context:', contextMessage);
      }

      // Use Mastra's correct streaming API format
      const response = await fetch(`${MASTRA_API_BASE}/agents/climbingPillAgent/stream`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'  // Mastra streaming returns JSON, not SSE
        },
        body: JSON.stringify({ 
          messages: [contextMessage],  // Mastra expects array of strings
          resourceId: userId,          // Correct capitalization
          threadId: actualThreadId
        }),
        signal: AbortSignal.timeout(60000)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Streaming API Error Response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }
      
      // Parse the streaming response according to Mastra docs
      const data = await response.json();
      console.log('Streaming API Response:', data);
      
      let fullContent = '';
      
      // Check if we have a textStream in the response
      if (data.textStream) {
        // Handle async iterable textStream
        for await (const chunk of data.textStream) {
          fullContent += chunk;
          onChunk?.(chunk);
        }
      } else if (data.text || data.content) {
        // Fallback to single response
        fullContent = data.text || data.content;
        onChunk?.(fullContent);
      } else {
        console.warn('No streaming data found in response:', data);
        throw new Error('No streaming content received');
      }
      
      return {
        role: 'assistant',
        content: fullContent,
        confidence: 0.9
      };
      
    } catch (error) {
      console.error('Error streaming with AI coach:', error);
      
      // Fallback to regular chat if streaming fails
      console.log('Falling back to regular chat...');
      return this.chat(message, userId, threadId);
    }
  },

  // Chat with the AI coach (original non-streaming version)
  async chat(message: string, userId: string, threadId?: string) {
    try {
      // Use user-specific thread ID to avoid conflicts between users
      const actualThreadId = threadId || `user-${userId}-conversation`;
      
      // Get user's current program and assessment data to provide context
      // Make this non-blocking with fast timeout - if context fails, continue with just the message
      let contextMessage = message;
      
      try {
        console.log('Chat: Getting program and assessment data for user:', userId);
        
        // Ultra-fast context fetching (5 seconds max total)
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
        
        // Ultra-aggressive timeout - if context takes too long, skip it immediately
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Context timeout')), 5000)
        );
        
        const [programData, assessmentData] = await Promise.race([
          contextPromise,
          timeoutPromise
        ]) as [any, any];

        console.log('Chat: Program data retrieved:', programData);
        console.log('Chat: Assessment data retrieved:', assessmentData);

        // Always build context with user info - even if no program/assessment data
        const context = {
          userMessage: message,
          userId: userId,
          isExistingUser: true, // This user is authenticated, so they exist
          currentProgram: programData?.detailedProgram,
          programName: programData?.name,
          currentWeek: programData?.currentWeek,
          assessmentData: assessmentData && assessmentData.length > 0 ? {
            predictedGrade: assessmentData[0].predicted_grade,
            compositeScore: assessmentData[0].composite_score,
            currentGrade: assessmentData[0].current_boulder_grade,
            targetGrade: assessmentData[0].target_grade
          } : null
        };
        contextMessage = `User question: "${message}"\n\nUser Context: ${JSON.stringify(context)}`;
        console.log('Chat: Sending context message:', contextMessage);
      } catch (error) {
        console.warn('Chat: Context fetching failed or timed out, continuing without context:', error instanceof Error ? error.message : String(error));
        // Even if context fetching fails, still tell AI this is an existing user
        const fallbackContext = {
          userMessage: message,
          userId: userId,
          isExistingUser: true,
          note: "Context fetching timed out, but this is an authenticated existing user"
        };
        contextMessage = `User question: "${message}"\n\nUser Context: ${JSON.stringify(fallbackContext)}`;
        console.log('Chat: Using fallback context:', contextMessage);
      }

      const response = await fetch(`${MASTRA_API_BASE}/agents/climbingPillAgent/generate`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ 
          messages: [contextMessage],  // Fix: API expects Array<string>, not Array<object>
          resourceid: userId,   // API uses lowercase 'resourceid'
          threadId: actualThreadId    // Thread ID for conversation context
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
      
      return {
        role: 'assistant',
        content: 'Sorry, I encountered an unexpected error. Please try again.',
        confidence: 0.1
      };
    }
  },

  // Get user profile data from Supabase and latest assessment
  async getUserProfile(userId: string) {
    try {
      // Get the latest assessment to determine current grade and progress
      const assessment = await this.getLatestAssessment(userId);
      
      if (assessment) {
        // Calculate user data based on assessment
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
      if (assessment && assessment.length > 0) {
        const grade = assessment[0].predicted_grade || "V4";
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
        eightyPercentGrade: assessmentData.currentGrade as string, // Fix: Use currentGrade from frontend
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

  // Generate training program - CRITICAL METHOD THAT WAS MISSING
  async generateProgram(programData: Record<string, unknown>) {
    try {
      console.log('🚀 V2 API: Generating program with preferences:', programData);

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
      console.log('✅ V2 API: Program generation success:', result);
      return result;
    } catch (error) {
      console.error('❌ V2 API: Error generating program:', error);
      throw error;
    }
  },

  // Save training program to database - CRITICAL METHOD THAT WAS MISSING
  async saveTrainingProgram(programData: Record<string, unknown>, userId: string) {
    try {
      console.log('💾 V2 API: Saving training program:', programData);

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
      console.log('✅ V2 API: Program saved successfully:', result);
      return result;
    } catch (error) {
      console.error('❌ V2 API: Error saving program:', error);
      throw error;
    }
  }
};

export default climbingPillAPI; 