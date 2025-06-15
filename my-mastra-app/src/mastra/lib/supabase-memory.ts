import { Memory } from '@mastra/memory';
import { LibSQLStore } from '@mastra/libsql';

/**
 * Create LibSQL Memory Configuration
 * 
 * Simple, reliable memory storage that works in all environments
 * This provides:
 * - Persistent memory storage with LibSQL
 * - Working memory for persistent user information
 * - Reliable deployment compatibility
 */
export function createLibSQLMemory(): Memory {
  console.log('📁 Initializing LibSQL Memory Storage');

  try {
    const memory = new Memory({
      storage: new LibSQLStore({
        url: process.env.NODE_ENV === 'production' 
          ? 'file:memory.db' // In-memory for production (temporary)
          : 'file:local.db', // Local file for development
      }),
      options: {
        lastMessages: 15,
        semanticRecall: false,
        workingMemory: {
          enabled: true,
          template: `# ClimbingPill User Profile

## Personal Info
- Name:
- Location:
- Timezone:

## Climbing Profile
- Current Grade:
- Target Grade:
- Experience (years):
- Climbing Style: [boulder/lead/both]

## Training Preferences
- Available Days:
- Session Length:
- Equipment Access:
- Primary Goals:

## Progress Tracking
- Last Assessment Date:
- Current Program:
- Recent Achievements:
- Areas of Focus:

## Session Context
- Last Topic Discussed:
- Current Training Phase:
- Upcoming Goals:`,
        },
        threads: {
          generateTitle: true,
        },
      },
    });

    console.log('✅ LibSQL Memory initialized successfully');
    console.log('🧠 Working memory enabled for user profiles');
    console.log('💾 Memory will persist locally');

    return memory;

  } catch (error) {
    console.error('❌ Failed to initialize LibSQL Memory:', error);
    throw new Error(`LibSQL Memory initialization failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Memory Configuration Helper
 * 
 * Uses LibSQL for reliable deployment compatibility
 * Once deployment is stable, we can add Supabase back
 */
export function createOptimalMemory(): Memory {
  console.log('🚀 Using LibSQL memory for reliable deployment');
  return createLibSQLMemory();
}

// Legacy exports for backward compatibility
export const createSupabaseMemory = createLibSQLMemory;
export const createSupabaseMemorySimple = createLibSQLMemory; 