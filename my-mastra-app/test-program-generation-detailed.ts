import { climbingAgent } from './src/mastra/agents/climbing-agent';

/**
 * Detailed Program Generation Test
 * 
 * This test specifically checks:
 * 1. Program generation tool quality
 * 2. AI response parsing
 * 3. Fallback vs AI-generated content
 * 4. Program detail and variety
 */

async function testProgramGenerationQuality() {
  console.log('🧪 Testing ClimbingPill Program Generation Quality...\n');
  
  try {
    const threadId = 'test-program-quality-' + Date.now();
    const resourceId = 'test-climber-detailed-' + Date.now();
    
    // Test 1: Generate program with realistic user data
    console.log('📋 Test 1: Generating program with realistic assessment data...');
    
    const assessmentData = {
      userId: resourceId,
      bodyWeight: 70,
      height: 175,
      addedWeight: 30,
      pullUpsMax: 18,
      pushUpsMax: 25,
      toeToBarMax: 15,
      legSpread: 150,
      currentGrade: "V7",
      targetGrade: "V9",
      eightyPercentGrade: "V7",
      assessmentType: "complete",
      climberName: "Advanced Test Climber",
      compositeScore: 0.85,
      predictedGrade: "V8"
    };

    console.log('Assessment data:', JSON.stringify(assessmentData, null, 2));

    const programResponse = await climbingAgent.generate(
      `Please generate a comprehensive ClimbingPill training program using the programGeneration tool with this advanced climber data: ${JSON.stringify(assessmentData)}. 

Make sure to:
1. Use the 'optimized' program type for maximum detail
2. Include specific climbing grades for each session
3. Add variety in training types (fingerboard, projects, flash, technical)
4. Include detailed exercise progressions
5. Make it engaging and motivating, not boring

Focus on creating an exciting, challenging program that will help this V7 climber reach V9.`,
      {
        threadId,
        resourceId
      }
    );

    const fullResponse = programResponse.text || '';
    console.log(fullResponse);

    console.log('\n\n✅ Program generation completed');
    console.log('📊 Response length:', fullResponse.length);
    
    // Test 2: Analyze response quality
    console.log('\n📋 Test 2: Analyzing response quality...');
    
    // Check for variety indicators
    const varietyChecks = {
      hasFingerboard: fullResponse.toLowerCase().includes('fingerboard'),
      hasProjects: fullResponse.toLowerCase().includes('project'),
      hasFlash: fullResponse.toLowerCase().includes('flash'),
      hasTechnical: fullResponse.toLowerCase().includes('technical'),
      hasGrades: /V\d+/.test(fullResponse),
      hasSpecificSets: /\d+\s*sets?/i.test(fullResponse),
      hasRestPeriods: /rest/i.test(fullResponse),
      hasProgression: /progression|increase|advance/i.test(fullResponse),
      hasWeekStructure: /week\s*\d+/i.test(fullResponse),
      hasRPE: /rpe/i.test(fullResponse)
    };

    console.log('🔍 Variety Analysis:');
    Object.entries(varietyChecks).forEach(([check, passed]) => {
      console.log(`  ${passed ? '✅' : '❌'} ${check}: ${passed}`);
    });

    // Test 3: Check for specific issues that make programs "dull"
    console.log('\n📋 Test 3: Checking for "dull" program indicators...');
    
    const dullnessChecks = {
      tooGeneric: /general|basic|simple|standard/gi.test(fullResponse),
      lackOfSpecificity: !/V\d+.*V\d+.*V\d+/.test(fullResponse), // Less than 3 specific grades
      noPersonalization: !fullResponse.includes('V7') && !fullResponse.includes('V9'),
      repetitiveLanguage: (fullResponse.match(/training|session|exercise/gi) || []).length > 20,
      noMotivation: !/challenge|progress|improve|achieve|goal/i.test(fullResponse),
      lackOfDetail: fullResponse.length < 1000,
      noVariety: Object.values(varietyChecks).filter(Boolean).length < 6
    };

    console.log('🚨 Dullness Analysis:');
    Object.entries(dullnessChecks).forEach(([check, isDull]) => {
      console.log(`  ${isDull ? '🔴' : '🟢'} ${check}: ${isDull ? 'ISSUE DETECTED' : 'Good'}`);
    });

    // Test 4: Extract and display program structure
    console.log('\n📋 Test 4: Extracting program structure...');
    
    const weekMatches = fullResponse.match(/WEEK\s+\d+[^\n]*/gi) || [];
    const dayMatches = fullResponse.match(/(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)/gi) || [];
    const exerciseTypes = fullResponse.match(/(Fingerboard|Projects?|Flash|Technical|Warm-up|Main Session)/gi) || [];

    console.log(`📅 Weeks found: ${weekMatches.length}`);
    weekMatches.forEach(week => console.log(`  - ${week}`));
    
    console.log(`📆 Days found: ${dayMatches.length}`);
    console.log(`🏋️ Exercise types: ${[...new Set(exerciseTypes)].join(', ')}`);

    // Test 5: Generate a second program to compare consistency
    console.log('\n📋 Test 5: Testing consistency with second generation...');
    
    const secondResponse = await climbingAgent.generate(
      `Generate another ClimbingPill program for the same climber, but focus on making it more exciting and varied. Use creative exercise names and motivational language.`,
      {
        threadId: threadId + '-second',
        resourceId
      }
    );

    const secondFullResponse = secondResponse.text || '';

    console.log('📊 Second response length:', secondFullResponse.length);
    console.log('🔄 Similarity check:', 
      fullResponse.substring(0, 200) === secondFullResponse.substring(0, 200) ? 
      'TOO SIMILAR (potential issue)' : 'Appropriately different'
    );

    // Final assessment
    console.log('\n🎯 FINAL ASSESSMENT:');
    
    const qualityScore = Object.values(varietyChecks).filter(Boolean).length;
    const dullnessScore = Object.values(dullnessChecks).filter(Boolean).length;
    
    console.log(`✨ Quality Score: ${qualityScore}/10 variety indicators`);
    console.log(`🚨 Dullness Score: ${dullnessScore}/7 issues detected`);
    
    if (qualityScore >= 7 && dullnessScore <= 2) {
      console.log('🎉 RESULT: Program quality is GOOD');
    } else if (qualityScore >= 5 && dullnessScore <= 4) {
      console.log('⚠️ RESULT: Program quality is MODERATE - some improvements needed');
    } else {
      console.log('🔴 RESULT: Program quality is POOR - significant improvements needed');
      
      console.log('\n🔧 RECOMMENDATIONS:');
      if (dullnessChecks.lackOfSpecificity) {
        console.log('- Add more specific V-grades for different exercise types');
      }
      if (dullnessChecks.noPersonalization) {
        console.log('- Include user\'s current and target grades in exercises');
      }
      if (dullnessChecks.noVariety) {
        console.log('- Add more diverse exercise types and training methods');
      }
      if (dullnessChecks.lackOfDetail) {
        console.log('- Increase detail level in exercise descriptions');
      }
      if (dullnessChecks.noMotivation) {
        console.log('- Add motivational language and goal-oriented descriptions');
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Error details:', error);
  }
}

// Run the test
testProgramGenerationQuality(); 