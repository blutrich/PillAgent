/**
 * Simple Program Generation Test
 * Tests the program generation tool directly without database dependencies
 */

import { programGenerationTool } from './src/mastra/tools/program-generation-tool';

async function testProgramGenerationSimple() {
  console.log('🧪 Testing ClimbingPill Program Generation Tool Directly...\n');
  
  try {
    // Test data for an advanced climber
    const testContext = {
      userId: 'test-climber-123',
      assessmentResults: {
        predictedGrade: 'V8',
        compositeScore: 0.85,
        weaknesses: ['Core Strength', 'Flexibility'],
        strongestArea: 'Finger Strength',
        weakestArea: 'Core Strength',
        fingerStrengthRatio: 1.4,
        pullUpRatio: 25.7,
        pushUpRatio: 35.7,
        toeToBarRatio: 21.4,
        flexibilityRatio: 0.86
      },
      programType: 'optimized' as const,
      userPreferences: {
        availableDays: [1, 3, 5], // Monday, Wednesday, Friday
        sessionLengthMinutes: 90,
        equipmentAccess: ['fingerboard', 'gym', 'home_setup'],
        primaryGoals: ['strength', 'technique', 'grade_progression'],
        climbingStyle: 'bouldering',
        injuryHistory: []
      },
      detailedContext: {
        current80PercentGrade: 'V7',
        currentLeadGrade: '5.12b',
        fingboardMaxWeight: 30,
        trainingHistory: 'Advanced climber with 5+ years experience',
        climberName: 'Test Climber'
      }
    };

    console.log('📋 Test Input Data:');
    console.log('- Current Grade: V7 (80% success)');
    console.log('- Target Grade: V8 (predicted)');
    console.log('- Fingerboard Max: +30kg');
    console.log('- Program Type: Optimized');
    console.log('- Available Days: 3 days/week');
    console.log('- Session Length: 90 minutes');
    console.log('- Weaknesses: Core Strength, Flexibility');
    console.log('- Equipment: Fingerboard, Gym, Home Setup\n');

    console.log('🚀 Generating program...\n');
    
    // Execute the program generation tool
    const result = await programGenerationTool.execute({ context: testContext });
    
    console.log('✅ Program generation completed!\n');
    
    // Analyze the result
    console.log('📊 PROGRAM ANALYSIS:');
    console.log(`Program ID: ${result.programId}`);
    console.log(`Personalization Score: ${result.personalizationScore}%`);
    console.log(`Confidence Level: ${result.confidence}`);
    console.log(`Requires Coach Review: ${result.requiresCoachReview ? 'Yes' : 'No'}`);
    console.log(`Number of Weeks: ${result.programData.weeks.length}`);
    
    // Check each week
    console.log('\n📅 WEEK BREAKDOWN:');
    result.programData.weeks.forEach((week, index) => {
      console.log(`Week ${week.weekNumber}: ${week.focus} (${week.days.length} training days)`);
      
      week.days.forEach(day => {
        console.log(`  ${day.day}: ${day.sessions.length} session(s)`);
        day.sessions.forEach((session, sessionIndex) => {
          console.log(`    ${sessionIndex + 1}. ${session.type} - ${session.intensity} (${session.duration}min)`);
          if (session.exercises.length > 0) {
            console.log(`       Exercises: ${session.exercises.slice(0, 2).join(', ')}${session.exercises.length > 2 ? '...' : ''}`);
          }
        });
      });
    });
    
    // Quality checks
    console.log('\n🔍 QUALITY ANALYSIS:');
    
    const totalDays = result.programData.weeks.reduce((total, week) => total + week.days.length, 0);
    const totalSessions = result.programData.weeks.reduce((total, week) => 
      total + week.days.reduce((dayTotal, day) => dayTotal + day.sessions.length, 0), 0);
    
    console.log(`Total Training Days: ${totalDays}`);
    console.log(`Total Sessions: ${totalSessions}`);
    console.log(`Average Sessions per Day: ${(totalSessions / totalDays).toFixed(1)}`);
    
    // Check for variety
    const allSessionTypes = result.programData.weeks.flatMap(week => 
      week.days.flatMap(day => 
        day.sessions.map(session => session.type)
      )
    );
    const uniqueSessionTypes = [...new Set(allSessionTypes)];
    
    console.log(`Session Type Variety: ${uniqueSessionTypes.length} unique types`);
    console.log(`Session Types: ${uniqueSessionTypes.join(', ')}`);
    
    // Check for specific climbing content
    const allExercises = result.programData.weeks.flatMap(week => 
      week.days.flatMap(day => 
        day.sessions.flatMap(session => session.exercises)
      )
    );
    
    const climbingTerms = ['fingerboard', 'project', 'flash', 'boulder', 'crimp', 'hang', 'campus', 'V4', 'V5', 'V6', 'V7', 'V8', 'V9'];
    const climbingContent = allExercises.filter(exercise => 
      climbingTerms.some(term => exercise.toLowerCase().includes(term.toLowerCase()))
    );
    
    console.log(`Climbing-Specific Content: ${climbingContent.length}/${allExercises.length} exercises`);
    
    // Check AI insights
    console.log('\n💡 AI INSIGHTS:');
    result.aiInsights.forEach((insight, index) => {
      console.log(`${index + 1}. ${insight}`);
    });
    
    // Assess quality
    console.log('\n🎯 QUALITY ASSESSMENT:');
    
    const qualityFactors = {
      hasVariety: uniqueSessionTypes.length >= 4,
      hasProgression: result.programData.weeks.length === 6,
      hasClimbingContent: climbingContent.length > totalSessions * 0.5,
      hasPersonalization: result.personalizationScore >= 80,
      hasInsights: result.aiInsights.length >= 3,
      appropriateVolume: totalDays >= 12 && totalDays <= 24
    };
    
    const qualityScore = Object.values(qualityFactors).filter(Boolean).length;
    
    Object.entries(qualityFactors).forEach(([factor, passed]) => {
      console.log(`${passed ? '✅' : '❌'} ${factor}: ${passed ? 'Good' : 'Needs improvement'}`);
    });
    
    console.log(`\n📈 Overall Quality Score: ${qualityScore}/6`);
    
    if (qualityScore >= 5) {
      console.log('🎉 RESULT: Program quality is EXCELLENT');
    } else if (qualityScore >= 4) {
      console.log('✅ RESULT: Program quality is GOOD');
    } else if (qualityScore >= 3) {
      console.log('⚠️ RESULT: Program quality is MODERATE');
    } else {
      console.log('🔴 RESULT: Program quality is POOR');
    }
    
    // Check if it's "dull"
    console.log('\n🎨 DULLNESS CHECK:');
    
    const dullnessIndicators = {
      repetitiveTypes: uniqueSessionTypes.length < 3,
      noProgression: !result.programData.weeks.some(w => w.focus.toLowerCase().includes('deload') || w.focus.toLowerCase().includes('assessment')),
      genericExercises: climbingContent.length < totalSessions * 0.3,
      lowPersonalization: result.personalizationScore < 60,
      noInsights: result.aiInsights.length < 2
    };
    
    const dullnessScore = Object.values(dullnessIndicators).filter(Boolean).length;
    
    Object.entries(dullnessIndicators).forEach(([indicator, isDull]) => {
      console.log(`${isDull ? '🔴' : '🟢'} ${indicator}: ${isDull ? 'DULL INDICATOR' : 'Good'}`);
    });
    
    console.log(`\n📉 Dullness Score: ${dullnessScore}/5 (lower is better)`);
    
    if (dullnessScore <= 1) {
      console.log('🌟 RESULT: Program is ENGAGING and EXCITING');
    } else if (dullnessScore <= 2) {
      console.log('👍 RESULT: Program is INTERESTING with minor improvements needed');
    } else if (dullnessScore <= 3) {
      console.log('⚠️ RESULT: Program is SOMEWHAT DULL - improvements needed');
    } else {
      console.log('💤 RESULT: Program is VERY DULL - major improvements required');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Error details:', error);
  }
}

// Run the test
testProgramGenerationSimple(); 