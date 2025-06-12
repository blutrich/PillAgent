import { Mastra } from '@mastra/core';
import { LibSQLStore } from '@mastra/libsql';
import { PinoLogger } from '@mastra/loggers';

// Import Supabase configuration for data operations
import { supabase, dbHelpers } from './lib/supabase';

// Import the unified climbing agent
import { climbingAgent } from './agents/climbing-agent';

// Import workflows
import { simpleRetentionWorkflow } from './workflows/simple-retention-workflow';

export const mastra = new Mastra({
  agents: { 
    climbingPillAgent: climbingAgent
  },
  workflows: {
    simpleRetentionWorkflow
  },
  storage: new LibSQLStore({
    url: 'file:./mastra-climbing.db' // Persistent file storage
  }),
  logger: new PinoLogger({
    name: 'ClimbingPill-Mastra',
    level: 'info'
  })
});

// Export Supabase for use in tools and agents
export { supabase, dbHelpers };
