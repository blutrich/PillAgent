import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

const TAVILY_API_URL = 'https://api.tavily.com/search';

// Tavily API types based on the official API reference
interface TavilySearchRequest {
  query: string;
  topic?: 'general' | 'news';
  search_depth?: 'basic' | 'advanced';
  chunks_per_source?: number;
  max_results?: number;
  time_range?: 'day' | 'week' | 'month' | 'year' | 'd' | 'w' | 'm' | 'y';
  days?: number;
  include_answer?: boolean;
  include_raw_content?: boolean | 'markdown' | 'text';
  include_images?: boolean;
  include_image_descriptions?: boolean;
  include_domains?: string[];
  exclude_domains?: string[];
  country?: string;
}

interface TavilySearchResponse {
  query: string;
  answer?: string;
  images?: Array<{
    url: string;
    description?: string;
  }>;
  results: Array<{
    title: string;
    url: string;
    content: string;
    score: number;
    raw_content?: string;
  }>;
  response_time: string;
}

async function executeTavilySearch(params: TavilySearchRequest): Promise<TavilySearchResponse> {
  const tavilyApiKey = process.env.TAVILY_API_KEY;
  
  if (!tavilyApiKey) {
    throw new Error('TAVILY_API_KEY environment variable is required');
  }

  try {
    const response = await fetch(TAVILY_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tavilyApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Tavily API error (${response.status}): ${errorText}`);
    }

    const data: TavilySearchResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Tavily search error:', error);
    throw new Error(`Failed to search Tavily: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export const tavilySearchTool = createTool({
  id: 'tavily_search',
  description: `Search the web using Tavily AI for real-time information and answers. Use this tool to find current information about climbing techniques, gear reviews, weather conditions, climbing locations, or any topic not in your knowledge base. Particularly useful for finding recent climbing news, route conditions, gear recommendations, or answering questions that require up-to-date information.`,
  inputSchema: z.object({
    query: z.string().describe('The search query to execute'),
    topic: z.enum(['general', 'news']).optional().default('general').describe('Search category - use "news" for current events, sports, politics; "general" for broader searches'),
    search_depth: z.enum(['basic', 'advanced']).optional().default('basic').describe('Search depth - "advanced" provides more relevant content but costs more (2 credits vs 1)'),
    chunks_per_source: z.number().min(1).max(3).optional().default(3).describe('Number of content chunks per source (only for advanced search)'),
    max_results: z.number().min(1).max(20).optional().default(5).describe('Maximum number of search results to return'),
    days: z.number().min(1).optional().default(7).describe('Number of days back for news searches'),
    include_answer: z.boolean().optional().default(true).describe('Include an AI-generated answer to the query'),
    include_raw_content: z.boolean().optional().default(false).describe('Include cleaned HTML content from search results'),
    include_images: z.boolean().optional().default(false).describe('Include related images in the search results'),
    include_image_descriptions: z.boolean().optional().default(false).describe('Include descriptive text for images'),
    time_range: z.enum(['day', 'week', 'month', 'year', 'd', 'w', 'm', 'y']).optional().describe('Time range filter for results'),
    include_domains: z.array(z.string()).optional().describe('Specific domains to include in search'),
    exclude_domains: z.array(z.string()).optional().describe('Domains to exclude from search'),
    country: z.string().optional().describe('Boost results from specific country (for general searches)'),
  }),
  outputSchema: z.object({
    query: z.string(),
    answer: z.string().optional(),
    results: z.array(z.object({
      title: z.string(),
      url: z.string(),
      content: z.string(),
      score: z.number(),
    })),
    summary: z.string(),
    source_count: z.number(),
    response_time: z.string(),
  }),
  execute: async ({ context }) => {
    console.log('🔍 Executing Tavily search:', context.query);

    // Prepare the search request
    const searchParams: TavilySearchRequest = {
      query: context.query,
      topic: context.topic || 'general',
      search_depth: context.search_depth || 'basic',
      max_results: context.max_results || 5,
      include_answer: context.include_answer ?? true,
      include_raw_content: context.include_raw_content || false,
      include_images: context.include_images || false,
    };

    // Add optional parameters if provided
    if (context.chunks_per_source && context.search_depth === 'advanced') {
      searchParams.chunks_per_source = context.chunks_per_source;
    }
    if (context.days && context.topic === 'news') {
      searchParams.days = context.days;
    }
    if (context.include_image_descriptions && context.include_images) {
      searchParams.include_image_descriptions = context.include_image_descriptions;
    }
    if (context.time_range) {
      searchParams.time_range = context.time_range;
    }
    if (context.include_domains && context.include_domains.length > 0) {
      searchParams.include_domains = context.include_domains;
    }
    if (context.exclude_domains && context.exclude_domains.length > 0) {
      searchParams.exclude_domains = context.exclude_domains;
    }
    if (context.country && context.topic === 'general') {
      searchParams.country = context.country;
    }

    // Execute the search
    const searchResponse = await executeTavilySearch(searchParams);

    // Format the results
    const formattedResults = searchResponse.results.map(result => ({
      title: result.title,
      url: result.url,
      content: result.content,
      score: result.score,
    }));

    // Create a rich summary that the frontend can parse for clickable links
    let summary = `Found ${formattedResults.length} results for "${context.query}"`;
    
    if (searchResponse.answer) {
      summary += `\n\nAI Answer: ${searchResponse.answer}`;
    }

    if (formattedResults.length > 0) {
      summary += '\n\n**Key Sources:**';
      formattedResults.slice(0, 3).forEach((result, index) => {
        // Format each source with clear separation and clickable URL
        summary += `\n\n${index + 1}. **${result.title}**`;
        summary += `\n   🔗 **Link:** ${result.url}`;
        
        // Add a short content preview if available
        if (result.content && result.content.length > 50) {
          const preview = result.content.substring(0, 100) + '...';
          summary += `\n   📄 ${preview}`;
        }
      });
      
      // Add a note about more results being available
      if (formattedResults.length > 3) {
        summary += `\n\n📋 **View all ${formattedResults.length} results with clickable links in the sidebar →**`;
      }
    }

    console.log(`✅ Tavily search completed in ${searchResponse.response_time}s, found ${formattedResults.length} results`);

    // Include structured data for rich frontend rendering
    const structuredData = {
      query: searchResponse.query,
      answer: searchResponse.answer,
      results: formattedResults,
      source_count: formattedResults.length,
      response_time: searchResponse.response_time,
    };

    // Append structured data as JSON for frontend parsing
    const enhancedSummary = summary + `\n\n<!-- SEARCH_DATA: ${JSON.stringify(structuredData)} -->`;

    return {
      query: searchResponse.query,
      answer: searchResponse.answer,
      results: formattedResults,
      summary: enhancedSummary,
      source_count: formattedResults.length,
      response_time: searchResponse.response_time,
    };
  },
}); 