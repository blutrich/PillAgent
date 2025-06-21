import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

const TAVILY_API_URL = 'https://api.tavily.com/search';

// Tavily API types based on the API reference
interface TavilySearchRequest {
  query: string;
  topic?: 'general' | 'news';
  search_depth?: 'basic' | 'advanced';
  chunks_per_source?: number;
  max_results?: number;
  time_range?: 'day' | 'week' | 'month' | 'year' | 'd' | 'w' | 'm' | 'y';
  days?: number;
  include_answer?: boolean;
  include_raw_content?: boolean;
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
    max_results: z.number().min(1).max(20).optional().default(5).describe('Maximum number of search results to return'),
    include_answer: z.boolean().optional().default(true).describe('Include an AI-generated answer to the query'),
    include_raw_content: z.boolean().optional().default(false).describe('Include cleaned HTML content from search results'),
    include_images: z.boolean().optional().default(false).describe('Include related images in the search results'),
    time_range: z.enum(['day', 'week', 'month', 'year', 'd', 'w', 'm', 'y']).optional().describe('Time range filter for results'),
    include_domains: z.array(z.string()).optional().describe('Specific domains to include in search'),
    exclude_domains: z.array(z.string()).optional().describe('Domains to exclude from search'),
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
    if (context.time_range) {
      searchParams.time_range = context.time_range;
    }
    if (context.include_domains && context.include_domains.length > 0) {
      searchParams.include_domains = context.include_domains;
    }
    if (context.exclude_domains && context.exclude_domains.length > 0) {
      searchParams.exclude_domains = context.exclude_domains;
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

    // Create a summary of the search results
    let summary = `Found ${formattedResults.length} results for "${context.query}"`;
    
    if (searchResponse.answer) {
      summary += `\n\nAI Answer: ${searchResponse.answer}`;
    }

    if (formattedResults.length > 0) {
      summary += '\n\nTop sources:';
      formattedResults.slice(0, 3).forEach((result, index) => {
        summary += `\n${index + 1}. ${result.title} - ${result.url}`;
      });
    }

    console.log(`✅ Tavily search completed in ${searchResponse.response_time}s, found ${formattedResults.length} results`);

    return {
      query: searchResponse.query,
      answer: searchResponse.answer,
      results: formattedResults,
      summary,
      source_count: formattedResults.length,
      response_time: searchResponse.response_time,
    };
  },
}); 