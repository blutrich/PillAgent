import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { supabase, dbHelpers } from '../lib/supabase';

interface AssessmentResult {
  // Physical measurements
  bodyWeight: number;
  height: number;
  
  // Raw performance metrics
  fingerStrengthRatio: number;
  pullUpRatio: number;
  pushUpRatio: number;
  toeToBarRatio: number;
  flexibilityRatio: number;
  
  // Normalized scores (0-100)
  normalizedFingerStrength: number;
  normalizedPullUps: number;
  normalizedPushUps: number;
  normalizedCoreStrength: number;
  normalizedFlexibility: number;
  
  // Final assessment
  compositeScore: number;
  predictedGrade: string;
  confidenceLevel: string;
  strongestArea: string;
  weakestArea: string;
  recommendations: string[];
}

export const climbingAssessmentTool = createTool({
  id: 'climbing-assessment',
  description: 'ClimbingPill Assessment Tool - Comprehensive climbing performance analysis using normalized metrics and composite scoring to predict V-grade and provide training recommendations. Saves results to user profile.',
  inputSchema: z.object({
    // User identification
    userId: z.string().describe('User ID for saving assessment results'),
    
    // Basic measurements
    bodyWeight: z.number().describe('Body weight in kg (precision: 0.1kg)'),
    height: z.number().describe('Height in cm (precision: 1cm)'),
    
    // Finger strength (20mm edge hang)
    addedWeight: z.number().default(0).describe('Additional weight for 20mm edge hang in kg'),
    
    // Strength metrics
    maxPullUps: z.number().describe('Maximum pull-ups (full range of motion)'),
    maxPushUps: z.number().describe('Maximum push-ups (chest to ground)'),
    maxToeToBar: z.number().describe('Maximum toe-to-bar (full contact)'),
    
    // Flexibility
    legSpreadDistance: z.number().describe('Maximum leg spread distance in cm'),
    
    // Boulder grade assessment
    eightyPercentGrade: z.string().describe('Boulder grade you can complete 8/10 times (e.g., V4, V5)'),
    
    // Assessment type
    assessmentType: z.enum(['quick', 'partial', 'complete']).default('complete').describe('Type of assessment being performed'),
    
    // Optional context
    climberName: z.string().default('Climber').describe('Name for personalized output'),
  }),
  outputSchema: z.object({
    // Raw measurements
    bodyWeight: z.number(),
    height: z.number(),
    
    // Performance ratios
    fingerStrengthRatio: z.number(),
    pullUpRatio: z.number(),
    pushUpRatio: z.number(),
    toeToBarRatio: z.number(),
    flexibilityRatio: z.number(),
    
    // Normalized scores
    normalizedFingerStrength: z.number(),
    normalizedPullUps: z.number(),
    normalizedPushUps: z.number(),
    normalizedCoreStrength: z.number(),
    normalizedFlexibility: z.number(),
    
    // Final assessment
    compositeScore: z.number(),
    predictedGrade: z.string(),
    confidenceLevel: z.string(),
    strongestArea: z.string(),
    weakestArea: z.string(),
    recommendations: z.array(z.string()),
    
    // Detailed analysis
    assessmentSummary: z.string(),
  }),
  execute: async ({ context }) => {
    const {
      userId,
      bodyWeight,
      height,
      addedWeight,
      maxPullUps,
      maxPushUps,
      maxToeToBar,
      legSpreadDistance,
      eightyPercentGrade,
      assessmentType,
      climberName,
    } = context;

    // STEP 1: Calculate Performance Ratios
    
    // Finger strength ratio: (added_weight + body_weight) / body_weight
    const fingerStrengthRatio = (addedWeight + bodyWeight) / bodyWeight;
    
    // Pull-ups ratio: max_reps / body_weight
    const pullUpRatio = maxPullUps / bodyWeight;
    
    // Push-ups ratio: max_reps / body_weight  
    const pushUpRatio = maxPushUps / bodyWeight;
    
    // Toe-to-bar ratio: max_reps / body_weight
    const toeToBarRatio = maxToeToBar / bodyWeight;
    
    // Flexibility ratio: leg_spread_distance / height
    const flexibilityRatio = legSpreadDistance / height;

    // STEP 2: Normalize to 0-100 scale
    
    // Finger strength normalization (range 1.0-2.5)
    const normalizedFingerStrength = Math.min(100, Math.max(0, 
      ((fingerStrengthRatio - 1.0) / (2.5 - 1.0)) * 100
    ));
    
    // Pull-ups normalization (range 0.2-1.0)
    const normalizedPullUps = Math.min(100, Math.max(0,
      ((pullUpRatio - 0.2) / (1.0 - 0.2)) * 100
    ));
    
    // Push-ups normalization (range 0.3-1.2)
    const normalizedPushUps = Math.min(100, Math.max(0,
      ((pushUpRatio - 0.3) / (1.2 - 0.3)) * 100
    ));
    
    // Core strength (toe-to-bar) normalization (range 0.2-0.8)
    const normalizedCoreStrength = Math.min(100, Math.max(0,
      ((toeToBarRatio - 0.2) / (0.8 - 0.2)) * 100
    ));
    
    // Flexibility normalization (range 0.8-1.5)
    const normalizedFlexibility = Math.min(100, Math.max(0,
      ((flexibilityRatio - 0.8) / (1.5 - 0.8)) * 100
    ));

    // STEP 3: Calculate Composite Score
    const compositeScore = 
      (0.45 * (normalizedFingerStrength / 100)) +
      (0.20 * (normalizedPullUps / 100)) +
      (0.10 * (normalizedPushUps / 100)) +
      (0.15 * (normalizedCoreStrength / 100)) +
      (0.10 * (normalizedFlexibility / 100));

    // STEP 4: Determine Grade from Composite Score
    const predictedGrade = getGradeFromCompositeScore(compositeScore);
    
    // STEP 5: Calculate Confidence Level
    const confidenceLevel = calculateConfidenceLevel(compositeScore, eightyPercentGrade);
    
    // STEP 6: Identify Strongest and Weakest Areas
    const metrics = [
      { name: 'Finger Strength', score: normalizedFingerStrength, ratio: fingerStrengthRatio },
      { name: 'Pull-Ups', score: normalizedPullUps, ratio: pullUpRatio },
      { name: 'Push-Ups', score: normalizedPushUps, ratio: pushUpRatio },
      { name: 'Core Strength', score: normalizedCoreStrength, ratio: toeToBarRatio },
      { name: 'Flexibility', score: normalizedFlexibility, ratio: flexibilityRatio },
    ];
    
    const sortedMetrics = metrics.sort((a, b) => b.score - a.score);
    const strongestArea = `${sortedMetrics[0].name} (${sortedMetrics[0].ratio.toFixed(2)} - ${getInterpretation(sortedMetrics[0].name, sortedMetrics[0].score)})`;
    const weakestArea = `${sortedMetrics[4].name} (${sortedMetrics[4].ratio.toFixed(2)} - ${getInterpretation(sortedMetrics[4].name, sortedMetrics[4].score)})`;
    
    // STEP 7: Generate Training Recommendations
    const recommendations = generateTrainingRecommendations(sortedMetrics, compositeScore);

    // STEP 8: Create Assessment Summary
    const assessmentSummary = createAssessmentSummary(
      climberName,
      predictedGrade,
      confidenceLevel,
      strongestArea,
      weakestArea,
      compositeScore,
      metrics
    );

    // STEP 9: Save Assessment to Supabase
    try {
      const assessmentData = {
        user_id: userId,
        assessment_type: assessmentType,
        fingerboard_max_weight_kg: addedWeight,
        fingerboard_edge_size_mm: 20, // Standard 20mm edge
        fingerboard_duration_seconds: 10, // Standard 10-second hang
        pull_ups_max: maxPullUps,
        flexibility_score: legSpreadDistance / height, // Save the raw ratio
        current_boulder_grade: eightyPercentGrade,
        composite_score: compositeScore,
        strength_score: normalizedFingerStrength, // Primary strength metric
        technique_score: (normalizedCoreStrength + normalizedFlexibility) / 2, // Combined technique
        endurance_score: (normalizedPullUps + normalizedPushUps) / 2, // Combined endurance
        predicted_grade: predictedGrade,
        confidence_level: confidenceLevel.toLowerCase() as 'low' | 'medium' | 'high',
        primary_weaknesses: [sortedMetrics[4].name, sortedMetrics[3].name], // Two weakest areas
        recommended_focus_areas: recommendations.slice(0, 3), // First 3 recommendations
        notes: `${strongestArea} | ${weakestArea} | Composite: ${compositeScore.toFixed(3)}`
      };

      const savedAssessment = await dbHelpers.createAssessment(assessmentData);
      if (savedAssessment) {
        console.log(`Assessment saved for user ${userId}: ${predictedGrade} (${confidenceLevel} confidence)`);
      } else {
        console.error(`Failed to save assessment for user ${userId}`);
      }

      // Also update user profile with latest stats
      await dbHelpers.updateUserProfile(userId, {
        weight_kg: bodyWeight,
        height_cm: height
      });
    } catch (error) {
      console.error('Error saving assessment to Supabase:', error);
      // Continue execution - don't fail the tool if save fails
    }

    return {
      // Raw measurements
      bodyWeight,
      height,
      
      // Performance ratios
      fingerStrengthRatio: Math.round(fingerStrengthRatio * 100) / 100,
      pullUpRatio: Math.round(pullUpRatio * 100) / 100,
      pushUpRatio: Math.round(pushUpRatio * 100) / 100,
      toeToBarRatio: Math.round(toeToBarRatio * 100) / 100,
      flexibilityRatio: Math.round(flexibilityRatio * 100) / 100,
      
      // Normalized scores
      normalizedFingerStrength: Math.round(normalizedFingerStrength),
      normalizedPullUps: Math.round(normalizedPullUps),
      normalizedPushUps: Math.round(normalizedPushUps),
      normalizedCoreStrength: Math.round(normalizedCoreStrength),
      normalizedFlexibility: Math.round(normalizedFlexibility),
      
      // Final assessment
      compositeScore: Math.round(compositeScore * 1000) / 1000,
      predictedGrade,
      confidenceLevel,
      strongestArea,
      weakestArea,
      recommendations,
      assessmentSummary,
    };
  },
});

function getGradeFromCompositeScore(score: number): string {
  if (score > 1.45) return 'V12';
  if (score >= 1.30) return 'V11';
  if (score >= 1.15) return 'V10';
  if (score >= 1.05) return 'V9';
  if (score >= 0.95) return 'V8';
  if (score >= 0.85) return 'V7';
  if (score >= 0.75) return 'V6';
  if (score >= 0.65) return 'V5';
  return 'V4';
}

function calculateConfidenceLevel(compositeScore: number, reportedGrade: string): string {
  const predictedGrade = getGradeFromCompositeScore(compositeScore);
  const gradeNumbers: { [key: string]: number } = {
    'V4': 4, 'V5': 5, 'V6': 6, 'V7': 7, 'V8': 8, 'V9': 9, 'V10': 10, 'V11': 11, 'V12': 12
  };
  
  const predictedNum = gradeNumbers[predictedGrade] || 4;
  const reportedNum = gradeNumbers[reportedGrade] || 4;
  const difference = Math.abs(predictedNum - reportedNum);
  
  if (difference <= 1) return 'High';
  if (difference <= 2) return 'Medium';
  return 'Low';
}

function getInterpretation(metricName: string, score: number): string {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Average';
  if (score >= 20) return 'Below Average';
  return 'Needs Work';
}

function generateTrainingRecommendations(
  sortedMetrics: Array<{ name: string; score: number; ratio: number }>,
  compositeScore: number
): string[] {
  const recommendations: string[] = [];
  const weakest = sortedMetrics[4];
  const secondWeakest = sortedMetrics[3];
  const strongest = sortedMetrics[0];
  
  // Primary Focus (Weakest Area)
  recommendations.push(`PRIMARY FOCUS - ${weakest.name}:`);
  
  switch (weakest.name) {
    case 'Finger Strength':
      recommendations.push('• Implement fingerboard training 2x/week with 72h separation');
      recommendations.push('• Focus on 10-second max hangs on 20mm edge');
      recommendations.push('• Rest 2-3 minutes between sets');
      recommendations.push('• Start at body weight and progress gradually');
      break;
    case 'Pull-Ups':
      recommendations.push('• Add weighted pull-up training 2x/week');
      recommendations.push('• Focus on slow, controlled movements');
      recommendations.push('• Include assisted pull-up variations');
      recommendations.push('• Target 8-10 reps at RPE 8');
      break;
    case 'Push-Ups':
      recommendations.push('• Incorporate push-up variations 3x/week');
      recommendations.push('• Focus on chest-to-ground full range');
      recommendations.push('• Progress to weighted or single-arm variations');
      recommendations.push('• Target 8-10 reps at RPE 8');
      break;
    case 'Core Strength':
      recommendations.push('• Add toe-to-bar exercises 3x/week');
      recommendations.push('• Integrate front lever progressions');
      recommendations.push('• Include hanging leg raises');
      recommendations.push('• Maintain 8/10 difficulty level');
      break;
    case 'Flexibility':
      recommendations.push('• Daily stretching routine focusing on hip mobility');
      recommendations.push('• Include dynamic warm-up before climbing');
      recommendations.push('• Practice side splits and hip flexor stretches');
      recommendations.push('• Hold stretches for 30-60 seconds');
      break;
  }
  
  // Secondary Focus
  recommendations.push(`\nSECONDARY FOCUS - ${secondWeakest.name}:`);
  recommendations.push('• Address this area 1-2x/week while prioritizing primary focus');
  recommendations.push('• Use lighter intensity to avoid overtraining');
  
  // Maintenance
  recommendations.push(`\nMAINTENANCE - ${strongest.name}:`);
  recommendations.push('• Continue current volume to maintain strength');
  recommendations.push('• Focus on quality over quantity');
  recommendations.push('• Integrate with other training components');
  
  // Training Guidelines
  recommendations.push('\nKEY TRAINING GUIDELINES:');
  recommendations.push('• Max Hangs: 2x/week, 72h separation');
  recommendations.push('• Boulder Projects: 2x/week, 48h separation');
  recommendations.push('• Boulder Flash: 2x/week, 48h separation');
  recommendations.push('• Boulder Aerobic: Up to 4x/week, 24h separation');
  recommendations.push('• General Fitness: 8-10 reps at RPE 8');
  
  return recommendations;
}

function createAssessmentSummary(
  climberName: string,
  predictedGrade: string,
  confidenceLevel: string,
  strongestArea: string,
  weakestArea: string,
  compositeScore: number,
  metrics: Array<{ name: string; score: number; ratio: number }>
): string {
  return `
Based on ${climberName}'s Assessment:

GRADE PREDICTION:
Predicted Grade: ${predictedGrade}
Confidence Level: ${confidenceLevel}
Composite Score: ${compositeScore.toFixed(3)}

METRIC ANALYSIS:
Strongest Area: ${strongestArea}
Weakest Area: ${weakestArea}

DETAILED BREAKDOWN:
• Finger Strength: ${metrics[0].score}/100 (ratio: ${metrics[0].ratio.toFixed(2)}) - 45% weight
• Pull-Ups: ${metrics[1].score}/100 (ratio: ${metrics[1].ratio.toFixed(2)}) - 20% weight  
• Push-Ups: ${metrics[2].score}/100 (ratio: ${metrics[2].ratio.toFixed(2)}) - 10% weight
• Core Strength: ${metrics[3].score}/100 (ratio: ${metrics[3].ratio.toFixed(2)}) - 15% weight
• Flexibility: ${metrics[4].score}/100 (ratio: ${metrics[4].ratio.toFixed(2)}) - 10% weight

Your composite score places you in the ${predictedGrade} range. Focus on your weakest areas while maintaining your strengths for optimal progression.
  `.trim();
} 