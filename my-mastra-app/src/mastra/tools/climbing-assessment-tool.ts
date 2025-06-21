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
    
    // Original input values (for frontend display)
    addedWeight: z.number(),
    maxPullUps: z.number(),
    maxPushUps: z.number(),
    maxToeToBar: z.number(),
    legSpreadDistance: z.number(),
    eightyPercentGrade: z.string(),
    
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

    // ASSESSMENT TYPE LOGIC - Different requirements and accuracy for each type
    let requiredMetrics: string[] = [];
    let confidenceMultiplier = 1.0;
    let assessmentDescription = '';

    switch (assessmentType) {
      case 'quick':
        requiredMetrics = ['finger strength', 'basic strength', 'current grade'];
        confidenceMultiplier = 0.7; // Reduced confidence for quick assessment
        assessmentDescription = 'Quick Assessment (2-3 minutes) - Basic grade prediction';
        break;
      case 'partial':
        requiredMetrics = ['finger strength', 'pull-ups', 'core OR push-ups', 'current grade'];
        confidenceMultiplier = 0.85; // Good confidence for partial assessment
        assessmentDescription = 'Partial Assessment (5-7 minutes) - Good accuracy with key metrics';
        break;
      case 'complete':
        requiredMetrics = ['all metrics'];
        confidenceMultiplier = 1.0; // Full confidence for complete assessment
        assessmentDescription = 'Complete Assessment (10-15 minutes) - Maximum accuracy';
        break;
    }

    // STEP 1: Calculate Performance Ratios (with assessment type considerations)
    
    // Finger strength ratio: (added_weight + body_weight) / body_weight
    const fingerStrengthRatio = (addedWeight + bodyWeight) / bodyWeight;
    
    // Pull-ups ratio: max_reps / body_weight
    const pullUpRatio = maxPullUps / bodyWeight;
    
    // Push-ups ratio: max_reps / body_weight (required for complete, optional for partial)
    const pushUpRatio = (assessmentType === 'quick' && maxPushUps === 0) ? 
      pullUpRatio * 0.8 : maxPushUps / bodyWeight; // Estimate for quick assessment
    
    // Toe-to-bar ratio: max_reps / body_weight (required for complete, optional for partial) 
    const toeToBarRatio = (assessmentType === 'quick' && maxToeToBar === 0) ?
      pullUpRatio * 0.6 : maxToeToBar / bodyWeight; // Estimate for quick assessment
    
    // Flexibility ratio: leg_spread_distance / height (optional for quick/partial)
    const flexibilityRatio = (assessmentType === 'quick' && legSpreadDistance === 0) ?
      0.9 : legSpreadDistance / height; // Default reasonable flexibility for quick

    // STEP 2: Normalize to 0-100 scale (same for all assessment types)
    
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

    // STEP 3: Calculate Composite Score (adjusted weights based on assessment type)
    let compositeScore: number;
    
    switch (assessmentType) {
      case 'quick':
        // Focus heavily on finger strength and basic strength for quick assessment
        compositeScore = 
          (0.60 * (normalizedFingerStrength / 100)) +  // Increased weight
          (0.30 * (normalizedPullUps / 100)) +         // Increased weight
          (0.05 * (normalizedPushUps / 100)) +         // Estimated values get less weight
          (0.03 * (normalizedCoreStrength / 100)) +    // Estimated values get less weight
          (0.02 * (normalizedFlexibility / 100));      // Estimated values get less weight
        break;
      case 'partial':
        // Balanced approach with measured metrics getting higher weight
        compositeScore = 
          (0.50 * (normalizedFingerStrength / 100)) +  // Slightly increased
          (0.25 * (normalizedPullUps / 100)) +         // Increased weight
          (0.10 * (normalizedPushUps / 100)) +         // Standard or estimated
          (0.10 * (normalizedCoreStrength / 100)) +    // Standard or estimated
          (0.05 * (normalizedFlexibility / 100));      // Reduced weight
        break;
      case 'complete':
      default:
        // Standard ClimbingPill methodology weights
        compositeScore = 
          (0.45 * (normalizedFingerStrength / 100)) +
          (0.20 * (normalizedPullUps / 100)) +
          (0.10 * (normalizedPushUps / 100)) +
          (0.15 * (normalizedCoreStrength / 100)) +
          (0.10 * (normalizedFlexibility / 100));
        break;
    }

    // Apply confidence multiplier to composite score for grade prediction accuracy
    const adjustedCompositeScore = compositeScore * confidenceMultiplier;

    // STEP 4: Determine Grade from Composite Score
    const predictedGrade = getGradeFromCompositeScore(adjustedCompositeScore);
    
    // STEP 5: Calculate Confidence Level (based on assessment type and data completeness)
    const baseConfidence = calculateConfidenceLevel(adjustedCompositeScore, eightyPercentGrade);
    let finalConfidence: string;
    
    switch (assessmentType) {
      case 'quick':
        finalConfidence = baseConfidence === 'High' ? 'Medium' : 'Low';
        break;
      case 'partial':
        finalConfidence = baseConfidence === 'High' ? 'High' : 'Medium';
        break;
      case 'complete':
      default:
        finalConfidence = baseConfidence;
        break;
    }
    
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
    
    // STEP 7: Generate Training Recommendations (tailored to assessment type)
    const recommendations = generateTrainingRecommendations(sortedMetrics, compositeScore, assessmentType);

    // STEP 8: Create Assessment Summary (include assessment type info)
    const assessmentSummary = createAssessmentSummary(
      climberName,
      predictedGrade,
      finalConfidence,
      strongestArea,
      weakestArea,
      compositeScore,
      metrics,
      assessmentType,
      assessmentDescription
    );

    // STEP 9: Save Assessment to Supabase
    try {
      console.log(`🔄 Starting assessment save for user: ${userId}`);
      
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
        confidence_level: finalConfidence.toLowerCase() as 'low' | 'medium' | 'high',
        primary_weaknesses: [sortedMetrics[4].name, sortedMetrics[3].name], // Two weakest areas
        recommended_focus_areas: recommendations.slice(0, 3), // First 3 recommendations
        notes: `${strongestArea} | ${weakestArea} | Composite: ${compositeScore.toFixed(3)}`
      };

      console.log(`📊 Assessment data prepared:`, {
        user_id: assessmentData.user_id,
        predicted_grade: assessmentData.predicted_grade,
        composite_score: assessmentData.composite_score,
        confidence_level: assessmentData.confidence_level
      });

      const savedAssessment = await dbHelpers.createAssessment(assessmentData);
      if (savedAssessment) {
        console.log(`✅ Assessment saved successfully for user ${userId}: ${predictedGrade} (${finalConfidence} confidence)`);
        console.log(`📝 Saved assessment ID: ${savedAssessment.id}`);
      } else {
        console.error(`❌ Failed to save assessment for user ${userId} - no data returned`);
      }

      // Also update user profile with latest stats
      console.log(`🔄 Updating user profile for ${userId}`);
      const profileUpdate = await dbHelpers.updateUserProfile(userId, {
        weight_kg: bodyWeight,
        height_cm: height
      });
      
      if (profileUpdate) {
        console.log(`✅ User profile updated successfully`);
      } else {
        console.log(`⚠️ User profile update failed or user doesn't exist yet`);
      }
      
    } catch (error) {
      console.error('❌ Error saving assessment to Supabase:', error);
      if (error instanceof Error) {
        console.error('❌ Error details:', {
          message: error.message,
          code: (error as any).code,
          details: (error as any).details,
          hint: (error as any).hint
        });
      }
      // Continue execution - don't fail the tool if save fails
    }

    return {
      // Raw measurements
      bodyWeight,
      height,
      
      // Original input values (for frontend display)
      addedWeight,
      maxPullUps,
      maxPushUps,
      maxToeToBar,
      legSpreadDistance,
      eightyPercentGrade,
      
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
      confidenceLevel: finalConfidence,
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
  compositeScore: number,
  assessmentType: string
): string[] {
  const recommendations: string[] = [];
  const weakest = sortedMetrics[4];
  const secondWeakest = sortedMetrics[3];
  const strongest = sortedMetrics[0];
  
  // Add assessment type context
  switch (assessmentType) {
    case 'quick':
      recommendations.push('QUICK ASSESSMENT RECOMMENDATIONS:');
      recommendations.push('• Consider taking a complete assessment for detailed analysis');
      recommendations.push('• Focus on the primary area identified below');
      break;
    case 'partial':
      recommendations.push('PARTIAL ASSESSMENT RECOMMENDATIONS:');
      recommendations.push('• For comprehensive analysis, complete all metrics');
      recommendations.push('• Current recommendations based on measured data');
      break;
    case 'complete':
      recommendations.push('COMPLETE ASSESSMENT RECOMMENDATIONS:');
      break;
  }
  
  // Primary Focus (Weakest Area)
  recommendations.push(`\nPRIMARY FOCUS - ${weakest.name}:`);
  
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
  metrics: Array<{ name: string; score: number; ratio: number }>,
  assessmentType: string,
  assessmentDescription: string
): string {
  return `
Based on ${climberName}'s ${assessmentDescription}:

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