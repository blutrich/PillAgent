import { z } from 'zod';
import { createTool } from '@mastra/core/tools';
import { supabase } from '../lib/supabase';

// Analytics Configuration Schema
const AnalyticsConfigSchema = z.object({
  userId: z.string().describe('User ID to fetch analytics for'),
  timeframe: z.enum(['week', 'month', '3months', '6months', 'year']).optional().default('month').describe('Time range for analytics'),
  metrics: z.array(z.enum(['strength', 'grades', 'consistency', 'volume', 'assessment'])).optional().default(['strength', 'grades', 'consistency']).describe('Metrics to include in analytics'),
});

// Helper function to get date range based on timeframe
const getDateRange = (timeframe: string) => {
  const now = new Date();
  const ranges = {
    week: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
    month: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
    '3months': new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
    '6months': new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000),
    year: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000),
  };
  return ranges[timeframe as keyof typeof ranges] || ranges.month;
};

// Helper function to fetch strength progression data
const getStrengthProgression = async (userId: string, startDate: Date) => {
  const { data: assessments, error } = await supabase
    .from('assessments')
    .select('created_at, finger_strength, pull_ups, push_ups, core_strength, flexibility_score, composite_score')
    .eq('user_id', userId)
    .gte('created_at', startDate.toISOString())
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching strength data:', error);
    return [];
  }

  return assessments?.map(assessment => ({
    date: assessment.created_at,
    fingerStrength: assessment.finger_strength || 0,
    pullUps: assessment.pull_ups || 0,
    pushUps: assessment.push_ups || 0,
    coreStrength: assessment.core_strength || 0,
    flexibility: assessment.flexibility_score || 0,
    compositeScore: assessment.composite_score || 0,
  })) || [];
};

// Helper function to fetch grade progression data
const getGradeProgression = async (userId: string, startDate: Date) => {
  const { data: assessments, error } = await supabase
    .from('assessments')
    .select('created_at, current_grade, target_grade, predicted_grade')
    .eq('user_id', userId)
    .gte('created_at', startDate.toISOString())
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching grade data:', error);
    return [];
  }

  return assessments?.map(assessment => ({
    date: assessment.created_at,
    currentGrade: assessment.current_grade || 'V0',
    targetGrade: assessment.target_grade || 'V1',
    predictedGrade: assessment.predicted_grade || 'V0',
  })) || [];
};

// Helper function to fetch training consistency data
const getTrainingConsistency = async (userId: string, startDate: Date) => {
  const { data: journals, error } = await supabase
    .from('journal_entries')
    .select('created_at, entry_type')
    .eq('user_id', userId)
    .gte('created_at', startDate.toISOString())
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching consistency data:', error);
    return [];
  }

  // Group by week for consistency heatmap
  const weeklyData: Record<string, number> = {};
  journals?.forEach(entry => {
    const date = new Date(entry.created_at);
    const weekKey = `${date.getFullYear()}-W${Math.ceil(date.getDate() / 7)}`;
    weeklyData[weekKey] = (weeklyData[weekKey] || 0) + 1;
  });

  return Object.entries(weeklyData).map(([week, sessions]) => ({
    week,
    sessions,
    consistency: Math.min(sessions / 4, 1), // Normalize to 0-1 scale (4 sessions = 100%)
  }));
};

// Helper function to fetch training volume data
const getTrainingVolume = async (userId: string, startDate: Date) => {
  const { data: journals, error } = await supabase
    .from('journal_entries')
    .select('created_at, content')
    .eq('user_id', userId)
    .gte('created_at', startDate.toISOString())
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching volume data:', error);
    return [];
  }

  // Group by month for volume tracking
  const monthlyData: Record<string, number> = {};
  journals?.forEach(entry => {
    const date = new Date(entry.created_at);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    monthlyData[monthKey] = (monthlyData[monthKey] || 0) + 1;
  });

  return Object.entries(monthlyData).map(([month, entries]) => ({
    month,
    entries,
    volume: entries, // Raw number of journal entries as volume metric
  }));
};

// Helper function to get assessment summary
const getAssessmentSummary = async (userId: string, startDate: Date) => {
  const { data: assessments, error } = await supabase
    .from('assessments')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', startDate.toISOString())
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) {
    console.error('Error fetching assessment summary:', error);
    return null;
  }

  return assessments?.[0] || null;
};

// Create Analytics Tool
export const getProgressAnalyticsTool = createTool({
  id: 'getProgressAnalytics',
  description: 'Get comprehensive training analytics and progress data for climbing performance tracking',
  inputSchema: AnalyticsConfigSchema,
  outputSchema: z.object({
    timeframe: z.string(),
    metrics: z.array(z.string()),
    strengthProgression: z.array(z.object({
      date: z.string(),
      fingerStrength: z.number(),
      pullUps: z.number(),
      pushUps: z.number(),
      coreStrength: z.number(),
      flexibility: z.number(),
      compositeScore: z.number(),
    })).optional(),
    gradeProgression: z.array(z.object({
      date: z.string(),
      currentGrade: z.string(),
      targetGrade: z.string(),
      predictedGrade: z.string(),
    })).optional(),
    trainingConsistency: z.array(z.object({
      week: z.string(),
      sessions: z.number(),
      consistency: z.number(),
    })).optional(),
    trainingVolume: z.array(z.object({
      month: z.string(),
      entries: z.number(),
      volume: z.number(),
    })).optional(),
    assessmentSummary: z.object({
      created_at: z.string(),
      composite_score: z.number(),
      predicted_grade: z.string(),
      finger_strength: z.number(),
    }).nullable().optional(),
    summary: z.object({
      totalDataPoints: z.number(),
      timeRange: z.string(),
      availableMetrics: z.array(z.string()),
    }),
  }),
  execute: async ({ context }) => {
    const { userId, timeframe, metrics } = context;
    
    try {
      const startDate = getDateRange(timeframe);
      const analytics: any = {
        timeframe,
        metrics,
        summary: {
          totalDataPoints: 0,
          timeRange: `${startDate.toISOString().split('T')[0]} to ${new Date().toISOString().split('T')[0]}`,
          availableMetrics: metrics,
        }
      };

      // Fetch data based on requested metrics
      if (metrics.includes('strength')) {
        const strengthData = await getStrengthProgression(userId, startDate);
        analytics.strengthProgression = strengthData;
        analytics.summary.totalDataPoints += strengthData.length;
      }

      if (metrics.includes('grades')) {
        const gradeData = await getGradeProgression(userId, startDate);
        analytics.gradeProgression = gradeData;
        analytics.summary.totalDataPoints += gradeData.length;
      }

      if (metrics.includes('consistency')) {
        const consistencyData = await getTrainingConsistency(userId, startDate);
        analytics.trainingConsistency = consistencyData;
        analytics.summary.totalDataPoints += consistencyData.length;
      }

      if (metrics.includes('volume')) {
        const volumeData = await getTrainingVolume(userId, startDate);
        analytics.trainingVolume = volumeData;
        analytics.summary.totalDataPoints += volumeData.length;
      }

      if (metrics.includes('assessment')) {
        const assessmentData = await getAssessmentSummary(userId, startDate);
        analytics.assessmentSummary = assessmentData;
        if (assessmentData) analytics.summary.totalDataPoints += 1;
      }

      return analytics;

    } catch (error) {
      console.error('Error fetching analytics:', error);
      throw new Error(`Failed to fetch analytics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

// Create Analytics Insights Tool (for AI-powered insights)
export const getAnalyticsInsightsTool = createTool({
  id: 'getAnalyticsInsights',
  description: 'Generate AI-powered insights and recommendations based on training analytics data',
  inputSchema: z.object({
    userId: z.string().describe('User ID to generate insights for'),
    analyticsData: z.any().describe('Raw analytics data to analyze'),
    focusArea: z.enum(['strength', 'technique', 'consistency', 'progression', 'overall']).optional().default('overall').describe('Area to focus insights on'),
  }),
  outputSchema: z.object({
    insights: z.array(z.object({
      type: z.enum(['strength', 'weakness', 'trend', 'recommendation']),
      title: z.string(),
      description: z.string(),
      priority: z.enum(['high', 'medium', 'low']),
      actionable: z.boolean(),
    })),
    recommendations: z.array(z.object({
      category: z.string(),
      action: z.string(),
      rationale: z.string(),
      timeframe: z.string(),
    })),
    summary: z.object({
      overallTrend: z.enum(['improving', 'stable', 'declining']),
      keyStrengths: z.array(z.string()),
      areasForImprovement: z.array(z.string()),
      nextSteps: z.array(z.string()),
    }),
  }),
  execute: async ({ context }) => {
    const { analyticsData, focusArea } = context;
    
    // Generate insights based on the analytics data
    const insights = [];
    const recommendations = [];
    
    // Analyze strength progression
    if (analyticsData.strengthProgression?.length > 1) {
      const latest = analyticsData.strengthProgression[analyticsData.strengthProgression.length - 1];
      const previous = analyticsData.strengthProgression[0];
      
      if (latest.fingerStrength > previous.fingerStrength) {
        insights.push({
          type: 'strength' as const,
          title: 'Finger Strength Improvement',
          description: `Your finger strength has improved by ${((latest.fingerStrength - previous.fingerStrength) / previous.fingerStrength * 100).toFixed(1)}% over the selected period.`,
          priority: 'high' as const,
          actionable: false,
        });
      }
      
      if (latest.compositeScore > previous.compositeScore) {
        insights.push({
          type: 'trend' as const,
          title: 'Overall Performance Trending Up',
          description: `Your composite score has increased from ${previous.compositeScore.toFixed(1)} to ${latest.compositeScore.toFixed(1)}.`,
          priority: 'high' as const,
          actionable: false,
        });
      }
    }

    // Analyze training consistency
    if (analyticsData.trainingConsistency?.length > 0) {
      const avgConsistency = analyticsData.trainingConsistency.reduce((sum: number, week: any) => sum + week.consistency, 0) / analyticsData.trainingConsistency.length;
      
      if (avgConsistency < 0.5) {
        insights.push({
          type: 'weakness' as const,
          title: 'Consistency Could Be Improved',
          description: `Your training consistency is at ${(avgConsistency * 100).toFixed(0)}%. Aim for 3-4 sessions per week for optimal progress.`,
          priority: 'high' as const,
          actionable: true,
        });
        
        recommendations.push({
          category: 'Consistency',
          action: 'Schedule regular training sessions',
          rationale: 'Consistent training is crucial for strength gains and technique development',
          timeframe: '2-4 weeks',
        });
      } else {
        insights.push({
          type: 'strength' as const,
          title: 'Great Training Consistency',
          description: `You maintain ${(avgConsistency * 100).toFixed(0)}% training consistency. Keep it up!`,
          priority: 'medium' as const,
          actionable: false,
        });
      }
    }

    // Generate overall recommendations based on focus area
    if (focusArea === 'strength' || focusArea === 'overall') {
      recommendations.push({
        category: 'Strength Training',
        action: 'Incorporate max hang sessions 2x per week',
        rationale: 'Finger strength is the foundation of climbing performance',
        timeframe: '4-6 weeks',
      });
    }

    if (focusArea === 'technique' || focusArea === 'overall') {
      recommendations.push({
        category: 'Technique',
        action: 'Focus on footwork drills and body positioning',
        rationale: 'Good technique reduces energy expenditure and prevents injury',
        timeframe: 'Ongoing',
      });
    }

    // Generate summary
    const summary = {
      overallTrend: 'improving' as const, // This would be calculated based on actual data trends
      keyStrengths: ['Consistent training', 'Strength progression'],
      areasForImprovement: ['Flexibility', 'Core strength'],
      nextSteps: [
        'Continue current training routine',
        'Add flexibility work 3x per week',
        'Incorporate core-specific exercises',
      ],
    };

    return {
      insights,
      recommendations,
      summary,
    };
  },
}); 