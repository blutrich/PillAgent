# Tavily Search Tool Integration

## Overview

The Tavily Search tool has been successfully integrated into the ClimbingPill application to provide real-time web search capabilities. This enables the climbing coach to access current information about climbing techniques, gear reviews, weather conditions, route conditions, and other climbing-related topics not available in the knowledge base.

## Implementation Details

### 1. Tool Location
- **File**: `src/mastra/tools/tavily-search-tool.ts`
- **Export**: `tavilySearchTool`

### 2. Integration Points
- **Agent**: Added to `climbingAgent` in `src/mastra/agents/climbing-agent.ts`
- **Tool Key**: `tavilySearch`

### 3. Environment Configuration
- **Required**: `TAVILY_API_KEY` environment variable
- **Setup**: Added to `ENVIRONMENT_SETUP.md`

## Features

### Search Capabilities
- **General Search**: Broad climbing-related queries
- **News Search**: Current events, competitions, and recent developments
- **Advanced Search**: More relevant content (costs 2 credits vs 1 for basic)
- **Domain Filtering**: Include/exclude specific domains
- **Time Filtering**: Filter results by recency
- **AI Answers**: Get AI-generated summaries of search results

### Tool Parameters
```typescript
{
  query: string;                    // Search query
  topic?: 'general' | 'news';       // Search category
  search_depth?: 'basic' | 'advanced'; // Search quality/cost
  max_results?: number;             // Number of results (1-20)
  include_answer?: boolean;         // Include AI answer
  include_raw_content?: boolean;    // Include HTML content
  include_images?: boolean;         // Include related images
  time_range?: string;              // Time filter
  include_domains?: string[];       // Specific domains to include
  exclude_domains?: string[];       // Domains to exclude
}
```

## Agent Usage Guidelines

The climbing agent will automatically use the Tavily search tool for:

### 1. Weather & Conditions
- "weather at Joshua Tree today"
- "current conditions at Red Rocks"
- "climbing weather forecast [location]"

### 2. Gear & Equipment
- "best crash pads 2024"
- "climbing shoes review"
- "new gear releases"

### 3. Route Information
- "route beta for [specific climb]"
- "current route conditions [area]"
- "new routes at [climbing area]"

### 4. News & Events
- "latest climbing competitions"
- "climbing news today"
- "recent climbing accidents"

### 5. Technical Information
- "latest training research"
- "new climbing techniques"
- "climbing injury prevention studies"

## Search Strategy

### Domain Optimization
The tool is configured to prioritize trusted climbing sources:
- **mountainproject.com**: Route information and conditions
- **8a.nu**: Performance and training data
- **rockandice.com**: News and gear reviews
- **climbing.com**: General climbing content

### Search Quality
- **Basic Search**: Fast, cost-effective (1 credit)
- **Advanced Search**: Higher quality, more relevant (2 credits)
- **Smart Defaults**: Basic for most queries, advanced for complex research

### Response Format
```
🔍 I found current information about [topic]. Let me search for the latest details...

**Current Information:**
[AI-generated answer from Tavily]

**Key Sources:**
1. [Title] - [URL]
2. [Title] - [URL]

**Summary:**
[Analysis combining search results with climbing expertise]

[Coaching advice or next steps]
```

## Cost Considerations

### Tavily API Credits
- **Basic Search**: 1 credit per query
- **Advanced Search**: 2 credits per query
- **Recommended**: Use basic for most queries, advanced for research

### Optimization Tips
1. Use specific climbing terms in queries
2. Limit max_results to 3-5 for simple queries
3. Use domain filtering for targeted searches
4. Combine with existing knowledge when possible

## Testing & Validation

To test the Tavily search functionality:

1. **Set up API key**: Add `TAVILY_API_KEY` to your `.env` file
2. **Test query**: Ask the agent: "What are the best climbing shoes for 2024?"
3. **Verify response**: Should include real-time search results and AI summary

### Example Test Queries
```
- "weather at Joshua Tree this weekend"
- "latest climbing competition results"
- "new route development at Red Rocks"
- "climbing gear reviews 2024"
- "current conditions at Yosemite"
```

## Error Handling

The tool includes comprehensive error handling:
- **Missing API Key**: Clear error message with setup instructions
- **API Errors**: Detailed error messages with status codes
- **Network Issues**: Graceful fallback with error reporting
- **Rate Limiting**: Automatic detection and user-friendly messages

## Future Enhancements

### Potential Improvements
1. **Caching**: Cache frequent searches to reduce API costs
2. **User Preferences**: Personal domain preferences
3. **Location Awareness**: Auto-include location-based domains
4. **Search History**: Track popular queries for optimization
5. **Multi-language**: Support for international climbing communities

## Security & Privacy

### Data Handling
- No user data sent to Tavily beyond search queries
- Results are not stored permanently
- API key secured in environment variables
- No tracking or analytics sent to third parties

### Best Practices
- Keep API key secure and private
- Monitor usage to avoid unexpected costs
- Use domain filtering to ensure quality sources
- Combine with existing knowledge for context

## Support & Troubleshooting

### Common Issues

1. **"TAVILY_API_KEY environment variable is required"**
   - Solution: Add your Tavily API key to `.env` file

2. **"Tavily API error (401)"**
   - Solution: Check API key validity and account status

3. **"Failed to search Tavily: timeout"**
   - Solution: Check network connection and API status

4. **No relevant results**
   - Solution: Try broader search terms or different domains

For additional support, refer to:
- [Tavily API Documentation](https://docs.tavily.com/)
- [Mastra Tools Documentation](https://docs.mastra.ai/docs/tools-mcp/overview)
- ClimbingPill project documentation 