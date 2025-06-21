# ClimbingPill MCP Server Guide

## 🧗 Overview

The ClimbingPill MCP Server exposes your climbing AI coach capabilities to external MCP clients like Cursor, Claude Desktop, and other AI tools. This allows other applications to access your climbing expertise!

## 🔧 Available Tools

When you connect to the ClimbingPill MCP server, you get access to these tools:

### **Core Climbing Tools**
- `climbingAssessment` - Conduct comprehensive climbing assessments
- `programGeneration` - Generate personalized training programs  
- `getUserTrainingProgram` - Retrieve existing training programs

### **Journal & Tracking**
- `createJournalEntry` - Log climbing sessions and progress
- `queryJournal` - Search through training history

### **Utilities**
- `createTimer` - Set up training timers
- `getTimerPresets` - Get common timer configurations
- `weather` - Check climbing conditions
- `tavilySearch` - Search for climbing information online

### **AI Agent**
- `ask_climbingPillAgent` - Chat with the ClimbingPill AI coach

## 🚀 Starting the MCP Server

### **1. Stdio Mode (Command Line)**
```bash
cd my-mastra-app
tsx start-mcp-server.ts stdio
```

### **2. HTTP Mode (Web API)**
```bash
tsx start-mcp-server.ts http 8080
# Connects at: http://localhost:8080/mcp
```

### **3. SSE Mode (Server-Sent Events)**
```bash
tsx start-mcp-server.ts sse 8080
# Connects at: http://localhost:8080/sse
```

## 🔌 Connecting External Clients

### **Cursor IDE**

1. Open Cursor settings
2. Navigate to MCP configuration
3. Add this configuration:

```json
{
  "mcpServers": {
    "climbingpill": {
      "command": "tsx",
      "args": ["/path/to/PillAgent/my-mastra-app/start-mcp-server.ts", "stdio"],
      "env": {
        "OPENAI_API_KEY": "your-openai-key",
        "SUPABASE_URL": "your-supabase-url",
        "SUPABASE_ANON_KEY": "your-supabase-key"
      }
    }
  }
}
```

### **Claude Desktop**

1. Edit: `~/Library/Application Support/Claude/claude_desktop_config.json`
2. Add:

```json
{
  "mcpServers": {
    "climbingpill-ai-coach": {
      "command": "tsx",
      "args": ["/path/to/PillAgent/my-mastra-app/start-mcp-server.ts", "stdio"]
    }
  }
}
```

### **Custom MCP Client**

```typescript
import { MCPClient } from "@mastra/mcp";

const client = new MCPClient({
  servers: {
    climbingpill: {
      command: "tsx",
      args: ["start-mcp-server.ts", "stdio"],
      env: {
        OPENAI_API_KEY: "your-key"
      }
    }
  }
});

// Get all climbing tools
const tools = await client.getTools();

// Use the climbing agent
const result = await tools.ask_climbingPillAgent({
  message: "What's the best training for V7 bouldering?"
});
```

## 🎯 Use Cases

### **1. IDE Integration**
- Get climbing advice directly in your code editor
- Generate training programs while coding
- Access climbing knowledge during development

### **2. Multi-Tool Workflows**
- Combine climbing expertise with other MCP servers
- Create complex automation workflows
- Integrate with productivity tools

### **3. External Applications**
- Add climbing intelligence to other apps
- Build custom climbing tools using the MCP protocol
- Share climbing expertise across different platforms

## 🛠 Advanced Configuration

### **Custom Port & Environment**
```bash
# Custom port
tsx start-mcp-server.ts http 9090

# With environment variables
OPENAI_API_KEY=your-key tsx start-mcp-server.ts stdio
```

### **Production Deployment**
For production use, consider:
- Using PM2 or similar process manager
- Setting up proper environment variables
- Implementing authentication for HTTP/SSE modes
- Adding monitoring and logging

### **Security Considerations**
- Stdio mode: Secure by default (local process)
- HTTP/SSE modes: Consider adding authentication
- Environment variables: Use secure secret management
- Network access: Restrict to trusted clients only

## 📊 Tool Usage Examples

### **Climbing Assessment**
```typescript
const assessment = await tools.climbingAssessment({
  bodyWeight: 70,
  maxPullUps: 15,
  maxPushUps: 30,
  coreStrength: 60,
  flexibility: 8,
  eightyPercentGrade: "V4"
});
```

### **Program Generation**
```typescript
const program = await tools.programGeneration({
  currentGrade: "V6",
  targetGrade: "V8",
  trainingEnvironment: "gym",
  focusAreas: ["strength", "technique"]
});
```

### **Ask the AI Coach**
```typescript
const advice = await tools.ask_climbingPillAgent({
  message: "I'm struggling with overhangs. What specific exercises should I focus on?"
});
```

## 🔍 Debugging

### **Check Server Status**
```bash
# Test if server starts
tsx start-mcp-server.ts stdio

# Check HTTP endpoint
curl http://localhost:8080/mcp
```

### **Common Issues**
1. **Missing Environment Variables**: Ensure all API keys are set
2. **Port Conflicts**: Try different ports for HTTP/SSE modes
3. **Tool Import Errors**: Check that all tool files exist and export correctly
4. **Client Connection Issues**: Verify client configuration matches server mode

## 🚀 Next Steps

1. **Test the MCP Server**: Start with stdio mode and verify tools work
2. **Connect to Cursor**: Add the MCP configuration to test in your IDE
3. **Explore Tool Combinations**: Try combining climbing tools with other capabilities
4. **Build Custom Clients**: Create specialized applications using the MCP protocol

The ClimbingPill MCP server makes your climbing expertise available everywhere! 🧗‍♀️ 