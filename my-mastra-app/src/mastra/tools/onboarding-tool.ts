import { z } from 'zod';
import { createTool } from '@mastra/core';
import { supabase, dbHelpers } from '../lib/supabase';

// Onboarding step schemas
const GoalSettingSchema = z.object({
  goal: z.enum([
    'send_first_v6',
    'improve_finger_strength', 
    'climb_outdoors_confidently',
    'get_stronger_overall',
    'prepare_for_competition'
  ]).describe('Primary climbing goal'),
  customGoal: z.string().optional().describe('Custom goal if not in predefined list')
});

const CurrentLevelSchema = z.object({
  hardestGrade: z.enum(['V0', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6', 'V7', 'V8+'])
    .describe('Hardest boulder grade successfully sent'),
  confidenceLevel: z.number().min(1).max(5)
    .describe('Confidence in this grade (1-5 scale)'),
  yearsClimbing: z.number().min(0)
    .describe('Years of climbing experience')
});

const MiniAssessmentSchema = z.object({
  maxPullUps: z.number().min(0).describe('Maximum pull-ups completed'),
  fingerbaordWeight: z.number().describe('Added weight for 20mm edge hang (kg, can be negative)'),
  hasFingerboard: z.boolean().describe('Has access to fingerboard'),
  maxToeToBar: z.number().min(0).describe('Maximum toe-to-bar or knee raises'),
  bodyWeight: z.number().min(30).max(200).describe('Body weight in kg'),
  height: z.number().min(120).max(220).describe('Height in cm')
});

const ScheduleSetupSchema = z.object({
  trainingDays: z.array(z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']))
    .min(2).max(6).describe('Preferred training days'),
  sessionLength: z.enum(['60', '90', '120']).describe('Session length in minutes'),
  timeOfDay: z.enum(['morning', 'afternoon', 'evening']).describe('Preferred training time'),
  timezone: z.string().describe('User timezone')
});

const EquipmentCheckSchema = z.object({
  hasClimbingGym: z.boolean().describe('Access to climbing gym'),
  hasHomeFingerboard: z.boolean().describe('Has home fingerboard'),
  hasOutdoorAccess: z.boolean().describe('Access to outdoor crags'),
  hasFitnessEquipment: z.boolean().describe('Has basic fitness equipment'),
  phoneOnly: z.boolean().describe('Only has phone for training')
});

const OnboardingProgressSchema = z.object({
  userId: z.string().describe('Unique user identifier'),
  currentStep: z.number().min(1).max(6).describe('Current onboarding step'),
  completedSteps: z.array(z.number()).describe('Array of completed step numbers'),
  stepData: z.object({
    goalSetting: GoalSettingSchema.optional(),
    currentLevel: CurrentLevelSchema.optional(),
    miniAssessment: MiniAssessmentSchema.optional(),
    scheduleSetup: ScheduleSetupSchema.optional(),
    equipmentCheck: EquipmentCheckSchema.optional()
  }).describe('Data collected from each step'),
  startedAt: z.string().describe('ISO timestamp when onboarding started'),
  completedAt: z.string().optional().describe('ISO timestamp when onboarding completed'),
  totalTimeMinutes: z.number().optional().describe('Total time spent in onboarding')
});

// Individual step tools
export const goalSettingTool = createTool({
  id: 'goal_setting',
  description: 'Collect user\'s primary climbing goal and personalize their experience. Saves to user profile.',
  inputSchema: z.object({
    userId: z.string().describe('User ID for saving onboarding progress'),
    goal: z.enum([
      'send_first_v6',
      'improve_finger_strength', 
      'climb_outdoors_confidently',
      'get_stronger_overall',
      'prepare_for_competition'
    ]).describe('Primary climbing goal'),
    customGoal: z.string().optional().describe('Custom goal if not in predefined list')
  }),
  outputSchema: z.object({
    success: z.boolean(),
    message: z.string(),
    personalizedMessage: z.string().describe('Personalized message based on goal'),
    nextStepPreview: z.string().describe('Preview of what comes next')
  }),
  execute: async ({ context }) => {
    const { userId, goal, customGoal } = context;
    const goalMessages = {
      send_first_v6: "Awesome! Breaking into V6 is a huge milestone. We'll focus on the finger strength and technique needed for this grade.",
      improve_finger_strength: "Great choice! Finger strength is the foundation of climbing performance. Our program will target specific grip positions and progressive loading.",
      climb_outdoors_confidently: "Perfect! Outdoor climbing requires different skills than gym climbing. We'll build your confidence with strength and technique.",
      get_stronger_overall: "Excellent! Building overall climbing strength will improve your performance across all aspects of the sport.",
      prepare_for_competition: "Amazing! Competition climbing demands peak performance. We'll create a structured training plan for your competitive goals."
    };

    const personalizedMessage = customGoal 
      ? `Your custom goal: "${customGoal}" - We'll create a program specifically tailored to help you achieve this!`
      : goalMessages[goal];

    // Save goal to user profile
    try {
      const goalText = customGoal || goal.replace(/_/g, ' ');
      await dbHelpers.updateUserProfile(userId, {
        primary_goals: [goalText],
        onboarding_step: 2 // Move to next step
      });
      console.log(`Goal saved for user ${userId}: ${goalText}`);
    } catch (error) {
      console.error('Error saving goal to Supabase:', error);
    }

    return {
      success: true,
      message: "Goal successfully recorded! This will help us personalize your training program.",
      personalizedMessage,
      nextStepPreview: "Next, we'll quickly assess your current climbing level to establish your baseline."
    };
  }
});

export const currentLevelCheckTool = createTool({
  id: 'current_level_check',
  description: 'Assess user\'s current climbing level and experience',
  inputSchema: CurrentLevelSchema,
  outputSchema: z.object({
    success: z.boolean(),
    message: z.string(),
    levelAnalysis: z.string().describe('Analysis of their current level'),
    nextStepPreview: z.string()
  }),
  execute: async ({ context }) => {
    const { hardestGrade, confidenceLevel, yearsClimbing } = context;
    // Convert grade to numeric for analysis
    const gradeNumbers = { V0: 0, V1: 1, V2: 2, V3: 3, V4: 4, V5: 5, V6: 6, V7: 7, 'V8+': 8 };
    const numericGrade = gradeNumbers[hardestGrade as keyof typeof gradeNumbers];
    
    let levelAnalysis = `You're climbing ${hardestGrade} with ${yearsClimbing} years of experience. `;
    
    if (confidenceLevel >= 4) {
      levelAnalysis += "You seem confident at this grade - we'll focus on progressing to the next level.";
    } else if (confidenceLevel <= 2) {
      levelAnalysis += "Let's build more confidence at your current grade while working toward progression.";
    } else {
      levelAnalysis += "You're in a good position to push for the next grade level.";
    }

    // Experience vs grade analysis
    const expectedGrade = Math.min(Math.floor(yearsClimbing * 1.2), 8); // Rough formula
    if (numericGrade > expectedGrade) {
      levelAnalysis += " You're progressing faster than typical - great job!";
    } else if (numericGrade < expectedGrade - 1) {
      levelAnalysis += " There's definitely room for improvement with focused training.";
    }

    return {
      success: true,
      message: "Current level recorded successfully!",
      levelAnalysis,
      nextStepPreview: "Now let's do a quick physical assessment to understand your strengths and areas for improvement."
    };
  }
});

export const miniPhysicalAssessmentTool = createTool({
  id: 'mini_physical_assessment',
  description: 'Conduct abbreviated physical assessment for onboarding',
  inputSchema: MiniAssessmentSchema,
  outputSchema: z.object({
    success: z.boolean(),
    message: z.string(),
    compositeScore: z.number().describe('Calculated composite score'),
    predictedGrade: z.string().describe('Predicted climbing grade based on assessment'),
    strengthAreas: z.array(z.string()).describe('Identified strength areas'),
    improvementAreas: z.array(z.string()).describe('Areas needing improvement'),
    nextStepPreview: z.string()
  }),
  execute: async ({ context }) => {
    const { maxPullUps, fingerbaordWeight, hasFingerboard, maxToeToBar, bodyWeight, height } = context;
    // Simplified assessment calculation (based on full assessment tool)
    const fingerStrengthRatio = hasFingerboard 
      ? (fingerbaordWeight + bodyWeight) / bodyWeight 
      : 1.0; // Default if no fingerboard
    
    const pullUpRatio = maxPullUps / bodyWeight;
    const coreRatio = maxToeToBar / bodyWeight;
    
    // Simplified composite score (missing push-ups and flexibility)
    const compositeScore = (0.45 * fingerStrengthRatio) + (0.20 * pullUpRatio) + (0.35 * coreRatio);
    
    // Grade prediction
    let predictedGrade = 'V4';
    if (compositeScore >= 1.45) predictedGrade = 'V12+';
    else if (compositeScore >= 1.30) predictedGrade = 'V11';
    else if (compositeScore >= 1.15) predictedGrade = 'V10';
    else if (compositeScore >= 1.05) predictedGrade = 'V9';
    else if (compositeScore >= 0.95) predictedGrade = 'V8';
    else if (compositeScore >= 0.85) predictedGrade = 'V7';
    else if (compositeScore >= 0.75) predictedGrade = 'V6';
    else if (compositeScore >= 0.65) predictedGrade = 'V5';
    
    // Identify strengths and weaknesses
    const strengthAreas = [];
    const improvementAreas = [];
    
    if (fingerStrengthRatio > 1.3) strengthAreas.push('Finger strength');
    else if (fingerStrengthRatio < 1.0) improvementAreas.push('Finger strength');
    
    if (pullUpRatio > 0.7) strengthAreas.push('Pull-up strength');
    else if (pullUpRatio < 0.3) improvementAreas.push('Pull-up strength');
    
    if (coreRatio > 0.5) strengthAreas.push('Core strength');
    else if (coreRatio < 0.2) improvementAreas.push('Core strength');
    
    if (!hasFingerboard) improvementAreas.push('Equipment access (fingerboard recommended)');

    return {
      success: true,
      message: "Physical assessment completed! Your results look great.",
      compositeScore: Math.round(compositeScore * 100) / 100,
      predictedGrade,
      strengthAreas,
      improvementAreas,
      nextStepPreview: "Now let's set up your training schedule to fit your lifestyle."
    };
  }
});

export const scheduleSetupTool = createTool({
  id: 'schedule_setup',
  description: 'Configure user\'s training schedule preferences',
  inputSchema: ScheduleSetupSchema,
  outputSchema: z.object({
    success: z.boolean(),
    message: z.string(),
    scheduleAnalysis: z.string().describe('Analysis of their schedule'),
    recommendedProgram: z.string().describe('Recommended program structure'),
    nextStepPreview: z.string()
  }),
  execute: async ({ context }) => {
    const { trainingDays, sessionLength, timeOfDay, timezone } = context;
    const daysPerWeek = trainingDays.length;
    let scheduleAnalysis = `Training ${daysPerWeek} days per week with ${sessionLength}-minute sessions in the ${timeOfDay}. `;
    
    let recommendedProgram = '';
    if (daysPerWeek >= 4) {
      recommendedProgram = 'Enhanced program with dedicated strength and technique days';
      scheduleAnalysis += 'Great frequency for serious progression!';
    } else if (daysPerWeek === 3) {
      recommendedProgram = 'Balanced program mixing strength, technique, and projects';
      scheduleAnalysis += 'Perfect balance for consistent progress.';
    } else {
      recommendedProgram = 'Focused program maximizing each session';
      scheduleAnalysis += 'We\'ll make every session count!';
    }
    
    // Check for optimal spacing
    const hasBackToBackDays = trainingDays.some((day, index) => {
      const nextDay = trainingDays[index + 1];
      const dayOrder = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const currentIndex = dayOrder.indexOf(day);
      const nextIndex = dayOrder.indexOf(nextDay);
      return nextIndex === (currentIndex + 1) % 7;
    });
    
    if (hasBackToBackDays && daysPerWeek > 2) {
      scheduleAnalysis += ' Note: We\'ll balance intensive and recovery sessions on consecutive days.';
    }

    return {
      success: true,
      message: "Training schedule configured successfully!",
      scheduleAnalysis,
      recommendedProgram,
      nextStepPreview: "Finally, let's check what equipment you have access to."
    };
  }
});

export const equipmentCheckTool = createTool({
  id: 'equipment_check',
  description: 'Assess available equipment and adapt program accordingly',
  inputSchema: EquipmentCheckSchema,
  outputSchema: z.object({
    success: z.boolean(),
    message: z.string(),
    equipmentAnalysis: z.string().describe('Analysis of available equipment'),
    programAdaptations: z.array(z.string()).describe('How program will be adapted'),
    nextStepPreview: z.string()
  }),
  execute: async ({ context }) => {
    const { hasClimbingGym, hasHomeFingerboard, hasOutdoorAccess, hasFitnessEquipment, phoneOnly } = context;
    const availableEquipment = [];
    const programAdaptations = [];
    
    if (hasClimbingGym) {
      availableEquipment.push('climbing gym');
      programAdaptations.push('Route-based training and gym-specific exercises');
    }
    
    if (hasHomeFingerboard) {
      availableEquipment.push('home fingerboard');
      programAdaptations.push('Home fingerboard protocols for finger strength');
    }
    
    if (hasOutdoorAccess) {
      availableEquipment.push('outdoor crags');
      programAdaptations.push('Outdoor-specific technique and mental training');
    }
    
    if (hasFitnessEquipment) {
      availableEquipment.push('fitness equipment');
      programAdaptations.push('Supplementary strength training exercises');
    }
    
    if (phoneOnly) {
      programAdaptations.push('Bodyweight exercises and technique drills');
    }
    
    let equipmentAnalysis = '';
    if (availableEquipment.length === 0) {
      equipmentAnalysis = 'We\'ll create a program using bodyweight exercises and basic equipment you can find anywhere.';
    } else {
      equipmentAnalysis = `Great! You have access to: ${availableEquipment.join(', ')}. We'll optimize your program for these resources.`;
    }
    
    if (!hasHomeFingerboard && hasClimbingGym) {
      programAdaptations.push('Gym-based fingerboard alternatives');
    }

    return {
      success: true,
      message: "Equipment assessment complete!",
      equipmentAnalysis,
      programAdaptations,
      nextStepPreview: "Perfect! Now we'll generate your personalized training program."
    };
  }
});

// Main onboarding orchestration tool
export const onboardingOrchestratorTool = createTool({
  id: 'onboarding_orchestrator',
  description: 'Orchestrate the complete onboarding flow and generate final program',
  inputSchema: z.object({
    userId: z.string(),
    action: z.enum(['start', 'continue', 'complete', 'get_progress']),
    stepData: z.any().optional().describe('Data for current step if continuing')
  }),
  outputSchema: z.object({
    success: z.boolean(),
    message: z.string(),
    currentStep: z.number(),
    totalSteps: z.number(),
    progress: z.number().describe('Progress percentage'),
    nextAction: z.string().describe('What user should do next'),
    stepTitle: z.string().describe('Title of current/next step'),
    estimatedTimeRemaining: z.string().describe('Estimated time to completion'),
    onboardingComplete: z.boolean(),
    generatedProgram: z.any().optional().describe('Generated program if onboarding complete')
  }),
  execute: async ({ context }) => {
    const { userId, action, stepData } = context;
    // This would integrate with a persistence layer in a real implementation
    // For now, we'll simulate the orchestration logic
    
    const totalSteps = 6;
    let currentStep = 1;
    
    switch (action) {
      case 'start':
        return {
          success: true,
          message: "Welcome to ClimbingPill! Let's get you set up with a personalized training program.",
          currentStep: 1,
          totalSteps,
          progress: 0,
          nextAction: "Select your primary climbing goal",
          stepTitle: "Quick Goal Setting",
          estimatedTimeRemaining: "5 minutes",
          onboardingComplete: false
        };
        
      case 'continue':
        // This would update the user's progress and return next step
        currentStep = Math.min(currentStep + 1, totalSteps);
        const progress = (currentStep - 1) / totalSteps * 100;
        
        const stepTitles = [
          "Quick Goal Setting",
          "Current Level Check", 
          "Mini Physical Assessment",
          "Schedule Setup",
          "Equipment Check",
          "Program Generation"
        ];
        
        return {
          success: true,
          message: `Step ${currentStep - 1} completed! Moving to step ${currentStep}.`,
          currentStep,
          totalSteps,
          progress,
          nextAction: currentStep <= totalSteps ? "Complete current step" : "Review your program",
          stepTitle: stepTitles[currentStep - 1] || "Complete",
          estimatedTimeRemaining: `${Math.max(0, 6 - currentStep)} minutes`,
          onboardingComplete: currentStep > totalSteps
        };
        
      case 'complete':
        return {
          success: true,
          message: "Congratulations! Your personalized ClimbingPill program is ready!",
          currentStep: totalSteps,
          totalSteps,
          progress: 100,
          nextAction: "Start your first training session",
          stepTitle: "Program Ready",
          estimatedTimeRemaining: "0 minutes",
          onboardingComplete: true,
          generatedProgram: {
            type: "6-week_personalized_program",
            startDate: new Date().toISOString(),
            message: "Your program has been generated based on your assessment. Check your dashboard to begin!"
          }
        };
        
      case 'get_progress':
        return {
          success: true,
          message: "Current onboarding progress retrieved",
          currentStep: 3, // Example
          totalSteps,
          progress: 40,
          nextAction: "Complete physical assessment",
          stepTitle: "Mini Physical Assessment",
          estimatedTimeRemaining: "3 minutes",
          onboardingComplete: false
        };
        
      default:
        throw new Error('Invalid action');
    }
  }
});

// Onboarding analytics tool
export const onboardingAnalyticsTool = createTool({
  id: 'onboarding_analytics',
  description: 'Track onboarding metrics and identify optimization opportunities',
  inputSchema: z.object({
    event: z.enum(['step_started', 'step_completed', 'step_abandoned', 'onboarding_completed']),
    userId: z.string(),
    stepNumber: z.number().optional(),
    timeSpent: z.number().optional().describe('Time spent in seconds'),
    metadata: z.any().optional()
  }),
  outputSchema: z.object({
    success: z.boolean(),
    message: z.string(),
    recommendations: z.array(z.string()).optional().describe('Optimization recommendations')
  }),
  execute: async ({ context }) => {
    const { event, userId, stepNumber, timeSpent, metadata } = context;
    // This would integrate with analytics platform in real implementation
    const recommendations = [];
    
    if (event === 'step_abandoned' && stepNumber === 3) {
      recommendations.push('Consider simplifying physical assessment step');
      recommendations.push('Add progress saving to allow users to return later');
    }
    
    if (timeSpent && timeSpent > 300 && stepNumber === 4) { // 5+ minutes on schedule setup
      recommendations.push('Schedule setup is taking too long - consider smart defaults');
    }
    
    return {
      success: true,
      message: `Onboarding event '${event}' tracked successfully`,
      recommendations: recommendations.length > 0 ? recommendations : undefined
    };
  }
}); 