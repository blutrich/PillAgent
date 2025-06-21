#!/usr/bin/env tsx

import { 
  climbingPillMCPServer, 
  startStdioServer, 
  startHTTPServer, 
  startSSEServer 
} from "./src/mastra/mcp-server";

// Get command line arguments
const args = process.argv.slice(2);
const mode = args[0] || 'stdio';
const port = parseInt(args[1]) || 8080;

async function main() {
  console.log("🧗 ClimbingPill MCP Server");
  console.log("========================");
  
  switch (mode.toLowerCase()) {
    case 'stdio':
      console.log("Starting in STDIO mode (for command-line clients)...");
      await startStdioServer();
      break;
      
    case 'http':
      console.log(`Starting HTTP server on port ${port}...`);
      console.log(`📍 Connect MCP clients to: http://localhost:${port}/mcp`);
      await startHTTPServer(port);
      break;
      
    case 'sse':
      console.log(`Starting SSE server on port ${port}...`);
      console.log(`📍 Connect MCP clients to: http://localhost:${port}/sse`);
      await startSSEServer(port);
      break;
      
    default:
      console.error("❌ Invalid mode. Use: stdio, http, or sse");
      console.log("\nUsage:");
      console.log("  tsx start-mcp-server.ts stdio");
      console.log("  tsx start-mcp-server.ts http [port]");
      console.log("  tsx start-mcp-server.ts sse [port]");
      process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log("\n🛑 Shutting down ClimbingPill MCP Server...");
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log("\n🛑 Shutting down ClimbingPill MCP Server...");
  process.exit(0);
});

main().catch((error) => {
  console.error("❌ Failed to start MCP server:", error);
  process.exit(1);
}); 