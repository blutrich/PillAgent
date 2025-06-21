import { dbHelpers } from './src/mastra/lib/supabase';

async function checkUserPrograms() {
  const userId = '7d9854c4-a8e6-4f95-a9c8-446d2324c78a';
  console.log('🔍 Checking programs for user:', userId);
  
  try {
    const programs = await dbHelpers.getUserPrograms(userId);
    console.log('📊 Programs found:', programs?.length || 0);
    
    if (programs && programs.length > 0) {
      const latest = programs[0];
      console.log('✅ Latest program:');
      console.log('  - Name:', latest.program_name);
      console.log('  - Status:', latest.status);
      console.log('  - Target Grade:', latest.target_grade);
      console.log('  - Focus Areas:', latest.focus_areas);
      console.log('  - Has Program Data:', !!latest.program_data);
      console.log('  - Created:', latest.created_at);
      
      if (latest.program_data) {
        console.log('  - Program Data Type:', typeof latest.program_data);
        if (typeof latest.program_data === 'object') {
          console.log('  - Weeks in Program:', latest.program_data.weeks?.length || 'Unknown');
        }
      }
    } else {
      console.log('📭 No programs found for this user');
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkUserPrograms(); 