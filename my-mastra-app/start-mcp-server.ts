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
    // For streamable HTTP connections (modern, efficient)
    const http = require('http');
    const { randomUUID } = require('crypto');
    
    const server = http.createServer(async (req: any, res: any) => {
      const url = new URL(req.url || '', `http://localhost:${port}`);
      
      // Handle MCP server requests using streamable HTTP transport
      if (url.pathname === '/mcp' || url.pathname.startsWith('/mcp/')) {
        try {
          await climbingPillMCPServer.startHTTP({
            url,
            httpPath: '/mcp',
            req,
            res,
            options: {
              sessionIdGenerator: () => randomUUID(), // Enable session management
              enableJsonResponse: false, // Use streaming by default
              onsessioninitialized: (sessionId: string) => {
                console.log(`New MCP session initialized: ${sessionId}`);
              }
            }
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
          server: 'ClimbingPill MCP Server (Streamable HTTP)',
          endpoints: {
            mcp: '/mcp',
            health: '/'
          },
          transport: 'streamable-http'
        }));
      }
    });
    
    server.listen(port, () => {
      console.log(`🚀 ClimbingPill MCP Server (Streamable HTTP) listening on http://localhost:${port}/mcp`);
      console.log(`📊 Health check: http://localhost:${port}/`);
      console.log(`🔧 Transport: Streamable HTTP with session management`);
    });
  } else if (mode === 'sse') {
    // Legacy SSE support for older clients
    const http = require('http');
    
    const server = http.createServer(async (req: any, res: any) => {
      const url = new URL(req.url || '', `http://localhost:${port}`);
      
      if (url.pathname === '/sse' || url.pathname.startsWith('/sse/')) {
        try {
          await climbingPillMCPServer.startSSE({
            url,
            ssePath: '/sse',
            messagePath: '/sse/message',
            req,
            res,
          });
        } catch (error) {
          console.error('SSE MCP Server error:', error);
          res.writeHead(500);
          res.end('Internal Server Error');
        }
      } else {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          status: 'healthy', 
          server: 'ClimbingPill MCP Server (SSE)', 
          endpoints: { sse: '/sse', health: '/' },
          transport: 'sse'
        }));
      }
    });
    
    server.listen(port, () => {
      console.log(`📡 ClimbingPill MCP Server (SSE) listening on http://localhost:${port}/sse`);
    });
  }
}

if (require.main === module) {
  main().catch(console.error);
} 