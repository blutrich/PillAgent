# Supabase Memory Implementation Guide

## Overview

This guide documents the implementation of Supabase PostgreSQL memory storage for the ClimbingPill agent, following Mastra best practices and providing production-ready memory capabilities.

## Architecture

### Memory Stack
- **Storage Backend**: Supabase PostgreSQL with pgvector extension
- **Vector Search**: Enabled with OpenAI text-embedding-3-small
- **Working Memory**: ClimbingPill-specific user profile template
- **Semantic Recall**: Resource scope for cross-conversation memory
- **Fallback**: Automatic LibSQL fallback when credentials unavailable

### Database Schema

The implementation creates the following tables in your Supabase database:

```sql
-- Core memory tables
mastra_threads          -- Conversation threads
mastra_messages         -- Individual messages
mastra_embeddings       -- Vector embeddings for semantic search
mastra_working_memory   -- Persistent user information

-- Features
- UUID primary keys
- Row Level Security (RLS) for user isolation
- Vector similarity search indexes
- Automatic timestamps and triggers
```

## Configuration

### Environment Variables

Set these environment variables for production:

```bash
# Supabase Database Connection
SUPABASE_DB_PASSWORD=your_database_password
SUPABASE_SERVICE_KEY=your_service_role_key

# OpenAI for Embeddings (required for semantic recall)
OPENAI_API_KEY=your_openai_api_key
```

### Memory Features

The implementation includes all Mastra memory features:

#### 1. Conversation History
- **Last Messages**: 15 most recent messages included in context
- **Persistence**: Messages survive app restarts and deployments
- **Thread Organization**: Conversations organized by `threadId` and `resourceId`

#### 2. Semantic Recall (RAG)
- **Vector Search**: pgvector with cosine similarity
- **Embeddings**: OpenAI text-embedding-3-small (1536 dimensions)
- **Scope**: Resource-level search across all user conversations
- **Context**: 2 messages before/after each relevant match
- **Top-K**: 3 most relevant messages retrieved

#### 3. Working Memory
- **Template**: ClimbingPill-specific user profile
- **Persistence**: Survives across conversations and sessions
- **Auto-Update**: Agent automatically maintains user information

#### 4. Thread Management
- **Auto-Titles**: Conversation titles generated from first message
- **Metadata**: Rich metadata support for categorization
- **User Isolation**: RLS ensures users only see their own data

## Usage Examples

### Basic Agent Setup

```typescript
import { climbingAgent } from './src/mastra/agents/climbing-agent';

// Agent automatically uses Supabase memory when credentials available
const response = await climbingAgent.stream(
  "Hi, I'm Alice from Berlin. I want to train for V8 climbing.",
  {
    threadId: "conversation-123",
    resourceId: "user-alice-456"
  }
);
```

### Memory Configuration

```typescript
import { createSupabaseMemory } from './src/mastra/lib/supabase-memory';

// Full-featured Supabase memory
const memory = createSupabaseMemory();

// Simple version without vector search
const simpleMemory = createSupabaseMemorySimple();

// Optimal configuration (auto-selects best available)
const optimalMemory = createOptimalMemory();
```

### Working Memory Template

The ClimbingPill working memory template captures:

```markdown
# ClimbingPill User Profile

## Personal Info
- Name: [Auto-filled from conversation]
- Location: [Auto-filled from conversation]
- Timezone: [Auto-filled from conversation]

## Climbing Profile
- Current Grade: [Auto-filled from conversation]
- Target Grade: [Auto-filled from conversation]
- Experience (years): [Auto-filled from conversation]
- Climbing Style: [boulder/lead/both]

## Training Preferences
- Available Days: [Auto-filled from conversation]
- Session Length: [Auto-filled from conversation]
- Equipment Access: [Auto-filled from conversation]
- Primary Goals: [Auto-filled from conversation]

## Progress Tracking
- Last Assessment Date: [Auto-filled from conversation]
- Current Program: [Auto-filled from conversation]
- Recent Achievements: [Auto-filled from conversation]
- Areas of Focus: [Auto-filled from conversation]

## Session Context
- Last Topic Discussed: [Auto-filled from conversation]
- Current Training Phase: [Auto-filled from conversation]
- Upcoming Goals: [Auto-filled from conversation]
```

## Testing

### Comprehensive Test Suite

Run the complete test suite:

```bash
npx tsx test-supabase-memory-complete.ts
```

This tests:
- ✅ Configuration verification
- ✅ Memory initialization
- ✅ Thread creation and retrieval
- ✅ Agent integration
- ✅ Working memory functionality
- ✅ Cross-conversation memory (resource scope)
- ✅ Fallback behavior

### Quick Test

Run the basic fallback test:

```bash
npx tsx test-memory-fallback.ts
```

## Production Deployment

### Mastra Cloud Environment Variables

When deploying to Mastra Cloud, use alphanumeric variable names:

```bash
# In Mastra Cloud dashboard
SUPABASEDBPASSWORD=your_database_password
SUPABASESERVICEKEY=your_service_role_key
OPENAIKEY=your_openai_api_key
```

### Deployment Checklist

- [ ] Supabase database tables created (via migration)
- [ ] Environment variables set in production
- [ ] OpenAI API key configured for embeddings
- [ ] Test memory functionality in staging
- [ ] Monitor memory performance after deployment

## Performance Considerations

### Scalability
- **PostgreSQL**: Unlimited scalability vs LibSQL file limits
- **Vector Search**: Optimized with ivfflat indexes
- **Connection Pooling**: Supabase handles connection management
- **RLS**: Efficient user isolation without performance impact

### Cost Optimization
- **Supabase**: Free tier covers development and small production
- **OpenAI Embeddings**: ~$0.0001 per 1K tokens (very affordable)
- **Vector Storage**: Minimal storage cost for embeddings

### Monitoring
- Monitor Supabase dashboard for:
  - Database usage and performance
  - Connection counts
  - Query performance
- Monitor OpenAI usage for embedding costs

## Troubleshooting

### Common Issues

#### 1. Missing Credentials
```
Error: Missing Supabase credentials for memory storage
```
**Solution**: Set `SUPABASE_DB_PASSWORD` and `SUPABASE_SERVICE_KEY` environment variables

#### 2. Vector Extension Missing
```
Error: extension "vector" is not available
```
**Solution**: Enable pgvector extension in Supabase dashboard

#### 3. OpenAI API Key Missing
```
Error: OpenAI API key not found
```
**Solution**: Set `OPENAI_API_KEY` environment variable for embeddings

#### 4. Connection Issues
```
Error: Connection to PostgreSQL failed
```
**Solution**: Check Supabase project status and credentials

### Fallback Behavior

The system automatically falls back to LibSQL when:
- Supabase credentials are missing
- Supabase connection fails
- PostgreSQL is unavailable

Fallback provides:
- ✅ Basic conversation history
- ✅ Working memory
- ❌ Vector search (disabled)
- ❌ Cross-conversation memory

## Migration from LibSQL

### Automatic Migration
The system handles migration automatically:
1. Detects Supabase credentials
2. Switches to PostgreSQL backend
3. Maintains all existing functionality
4. Adds new capabilities (vector search, cross-conversation memory)

### Data Migration
To migrate existing LibSQL data:
1. Export conversations from LibSQL
2. Import into Supabase using Mastra memory API
3. Verify data integrity
4. Switch to Supabase configuration

## Security

### Row Level Security (RLS)
- **User Isolation**: Users can only access their own data
- **Resource Scoping**: Data filtered by `resourceId`
- **Service Role**: Full access for system operations
- **Authenticated Role**: User-scoped access

### Best Practices
- Use unique `resourceId` per user (e.g., `user-${userId}`)
- Use meaningful `threadId` for conversation organization
- Regularly rotate service keys
- Monitor access patterns in Supabase dashboard

## Future Enhancements

### Potential Improvements
- **Memory Processors**: Add token limiting and content filtering
- **Custom Embeddings**: Switch to domain-specific embedding models
- **Advanced RAG**: Implement hybrid search (vector + keyword)
- **Analytics**: Add conversation analytics and insights
- **Backup**: Implement automated backup strategies

### Integration Opportunities
- **Supabase Auth**: Integrate with existing user authentication
- **Real-time**: Add real-time conversation updates
- **Edge Functions**: Process embeddings at the edge
- **Storage**: Store conversation attachments in Supabase Storage

## Support

### Resources
- [Mastra Memory Documentation](https://mastra.ai/docs/memory/overview)
- [Supabase PostgreSQL Guide](https://supabase.com/docs/guides/database)
- [pgvector Documentation](https://github.com/pgvector/pgvector)

### Getting Help
1. Check this guide for common solutions
2. Run test suite to identify specific issues
3. Check Supabase dashboard for database status
4. Review Mastra documentation for memory configuration
5. Contact support with specific error messages and logs

---

**Implementation Status**: ✅ Complete and Production-Ready
**Last Updated**: January 2025
**Version**: 1.0.0 