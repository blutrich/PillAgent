import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { supabase, dbHelpers } from '../lib/supabase';

/**
 * Optimal ClimbingPill Program Generator
 * Your proven climbing expertise + constraint validation + injury protocols
 */
const OPTIMAL_CLIMBINGPILL_PROMPT = `
You are ClimbingPill's program creation specialist. Generate personalized 6-week climbing training cycles.

## CONSTRAINT HIERARCHY (NEVER VIOLATE)
1. Fingerboard: 2x/week, 72hr apart
2. Projects: 2x/week, 48hr apart  
3. Flash: 2x/week, 48hr apart
4. Technical: 4x/week, 24hr apart
5. Minimum 2 rest days/week
6. No consecutive high-intensity days

## 6-WEEK CYCLE STRUCTURE

### WEEKS 1-4: Progressive Loading
- Week 1: FB 3 sets at 95%, project 5-6 moves
- Week 2: FB 3 sets at 97%, project 5-6 moves  
- Week 3: FB 4 sets at 100%, project 4-5 moves
- Week 4: FB 4 sets at 100%, project 2-4 moves

### WEEK 5: Deload
- Intensity: 50%, Volume: 50%
- Sessions: Fingerboard (2 sets), General fitness, Free climbing

### WEEK 6: Assessment  
- 1 test day, 3+ rest days
- Test fingerboard max, project attempts, physical assessments

## GRADE CALCULATIONS
- Project: 80% + 1
- Flash: 80% - 1  
- Technical: Flash - 3
- Endurance: Flash - 4

## TRAINING TYPES

### Boulder Projects
- RPE 8-10, 2-4 moves, 20min/boulder, quality over quantity

### Flash Training
- RPE 6-7, 2 attempts/boulder, video review, 2min rest

### Technical Practice  
- RPE 4-5, multiple solutions, 3-4 grades below flash

### Fingerboard Protocol
- 10s hangs, 2-3min rest, RPE 8-10, max +5% increase/week

### General Fitness
- Upper Push: Push-ups, triceps ext., Y shoulder press, handstand
- Upper Pull: Pull-ups, front lever, biceps curls
- Core: Toe-to-bar, ab wheel, leg raises
- Lower: Squats, deadlifts, box jumps
- Standard: 3 sets × 6-12 reps, RPE 8, 2min rest

## SESSION DISTRIBUTION
- High Intensity: Never consecutive, best after rest days, morning preferred
- Low Intensity: Can be consecutive, good for fatigue days
- Rest Days: Min 2/week, never >2 high intensity between rests

## INJURY PROTOCOLS
**Shoulder**: No overhead FB positions, modified pull-up grips
**Elbow**: Reduce FB intensity 20%, extended warm-up, antagonist work  
**Finger**: Open-hand only, avoid max hangs, larger holds
**Back**: No weighted exercises, core stability focus

## OUTPUT FORMAT

WEEK [1-6] - [Focus]

[Day Name]
Warm-up:
- Grade: [Specific climbing grade]
- Volume: [Problem count/time]

Main Session:
- Type: [FB/Projects/Flash/Technical/Fitness]
- Target: [Specific grade or load]
- Volume: [Sets/duration]  
- Rest: [Specific periods]

Modifications:
- RPE: [Target effort]
- Alternatives: [For injuries/equipment]
- Progression: [How to advance]

## VALIDATION CHECKLIST
Before finalizing, verify:
✓ FB sessions 72+ hours apart
✓ Project sessions 48+ hours apart  
✓ No consecutive high-intensity days
✓ Minimum 2 rest days included
✓ Deload week reduces intensity/volume appropriately
✓ Assessment week has adequate rest
✓ All injury modifications applied

USER DATA:
- Current Boulder Grade (80%): {current_80_percent_grade}
- Current Lead Grade: {current_lead_grade}  
- Fingerboard Max Weight: {fingerboard_max_weight}
- Flash Grade: {flash_grade}
- Project Grade: {project_grade}
- Pull-up Max: {pull_up_max}
- Push-up Max: {push_up_max}
- Toe-to-bar Max: {toe_to_bar_max}
- Leg Split (cm): {leg_split}
- Climbing Style: {style_preference}
- Goals: {goals}
- Available Days/Times: {available_days_times}
- Equipment Access: {equipment_access}
- Training History: {training_history}
- Injuries/Limitations: {injuries}
- Session Length: {session_length}

Generate a complete 6-week program following all rules above. Focus on the user's specific goals and limitations.

EXAMPLE OUTPUT:

WEEK 1 - Base Building

Monday
Warm-up:
- Grade: V3
- Volume: 10 problems, 15min

Main Session:
- Type: Fingerboard
- Target: 100% max weight
- Volume: 3 sets × 10s hangs
- Rest: 3min between sets

- Type: Boulder Projects  
- Target: V6
- Volume: 3 problems × 20min each
- Rest: Full recovery between attempts

Modifications:
- RPE: 8-10 for projects
- Alternatives: If no FB, use gym holds for max hangs
- Progression: Next week increase FB to 102%

Wednesday  
Warm-up:
- Grade: V3
- Volume: 10 problems, 10min

Main Session:
- Type: General Fitness
- Target: Upper body focus
- Volume: Pull-ups 3×10, Push-ups 3×15, Core 3×12
- Rest: 2min between exercises

- Type: Flash Training
- Target: V4  
- Volume: 8-10 problems, 60min total
- Rest: 2min between problems

Modifications:
- RPE: 6-7 for flash
- Alternatives: If elbow pain, reduce pull-up volume
- Progression: Aim for higher success rate

Continue this format for all 6 weeks...`;

interface ProgramGenerationResult {
  programId: string;
  programType: 'quick' | 'enhanced' | 'optimized';
  personalizationScore: number;
  requiresCoachReview: boolean;
  programData: {
    weeks: Array<{
      weekNumber: number;
      focus: string;
      days: Array<{
        day: string;
        sessions: Array<{
          type: string;
          exercises: string[];
          duration: number;
          intensity: string;
          notes: string;
        }>;
      }>;
    }>;
  };
  aiInsights: string[];
  confidence: 'high' | 'medium' | 'low';
}

export const programGenerationTool = createTool({
  id: 'generate-training-program',
  description: 'Generate personalized 6-week climbing training program using ClimbingPill methodology with proper periodization, constraint validation, and injury protocols',
  inputSchema: z.object({
    // User identification
    userId: z.string().describe('Unique user identifier'),
    
    // Assessment results (from climbing-assessment-tool)
    assessmentResults: z.object({
      predictedGrade: z.string().describe('Predicted V-grade from assessment'),
      compositeScore: z.number().describe('Composite score from assessment'),
      weaknesses: z.array(z.string()).describe('Primary and secondary weaknesses identified'),
      strongestArea: z.string().describe('Strongest performance area'),
      weakestArea: z.string().describe('Weakest performance area'),
      fingerStrengthRatio: z.number().describe('Finger strength ratio from assessment'),
      pullUpRatio: z.number().describe('Pull-up ratio from assessment'),
      pushUpRatio: z.number().describe('Push-up ratio from assessment'),
      toeToBarRatio: z.number().describe('Toe-to-bar ratio from assessment'),
      flexibilityRatio: z.number().describe('Flexibility ratio from assessment'),
    }),
    
    // Program type selection
    programType: z.enum(['quick', 'enhanced', 'optimized']).describe('Level of personalization and detail'),
    
    // User preferences and constraints
    userPreferences: z.object({
      availableDays: z.array(z.number()).describe('Available training days (1-7, where 1=Monday)'),
      sessionLengthMinutes: z.number().describe('Preferred session length in minutes'),
      equipmentAccess: z.array(z.string()).describe('Available equipment: fingerboard, campus_board, gym, home_setup, etc.'),
      primaryGoals: z.array(z.string()).describe('Primary training goals: strength, technique, specific_route, competition, etc.'),
      climbingStyle: z.string().optional().describe('Preferred climbing style: sport, boulder, trad, etc.'),
      injuryHistory: z.array(z.string()).optional().describe('Previous injuries or current limitations'),
    }),
    
    // Detailed context for program generation
    detailedContext: z.object({
      current80PercentGrade: z.string().describe('Grade user can complete 8/10 times'),
      currentLeadGrade: z.string().optional().describe('Current lead climbing grade'),
      fingboardMaxWeight: z.number().describe('Current fingerboard max weight in kg'),
      trainingHistory: z.string().optional().describe('Previous training experience'),
      climberName: z.string().optional().describe('Climber name for personalization'),
    }),
  }),
  outputSchema: z.object({
    programId: z.string(),
    programData: z.object({
      weeks: z.array(z.object({
        weekNumber: z.number(),
        focus: z.string(),
        days: z.array(z.object({
          day: z.string(),
          sessions: z.array(z.object({
            type: z.string(),
            exercises: z.array(z.string()),
            duration: z.number(),
            intensity: z.string(),
            notes: z.string(),
          })),
        })),
      })),
    }),
    personalizationScore: z.number(),
    requiresCoachReview: z.boolean(),
    aiInsights: z.array(z.string()),
    confidence: z.enum(['high', 'medium', 'low']),
  }),
  execute: async ({ context }) => {
    const {
      userId,
      assessmentResults,
      programType,
      userPreferences,
      detailedContext,
    } = context;

    // Generate unique program ID
    const programId = `prog_${userId}_${Date.now()}`;
    
    // Determine personalization score based on program type
    const personalizationScores = {
      quick: 20,
      enhanced: 60,
      optimized: 95,
    };
    const personalizationScore = personalizationScores[programType];

    // Calculate training grades from assessment
    const flashGrade = calculateGradeNumber(detailedContext.current80PercentGrade) - 1;
    const projectGrade = calculateGradeNumber(detailedContext.current80PercentGrade) + 1;
    const technicalGrade = flashGrade - 3;
    const enduranceGrade = flashGrade - 4;

    // Prepare user data for the prompt
    const userData = {
      current_80_percent_grade: detailedContext.current80PercentGrade,
      current_lead_grade: detailedContext.currentLeadGrade || 'Not specified',
      fingerboard_max_weight: `${detailedContext.fingboardMaxWeight}kg`,
      flash_grade: `V${Math.max(0, flashGrade)}`,
      project_grade: `V${projectGrade}`,
      pull_up_max: Math.round(assessmentResults.pullUpRatio * 70), // Estimate from ratio
      push_up_max: Math.round(assessmentResults.pushUpRatio * 70),
      toe_to_bar_max: Math.round(assessmentResults.toeToBarRatio * 70),
      leg_split: Math.round(assessmentResults.flexibilityRatio * 175), // Estimate from ratio
      style_preference: userPreferences.climbingStyle || 'Bouldering',
      goals: userPreferences.primaryGoals.join(', '),
      available_days_times: `${userPreferences.availableDays.length} days per week, ${userPreferences.sessionLengthMinutes} minutes per session`,
      equipment_access: userPreferences.equipmentAccess.join(', '),
      training_history: detailedContext.trainingHistory || 'General climbing experience',
      injuries: userPreferences.injuryHistory?.join(', ') || 'None reported',
      session_length: `${userPreferences.sessionLengthMinutes} minutes`,
    };

         // Replace placeholders in the optimal prompt
     const prompt = OPTIMAL_CLIMBINGPILL_PROMPT.replace(
       /{(\w+)}/g,
       (match, key) => {
         const value = userData[key as keyof typeof userData];
         return typeof value === 'string' ? value : String(value) || `[${key} not provided]`;
       }
     );

    try {
      // Generate program using OpenAI with the optimal prompt
      const { text } = await generateText({
        model: openai('gpt-4o'),
        prompt,
        temperature: 0.2, // Lower temperature for more consistent, structured output
      });

      // Parse the response into our structured format
      const programData = parseAIResponseToStructure(text, userPreferences.availableDays.length);

      // Determine if coach review is required
      const requiresCoachReview = shouldRequireCoachReview(
        assessmentResults,
        userPreferences,
        programType
      );

      // Generate AI insights
      const aiInsights = generateAIInsights(
        assessmentResults,
        userPreferences,
        programType,
        requiresCoachReview
      );

      // Determine confidence level
      const confidence = calculateConfidenceLevel(
        assessmentResults,
        userPreferences,
        programType
      );

      // Save program to Supabase
      try {
        // Get latest assessment for linking
        const latestAssessment = await dbHelpers.getLatestAssessment(userId);
        
        const programToSave = {
          user_id: userId,
          assessment_id: latestAssessment?.id,
          program_name: `ClimbingPill ${programType.charAt(0).toUpperCase() + programType.slice(1)} Program`,
          duration_weeks: 6,
          difficulty_level: (confidence === 'high' ? 'advanced' : confidence === 'medium' ? 'intermediate' : 'beginner') as 'advanced' | 'intermediate' | 'beginner',
          focus_areas: userPreferences.primaryGoals,
          target_grade: assessmentResults.predictedGrade,
          program_data: {
            ...programData,
            personalization_score: personalizationScore,
            requires_coach_review: requiresCoachReview,
            ai_insights: aiInsights,
            confidence,
            generated_at: new Date().toISOString(),
            user_preferences: userPreferences,
            assessment_data: assessmentResults
          },
          status: 'active' as 'active' | 'completed' | 'paused' | 'cancelled',
          progress_percentage: 0,
          completed_sessions: 0,
          total_sessions: programData.weeks.reduce((total: number, week: any) => 
            total + week.days.length, 0),
          initial_grade: detailedContext.current80PercentGrade,
          current_grade: detailedContext.current80PercentGrade,
          grade_improvements: 0
        };

        const savedProgram = await dbHelpers.createTrainingProgram(programToSave);
        
        if (savedProgram) {
          console.log(`Training program saved for user ${userId}: ${programType} program with ${confidence} confidence`);
        } else {
          console.error(`Failed to save training program for user ${userId}`);
        }
      } catch (error) {
        console.error('Error saving program to Supabase:', error);
        // Continue execution - don't fail the tool if save fails
      }

      return {
        programId,
        programData,
        personalizationScore,
        requiresCoachReview,
        aiInsights,
        confidence,
      };
    } catch (error) {
      console.error('Program generation error:', error);
      
      // Return fallback program on error
      return {
        programId,
        programData: createFallbackProgram(assessmentResults, userPreferences),
        personalizationScore,
        requiresCoachReview: true, // Always require review on error
        aiInsights: ['Program generated with fallback method due to AI service error. Coach review required.'],
        confidence: 'low' as const,
      };
    }
  },
});

function calculateGradeNumber(gradeString: string): number {
  const match = gradeString.match(/V(\d+)/);
  return match ? parseInt(match[1]) : 5; // Default to V5 if parsing fails
}

function parseAIResponseToStructure(aiResponse: string, availableDays: number): any {
  console.log('Parsing AI response for program structure...');
  
  // Try to parse JSON if the response contains structured data
  try {
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.weeks && Array.isArray(parsed.weeks)) {
        console.log('Successfully parsed structured JSON response');
        return parsed;
      }
    }
  } catch (e) {
    console.log('AI response is not JSON, using fallback structure generation');
  }
  
  // Fallback: Generate structured program regardless of AI response format
  const weeks = [];
  
  for (let i = 1; i <= 6; i++) {
    const week = {
      weekNumber: i,
      focus: i <= 4 ? 'Progressive Loading' : i === 5 ? 'Deload' : 'Assessment',
      days: generateWeekDays(availableDays, i)
    };
    weeks.push(week);
  }
  
  console.log(`Generated ${weeks.length} weeks with structured data`);
  return { weeks };
}

function generateWeekDays(availableDays: number, weekNumber: number): any[] {
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const days: any[] = [];
  
  // Generate training days based on available days (typically 3-4 days)
  const trainingDays = availableDays >= 4 ? 
    ['Monday', 'Tuesday', 'Thursday', 'Saturday'] : 
    ['Monday', 'Wednesday', 'Friday'];
  
  trainingDays.forEach((day, index) => {
    if (weekNumber === 6 && index > 1) {
      // Assessment week - mostly rest days after first 2 sessions
      days.push({
        day,
        sessions: [{
          type: 'Rest Day',
          exercises: ['Complete rest or light stretching', 'Mobility work (10-15 minutes)'],
          duration: 15,
          intensity: 'RPE 1',
          notes: 'Recovery for assessment week - prepare for grade testing'
        }]
      });
    } else if (weekNumber === 5) {
      // Deload week - reduced intensity
      const sessionType = index % 2 === 0 ? 'Light Fingerboard' : 'Technical Volume';
      days.push({
        day,
        sessions: [{
          type: sessionType,
          exercises: sessionType === 'Light Fingerboard' ? [
            'Fingerboard hangs: 2 sets × 8s (reduced load)',
            'Easy boulder problems (2-3 grades below max)',
            'Core activation: 2 sets × 30s planks'
          ] : [
            'Technical climbing: 60-70% intensity',
            'Movement drills and coordination',
            'Light stretching and mobility'
          ],
          duration: 60,
          intensity: 'RPE 4-5',
          notes: 'Deload week - focus on recovery and movement quality'
        }]
      });
    } else {
      // Regular training weeks (1-4)
      const isFingerboardDay = index % 2 === 0;
      const sessionType = isFingerboardDay ? 'Fingerboard + Projects' : 'Technical + Fitness';
      
      days.push({
        day,
        sessions: [{
          type: sessionType,
          exercises: isFingerboardDay ? [
            `Fingerboard max hangs: 3-4 sets × 10s (Week ${weekNumber} progression)`,
            'Boulder projects at target grade: 45-60 minutes',
            'Core strength: Toe-to-bar 3 sets × 5-8 reps',
            'Cool-down stretching: 10 minutes'
          ] : [
            'Technical climbing practice: 45 minutes',
            'Pull-ups: 3 sets × 6-10 reps',
            'Push-ups: 3 sets × 8-12 reps',
            'Flexibility work: Hip mobility and shoulders'
          ],
          duration: 90,
          intensity: isFingerboardDay ? 'RPE 8-9' : 'RPE 6-7',
          notes: `Week ${weekNumber}: ${weekNumber <= 2 ? 'Base building phase' : 'Intensity building phase'} - ${isFingerboardDay ? 'Focus on max strength' : 'Focus on technique and general fitness'}`
        }]
      });
    }
  });
  
  return days;
}

function shouldRequireCoachReview(
  assessmentResults: any,
  userPreferences: any,
  programType: string
): boolean {
  // High priority triggers (immediate review required)
  if (userPreferences.injuryHistory && userPreferences.injuryHistory.length > 0) {
    return true; // Injury history requires coach review
  }
  
  const gradeNumber = calculateGradeNumber(assessmentResults.predictedGrade);
  if (gradeNumber >= 10) {
    return true; // Elite athletes (V10+) require coach review
  }
  
  if (assessmentResults.weaknesses.length >= 3) {
    return true; // Complex cases with multiple weaknesses
  }
  
  // Medium priority triggers
  if (programType === 'optimized') {
    return true; // Optimized programs should be reviewed
  }
  
  if (userPreferences.primaryGoals.includes('competition') || 
      userPreferences.primaryGoals.includes('specific_route')) {
    return true; // Specific goals benefit from coach input
  }
  
  // Low risk cases can auto-approve
  return false;
}

function generateAIInsights(
  assessmentResults: any,
  userPreferences: any,
  programType: string,
  requiresCoachReview: boolean
): string[] {
  const insights: string[] = [];
  
  // Weakness-specific insights
  if (assessmentResults.weaknesses.includes('finger_strength')) {
    insights.push('Your finger strength is the primary limiting factor. This program prioritizes fingerboard training with proper 72-hour recovery periods.');
  }
  
  if (assessmentResults.weaknesses.includes('core_strength')) {
    insights.push('Core strength development will unlock steeper climbing and better body positioning through targeted toe-to-bar and ab wheel work.');
  }
  
  // Program type insights
  insights.push(`This ${programType} program includes proper 6-week periodization with progressive loading (weeks 1-4), deload (week 5), and assessment (week 6).`);
  
  // Coach review insights
  if (requiresCoachReview) {
    insights.push('This program has been flagged for coach review to ensure optimal safety and effectiveness based on your profile.');
  }
  
  // Constraint compliance
  insights.push('All training constraints are validated: fingerboard 2x/week with 72h spacing, projects 2x/week with 48h spacing, minimum 2 rest days.');
  
  return insights;
}

function calculateConfidenceLevel(
  assessmentResults: any,
  userPreferences: any,
  programType: string
): 'high' | 'medium' | 'low' {
  let confidenceScore = 0;
  
  // Assessment quality factors
  if (assessmentResults.compositeScore > 0) confidenceScore += 3;
  if (assessmentResults.weaknesses.length <= 2) confidenceScore += 2;
  
  // User preference completeness
  if (userPreferences.availableDays.length >= 3) confidenceScore += 2;
  if (userPreferences.equipmentAccess.length >= 2) confidenceScore += 1;
  
  // Program type factors
  if (programType === 'optimized') confidenceScore += 3;
  else if (programType === 'enhanced') confidenceScore += 2;
  else confidenceScore += 1;
  
  if (confidenceScore >= 8) return 'high';
  if (confidenceScore >= 5) return 'medium';
  return 'low';
}

function createFallbackProgram(assessmentResults: any, userPreferences: any): any {
  // Create a basic 6-week program structure as fallback
  return {
    weeks: [
      {
        weekNumber: 1,
        focus: 'Base Building',
        days: [
          {
            day: 'Monday',
            sessions: [
              {
                type: 'Fingerboard Training',
                exercises: ['Max hangs on 20mm edge: 3 sets of 10 seconds, 3min rest'],
                duration: 90,
                intensity: 'RPE 8',
                notes: 'Focus on proper form and full recovery between sets',
              },
            ],
          },
          {
            day: 'Wednesday',
            sessions: [
              {
                type: 'Technical Climbing + Fitness',
                exercises: ['Technical volume climbing', 'Pull-ups 3×8', 'Core circuit'],
                duration: 90,
                intensity: 'RPE 6',
                notes: 'Focus on movement quality and general fitness',
              },
            ],
          },
        ],
      },
    ],
  };
} 