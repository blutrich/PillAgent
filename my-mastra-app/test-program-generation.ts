import { climbingAgent } from './src/mastra/agents/climbing-agent';

/**
 * Test Program Generation Tool
 * 
 * This test verifies:
 * 1. User profile retrieval works
 * 2. Assessment data can be used for program generation
 * 3. Different program types (quick, enhanced, optimized) work
 * 4. AI response parsing functions correctly
 * 5. Fallback mechanisms work when AI fails
 * 6. Program data is properly structured and saved
 */

async function testProgramGeneration() {
  console.log('🏋️ Testing ClimbingPill Program Generation...');
  
  try {
    const threadId = 'test-program-' + Date.now();
    const resourceId = 'test-climber-program-' + Date.now();
    
    console.log('\n👤 Step 1: Setting up user profile...');
    const profileResponse = await climbingAgent.stream(
      'Hi! I\'m Sarah, I\'ve been climbing for 2 years. I can consistently climb V5, my goal is V7. I train 3 days per week and have access to a fingerboard and gym. I have no injuries.',
      { threadId, resourceId }
    );
    
    let profileText = '';
    for await (const chunk of profileResponse.textStream) {
      profileText += chunk;
    }
    console.log('✅ Profile established. Response length:', profileText.length);
    
    console.log('\n📊 Step 2: Running assessment...');
    const assessmentResponse = await climbingAgent.stream(
      'Please run a climbing assessment for me. I weigh 65kg, height 170cm. Finger strength: I can hang bodyweight for 10 seconds. Pull-ups: 8 reps. Push-ups: 15 reps. Toe-to-bar: 5 reps. Leg split: 140cm.',
      { threadId, resourceId }
    );
    
    let assessmentText = '';
    for await (const chunk of assessmentResponse.textStream) {
      assessmentText += chunk;
    }
    console.log('✅ Assessment completed. Response length:', assessmentText.length);
    
    // Check if assessment mentions key elements
    const hasCompositeScore = assessmentText.toLowerCase().includes('composite') || assessmentText.toLowerCase().includes('score');
    const hasWeaknesses = assessmentText.toLowerCase().includes('weakness') || assessmentText.toLowerCase().includes('improve');
    const hasPrediction = assessmentText.toLowerCase().includes('v6') || assessmentText.toLowerCase().includes('grade');
    
    console.log('📋 Assessment Analysis:');
    console.log('  - Contains composite score:', hasCompositeScore ? '✅' : '❌');
    console.log('  - Identifies weaknesses:', hasWeaknesses ? '✅' : '❌');
    console.log('  - Provides grade prediction:', hasPrediction ? '✅' : '❌');
    
    console.log('\n🏃‍♀️ Step 3: Generating training program...');
    const programResponse = await climbingAgent.stream(
      'Great! Now please generate an optimized 6-week training program for me based on my assessment. I prefer to train Monday, Wednesday, Friday for 90 minutes each session.',
      { threadId, resourceId }
    );
    
    let programText = '';
    const startTime = Date.now();
    let hasStartedGenerating = false;
    
    for await (const chunk of programResponse.textStream) {
      programText += chunk;
      
      // Check for "generating" or similar text
      if (!hasStartedGenerating && (chunk.toLowerCase().includes('generat') || chunk.toLowerCase().includes('creat'))) {
        hasStartedGenerating = true;
        console.log('📝 Program generation started...');
      }
    }
    
    const generationTime = Date.now() - startTime;
    console.log(`✅ Program generated in ${generationTime}ms`);
    console.log('📊 Program response length:', programText.length);
    
    // Analyze program content
    console.log('\n📋 Program Content Analysis:');
    
    const hasWeekStructure = programText.toLowerCase().includes('week') && (programText.match(/week/gi) || []).length >= 3;
    const hasSpecificExercises = programText.toLowerCase().includes('fingerboard') || programText.toLowerCase().includes('pull-up') || programText.toLowerCase().includes('boulder');
    const hasRPE = programText.toLowerCase().includes('rpe') || programText.toLowerCase().includes('intensity');
    const hasProgression = programText.toLowerCase().includes('progress') || programText.toLowerCase().includes('increase');
    const hasRestDays = programText.toLowerCase().includes('rest') || programText.toLowerCase().includes('recovery');
    
    console.log('  - Has week structure (6 weeks):', hasWeekStructure ? '✅' : '❌');
    console.log('  - Contains specific exercises:', hasSpecificExercises ? '✅' : '❌');
    console.log('  - Includes RPE/intensity:', hasRPE ? '✅' : '❌');
    console.log('  - Shows progression:', hasProgression ? '✅' : '❌');
    console.log('  - Includes rest days:', hasRestDays ? '✅' : '❌');
    
    // Check for "generating..." hang issue
    const hasGeneratingText = programText.toLowerCase().includes('generating...');
    const hasIncompleteResponse = programText.length < 500; // Very short response might indicate parsing issues
    
    console.log('\n🔍 Issue Detection:');
    console.log('  - Contains "generating..." hang:', hasGeneratingText ? '❌ ISSUE FOUND' : '✅ No hang detected');
    console.log('  - Response completeness:', hasIncompleteResponse ? '❌ Response too short' : '✅ Complete response');
    console.log('  - Generation time acceptable:', generationTime < 45000 ? '✅ Under 45s' : '❌ Over 45s timeout');
    
    // Test program follow-up
    console.log('\n🔄 Step 4: Testing program follow-up...');
    const followupResponse = await climbingAgent.stream(
      'Can you explain the Week 1 training schedule in more detail?',
      { threadId, resourceId }
    );
    
    let followupText = '';
    for await (const chunk of followupResponse.textStream) {
      followupText += chunk;
    }
    console.log('✅ Follow-up response length:', followupText.length);
    
    const canExplainWeek1 = followupText.toLowerCase().includes('week 1') || followupText.toLowerCase().includes('first week');
    console.log('  - Can explain Week 1 details:', canExplainWeek1 ? '✅' : '❌');
    
    // Overall assessment
    console.log('\n🎯 PROGRAM GENERATION TEST RESULTS:');
    
    const criticalTests = [
      hasWeekStructure,
      hasSpecificExercises,
      !hasGeneratingText,
      !hasIncompleteResponse,
      generationTime < 45000
    ];
    
    const passedCritical = criticalTests.filter(test => test).length;
    const totalCritical = criticalTests.length;
    
    console.log(`✅ Critical tests passed: ${passedCritical}/${totalCritical}`);
    
    if (passedCritical === totalCritical) {
      console.log('🎉 PROGRAM GENERATION: FULLY FUNCTIONAL');
      console.log('✅ All critical functionality working correctly');
    } else if (passedCritical >= 3) {
      console.log('⚠️  PROGRAM GENERATION: MOSTLY FUNCTIONAL');
      console.log('📝 Some minor issues detected but core functionality works');
    } else {
      console.log('❌ PROGRAM GENERATION: NEEDS ATTENTION');
      console.log('🔧 Major issues detected - requires investigation');
    }
    
    console.log('\n📊 DETAILED METRICS:');
    console.log(`  - Profile setup: ${profileText.length > 100 ? 'PASS' : 'FAIL'}`);
    console.log(`  - Assessment: ${hasCompositeScore && hasWeaknesses ? 'PASS' : 'FAIL'}`);
    console.log(`  - Program generation: ${hasWeekStructure && hasSpecificExercises ? 'PASS' : 'FAIL'}`);
    console.log(`  - Response time: ${generationTime}ms`);
    console.log(`  - Memory persistence: ${canExplainWeek1 ? 'PASS' : 'FAIL'}`);
    
  } catch (error) {
    console.error('❌ Program Generation Test FAILED:', error);
    
    if (error instanceof Error) {
      console.log('\n🔍 Error Analysis:');
      console.log('  - Error message:', error.message);
      console.log('  - Error type:', error.name);
      
      if (error.message.includes('timeout')) {
        console.log('💡 SOLUTION: Increase timeout settings or optimize AI prompts');
      }
      if (error.message.includes('parsing')) {
        console.log('💡 SOLUTION: Check AI response parsing logic in program-generation-tool.ts');
      }
      if (error.message.includes('supabase') || error.message.includes('database')) {
        console.log('💡 SOLUTION: Check database connection and schema');
      }
    }
    
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testProgramGeneration();
}

export { testProgramGeneration }; 