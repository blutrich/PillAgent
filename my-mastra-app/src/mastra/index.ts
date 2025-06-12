import { Mastra } from '@mastra/core';
import { LibSQLStore } from '@mastra/libsql';
import { PinoLogger } from '@mastra/loggers';
import { VercelDeployer } from '@mastra/deployer-vercel';

// Import Supabase configuration for data operations
import { supabase, dbHelpers } from './lib/supabase';

// Import the unified climbing agent
import { climbingAgent } from './agents/climbing-agent';

// Import workflows
import { retentionWorkflow } from './workflows/retention-workflow';

export const mastra = new Mastra({
  agents: { 
    climbingPillAgent: climbingAgent
  },
  workflows: {
    retentionWorkflow
  },
  storage: new LibSQLStore({
    url: 'file:./mastra-climbing.db' // Persistent file storage
  }),
  logger: new PinoLogger({
    name: 'ClimbingPill-Mastra',
    level: 'info'
  }),
  // Vercel deployment configuration (optional - GitHub integration handles deployment)
  ...(process.env.VERCEL_TOKEN && {
    deployer: new VercelDeployer({
      teamSlug: process.env.VERCEL_TEAM_SLUG || '',
      projectName: 'climbing-pill-ai-coach',
      token: process.env.VERCEL_TOKEN,
    })
  }),
  // Server configuration for production
  server: {
    port: process.env.PORT ? parseInt(process.env.PORT) : 4111,
    timeout: 30000, // 30 seconds for AI operations
    cors: {
      origin: ['https://climbing-pill-ai-coach.vercel.app', 'https://*.vercel.app'],
      allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      credentials: true,
    },
  }
});

// Export Supabase for use in tools and agents
export { supabase, dbHelpers };
