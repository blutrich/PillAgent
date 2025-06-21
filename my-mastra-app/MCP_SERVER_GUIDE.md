# ClimbingPill MCP Server Guide

This guide explains how to run and use the ClimbingPill MCP Server to expose your climbing tools to external MCP clients like Cursor, Claude Desktop, and other AI assistants.

## 🏗️ Architecture Overview

### Two Separate Systems:

1. **Mastra Cloud App** (`src/mastra/index.ts`)
   - Main application deployed to Mastra Cloud
   - Agents and tools accessible via HTTP API
   - Used by your frontend application

2. **MCP Server** (`src/mastra/mcp-server.ts`)
   - Separate server exposing tools via MCP protocol
   - Used by external MCP clients (Cursor, Claude Desktop, etc.)
   - Runs independently from main app

## 🚀 Running the MCP Server

### 1. Streamable HTTP Transport (Recommended)
Modern, efficient transport with session management:

```bash
npm run mcp:http
# or manually:
MCP_MODE=http PORT=8080 node -r dotenv/config start-mcp-server.ts
```

**Features:**
- ✅ Session management with UUID generation
- ✅ Message resumability  
- ✅ Streaming responses
- ✅ Health check endpoint

**Endpoints:**
- MCP: `http://localhost:8080/mcp`
- Health: `http://localhost:8080/`

### 2. STDIO Transport (CLI Tools)
For command-line MCP clients:

```bash
npm run mcp:stdio
# or manually:
node -r dotenv/config start-mcp-server.ts
```

**Use case:** Direct integration with CLI tools

### 3. SSE Transport (Legacy)
Server-Sent Events for older clients:

```bash
npm run mcp:sse
# or manually:
MCP_MODE=sse PORT=8080 node -r dotenv/config start-mcp-server.ts
```

**Endpoints:**
- SSE: `http://localhost:8080/sse`
- Health: `http://localhost:8080/`

## 🧗 Available Tools

The MCP server exposes all ClimbingPill tools:

### Core Tools
- **climbingAssessment** - Complete climbing assessment
- **programGeneration** - Generate training programs
- **getUserTrainingProgram** - Get existing user programs

### Utility Tools
- **weather** - Weather information for outdoor climbing
- **tavilySearch** - Web search for climbing info
- **createJournalEntry** - Log climbing sessions
- **queryJournal** - Search climbing history
- **createTimer** - Training timers
- **getTimerPresets** - Timer presets

### AI Agent
- **ask_climbingPillAgent** - Chat with the climbing AI coach

## 🔧 Client Configuration

### For Cursor/Windsurf
Add to your MCP configuration:

```json
{
  "mcpServers": {
    "climbingpill": {
      "command": "node",
      "args": ["-r", "dotenv/config", "/path/to/start-mcp-server.ts"],
      "env": {
        "MCP_MODE": "stdio"
      }
    }
  }
}
```

### For HTTP Clients
Connect to: `http://localhost:8080/mcp`

## 🏔️ Example Usage

Once connected, you can use tools like:

```
# Get weather for climbing location
weather({"location": "Yosemite Valley, CA"})

# Create climbing assessment
climbingAssessment({
  "age": 28,
  "weight": 70,
  "height": 175,
  "fingerStrength": 15,
  "pullUps": 12,
  "pushUps": 30,
  "coreStrength": 8,
  "flexibility": 7,
  "climbingGrade": "V6",
  "experience": 3
})

# Chat with AI coach
ask_climbingPillAgent({"message": "What's the best training plan for improving from V6 to V8?"})
```

## 🐛 Debugging

### Check Server Status
```bash
curl http://localhost:8080/
```

### View Logs
The server outputs detailed logs including:
- Session initialization
- Tool executions
- Error messages

### Common Issues

1. **Port conflicts**: Change PORT environment variable
2. **Missing dependencies**: Run `npm install`
3. **Environment variables**: Ensure `.env` file has required API keys

## 🔑 Required Environment Variables

```bash
# OpenAI for AI agent
OPENAI_API_KEY=your_openai_key

# Supabase for data storage
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_key

# Optional: Tavily for web search
TAVILY_API_KEY=your_tavily_key
```

## 🎯 Use Cases

### Development
- **Cursor/Windsurf**: Use climbing tools directly in your IDE
- **Claude Desktop**: Access climbing expertise in conversations
- **Custom MCP Clients**: Build specialized climbing applications

### Production
- **API Integration**: Expose tools to other services
- **Multi-tenant**: Session management for multiple users
- **Scaling**: Run multiple instances with load balancing

## 🔄 Deployment Options

### Local Development
```bash
npm run mcp:http  # Streamable HTTP on localhost:8080
```

### Docker
```dockerfile
FROM node:20
# ... copy files ...
EXPOSE 8080
CMD ["npm", "run", "mcp:http"]
```

### Cloud Platforms
Deploy as a separate service alongside your main Mastra Cloud app

## 📊 Monitoring

### Health Checks
- **HTTP**: `GET http://localhost:8080/`
- **Response**: Server status and available endpoints

### Session Tracking
The server logs all session initializations and tool executions for monitoring and debugging.

---

## 🤝 Integration with Main App

The MCP server shares the same tool implementations as your main Mastra Cloud app but runs as a separate process. This allows:

- **Consistent behavior** across both HTTP API and MCP protocol
- **Independent scaling** of MCP server and main app
- **Security isolation** between internal and external access 