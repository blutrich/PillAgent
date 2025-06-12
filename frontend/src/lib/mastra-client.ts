// ClimbingPill AI Coach API functions - Connected to Mastra Backend
const MASTRA_API_BASE = 'http://localhost:4112/api';

export const climbingPillAPI = {
  // Chat with the AI coach
  async chat(message: string) {
    try {
      const response = await fetch(`${MASTRA_API_BASE}/agents/climbingPillAgent/generate`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ 
          messages: [{ role: 'user', content: message }]
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

  // Get user profile data
  async getUserProfile(userId: string) {
    try {
      const response = await fetch(`${MASTRA_API_BASE}/users/${userId}/profile`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        // Return mock data if user doesn't exist yet
        return {
          name: "Alex Chen",
          currentGrade: "V7",
          targetGrade: "V8", 
          assessmentScore: 0.82,
          programProgress: 65,
          subscription: "premium",
          avatar: "AC"
        };
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error getting user profile:', error);
      // Return mock data as fallback
      return {
        name: "Alex Chen",
        currentGrade: "V7",
        targetGrade: "V8", 
        assessmentScore: 0.82,
        programProgress: 65,
        subscription: "premium",
        avatar: "AC"
      };
    }
  },

  // Get training program data
  async getTrainingProgram(userId: string) {
    try {
      const response = await fetch(`${MASTRA_API_BASE}/users/${userId}/program`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        // Return mock data if program doesn't exist yet
        return {
          name: "V8 Power Development",
          currentWeek: 3,
          totalWeeks: 6,
          nextSession: "Fingerboard + Projects",
          todayComplete: false
        };
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error getting training program:', error);
      // Return mock data as fallback
      return {
        name: "V8 Power Development",
        currentWeek: 3,
        totalWeeks: 6,
        nextSession: "Fingerboard + Projects",
        todayComplete: false
      };
    }
  },

  // Run onboarding flow
  async startOnboarding(userData: Record<string, unknown>) {
    try {
      const response = await fetch(`${MASTRA_API_BASE}/agents/climbingPillAgent/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ 
            role: 'user', 
            content: `Start onboarding for new user: ${JSON.stringify(userData)}` 
          }]
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
      const response = await fetch(`${MASTRA_API_BASE}/agents/climbingPillAgent/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ 
            role: 'user', 
            content: `Conduct assessment with data: ${JSON.stringify(assessmentData)}` 
          }]
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