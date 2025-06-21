#!/usr/bin/env node

/**
 * Start the ClimbingPill MCP Server for external MCP clients
 * This exposes your tools to Cursor, Claude Desktop, and other MCP clients
 * 
 * Usage:
 * - For stdio (CLI tools): node start-mcp-server.ts
 * - For HTTP/SSE: Set PORT environment variable and run
 */

import { climbingPillMCPServer } from './src/mastra/mcp-server';

async function main() {
  const mode = process.env.MCP_MODE || 'stdio';
  const port = process.env.PORT || 8080;
  
  console.log(`Starting ClimbingPill MCP Server in ${mode} mode...`);
  
  if (mode === 'stdio') {
    // For CLI tools like npx, direct stdio connection
    console.log('MCP Server ready for stdio connections');
    await climbingPillMCPServer.startStdio();
  } else if (mode === 'http') {
    // For HTTP/SSE connections
    const http = require('http');
    
    const server = http.createServer(async (req: any, res: any) => {
      const url = new URL(req.url || '', `http://localhost:${port}`);
      
      // Handle MCP server requests
      if (url.pathname === '/mcp' || url.pathname.startsWith('/mcp/')) {
        try {
          await climbingPillMCPServer.startSSE({
            url,
            ssePath: '/mcp',
            messagePath: '/mcp/message',
            req,
            res,
          });
        } catch (error) {
          console.error('MCP Server error:', error);
          res.writeHead(500);
          res.end('Internal Server Error');
        }
      } else {
        // Health check endpoint
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          status: 'healthy', 
          server: 'ClimbingPill MCP Server',
          endpoints: {
            mcp: '/mcp',
            health: '/'
          }
        }));
      }
    });
    
    server.listen(port, () => {
      console.log(`MCP Server listening on http://localhost:${port}/mcp`);
      console.log(`Health check: http://localhost:${port}/`);
    });
  }
}

if (require.main === module) {
  main().catch(console.error);
} 