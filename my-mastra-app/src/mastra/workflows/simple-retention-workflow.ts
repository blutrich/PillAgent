import { createWorkflow, createStep } from '@mastra/core/workflows';
import { z } from 'zod';

// Single step workflow for retention analysis
const retentionAnalysisStep = createStep({
  id: 'retention-analysis',
  description: 'Analyze user progress and generate retention recommendations',
  inputSchema: z.object({
    userId: z.string(),
    weekNumber: z.number(),
    sessionData: z.object({
      completed: z.boolean(),
      duration: z.number(),
      difficulty: z.number(),
      satisfaction: z.number()
    }),
    userProfile: z.object({
      goal: z.string(),
      currentGrade: z.string(),
      trainingDays: z.array(z.string()),
      equipment: z.array(z.string())
    })
  }),
  outputSchema: z.object({
    progressMetrics: z.object({
      consistencyScore: z.number(),
      improvementTrend: z.string(),
      engagementLevel: z.string(),
      nextMilestone: z.string()
    }),
    recommendations: z.array(z.object({
      type: z.string(),
      message: z.string(),
      action: z.string(),
      priority: z.string()
    })),
    communications: z.array(z.object({
      channel: z.string(),
      message: z.string(),
      timing: z.string(),
      callToAction: z.string()
    })),
    programAdjustments: z.array(z.object({
      type: z.string(),
      description: z.string(),
      rationale: z.string()
    })),
    celebrationMessage: z.string().optional(),
    nextCheckIn: z.string()
  }),
  execute: async ({ inputData }) => {
    const { userId, weekNumber, sessionData, userProfile } = inputData;
    
    // Calculate progress metrics
    const consistencyScore = sessionData.completed ? 
      Math.min(100, 70 + (sessionData.satisfaction * 6)) : 0;
    
    const improvementTrend = weekNumber > 2 ? 'positive' : 'building';
    
    let engagementLevel = 'low';
    if (consistencyScore > 80) engagementLevel = 'high';
    else if (consistencyScore > 60) engagementLevel = 'medium';
    
    const milestones = [
      'Complete first week', 
      'Train consistently for 2 weeks',
      'Complete month 1',
      'Show measurable strength gains',
      'Complete 6-week program'
    ];
    const nextMilestone = milestones[Math.min(weekNumber, milestones.length - 1)];
    
    // Generate recommendations
    const recommendations = [];
    const communications = [];
    const programAdjustments = [];
    
    const shouldCelebrate = sessionData.completed && 
      (weekNumber === 1 || weekNumber === 2 || weekNumber === 4);
    const riskOfChurn = consistencyScore < 40 || 
      (weekNumber > 1 && !sessionData.completed);
    
    // Celebration message
    let celebrationMessage;
    if (shouldCelebrate) {
      celebrationMessage = `🎉 Amazing work! You're building serious momentum on your ${userProfile.goal} goal!`;
      communications.push({
        channel: 'push_notification',
        message: celebrationMessage,
        timing: 'immediate',
        callToAction: 'View Progress'
      });
    }
    
    // Risk mitigation
    if (riskOfChurn) {
      recommendations.push({
        type: 'motivation',
        message: 'Having trouble staying consistent? That\'s totally normal! Let\'s adjust your plan.',
        action: 'schedule_check_in',
        priority: 'high'
      });
      
      communications.push({
        channel: 'push_notification',
        message: 'Having trouble staying consistent? That\'s totally normal! Let\'s adjust your plan.',
        timing: 'immediate',
        callToAction: 'Open ClimbingPill'
      });
      
      programAdjustments.push({
        type: 'schedule_modification',
        description: 'Reduce training frequency from 4x to 3x per week',
        rationale: 'Lower barrier to consistency while maintaining progress'
      });
    }
    
    // Progress-based recommendations
    if (engagementLevel === 'high') {
      recommendations.push({
        type: 'progression',
        message: 'You\'re crushing it! Ready to level up your training intensity?',
        action: 'suggest_advanced_techniques',
        priority: 'medium'
      });
    } else if (engagementLevel === 'low') {
      recommendations.push({
        type: 'support',
        message: 'Let\'s find what works best for you. How about trying a shorter session?',
        action: 'modify_program_difficulty',
        priority: 'high'
      });
      
      programAdjustments.push({
        type: 'intensity_adjustment',
        description: 'Reduce session length by 15 minutes',
        rationale: 'Improve completion rates and build confidence'
      });
    }
    
    // Milestone recommendations
    recommendations.push({
      type: 'milestone',
      message: `You're on track for: ${nextMilestone}`,
      action: 'show_progress_visualization',
      priority: 'medium'
    });
    
    // Equipment-based recommendations
    if (userProfile.equipment.includes('fingerboard')) {
      recommendations.push({
        type: 'technique',
        message: 'Perfect fingerboard weather! Try this advanced hang variation.',
        action: 'suggest_fingerboard_progression',
        priority: 'low'
      });
    }
    
    // Add general communications for non-high priority items
    recommendations.forEach(rec => {
      if (rec.priority !== 'high') {
        communications.push({
          channel: 'in_app',
          message: rec.message,
          timing: 'next_session',
          callToAction: rec.action
        });
      }
    });
    
    // Schedule next check-in
    const nextCheckIn = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    return {
      progressMetrics: {
        consistencyScore,
        improvementTrend,
        engagementLevel,
        nextMilestone
      },
      recommendations,
      communications,
      programAdjustments,
      celebrationMessage,
      nextCheckIn
    };
  }
});

// Simple retention workflow
export const simpleRetentionWorkflow = createWorkflow({
  id: 'simple-retention-workflow',
  description: 'Analyze user progress and generate personalized retention strategies',
  inputSchema: z.object({
    userId: z.string(),
    weekNumber: z.number(),
    sessionData: z.object({
      completed: z.boolean(),
      duration: z.number(),
      difficulty: z.number(),
      satisfaction: z.number()
    }),
    userProfile: z.object({
      goal: z.string(),
      currentGrade: z.string(),
      trainingDays: z.array(z.string()),
      equipment: z.array(z.string())
    })
  }),
  outputSchema: z.object({
    progressMetrics: z.object({
      consistencyScore: z.number(),
      improvementTrend: z.string(),
      engagementLevel: z.string(),
      nextMilestone: z.string()
    }),
    recommendations: z.array(z.object({
      type: z.string(),
      message: z.string(),
      action: z.string(),
      priority: z.string()
    })),
    communications: z.array(z.object({
      channel: z.string(),
      message: z.string(),
      timing: z.string(),
      callToAction: z.string()
    })),
    programAdjustments: z.array(z.object({
      type: z.string(),
      description: z.string(),
      rationale: z.string()
    })),
    celebrationMessage: z.string().optional(),
    nextCheckIn: z.string()
  })
})
  .then(retentionAnalysisStep)
  .commit(); 