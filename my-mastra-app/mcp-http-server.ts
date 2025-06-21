#!/usr/bin/env node

/**
 * HTTP MCP Server for Claude Integrations
 * Deploy this to any cloud platform (Vercel, Railway, fly.io, etc.)
 * Claude can then connect to this remote MCP server via HTTP/SSE
 */

import { climbingPillMCPServer } from './src/mastra/mcp-server';
import http from 'http';

const PORT = process.env.PORT || 8080;

console.log('🧗 Starting ClimbingPill MCP Server for Claude Integrations');

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '', `http://localhost:${PORT}`);
  
  // Add CORS headers for Claude access
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  // MCP endpoints
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
      console.error('MCP Error:', error);
      res.writeHead(500);
      res.end(JSON.stringify({ error: 'Internal Server Error' }));
    }
  } 
  // Health check / info endpoint
  else if (url.pathname === '/' || url.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      name: 'ClimbingPill MCP Server',
      version: '1.0.0',
      status: 'healthy',
      endpoints: {
        mcp: '/mcp',
        health: '/health'
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
    }));
  } 
  // 404
  else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

server.listen(PORT, () => {
  console.log(`🌐 MCP Server running on http://localhost:${PORT}`);
  console.log(`📍 Claude can connect to: http://localhost:${PORT}/mcp`);
  console.log(`💡 Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down gracefully...');
  server.close(() => {
    process.exit(0);
  });
}); 