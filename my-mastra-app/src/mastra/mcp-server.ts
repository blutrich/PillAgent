import { MCPServer } from "@mastra/mcp";
import type { MCPServerResources, Resource, MCPServerResourceContent } from "@mastra/mcp";
import { climbingAgent } from "./agents/climbing-agent";
import { climbingAssessmentTool } from "./tools/climbing-assessment-tool";
import { 
  programGenerationTool,
  getUserTrainingProgramTool 
} from "./tools/program-generation-tool";
import { weatherTool } from "./tools/weather-tool";
import { tavilySearchTool } from "./tools/tavily-search-tool";
import { 
  createJournalEntryTool, 
  queryJournalTool 
} from "./tools/journal-tool";
import { 
  createTimerTool, 
  getTimerPresetsTool 
} from "./tools/timer-tool";

// Authentication middleware for MCP server
function authenticateRequest(req: any): boolean {
  const authHeader = req.headers.authorization;
  const expectedToken = process.env.MCP_API_KEY || 'climbingpill-secure-key-2024';
  
  if (!authHeader) {
    return false;
  }
  
  const token = authHeader.replace('Bearer ', '');
  return token === expectedToken;
}

// Resource handlers for MCP clients to access training data
const climbingPillResources: MCPServerResources = {
  listResources: async () => {
    return [
      {
        uri: "climbingpill://methodology/assessment",
        name: "ClimbingPill Assessment Methodology",
        description: "Scientific climbing assessment methodology and scoring system",
        mimeType: "text/markdown"
      },
      {
        uri: "climbingpill://methodology/training",
        name: "ClimbingPill Training Methodology", 
        description: "Comprehensive training methodology and exercise library",
        mimeType: "text/markdown"
      },
      {
        uri: "climbingpill://data/grade-standards",
        name: "Climbing Grade Standards",
        description: "V-scale grade standards and progression benchmarks",
        mimeType: "application/json"
      }
    ];
  },
  
  getResourceContent: async ({ uri }) => {
    switch (uri) {
      case "climbingpill://methodology/assessment":
        return {
          text: `# ClimbingPill Assessment Methodology

## Scientific Approach
- Composite scoring using weighted metrics
- Body weight normalization for accuracy
- Grade prediction based on performance ratios

## Key Metrics
- Finger Strength: 45% weight (most important)
- Pull-ups: 20% weight
- Core Strength: 15% weight  
- Push-ups: 10% weight
- Flexibility: 10% weight

## Assessment Types
- Quick (2-3 min): Basic prediction
- Partial (5-7 min): Good accuracy
- Complete (10-15 min): Maximum accuracy`
        };
        
      case "climbingpill://methodology/training":
        return {
          text: `# ClimbingPill Training Methodology

## Core Principles
- Progressive overload with 80% grade calculations
- 6-week training cycles with deload phases
- Environment-specific adaptations (home/gym/hybrid)
- Injury prevention protocols

## Exercise Categories
- Fingerboard protocols (20mm edge, 10s hangs)
- Boulder project progression
- Flash training sequences
- Technical skill development
- Endurance protocols`
        };
        
      case "climbingpill://data/grade-standards":
        return {
          text: JSON.stringify({
            "V4": { "composite_score": 0.15, "finger_strength_ratio": 1.3, "pull_up_ratio": 0.5 },
            "V5": { "composite_score": 0.25, "finger_strength_ratio": 1.4, "pull_up_ratio": 0.6 },
            "V6": { "composite_score": 0.35, "finger_strength_ratio": 1.5, "pull_up_ratio": 0.7 },
            "V7": { "composite_score": 0.45, "finger_strength_ratio": 1.6, "pull_up_ratio": 0.8 },
            "V8": { "composite_score": 0.55, "finger_strength_ratio": 1.7, "pull_up_ratio": 0.9 }
          }, null, 2)
        };
        
      default:
        throw new Error(`Resource not found: ${uri}`);
    }
  }
};

// Create MCP Server to expose ClimbingPill capabilities
// NOTE: This is for external MCP clients (like Cursor, Claude Desktop), not for Mastra Cloud deployment
// For Mastra Cloud, agents and tools are exposed directly through the main Mastra server
export const climbingPillMCPServer = new MCPServer({
  name: "ClimbingPill AI Coach Server",
  version: "1.0.0",
  description: "Professional climbing training AI with assessment, program generation, and coaching tools",
  id: "climbingpill-ai-coach-server", // Add explicit ID for cloud deployment
  
  // Expose core climbing tools
  tools: {
    climbingAssessment: climbingAssessmentTool,
    programGeneration: programGenerationTool,
    getUserTrainingProgram: getUserTrainingProgramTool,
    weather: weatherTool,
    tavilySearch: tavilySearchTool,
    createJournalEntry: createJournalEntryTool,
    queryJournal: queryJournalTool,
    createTimer: createTimerTool,
    getTimerPresets: getTimerPresetsTool,
  },
  
  // Expose the climbing agent as an "ask_climbingPillAgent" tool
  agents: {
    climbingPillAgent: climbingAgent
  },

  // Expose climbing methodology and data as resources
  resources: climbingPillResources,

  // Optional: Add repository info for discoverability
  repository: {
    url: "https://github.com/blutrich/PillAgent",
    source: "github",
    id: "climbingpill-ai-coach"
  },

  // Package info for distribution
  packages: [
    {
      name: "@climbingpill/mcp-server",
      version: "1.0.0",
      registry_name: "npm"
    }
  ]
});

// Export server startup functions
export async function startStdioServer() {
  console.log("🧗 Starting ClimbingPill MCP Server (stdio)...");
  await climbingPillMCPServer.startStdio();
}

export async function startHTTPServer(port: number = 8080) {
  console.log(`🧗 Starting ClimbingPill MCP Server (HTTP) on port ${port}...`);
  
  const http = require('http');
  
  const server = http.createServer(async (req: any, res: any) => {
    // Add CORS headers for web clients
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }
    
    // Authenticate request
    if (!authenticateRequest(req)) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Unauthorized. Please provide valid API key in Authorization header.' }));
      return;
    }
    
    await climbingPillMCPServer.startHTTP({
      url: new URL(req.url || '', `http://localhost:${port}`),
      httpPath: '/mcp',
      req,
      res,
    });
  });

  server.listen(port, () => {
    console.log(`✅ ClimbingPill MCP Server running at http://localhost:${port}/mcp`);
    console.log(`🔑 API Key required: ${process.env.MCP_API_KEY || 'climbingpill-secure-key-2024'}`);
  });
}

export async function startSSEServer(port: number = 8080) {
  console.log(`🧗 Starting ClimbingPill MCP Server (SSE) on port ${port}...`);
  
  const http = require('http');
  
  const server = http.createServer(async (req: any, res: any) => {
    // Add CORS headers for web clients
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }
    
    // Authenticate request
    if (!authenticateRequest(req)) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Unauthorized. Please provide valid API key in Authorization header.' }));
      return;
    }
    
    await climbingPillMCPServer.startSSE({
      url: new URL(req.url || '', `http://localhost:${port}`),
      ssePath: '/sse',
      messagePath: '/message',
      req,
      res,
    });
  });

  server.listen(port, () => {
    console.log(`✅ ClimbingPill MCP Server (SSE) running at http://localhost:${port}/sse`);
    console.log(`🔑 API Key required: ${process.env.MCP_API_KEY || 'climbingpill-secure-key-2024'}`);
  });
} 