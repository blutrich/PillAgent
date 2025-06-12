import { createTool } from '@mastra/core';
import { z } from 'zod';

export const retentionAnalysisTool = createTool({
  id: 'retention-analysis',
  description: 'Analyze user progress and generate personalized retention strategies',
  inputSchema: z.object({
    userId: z.string().describe('User ID to analyze'),
    weekNumber: z.number().describe('Current week number in training program'),
    sessionData: z.object({
      completed: z.boolean().describe('Whether the session was completed'),
      duration: z.number().describe('Session duration in minutes'),
      difficulty: z.number().min(1).max(10).describe('Session difficulty rating 1-10'),
      satisfaction: z.number().min(1).max(10).describe('User satisfaction rating 1-10')
    }).describe('Latest training session data'),
    userProfile: z.object({
      goal: z.string().describe('Primary climbing goal'),
      currentGrade: z.string().describe('Current climbing grade (e.g., V4, V5)'),
      trainingDays: z.array(z.string()).describe('Preferred training days'),
      equipment: z.array(z.string()).describe('Available equipment')
    }).describe('User profile information')
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
    celebrationMessage: z.string().optional(),
    programAdjustments: z.array(z.object({
      type: z.string(),
      description: z.string(),
      rationale: z.string()
    })),
    nextCheckIn: z.string(),
    shouldCelebrate: z.boolean(),
    riskOfChurn: z.boolean()
  }),
  execute: async ({ context, mastra }) => {
    const { userId, weekNumber, sessionData, userProfile } = context;
    
    // Get the retention workflow from Mastra
    const retentionWorkflow = mastra?.getWorkflow('retentionWorkflow');
    
    if (!retentionWorkflow) {
      throw new Error('Retention workflow not found. Make sure it is registered in Mastra.');
    }
    
    // Create a workflow run
    const run = retentionWorkflow.createRun();
    
    // Execute the workflow with the provided data
    const workflowResult = await run.start({
      inputData: {
        userId,
        weekNumber,
        sessionData,
        userProfile
      }
    });
    
    // Check if workflow completed successfully
    if (workflowResult.status !== 'success') {
      throw new Error(`Retention workflow failed with status: ${workflowResult.status}`);
    }
    
    // Extract the results from the workflow
    const result = workflowResult.result;
    
    return {
      progressMetrics: result.progressMetrics,
      recommendations: result.communications.map((comm: any) => ({
        type: 'communication',
        message: comm.message,
        action: comm.callToAction,
        priority: comm.timing === 'immediate' ? 'high' : 'medium'
      })),
      celebrationMessage: result.communications.find((comm: any) => 
        comm.message.includes('🎉'))?.message,
      programAdjustments: result.programAdjustments,
      nextCheckIn: result.nextCheckIn,
      shouldCelebrate: result.progressMetrics.consistencyScore > 80,
      riskOfChurn: result.progressMetrics.consistencyScore < 40
    };
  }
}); 