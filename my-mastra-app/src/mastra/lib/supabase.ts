import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'https://lxeggioigpyzmkrjdmne.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY; // Use environment variable for security
if (!supabaseServiceKey) {
  throw new Error('SUPABASE_SERVICE_KEY is not set in environment variables.');
}

// Create Supabase client using the service role key
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Database types for TypeScript support
export interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  height_cm?: number;
  weight_kg?: number;
  climbing_experience_years?: number;
  climbing_style?: 'boulder' | 'lead' | 'both';
  primary_goals?: string[];
  equipment_access?: string[];
  available_days?: number;
  session_length_minutes?: number;
  subscription_tier?: 'free' | 'pro' | 'elite';
  onboarding_completed?: boolean;
  onboarding_step?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Assessment {
  id: string;
  user_id: string;
  assessment_type?: string;
  fingerboard_max_weight_kg?: number;
  fingerboard_edge_size_mm?: number;
  fingerboard_duration_seconds?: number;
  pull_ups_max?: number;
  flexibility_score?: number;
  current_boulder_grade?: string;
  current_lead_grade?: string;
  max_boulder_grade?: string;
  max_lead_grade?: string;
  composite_score?: number;
  strength_score?: number;
  technique_score?: number;
  endurance_score?: number;
  predicted_grade?: string;
  confidence_level?: string;
  primary_weaknesses?: string[];
  recommended_focus_areas?: string[];
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface TrainingProgram {
  id: string;
  user_id: string;
  assessment_id?: string;
  program_name: string;
  duration_weeks?: number;
  difficulty_level?: string;
  focus_areas?: string[];
  target_grade?: string;
  program_data: any; // JSONB field
  status?: string;
  progress_percentage?: number;
  completed_sessions?: number;
  total_sessions?: number;
  initial_grade?: string;
  current_grade?: string;
  grade_improvements?: number;
  created_at?: string;
  updated_at?: string;
  completed_at?: string;
}

export interface TrainingSession {
  id: string;
  user_id: string;
  program_id?: string;
  session_date: string;
  session_type?: 'strength' | 'power' | 'endurance' | 'technique' | 'recovery';
  planned_duration_minutes?: number;
  actual_duration_minutes?: number;
  exercises_completed?: any; // JSONB field
  perceived_exertion?: number; // 1-10 scale
  mood?: 'motivated' | 'neutral' | 'tired' | 'stressed' | 'excited';
  energy_level?: number; // 1-10 scale
  session_quality_score?: number;
  improvements_noted?: string[];
  challenges_faced?: string[];
  injuries?: string[];
  pain_points?: string[];
  safety_notes?: string;
  notes?: string;
  coach_feedback?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ConversationHistory {
  id: string;
  user_id: string;
  thread_id?: string;
  session_id?: string;
  conversation_type?: 'assessment' | 'planning' | 'coaching' | 'general';
  role?: 'user' | 'assistant' | 'system';
  content: string;
  tool_calls?: any; // JSONB field
  tool_results?: any; // JSONB field
  user_context?: any; // JSONB field
  agent_context?: any; // JSONB field
  created_at?: string;
}

// Database helper functions
export const dbHelpers = {
  // User profile operations
  async createUserProfile(profile: Partial<UserProfile>) {
    const { data, error } = await supabase
      .from('user_profiles')
      .insert(profile)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateUserProfile(userId: string, updates: Partial<UserProfile>) {
    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();
    
    if (error) {
      console.warn('Profile update failed, user may not exist yet:', error);
      return null;
    }
    return data;
  },

  async getUserProfile(userId: string) {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error) return null;
    return data;
  },

  // Assessment operations - STANDALONE FOR TESTING
  async createAssessment(assessment: Partial<Assessment>) {
    // For testing, create assessment without user_id (allows NULL)
    const assessmentData = { ...assessment };
    
    // Remove user_id if it's a test string that can't convert to UUID
    if (assessmentData.user_id && typeof assessmentData.user_id === 'string' && assessmentData.user_id.startsWith('test-user-')) {
      delete assessmentData.user_id;
    }

    const { data, error } = await supabase
      .from('assessments')
      .insert(assessmentData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async getLatestAssessment(userId: string) {
    const { data, error } = await supabase
      .from('assessments')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error) return null;
    return data;
  },

  // Training program operations - STANDALONE FOR TESTING
  async createTrainingProgram(program: Partial<TrainingProgram>) {
    // For testing, create program without user_id (allows NULL)
    const programData = { ...program };
    
    // Remove user_id if it's a test string that can't convert to UUID
    if (programData.user_id && typeof programData.user_id === 'string' && programData.user_id.startsWith('test-user-')) {
      delete programData.user_id;
    }

    const { data, error } = await supabase
      .from('training_programs')
      .insert(programData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async getUserPrograms(userId: string) {
    const { data, error } = await supabase
      .from('training_programs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) return [];
    return data;
  },

  // TEST MODE: Create test records without foreign key constraints
  async createTestAssessment() {
    const testAssessment = {
      assessment_type: 'complete',
      fingerboard_max_weight_kg: 20,
      fingerboard_edge_size_mm: 20,
      fingerboard_duration_seconds: 10,
      pull_ups_max: 15,
      flexibility_score: 75.5,
      current_boulder_grade: 'V5',
      max_boulder_grade: 'V5',
      composite_score: 78.5,
      strength_score: 85.0,
      technique_score: 72.0,
      endurance_score: 70.0,
      predicted_grade: 'V6',
      confidence_level: 'high',
      primary_weaknesses: ['core_strength', 'endurance'],
      recommended_focus_areas: ['fingerboard_training', 'core_work', 'technique_drills'],
      notes: 'Test assessment created via dbHelpers'
    };

    return this.createAssessment(testAssessment);
  },

  async createTestProgram() {
    const testProgram = {
      program_name: 'ClimbingPill Test Program',
      duration_weeks: 6,
      difficulty_level: 'intermediate',
      focus_areas: ['finger_strength', 'core_training'],
      target_grade: 'V6',
      program_data: {
        weeks: 6,
        sessionsPerWeek: 3,
        exercises: ['fingerboard', 'pull_ups', 'core_work'],
        ai_confidence: 85
      },
      status: 'active',
      total_sessions: 18,
      initial_grade: 'V5',
      current_grade: 'V5'
    };

    return this.createTrainingProgram(testProgram);
  }
}; 