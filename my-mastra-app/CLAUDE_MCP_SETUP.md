# Claude.ai MCP Server Setup Guide

## 🧗 ClimbingPill AI Coach MCP Server with Authentication

This guide shows you how to connect Claude.ai to your ClimbingPill MCP server with proper authentication.

## 🔧 Prerequisites

1. **Node.js 20+** installed
2. **Environment variables** configured
3. **Network access** for Claude.ai to reach your server

## 🚀 Quick Start

### 1. Start the Authenticated MCP Server

```bash
# Option 1: Using npm script (recommended)
npm run mcp:sse

# Option 2: Using tsx directly
MCP_API_KEY=climbingpill-secure-key-2024 tsx start-authenticated-mcp-server.ts sse

# Option 3: Custom API key
MCP_API_KEY=your-custom-key tsx start-authenticated-mcp-server.ts sse 8080
```

### 2. Configure Claude.ai MCP Client

Claude.ai needs to connect with authentication headers. Use this configuration:

#### For Claude.ai Web Interface:
```json
{
  "mcpServers": {
    "climbingpill-ai-coach": {
      "url": "http://localhost:8080/sse",
      "requestInit": {
        "headers": {
          "Authorization": "Bearer climbingpill-secure-key-2024",
          "Content-Type": "application/json"
        }
      },
      "eventSourceInit": {
        "fetch": "function(input, init) { const headers = new Headers(init?.headers || {}); headers.set('Authorization', 'Bearer climbingpill-secure-key-2024'); return fetch(input, { ...init, headers }); }"
      }
    }
  }
}
```

#### For Claude Desktop App:
```json
{
  "mcpServers": {
    "climbingpill-ai-coach": {
      "command": "tsx",
      "args": ["start-authenticated-mcp-server.ts", "sse"],
      "env": {
        "MCP_API_KEY": "climbingpill-secure-key-2024",
        "OPENAI_API_KEY": "your-openai-key",
        "SUPABASE_URL": "your-supabase-url",
        "SUPABASE_ANON_KEY": "your-supabase-key"
      }
    }
  }
}
```

## 🔑 Authentication Details

### API Key Configuration
- **Default Key**: `climbingpill-secure-key-2024`
- **Environment Variable**: `MCP_API_KEY`
- **Header Format**: `Authorization: Bearer <your-api-key>`

### Custom API Key
```bash
# Set custom API key
export MCP_API_KEY="your-super-secure-key-here"

# Start server with custom key
npm run mcp:sse
```

## 🛠️ Available Tools & Capabilities

Your MCP server exposes these tools to Claude.ai:

### 🧗 Climbing Tools
- **`climbingAssessment`** - Scientific climbing assessment (3 types: Quick, Partial, Complete)
- **`programGeneration`** - Generate personalized training programs
- **`getUserTrainingProgram`** - Retrieve existing training programs

### 📝 Journal & Tracking
- **`createJournalEntry`** - Log climbing sessions and progress
- **`queryJournal`** - Search and analyze journal entries

### ⏱️ Training Tools
- **`createTimer`** - Create workout timers and intervals
- **`getTimerPresets`** - Get predefined timer configurations

### 🌍 External Data
- **`weather`** - Get weather information for climbing locations
- **`tavilySearch`** - Search web for climbing information

### 🤖 AI Agent
- **`ask_climbingPillAgent`** - Chat with the ClimbingPill AI coach

### 📚 Resources
- **ClimbingPill Assessment Methodology** - Scientific assessment system
- **ClimbingPill Training Methodology** - Comprehensive training protocols
- **Climbing Grade Standards** - V-scale progression benchmarks

## 🔧 Troubleshooting

### Common Issues

#### 1. Authentication Failed (401)
```bash
# Check if API key is set correctly
echo $MCP_API_KEY

# Verify server logs show the correct key
npm run mcp:sse
```

#### 2. CORS Issues
The server includes CORS headers for web clients:
```typescript
'Access-Control-Allow-Origin': '*'
'Access-Control-Allow-Headers': 'Content-Type, Authorization'
```

#### 3. Connection Refused
```bash
# Check if server is running
curl -H "Authorization: Bearer climbingpill-secure-key-2024" http://localhost:8080/sse

# Check firewall/network settings
netstat -an | grep 8080
```

#### 4. Environment Variables Missing
```bash
# Check required environment variables
env | grep -E "(OPENAI|SUPABASE|MCP)"

# Load from .env file
source .env
npm run mcp:sse
```

## 🌐 Production Deployment

### For Public Access (Claude.ai Web)
1. **Deploy to cloud service** (Railway, Render, Heroku)
2. **Use HTTPS** for secure connections
3. **Set strong API key** in environment variables
4. **Configure domain/subdomain**

### Example Railway Deployment
```bash
# Deploy to Railway
railway login
railway init
railway up

# Set environment variables
railway variables set MCP_API_KEY=your-production-key
railway variables set OPENAI_API_KEY=your-openai-key
```

## 📋 Testing Your Setup

### 1. Test Server Directly
```bash
# Test authentication
curl -X GET \
  -H "Authorization: Bearer climbingpill-secure-key-2024" \
  http://localhost:8080/sse

# Should return MCP server response, not 401 Unauthorized
```

### 2. Test with Claude.ai
1. Configure Claude.ai with your server URL and API key
2. Ask Claude: "What climbing tools do you have access to?"
3. Try: "Give me a climbing assessment"
4. Test: "Create a training program for V5 climbing"

## 🆘 Support

If you encounter issues:
1. Check server logs for authentication errors
2. Verify API key matches between server and client
3. Ensure all environment variables are set
4. Test connection with curl first
5. Check network/firewall settings

## 🔐 Security Notes

- **Never commit API keys** to version control
- **Use environment variables** for sensitive data
- **Rotate API keys** regularly in production
- **Use HTTPS** for production deployments
- **Restrict CORS origins** in production if needed

---

**Happy Climbing! 🧗‍♂️** 