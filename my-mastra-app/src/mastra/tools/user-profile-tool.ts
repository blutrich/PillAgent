import { createTool } from '@mastra/core';
import { z } from 'zod';
import { dbHelpers } from '../lib/supabase';

// Get user profile information tool
export const getUserProfileTool = createTool({
  id: 'get_user_profile',
  description: 'Get the user\'s profile information including personal details, climbing experience, goals, and preferences.',
  inputSchema: z.object({
    userId: z.string().optional().describe('User ID (automatically provided by agent)')
  }),
  execute: async ({ context, resourceId }) => {
    try {
      // Use resourceId from the tool execution context (this is the user ID from the API call)
      const userId = resourceId || 'anonymous';
      
      console.log(`Getting user profile for user: ${userId}`);
      
      // Get user profile from database
      const profile = await dbHelpers.getUserProfile(userId);
      
      if (!profile) {
        return {
          success: false,
          message: 'No user profile found. The user may need to complete onboarding first.',
          profile: null
        };
      }
      
      // Format profile data for the agent
      const formattedProfile = {
        name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim(),
        email: profile.email,
        physical_stats: {
          height_cm: profile.height_cm,
          weight_kg: profile.weight_kg
        },
        climbing_experience: {
          years: profile.climbing_experience_years,
          style: profile.climbing_style,
          primary_goals: profile.primary_goals || []
        },
        training_preferences: {
          available_days_per_week: profile.available_days,
          session_length_minutes: profile.session_length_minutes,
          equipment_access: profile.equipment_access || []
        },
        subscription: {
          tier: profile.subscription_tier || 'free'
        },
        onboarding: {
          completed: profile.onboarding_completed || false,
          current_step: profile.onboarding_step || 0
        },
        account_created: profile.created_at
      };
      
      console.log(`Found user profile for ${formattedProfile.name} (${userId})`);
      
      return {
        success: true,
        message: `Found profile for ${formattedProfile.name}`,
        profile: formattedProfile
      };
      
    } catch (error) {
      console.error('Get user profile failed:', error);
      return {
        success: false,
        message: 'Failed to retrieve user profile. Please try again.',
        error: error instanceof Error ? error.message : 'Unknown error',
        profile: null
      };
    }
  }
});

// Update user profile information tool
export const updateUserProfileTool = createTool({
  id: 'update_user_profile',
  description: 'Update the user\'s profile information such as goals, preferences, or personal details.',
  inputSchema: z.object({
    updates: z.object({
      first_name: z.string().optional(),
      last_name: z.string().optional(),
      height_cm: z.number().optional(),
      weight_kg: z.number().optional(),
      climbing_experience_years: z.number().optional(),
      climbing_style: z.enum(['boulder', 'lead', 'both']).optional(),
      primary_goals: z.array(z.string()).optional(),
      equipment_access: z.array(z.string()).optional(),
      available_days: z.number().optional(),
      session_length_minutes: z.number().optional()
    }).describe('Profile fields to update'),
    userId: z.string().optional().describe('User ID (automatically provided by agent)')
  }),
  execute: async ({ context, resourceId }) => {
    const { updates } = context;
    
    try {
      // Use resourceId from the tool execution context (this is the user ID from the API call)
      const userId = resourceId || 'anonymous';
      
      console.log(`Updating user profile for user: ${userId}`, updates);
      
      // Update user profile in database
      const updatedProfile = await dbHelpers.updateUserProfile(userId, updates);
      
      if (!updatedProfile) {
        return {
          success: false,
          message: 'Failed to update profile. User profile may not exist yet.',
          profile: null
        };
      }
      
      console.log(`Successfully updated profile for user ${userId}`);
      
      return {
        success: true,
        message: 'Profile updated successfully!',
        profile: updatedProfile
      };
      
    } catch (error) {
      console.error('Update user profile failed:', error);
      return {
        success: false,
        message: 'Failed to update user profile. Please try again.',
        error: error instanceof Error ? error.message : 'Unknown error',
        profile: null
      };
    }
  }
}); 