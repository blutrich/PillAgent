import { z } from 'zod';
import { createTool } from '@mastra/core';
import { supabase, dbHelpers } from '../lib/supabase';

// Journal entry schema for validation
const JournalEntrySchema = z.object({
  content: z.string().min(1).describe('The journal entry content'),
  mood: z.enum(['excited', 'motivated', 'neutral', 'tired', 'frustrated', 'stressed', 'happy', 'anxious']).optional().describe('Current mood (optional)'),
  energy_level: z.number().min(1).max(10).optional().describe('Energy level from 1-10 (optional)'),
  tags: z.array(z.string()).optional().describe('Tags to categorize the entry (optional)'),
  climbing_related: z.boolean().optional().describe('Whether this entry is climbing-related (optional)'),
  userId: z.string().optional().describe('User ID (automatically provided by agent)')
});

const JournalQuerySchema = z.object({
  query: z.string().describe('What to search for in journal entries'),
  date_range: z.enum(['today', 'week', 'month', 'all']).optional().describe('Time range to search (optional)'),
  mood_filter: z.enum(['excited', 'motivated', 'neutral', 'tired', 'frustrated', 'stressed', 'happy', 'anxious']).optional().describe('Filter by mood (optional)'),
  tags_filter: z.array(z.string()).optional().describe('Filter by specific tags (optional)'),
  climbing_only: z.boolean().optional().describe('Only show climbing-related entries (optional)'),
  userId: z.string().optional().describe('User ID (automatically provided by agent)')
});

// Create journal entry tool
export const createJournalEntryTool = createTool({
  id: 'create_journal_entry',
  description: 'Save a journal entry with mood, energy level, and tags. All entries are permanently stored and can be queried later.',
  inputSchema: JournalEntrySchema,
  execute: async ({ context, resourceId }) => {
    const { content, mood, energy_level, tags, climbing_related } = context;
    
    try {
      // Use resourceId from the tool execution context (this is the user ID from the API call)
      const userId = resourceId || 'anonymous';
      
      console.log('🔍 Journal Tool Debug Info:');
      console.log('  - resourceId received:', resourceId);
      console.log('  - resourceId type:', typeof resourceId);
      console.log('  - userId being used:', userId);
      console.log('  - context keys:', Object.keys(context));
      
      // Validate that userId is a proper UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(userId)) {
        console.error('❌ Invalid UUID format for userId:', userId);
        return {
          success: false,
          message: "Failed to save journal entry. Please try again.",
          error: `Invalid user ID format: "${userId}". Expected UUID format.`
        };
      }
      
      console.log('Creating journal entry for user:', userId);
      
      // Create journal entry in Supabase
      const { data, error } = await supabase
        .from('journal_entries')
        .insert({
          user_id: userId,
          content,
          mood,
          energy_level,
          tags: tags || [],
          climbing_related: climbing_related || false,
          entry_date: new Date().toISOString(),
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating journal entry:', error);
        throw new Error(`Failed to save journal entry: ${error.message}`);
      }

      console.log(`Journal entry created for user ${userId}:`, data.id);

      return {
        success: true,
        message: 'Journal entry saved successfully! 📝',
        entry_id: data.id,
        saved_at: data.created_at,
        ui_notice: '{adding to journal}', // Visual notice for UI
        summary: {
          content_length: content.length,
          mood: mood || 'not specified',
          energy_level: energy_level || 'not specified',
          tags: tags || [],
          climbing_related: climbing_related || false
        }
      };

    } catch (error) {
      console.error('Journal entry creation failed:', error);
      return {
        success: false,
        message: 'Failed to save journal entry. Please try again.',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
});

// Query journal entries tool
export const queryJournalTool = createTool({
  id: 'query_journal',
  description: 'Search and retrieve journal entries based on content, date range, mood, tags, or climbing focus. All your journal data persists forever.',
  inputSchema: JournalQuerySchema,
  execute: async ({ context, resourceId }) => {
    const { query, date_range, mood_filter, tags_filter, climbing_only } = context;
    
    try {
      // Use resourceId from the tool execution context (this is the user ID from the API call)
      const userId = resourceId || 'anonymous';
      
      console.log('🔍 Journal Query Tool Debug Info:');
      console.log('  - resourceId received:', resourceId);
      console.log('  - resourceId type:', typeof resourceId);
      console.log('  - userId being used:', userId);
      console.log('  - query:', query);
      console.log('  - date_range:', date_range);
      
      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (userId !== 'anonymous' && !uuidRegex.test(userId)) {
        console.error('❌ Invalid UUID format for userId:', userId);
        return {
          success: false,
          message: 'Invalid user ID format. Please try refreshing the page.',
          error: `Invalid UUID format: ${userId}`,
          entries: [],
          total_count: 0
        };
      }
      
      // Build the query
      let supabaseQuery = supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      // Apply date range filter
      if (date_range && date_range !== 'all') {
        const now = new Date();
        let startDate: Date;
        
        switch (date_range) {
          case 'today':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            break;
          case 'week':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
          default:
            startDate = new Date(0); // All time
        }
        
        supabaseQuery = supabaseQuery.gte('entry_date', startDate.toISOString());
      }

      // Apply mood filter
      if (mood_filter) {
        supabaseQuery = supabaseQuery.eq('mood', mood_filter);
      }

      // Apply climbing filter
      if (climbing_only) {
        supabaseQuery = supabaseQuery.eq('climbing_related', true);
      }

      // Apply tags filter
      if (tags_filter && tags_filter.length > 0) {
        supabaseQuery = supabaseQuery.overlaps('tags', tags_filter);
      }

      // Execute query
      const { data: entries, error } = await supabaseQuery;

      if (error) {
        console.error('Error querying journal entries:', error);
        throw new Error(`Failed to query journal entries: ${error.message}`);
      }

      if (!entries || entries.length === 0) {
        return {
          success: true,
          message: 'No journal entries found matching your criteria.',
          entries: [],
          total_count: 0,
          search_criteria: {
            query,
            date_range: date_range || 'all',
            mood_filter,
            tags_filter,
            climbing_only
          }
        };
      }

      // Filter by content query if provided
      let filteredEntries = entries;
      if (query && query.trim() && query.toLowerCase() !== 'all entries' && query.toLowerCase() !== 'all') {
        const searchTerm = query.toLowerCase();
        filteredEntries = entries.filter(entry => 
          entry.content.toLowerCase().includes(searchTerm) ||
          (entry.tags && entry.tags.some((tag: string) => tag.toLowerCase().includes(searchTerm)))
        );
      }

      // Format entries for response
      const formattedEntries = filteredEntries.map(entry => ({
        id: entry.id,
        date: new Date(entry.entry_date).toLocaleDateString(),
        time: new Date(entry.entry_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        datetime: new Date(entry.entry_date).toLocaleString(),
        relative_time: getRelativeTime(new Date(entry.entry_date)),
        content: entry.content,
        mood: entry.mood,
        energy_level: entry.energy_level,
        tags: entry.tags || [],
        climbing_related: entry.climbing_related,
        created_at: entry.created_at
      }));

      // Generate insights
      const insights = generateJournalInsights(filteredEntries);

      console.log(`Found ${filteredEntries.length} journal entries for user ${userId}`);

      return {
        success: true,
        message: `Found ${filteredEntries.length} journal entries matching your search.`,
        entries: formattedEntries,
        total_count: filteredEntries.length,
        insights,
        search_criteria: {
          query,
          date_range: date_range || 'all',
          mood_filter,
          tags_filter,
          climbing_only
        }
      };

    } catch (error) {
      console.error('Journal query failed:', error);
      return {
        success: false,
        message: 'Failed to search journal entries. Please try again.',
        error: error instanceof Error ? error.message : 'Unknown error',
        entries: [],
        total_count: 0
      };
    }
  }
});

// Get journal statistics tool
export const getJournalStatsTool = createTool({
  id: 'get_journal_stats',
  description: 'Get statistics and insights about your journal entries including mood patterns, energy trends, and climbing progress.',
  inputSchema: z.object({
    time_period: z.enum(['week', 'month', 'quarter', 'year', 'all']).optional().describe('Time period for statistics (optional)'),
    userId: z.string().optional().describe('User ID (automatically provided by agent)')
  }),
  execute: async ({ context, resourceId }) => {
    const { time_period = 'month' } = context;
    
    try {
      // Use resourceId from the tool execution context (this is the user ID from the API call)
      const userId = resourceId || 'anonymous';
      
      // Build date filter
      let startDate: Date;
      const now = new Date();
      
      switch (time_period) {
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'quarter':
          startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          startDate = new Date(0); // All time
      }

      // Get entries for the period
      const { data: entries, error } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', userId)
        .gte('entry_date', startDate.toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to get journal statistics: ${error.message}`);
      }

      if (!entries || entries.length === 0) {
        return {
          success: true,
          message: `No journal entries found for the ${time_period} period.`,
          stats: {
            total_entries: 0,
            time_period,
            date_range: `${startDate.toLocaleDateString()} - ${now.toLocaleDateString()}`
          }
        };
      }

      // Calculate comprehensive statistics
      const stats = calculateJournalStatistics(entries, time_period);

      console.log(`Generated journal statistics for user ${userId} (${time_period}):`, stats.total_entries, 'entries');

      return {
        success: true,
        message: `Here are your journal statistics for the ${time_period} period.`,
        stats
      };

    } catch (error) {
      console.error('Journal stats failed:', error);
      return {
        success: false,
        message: 'Failed to generate journal statistics. Please try again.',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
});

// Helper function to get relative time (e.g., "2 hours ago", "yesterday")
function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) === 1 ? '' : 's'} ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) === 1 ? '' : 's'} ago`;
  return `${Math.floor(diffDays / 365)} year${Math.floor(diffDays / 365) === 1 ? '' : 's'} ago`;
}

// Helper function to generate insights from journal entries
function generateJournalInsights(entries: any[]) {
  if (entries.length === 0) return null;

  const insights = {
    mood_distribution: {} as Record<string, number>,
    average_energy: 0,
    most_common_tags: [] as string[],
    climbing_percentage: 0,
    entry_frequency: 'Unknown',
    patterns: [] as string[]
  };

  // Mood distribution
  entries.forEach(entry => {
    if (entry.mood) {
      insights.mood_distribution[entry.mood] = (insights.mood_distribution[entry.mood] || 0) + 1;
    }
  });

  // Average energy level
  const energyEntries = entries.filter(e => e.energy_level);
  if (energyEntries.length > 0) {
    insights.average_energy = Math.round(
      energyEntries.reduce((sum, e) => sum + e.energy_level, 0) / energyEntries.length * 10
    ) / 10;
  }

  // Most common tags
  const allTags = entries.flatMap(e => e.tags || []);
  const tagCounts = allTags.reduce((acc, tag) => {
    acc[tag] = (acc[tag] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  insights.most_common_tags = Object.entries(tagCounts)
    .sort(([,a], [,b]) => (b as number) - (a as number))
    .slice(0, 5)
    .map(([tag]) => tag);

  // Climbing percentage
  const climbingEntries = entries.filter(e => e.climbing_related);
  insights.climbing_percentage = Math.round((climbingEntries.length / entries.length) * 100);

  // Generate pattern insights
  if (insights.average_energy > 7) {
    insights.patterns.push('High energy levels overall');
  }
  if (insights.climbing_percentage > 50) {
    insights.patterns.push('Strong focus on climbing');
  }
  if (insights.mood_distribution['motivated'] > insights.mood_distribution['tired']) {
    insights.patterns.push('More motivated than tired entries');
  }

  return insights;
}

// Helper function to calculate comprehensive statistics
function calculateJournalStatistics(entries: any[], timePeriod: string) {
  const stats = {
    total_entries: entries.length,
    time_period: timePeriod,
    date_range: `${new Date(entries[entries.length - 1]?.entry_date).toLocaleDateString()} - ${new Date(entries[0]?.entry_date).toLocaleDateString()}`,
    
    // Mood analysis
    mood_breakdown: {} as Record<string, number>,
    most_common_mood: 'Unknown',
    
    // Energy analysis
    average_energy: 0,
    energy_trend: 'Stable',
    
    // Content analysis
    total_words: 0,
    average_words_per_entry: 0,
    
    // Tags analysis
    unique_tags: 0,
    most_used_tags: [] as string[],
    
    // Climbing analysis
    climbing_entries: 0,
    climbing_percentage: 0,
    
    // Frequency analysis
    entries_per_week: 0,
    most_active_day: 'Unknown',
    
    // Trends
    trends: [] as string[]
  };

  // Mood breakdown
  entries.forEach(entry => {
    if (entry.mood) {
      stats.mood_breakdown[entry.mood] = (stats.mood_breakdown[entry.mood] || 0) + 1;
    }
  });

  // Most common mood
  if (Object.keys(stats.mood_breakdown).length > 0) {
    stats.most_common_mood = Object.entries(stats.mood_breakdown)
      .sort(([,a], [,b]) => b - a)[0][0];
  }

  // Energy analysis
  const energyEntries = entries.filter(e => e.energy_level);
  if (energyEntries.length > 0) {
    stats.average_energy = Math.round(
      energyEntries.reduce((sum, e) => sum + e.energy_level, 0) / energyEntries.length * 10
    ) / 10;
  }

  // Content analysis
  stats.total_words = entries.reduce((sum, entry) => sum + entry.content.split(' ').length, 0);
  stats.average_words_per_entry = Math.round(stats.total_words / entries.length);

  // Tags analysis
  const allTags = entries.flatMap(e => e.tags || []);
  const uniqueTagsSet = new Set(allTags);
  stats.unique_tags = uniqueTagsSet.size;
  
  const tagCounts = allTags.reduce((acc, tag) => {
    acc[tag] = (acc[tag] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  stats.most_used_tags = Object.entries(tagCounts)
    .sort(([,a], [,b]) => (b as number) - (a as number))
    .slice(0, 3)
    .map(([tag]) => tag);

  // Climbing analysis
  stats.climbing_entries = entries.filter(e => e.climbing_related).length;
  stats.climbing_percentage = Math.round((stats.climbing_entries / entries.length) * 100);

  // Frequency analysis
  const daysSinceFirst = Math.ceil(
    (new Date(entries[0].entry_date).getTime() - new Date(entries[entries.length - 1].entry_date).getTime()) 
    / (1000 * 60 * 60 * 24)
  );
  stats.entries_per_week = Math.round((entries.length / daysSinceFirst) * 7 * 10) / 10;

  // Generate trend insights
  if (stats.average_energy > 7) {
    stats.trends.push('High energy levels maintained');
  }
  if (stats.climbing_percentage > 60) {
    stats.trends.push('Strong climbing focus');
  }
  if (stats.entries_per_week > 3) {
    stats.trends.push('Consistent journaling habit');
  }
  if (stats.average_words_per_entry > 100) {
    stats.trends.push('Detailed, thoughtful entries');
  }

  return stats;
} 