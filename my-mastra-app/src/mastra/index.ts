import { Mastra } from '@mastra/core';
import { LibSQLStore } from '@mastra/libsql';
import { PinoLogger } from '@mastra/loggers';

// Import Supabase configuration for data operations
import { supabase, dbHelpers } from './lib/supabase';

// Import the unified climbing agent
import { climbingAgent } from './agents/climbing-agent';

// Import workflows
import { simpleRetentionWorkflow } from './workflows/simple-retention-workflow';

// Import MCP server
import { climbingPillMCPServer } from './mcp-server';

export const mastra = new Mastra({
  agents: { 
    climbingPillAgent: climbingAgent
  },
  workflows: {
    simpleRetentionWorkflow
  },
  // Register MCP server for Mastra Cloud visibility
  mcpServers: {
    climbingPillMCPServer
  },
  storage: new LibSQLStore({
    url: 'file:./mastra-climbing.db' // Persistent file storage
  }),
  logger: new PinoLogger({
    name: 'ClimbingPill-Mastra',
    level: 'info'
  }),
  // Add server configuration for cloud deployment
  server: {
    port: process.env.PORT ? parseInt(process.env.PORT) : 4111,
    cors: {
      origin: '*', // Allow all origins for MCP connections
      allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowHeaders: ['Content-Type', 'Authorization', 'x-mastra-*'],
      credentials: true,
    },
    middleware: [
      // Add logging middleware
      async (c, next) => {
        console.log(`${c.req.method} ${c.req.url}`);
        await next();
      }
    ]
  }
});

// Export Supabase for use in tools and agents
export { supabase, dbHelpers };
