import { Mastra } from '@mastra/core';
import { LibSQLStore } from '@mastra/libsql';
import { PinoLogger } from '@mastra/loggers';
import { registerApiRoute } from '@mastra/core/server';

// Import Supabase configuration for data operations
import { supabase, dbHelpers } from './lib/supabase';

// Import the unified climbing agent
import { climbingAgent } from './agents/climbing-agent';

// Import workflows
import { simpleRetentionWorkflow } from './workflows/simple-retention-workflow';

// Import MCP server for Claude Integrations
import { climbingPillMCPServer } from './mcp-server';

// Main Mastra instance for Cloud deployment (no MCP server registration needed)
export const mastra = new Mastra({
  agents: { 
    climbingPillAgent: climbingAgent
  },
  workflows: {
    simpleRetentionWorkflow
  },
  // Register MCP server for Mastra Cloud dashboard visibility
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
  // Server configuration for cloud deployment
  server: {
    port: process.env.PORT ? parseInt(process.env.PORT) : 4111,
    cors: {
      origin: '*', // Allow all origins
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
    ],
    // Add MCP endpoint for Claude Integrations
    apiRoutes: [
      registerApiRoute('/mcp*', {
        method: 'ALL',
        handler: async (c) => {
          // Add CORS headers for Claude
          c.header('Access-Control-Allow-Origin', '*');
          c.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
          c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
          
          if (c.req.method === 'OPTIONS') {
            return c.text('', 200);
          }
          
          // Return MCP server info - tools are accessible via main Mastra API
          return c.json({
            name: 'ClimbingPill MCP Integration',
            status: 'available',
            message: 'Tools available via Mastra Cloud API endpoints',
            baseUrl: `https://${c.req.header('host')}`,
            endpoints: {
              agents: '/agents/climbingPillAgent/generate',
              tools: '/tools',
              info: '/mcp-info'
            }
          });
        },
      }),
      registerApiRoute('/mcp-info', {
        method: 'GET',
        handler: async (c) => {
          return c.json({
            name: 'ClimbingPill MCP Server',
            version: '1.0.0',
            status: 'healthy',
            endpoints: {
              mcp: '/mcp',
              info: '/mcp-info'
            },
            tools: [
              'climbingAssessment',
              'programGeneration', 
              'getUserTrainingProgram',
              'weather',
              'tavilySearch',
              'createJournalEntry',
              'queryJournal',
              'createTimer',
              'getTimerPresets'
            ],
            agents: ['climbingPillAgent']
          });
        },
      }),
    ]
  }
});

// Export Supabase for use in tools and agents
export { supabase, dbHelpers };
