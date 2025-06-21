import { MCPServer } from "@mastra/mcp";
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

// Create MCP Server to expose ClimbingPill capabilities
export const climbingPillMCPServer = new MCPServer({
  name: "ClimbingPill AI Coach Server",
  version: "1.0.0",
  description: "Professional climbing training AI with assessment, program generation, and coaching tools",
  
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

  // Optional: Add repository info for discoverability
  repository: {
    url: "https://github.com/your-username/climbingpill",
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
    await climbingPillMCPServer.startHTTP({
      url: new URL(req.url || '', `http://localhost:${port}`),
      httpPath: '/mcp',
      req,
      res,
    });
  });

  server.listen(port, () => {
    console.log(`✅ ClimbingPill MCP Server running at http://localhost:${port}/mcp`);
  });
}

export async function startSSEServer(port: number = 8080) {
  console.log(`🧗 Starting ClimbingPill MCP Server (SSE) on port ${port}...`);
  
  const http = require('http');
  
  const server = http.createServer(async (req: any, res: any) => {
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
  });
} 