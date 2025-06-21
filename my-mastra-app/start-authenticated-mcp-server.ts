#!/usr/bin/env tsx

import { startSSEServer, startHTTPServer } from './src/mastra/mcp-server.js';

const mode = process.argv[2] || 'sse';
const port = parseInt(process.argv[3] || '8080');

async function main() {
  console.log('🧗 Starting ClimbingPill MCP Server with Authentication...');
  console.log(`🔑 API Key: ${process.env.MCP_API_KEY || 'climbingpill-secure-key-2024'}`);
  console.log(`📡 Mode: ${mode.toUpperCase()}`);
  console.log(`🚀 Port: ${port}`);
  
  try {
    if (mode === 'sse') {
      await startSSEServer(port);
    } else if (mode === 'http') {
      await startHTTPServer(port);
    } else {
      console.error('❌ Invalid mode. Use "sse" or "http"');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Failed to start MCP server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down MCP server...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down MCP server...');
  process.exit(0);
});

main().catch(console.error); 