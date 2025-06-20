import { z } from 'zod';
import { createTool } from '@mastra/core/tools';

// Simplified Timer Configuration Schema
const TimerConfigSchema = z.object({
  type: z.enum(['simple', 'interval', 'max_hang', 'endurance', 'custom']).describe('Type of timer to create'),
  duration: z.number().min(1).max(7200).optional().describe('Duration in seconds for simple timers'),
  workTime: z.number().min(1).max(3600).optional().describe('Work/hang time in seconds'),
  restTime: z.number().min(1).max(3600).optional().describe('Rest time in seconds'),
  rounds: z.number().min(1).max(50).optional().describe('Number of rounds for interval timers'),
  name: z.string().optional().describe('Custom name for the timer'),
});

// Create Timer Tool
export const createTimerTool = createTool({
  id: 'createTimer',
  description: 'Create a training timer for climbing sessions. Supports simple timers, interval training, max hangs, endurance training, and custom configurations.',
  inputSchema: TimerConfigSchema,
  execute: async ({ context }) => {
    const input = context;
    try {
      let timerConfig;
      let totalTime = 0;
      let description = '';

      switch (input.type) {
        case 'simple':
          const duration = input.duration || 1800; // Default 30 minutes
          timerConfig = {
            type: 'simple',
            duration,
            name: input.name || 'Training Timer',
          };
          totalTime = duration;
          description = `Simple timer for ${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}`;
          break;

        case 'interval':
          const workTime = input.workTime || 30;
          const restTime = input.restTime || 60;
          const rounds = input.rounds || 6;
          const intervalName = input.name || `${workTime}s on ${restTime}s off × ${rounds}`;
          timerConfig = {
            type: 'interval',
            workTime,
            restTime,
            rounds,
            name: intervalName,
            totalTime: (workTime + restTime) * rounds,
          };
          totalTime = (workTime + restTime) * rounds;
          description = `Interval timer: ${workTime}s work, ${restTime}s rest, ${rounds} rounds (${Math.floor(totalTime / 60)} minutes total)`;
          break;

        case 'max_hang':
          const hangTime = input.workTime || 10;
          const hangRest = input.restTime || 180;
          const hangRounds = input.rounds || 6;
          timerConfig = {
            type: 'interval',
            workTime: hangTime,
            restTime: hangRest,
            rounds: hangRounds,
            name: `Max Hang Timer (${hangTime}s on ${Math.floor(hangRest / 60)}min off × ${hangRounds})`,
            totalTime: (hangTime + hangRest) * hangRounds,
            isMaxHang: true,
          };
          totalTime = (hangTime + hangRest) * hangRounds;
          description = `Max hang timer: ${hangTime}s hangs, ${Math.floor(hangRest / 60)} minute rest, ${hangRounds} sets (${Math.floor(totalTime / 60)} minutes total)`;
          break;

        case 'endurance':
          const enduranceWork = input.workTime || 1200; // 20 minutes
          const enduranceRest = input.restTime || 300; // 5 minutes
          const enduranceRounds = input.rounds || 3;
          const enduranceName = input.name || `Endurance Timer (${Math.floor(enduranceWork / 60)}min on ${Math.floor(enduranceRest / 60)}min off × ${enduranceRounds})`;
          timerConfig = {
            type: 'interval',
            workTime: enduranceWork,
            restTime: enduranceRest,
            rounds: enduranceRounds,
            name: enduranceName,
            totalTime: (enduranceWork + enduranceRest) * enduranceRounds,
            isEndurance: true,
          };
          totalTime = (enduranceWork + enduranceRest) * enduranceRounds;
          description = `Endurance timer: ${Math.floor(enduranceWork / 60)} minute climbs, ${Math.floor(enduranceRest / 60)} minute rest, ${enduranceRounds} rounds`;
          break;

        case 'custom':
          const customWork = input.workTime || 60;
          const customRest = input.restTime || 120;
          const customRounds = input.rounds || 5;
          const customName = input.name || 'Custom Timer';
          timerConfig = {
            type: 'interval',
            workTime: customWork,
            restTime: customRest,
            rounds: customRounds,
            name: customName,
            totalTime: (customWork + customRest) * customRounds,
          };
          totalTime = (customWork + customRest) * customRounds;
          description = `Custom timer: ${customName} - ${customWork}s work, ${customRest}s rest, ${customRounds} rounds`;
          break;

        default:
          throw new Error(`Unknown timer type: ${input.type}`);
      }

      return {
        success: true,
        timer: timerConfig,
        description,
        totalDuration: totalTime,
        instructions: input.type === 'max_hang' 
          ? 'Hang at maximum intensity for the work periods. Use full rest between sets for proper recovery.'
          : input.type === 'endurance'
          ? 'Maintain steady climbing pace during work periods. Focus on movement efficiency and breathing.'
          : 'Follow the timer intervals as programmed. Stay focused and maintain good form.',
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to create timer',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
});

// Parse Timer Request Tool
export const parseTimerRequestTool = createTool({
  id: 'parseTimerRequest',
  description: 'Parse natural language timer requests and convert them to structured timer configurations.',
  inputSchema: z.object({
    request: z.string().describe('Natural language timer request (e.g., "10 sec on 3 min off x6", "max hang timer", "30 minute endurance session")'),
  }),
  execute: async ({ context }) => {
    const { request } = context;
    try {
      const lowerRequest = request.toLowerCase();

      // Max hang patterns
      if (lowerRequest.includes('max hang') || lowerRequest.includes('hangboard')) {
        return {
          success: true,
          timerType: 'max_hang',
          config: {
            type: 'max_hang',
            workTime: 10,
            restTime: 180,
            rounds: 6,
          },
          description: 'Detected max hang timer request',
        };
      }

      // Endurance patterns
      if (lowerRequest.includes('endurance') || lowerRequest.includes('aerobic')) {
        const durationMatch = lowerRequest.match(/(\d+)\s*(min|minute|hour)/);
        const duration = durationMatch ? parseInt(durationMatch[1]) * (durationMatch[2].startsWith('hour') ? 3600 : 60) : 1800;
        
        return {
          success: true,
          timerType: 'endurance',
          config: {
            type: 'endurance',
            workTime: Math.floor(duration * 0.7), // 70% work, 30% rest
            restTime: Math.floor(duration * 0.3),
            rounds: 4,
          },
          description: 'Detected endurance timer request',
        };
      }

      // Interval patterns: "X on Y off [x]Z" or "X sec on Y min off x Z"
      const intervalMatch = lowerRequest.match(/(\d+)\s*(sec|second|min|minute|mi)s?\s*on\s*(\d+)\s*(sec|second|min|minute|mi)s?\s*off\s*(?:x|×)?\s*(\d+)?/i);
      
      if (intervalMatch) {
        const [, workTime, workUnit, restTime, restUnit, rounds] = intervalMatch;
        const workSeconds = (workUnit.startsWith('min') || workUnit === 'mi') ? parseInt(workTime) * 60 : parseInt(workTime);
        const restSeconds = (restUnit.startsWith('min') || restUnit === 'mi') ? parseInt(restTime) * 60 : parseInt(restTime);
        const roundCount = rounds ? parseInt(rounds) : 4;

        return {
          success: true,
          timerType: 'interval',
          config: {
            type: 'interval',
            workTime: workSeconds,
            restTime: restSeconds,
            rounds: roundCount,
          },
          description: `Detected interval timer: ${workTime}${workUnit} work, ${restTime}${restUnit} rest, ${roundCount} rounds`,
        };
      }

      // Simple timer patterns
      const simpleMatch = lowerRequest.match(/(\d+)\s*(sec|second|min|minute|hour)/);
      if (simpleMatch || lowerRequest.includes('timer')) {
        const duration = simpleMatch 
          ? parseInt(simpleMatch[1]) * (simpleMatch[2].startsWith('hour') ? 3600 : simpleMatch[2].startsWith('min') ? 60 : 1)
          : 1800; // Default 30 minutes

        return {
          success: true,
          timerType: 'simple',
          config: {
            type: 'simple',
            duration,
          },
          description: `Detected simple timer request: ${Math.floor(duration / 60)} minutes`,
        };
      }

      return {
        success: false,
        error: 'Could not parse timer request',
        suggestion: 'Try formats like "10 sec on 3 min off x6", "max hang timer", or "30 minute timer"',
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to parse timer request',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
});

// Get Timer Presets Tool
export const getTimerPresetsTool = createTool({
  id: 'getTimerPresets',
  description: 'Get common timer presets for different climbing training types.',
  inputSchema: z.object({
    trainingType: z.enum(['max_hang', 'endurance', 'power', 'strength', 'general']).optional(),
  }),
  execute: async ({ context }) => {
    const { trainingType } = context;
    const presets = {
      max_hang: [
        {
          name: 'Beginner Max Hangs',
          type: 'max_hang',
          workTime: 7,
          restTime: 180,
          rounds: 5,
          description: 'Good starting point for hangboard training',
        },
        {
          name: 'Intermediate Max Hangs',
          type: 'max_hang',
          workTime: 10,
          restTime: 180,
          rounds: 6,
          description: 'Standard max hang protocol',
        },
        {
          name: 'Advanced Max Hangs',
          type: 'max_hang',
          workTime: 12,
          restTime: 180,
          rounds: 7,
          description: 'For experienced climbers with strong fingers',
        },
      ],
      endurance: [
        {
          name: 'ARC Training',
          type: 'endurance',
          workTime: 1200, // 20 minutes
          restTime: 300,  // 5 minutes
          rounds: 3,
          description: 'Aerobic capacity building',
        },
        {
          name: 'Long Intervals',
          type: 'interval',
          workTime: 300,  // 5 minutes
          restTime: 180,  // 3 minutes
          rounds: 6,
          description: 'Endurance with recovery intervals',
        },
      ],
      power: [
        {
          name: 'Power Intervals',
          type: 'interval',
          workTime: 10,
          restTime: 120,
          rounds: 8,
          description: 'Short, explosive efforts',
        },
        {
          name: 'Campus Board',
          type: 'interval',
          workTime: 5,
          restTime: 180,
          rounds: 6,
          description: 'Dynamic power training',
        },
      ],
      strength: [
        {
          name: 'Strength Intervals',
          type: 'interval',
          workTime: 30,
          restTime: 180,
          rounds: 6,
          description: 'Sustained strength efforts',
        },
      ],
      general: [
        {
          name: 'Warm-up Timer',
          type: 'simple',
          duration: 600, // 10 minutes
          description: 'General warm-up session',
        },
        {
          name: 'Cool-down Timer',
          type: 'simple',
          duration: 300, // 5 minutes
          description: 'Post-session cool-down',
        },
      ],
    };

    if (trainingType && presets[trainingType]) {
      return {
        success: true,
        presets: presets[trainingType],
        trainingType,
      };
    }

    return {
      success: true,
      presets: Object.entries(presets).reduce((all, [type, typePresets]) => {
        return [...all, ...typePresets.map(preset => ({ ...preset, category: type }))];
      }, [] as any[]),
      description: 'All available timer presets',
    };
  },
}); 