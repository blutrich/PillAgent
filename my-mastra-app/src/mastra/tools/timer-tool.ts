import { z } from 'zod';
import { createTool } from '@mastra/core';

// Timer types
const TimerType = z.enum(['simple', 'interval', 'max_hang', 'endurance', 'custom']);

const SimpleTimerSchema = z.object({
  type: z.literal('simple'),
  duration: z.number().min(1).max(7200), // 1 second to 2 hours
  name: z.string().optional().default('Training Timer'),
});

const IntervalTimerSchema = z.object({
  type: z.literal('interval'),
  workTime: z.number().min(1).max(3600), // 1 second to 1 hour
  restTime: z.number().min(1).max(3600),
  rounds: z.number().min(1).max(50),
  name: z.string().optional(),
});

const MaxHangTimerSchema = z.object({
  type: z.literal('max_hang'),
  hangTime: z.number().min(5).max(60).default(10), // 5-60 seconds
  restTime: z.number().min(60).max(600).default(180), // 1-10 minutes
  rounds: z.number().min(1).max(20).default(6),
  name: z.string().optional().default('Max Hang Timer'),
});

const EnduranceTimerSchema = z.object({
  type: z.literal('endurance'),
  workTime: z.number().min(30).max(1800), // 30 seconds to 30 minutes
  restTime: z.number().min(30).max(900), // 30 seconds to 15 minutes
  rounds: z.number().min(1).max(20),
  name: z.string().optional().default('Endurance Timer'),
});

const CustomTimerSchema = z.object({
  type: z.literal('custom'),
  workTime: z.number().min(1).max(3600),
  restTime: z.number().min(1).max(3600),
  rounds: z.number().min(1).max(100),
  name: z.string(),
});

const TimerConfigSchema = z.discriminatedUnion('type', [
  SimpleTimerSchema,
  IntervalTimerSchema,
  MaxHangTimerSchema,
  EnduranceTimerSchema,
  CustomTimerSchema,
]);

// Create Timer Tool
export const createTimerTool = createTool({
  id: 'create_timer',
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
          timerConfig = {
            type: 'simple',
            duration: input.duration,
            name: input.name || 'Training Timer',
          };
          totalTime = input.duration;
          description = `Simple timer for ${Math.floor(input.duration / 60)}:${(input.duration % 60).toString().padStart(2, '0')}`;
          break;

        case 'interval':
          const intervalName = input.name || `${input.workTime}s on ${input.restTime}s off × ${input.rounds}`;
          timerConfig = {
            type: 'interval',
            workTime: input.workTime,
            restTime: input.restTime,
            rounds: input.rounds,
            name: intervalName,
            totalTime: (input.workTime + input.restTime) * input.rounds,
          };
          totalTime = (input.workTime + input.restTime) * input.rounds;
          description = `Interval timer: ${input.workTime}s work, ${input.restTime}s rest, ${input.rounds} rounds (${Math.floor(totalTime / 60)} minutes total)`;
          break;

        case 'max_hang':
          timerConfig = {
            type: 'interval',
            workTime: input.hangTime,
            restTime: input.restTime,
            rounds: input.rounds,
            name: `Max Hang Timer (${input.hangTime}s on ${Math.floor(input.restTime / 60)}min off × ${input.rounds})`,
            totalTime: (input.hangTime + input.restTime) * input.rounds,
            isMaxHang: true,
          };
          totalTime = (input.hangTime + input.restTime) * input.rounds;
          description = `Max hang timer: ${input.hangTime}s hangs, ${Math.floor(input.restTime / 60)} minute rest, ${input.rounds} sets (${Math.floor(totalTime / 60)} minutes total)`;
          break;

        case 'endurance':
          const enduranceName = input.name || `Endurance Timer (${Math.floor(input.workTime / 60)}min on ${Math.floor(input.restTime / 60)}min off × ${input.rounds})`;
          timerConfig = {
            type: 'interval',
            workTime: input.workTime,
            restTime: input.restTime,
            rounds: input.rounds,
            name: enduranceName,
            totalTime: (input.workTime + input.restTime) * input.rounds,
            isEndurance: true,
          };
          totalTime = (input.workTime + input.restTime) * input.rounds;
          description = `Endurance timer: ${Math.floor(input.workTime / 60)} minute climbs, ${Math.floor(input.restTime / 60)} minute rest, ${input.rounds} rounds`;
          break;

        case 'custom':
          timerConfig = {
            type: 'interval',
            workTime: input.workTime,
            restTime: input.restTime,
            rounds: input.rounds,
            name: input.name,
            totalTime: (input.workTime + input.restTime) * input.rounds,
          };
          totalTime = (input.workTime + input.restTime) * input.rounds;
          description = `Custom timer: ${input.name} - ${input.workTime}s work, ${input.restTime}s rest, ${input.rounds} rounds`;
          break;
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
  id: 'parse_timer_request',
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
            type: 'max_hang' as const,
            hangTime: 10,
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
            type: 'endurance' as const,
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
            type: 'interval' as const,
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
            type: 'simple' as const,
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
  id: 'get_timer_presets',
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
          hangTime: 7,
          restTime: 180,
          rounds: 5,
          description: 'Good starting point for hangboard training',
        },
        {
          name: 'Intermediate Max Hangs',
          type: 'max_hang',
          hangTime: 10,
          restTime: 180,
          rounds: 6,
          description: 'Standard max hang protocol',
        },
        {
          name: 'Advanced Max Hangs',
          type: 'max_hang',
          hangTime: 12,
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