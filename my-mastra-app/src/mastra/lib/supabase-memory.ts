import { Memory } from '@mastra/memory';
import { PostgresStore, PgVector } from '@mastra/pg';
import { LibSQLStore } from '@mastra/libsql';
import { openai } from '@ai-sdk/openai';

// Supabase PostgreSQL connection configuration
// Extract connection details from Supabase URL: https://lxeggioigpyzmkrjdmne.supabase.co
const SUPABASE_PROJECT_ID = 'lxeggioigpyzmkrjdmne';
const SUPABASE_HOST = `db.${SUPABASE_PROJECT_ID}.supabase.co`;
const SUPABASE_PORT = 5432;
const SUPABASE_DATABASE = 'postgres';

// Environment variables for Supabase PostgreSQL connection
const SUPABASE_DB_PASSWORD = process.env.SUPABASE_DB_PASSWORD;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_DB_PASSWORD) {
  console.warn('⚠️ SUPABASE_DB_PASSWORD not set - falling back to LibSQL');
}

if (!SUPABASE_SERVICE_KEY) {
  console.warn('⚠️ SUPABASE_SERVICE_KEY not set - falling back to LibSQL');
}

/**
 * Create Supabase PostgreSQL Memory Configuration
 * 
 * This provides:
 * - Persistent memory storage in Supabase PostgreSQL
 * - Vector search capabilities with pgvector
 * - Working memory for persistent user information
 * - Scalable, production-ready memory
 * - Perfect integration with existing Supabase stack
 */
export function createSupabaseMemory(): Memory {
  // Check if we have the required credentials
  if (!SUPABASE_DB_PASSWORD || !SUPABASE_SERVICE_KEY) {
    throw new Error('Missing Supabase credentials for memory storage. Please set SUPABASE_DB_PASSWORD and SUPABASE_SERVICE_KEY environment variables.');
  }

  // PostgreSQL connection string for Supabase
  const connectionString = `postgresql://postgres:${SUPABASE_DB_PASSWORD}@${SUPABASE_HOST}:${SUPABASE_PORT}/${SUPABASE_DATABASE}`;

  console.log('🚀 Initializing Supabase PostgreSQL Memory Storage');
  console.log(`📍 Host: ${SUPABASE_HOST}`);
  console.log(`🗄️ Database: ${SUPABASE_DATABASE}`);

  try {
    // Initialize PostgreSQL storage
    const postgresStore = new PostgresStore({
      host: SUPABASE_HOST,
      port: SUPABASE_PORT,
      user: 'postgres',
      database: SUPABASE_DATABASE,
      password: SUPABASE_DB_PASSWORD,
    });

    // Initialize vector search with pgvector
    const pgVector = new PgVector({ 
      connectionString,
    });

    // Create memory instance with full Mastra capabilities
    const memory = new Memory({
      storage: postgresStore,
      vector: pgVector, // Enable semantic recall
      embedder: openai.embedding("text-embedding-3-small"), // OpenAI embeddings
      options: {
        lastMessages: 15, // Keep last 15 messages for context
        semanticRecall: {
          topK: 3, // Retrieve top 3 most relevant messages
          messageRange: 2, // Include 2 messages before/after each relevant message
          scope: 'resource', // Search across all user's conversations
        },
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
          generateTitle: true, // Auto-generate conversation titles
        },
      },
    });

    console.log('✅ Supabase PostgreSQL Memory initialized successfully');
    console.log('🔍 Vector search enabled for semantic recall');
    console.log('🧠 Working memory enabled for user profiles');
    console.log('💾 Memory will persist across deployments');

    return memory;

  } catch (error) {
    console.error('❌ Failed to initialize Supabase PostgreSQL Memory:', error);
    throw new Error(`Supabase Memory initialization failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Create Supabase Memory without Vector Search
 * 
 * Simpler configuration without vector capabilities
 * Use this if you don't need semantic search
 */
export function createSupabaseMemorySimple(): Memory {
  if (!SUPABASE_DB_PASSWORD || !SUPABASE_SERVICE_KEY) {
    throw new Error('Missing Supabase credentials for memory storage. Please set SUPABASE_DB_PASSWORD and SUPABASE_SERVICE_KEY environment variables.');
  }

  console.log('🚀 Initializing Simple Supabase PostgreSQL Memory Storage');

  try {
    const postgresStore = new PostgresStore({
      host: SUPABASE_HOST,
      port: SUPABASE_PORT,
      user: 'postgres',
      database: SUPABASE_DATABASE,
      password: SUPABASE_DB_PASSWORD,
    });

    const memory = new Memory({
      storage: postgresStore,
      options: {
        lastMessages: 15,
        semanticRecall: false, // Disabled for simplicity
        workingMemory: {
          enabled: true,
          template: `# ClimbingPill User Profile

## Personal Info
- Name:
- Current Grade:
- Target Grade:

## Session Context
- Last Topic:
- Current Focus:`,
        },
      },
    });

    console.log('✅ Simple Supabase PostgreSQL Memory initialized');
    return memory;

  } catch (error) {
    console.error('❌ Failed to initialize Simple Supabase Memory:', error);
    throw new Error(`Simple Supabase Memory initialization failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Memory Configuration Helper
 * 
 * Automatically chooses the best memory configuration:
 * 1. Supabase PostgreSQL (if credentials available)
 * 2. LibSQL fallback (if Supabase not available)
 */
export function createOptimalMemory(): Memory {
  // Try Supabase PostgreSQL first
  if (SUPABASE_DB_PASSWORD && SUPABASE_SERVICE_KEY) {
    try {
      return createSupabaseMemorySimple(); // Start with simple version
    } catch (error) {
      console.warn('⚠️ Supabase Memory failed, falling back to LibSQL:', error instanceof Error ? error.message : String(error));
    }
  }

  // Fallback to LibSQL
  console.log('📁 Using LibSQL fallback memory storage');
  
  return new Memory({
    storage: new LibSQLStore({
      url: process.env.NODE_ENV === 'production' 
        ? "file:./mastra-climbing-production.db"
        : "file:./mastra-climbing.db",
    }),
    options: {
      lastMessages: 15,
      semanticRecall: false,
    },
  });
}

// Export connection details for testing
export const supabaseConfig = {
  host: SUPABASE_HOST,
  port: SUPABASE_PORT,
  database: SUPABASE_DATABASE,
  projectId: SUPABASE_PROJECT_ID,
  hasCredentials: !!(SUPABASE_DB_PASSWORD && SUPABASE_SERVICE_KEY),
}; 