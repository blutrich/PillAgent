import { createWorkflow, createStep } from '@mastra/core/workflows';
import { z } from 'zod';

// Step 1: Track User Progress
const progressTrackingStep = createStep({
  id: 'progress-tracking',
  description: 'Track user training progress and engagement metrics',
  inputSchema: z.object({
    userId: z.string(),
    weekNumber: z.number(),
    sessionData: z.object({
      completed: z.boolean(),
      duration: z.number(),
      difficulty: z.number(),
      satisfaction: z.number()
    })
  }),
  outputSchema: z.object({
    progressMetrics: z.object({
      consistencyScore: z.number(),
      improvementTrend: z.string(),
      engagementLevel: z.string(),
      nextMilestone: z.string()
    }),
    shouldCelebrate: z.boolean(),
    riskOfChurn: z.boolean()
  }),
  execute: async ({ inputData }) => {
    const { userId, weekNumber, sessionData } = inputData;
    
    // Calculate consistency score (simplified)
    const consistencyScore = sessionData.completed ? 
      Math.min(100, 70 + (sessionData.satisfaction * 6)) : 0;
    
    // Determine improvement trend
    const improvementTrend = weekNumber > 2 ? 'positive' : 'building';
    
    // Calculate engagement level
    let engagementLevel = 'low';
    if (consistencyScore > 80) engagementLevel = 'high';
    else if (consistencyScore > 60) engagementLevel = 'medium';
    
    // Determine next milestone
    const milestones = [
      'Complete first week', 
      'Train consistently for 2 weeks',
      'Complete month 1',
      'Show measurable strength gains',
      'Complete 6-week program'
    ];
    const nextMilestone = milestones[Math.min(weekNumber, milestones.length - 1)];
    
    // Check celebration triggers
    const shouldCelebrate = sessionData.completed && 
      (weekNumber === 1 || weekNumber === 2 || weekNumber === 4);
    
    // Risk assessment
    const riskOfChurn = consistencyScore < 40 || 
      (weekNumber > 1 && !sessionData.completed);

    return {
      progressMetrics: {
        consistencyScore,
        improvementTrend,
        engagementLevel,
        nextMilestone
      },
      shouldCelebrate,
      riskOfChurn
    };
  }
});

// Step 2: Generate Personalized Recommendations
const personalizationStep = createStep({
  id: 'personalization',
  description: 'Generate personalized recommendations based on user progress',
  inputSchema: z.object({
    progressMetrics: z.object({
      consistencyScore: z.number(),
      improvementTrend: z.string(),
      engagementLevel: z.string(),
      nextMilestone: z.string()
    }),
    shouldCelebrate: z.boolean(),
    riskOfChurn: z.boolean(),
    userProfile: z.object({
      goal: z.string(),
      currentGrade: z.string(),
      trainingDays: z.array(z.string()),
      equipment: z.array(z.string())
    })
  }),
  outputSchema: z.object({
    recommendations: z.array(z.object({
      type: z.string(),
      message: z.string(),
      action: z.string(),
      priority: z.string()
    })),
    celebrationMessage: z.string().optional(),
    retentionActions: z.array(z.string())
  }),
  execute: async ({ inputData }) => {
    const { progressMetrics, shouldCelebrate, riskOfChurn, userProfile } = inputData;
    const recommendations = [];
    const retentionActions = [];
    
    // Celebration message
    let celebrationMessage;
    if (shouldCelebrate) {
      celebrationMessage = `🎉 Amazing work! You're building serious momentum on your ${userProfile.goal} goal!`;
    }
    
    // Risk mitigation recommendations
    if (riskOfChurn) {
      recommendations.push({
        type: 'motivation',
        message: 'Having trouble staying consistent? That\'s totally normal! Let\'s adjust your plan.',
        action: 'schedule_check_in',
        priority: 'high'
      });
      retentionActions.push('send_motivational_message', 'offer_schedule_adjustment');
    }
    
    // Progress-based recommendations
    if (progressMetrics.engagementLevel === 'high') {
      recommendations.push({
        type: 'progression',
        message: 'You\'re crushing it! Ready to level up your training intensity?',
        action: 'suggest_advanced_techniques',
        priority: 'medium'
      });
    } else if (progressMetrics.engagementLevel === 'low') {
      recommendations.push({
        type: 'support',
        message: 'Let\'s find what works best for you. How about trying a shorter session?',
        action: 'modify_program_difficulty',
        priority: 'high'
      });
    }
    
    // Milestone recommendations
    recommendations.push({
      type: 'milestone',
      message: `You're on track for: ${progressMetrics.nextMilestone}`,
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

    return {
      recommendations,
      celebrationMessage,
      retentionActions
    };
  }
});

// Step 3: Generate Engagement Actions
const engagementStep = createStep({
  id: 'engagement-actions',
  description: 'Generate specific engagement actions and communications',
  inputSchema: z.object({
    recommendations: z.array(z.object({
      type: z.string(),
      message: z.string(),
      action: z.string(),
      priority: z.string()
    })),
    celebrationMessage: z.string().optional(),
    retentionActions: z.array(z.string()),
    userProfile: z.object({
      goal: z.string(),
      currentGrade: z.string(),
      trainingDays: z.array(z.string())
    })
  }),
  outputSchema: z.object({
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
    nextCheckIn: z.string()
  }),
  execute: async ({ inputData }) => {
    const { recommendations, celebrationMessage, retentionActions, userProfile } = inputData;
    const communications = [];
    const programAdjustments = [];
    
    // Generate communications based on recommendations
    recommendations.forEach(rec => {
      if (rec.priority === 'high') {
        communications.push({
          channel: 'push_notification',
          message: rec.message,
          timing: 'immediate',
          callToAction: 'Open ClimbingPill'
        });
      } else {
        communications.push({
          channel: 'in_app',
          message: rec.message,
          timing: 'next_session',
          callToAction: rec.action
        });
      }
    });
    
    // Add celebration if needed
    if (celebrationMessage) {
      communications.push({
        channel: 'push_notification',
        message: celebrationMessage,
        timing: 'immediate',
        callToAction: 'View Progress'
      });
    }
    
    // Generate program adjustments
    if (retentionActions.includes('offer_schedule_adjustment')) {
      programAdjustments.push({
        type: 'schedule_modification',
        description: 'Reduce training frequency from 4x to 3x per week',
        rationale: 'Lower barrier to consistency while maintaining progress'
      });
    }
    
    if (retentionActions.includes('modify_program_difficulty')) {
      programAdjustments.push({
        type: 'intensity_adjustment',
        description: 'Reduce session length by 15 minutes',
        rationale: 'Improve completion rates and build confidence'
      });
    }
    
    // Schedule next check-in
    const nextCheckIn = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    return {
      communications,
      programAdjustments,
      nextCheckIn
    };
  }
});

// Main Retention Workflow
export const retentionWorkflow = createWorkflow({
  id: 'retention-workflow',
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
    nextCheckIn: z.string(),
    progressMetrics: z.object({
      consistencyScore: z.number(),
      improvementTrend: z.string(),
      engagementLevel: z.string(),
      nextMilestone: z.string()
    })
  })
})
  .then(progressTrackingStep)
  .map(({ inputData, getStepResult }) => {
    const progressResult = getStepResult(progressTrackingStep);
    const { userId, userProfile } = inputData;
    
    return {
      ...progressResult,
      userProfile
    };
  })
  .then(personalizationStep)
  .map(({ inputData, getStepResult }) => {
    const personalizationResult = getStepResult(personalizationStep);
    const { userProfile } = inputData;
    
    return {
      ...personalizationResult,
      userProfile
    };
  })
  .then(engagementStep)
  .map(({ getStepResult }) => {
    const progressResult = getStepResult(progressTrackingStep);
    const engagementResult = getStepResult(engagementStep);
    
    return {
      ...engagementResult,
      progressMetrics: progressResult.progressMetrics
    };
  })
  .commit(); 