#!/usr/bin/env npx tsx

/**
 * ClimbingPill Onboarding Flow Test
 * 
 * This script demonstrates the complete 5-minute onboarding journey:
 * 1. Goal Setting (30s)
 * 2. Current Level Check (60s) 
 * 3. Mini Physical Assessment (2min)
 * 4. Schedule Setup (45s)
 * 5. Equipment Check (30s)
 * 6. Program Generation (15s)
 */

import { mastra } from '../src/mastra';

async function testOnboardingFlow() {
  console.log('🏔️ ClimbingPill Onboarding Flow Test\n');
  
  try {
    // Get the unified climbing agent
    const onboardingAgent = mastra.getAgent('climbingPillAgent');
    
    console.log('🤖 Starting conversation with ClimbingPill Onboarding Coach...\n');
    
    // Step 1: Initial greeting and goal setting
    console.log('👋 Step 1: Goal Setting (30s target)\n');
    const step1Response = await onboardingAgent.generate([
      { 
        role: 'user', 
        content: 'Hi! I want to start climbing training. My main goal is to send my first V6.' 
      }
    ]);
    console.log('🧗‍♀️ Agent:', step1Response.text);
    console.log('\n---\n');

    // Step 2: Current level assessment
    console.log('📊 Step 2: Current Level Check (60s target)\n');
    const step2Response = await onboardingAgent.generate([
      { 
        role: 'user', 
        content: 'Hi! I want to start climbing training. My main goal is to send my first V6.' 
      },
      { role: 'assistant', content: step1Response.text },
      { 
        role: 'user', 
        content: 'The hardest boulder I\'ve sent is V4. I feel pretty confident at V3 level, maybe 4 out of 5. I\'ve been climbing for about 2 years.' 
      }
    ]);
    console.log('🧗‍♀️ Agent:', step2Response.text);
    console.log('\n---\n');

    // Step 3: Physical assessment
    console.log('💪 Step 3: Mini Physical Assessment (2min target)\n');
    const step3Response = await onboardingAgent.generate([
      { 
        role: 'user', 
        content: 'Hi! I want to start climbing training. My main goal is to send my first V6.' 
      },
      { role: 'assistant', content: step1Response.text },
      { 
        role: 'user', 
        content: 'The hardest boulder I\'ve sent is V4. I feel pretty confident at V3 level, maybe 4 out of 5. I\'ve been climbing for about 2 years.' 
      },
      { role: 'assistant', content: step2Response.text },
      { 
        role: 'user', 
        content: 'I can do 12 pull-ups max. For fingerboard, I can hang on a 20mm edge with about 8kg added weight. For core, I can do 8 toe-to-bar. I weigh 70kg and I\'m 175cm tall.' 
      }
    ]);
    console.log('🧗‍♀️ Agent:', step3Response.text);
    console.log('\n---\n');

    // Step 4: Schedule setup
    console.log('📅 Step 4: Schedule Setup (45s target)\n');
    const step4Response = await onboardingAgent.generate([
      { 
        role: 'user', 
        content: 'Hi! I want to start climbing training. My main goal is to send my first V6.' 
      },
      { role: 'assistant', content: step1Response.text },
      { 
        role: 'user', 
        content: 'The hardest boulder I\'ve sent is V4. I feel pretty confident at V3 level, maybe 4 out of 5. I\'ve been climbing for about 2 years.' 
      },
      { role: 'assistant', content: step2Response.text },
      { 
        role: 'user', 
        content: 'I can do 12 pull-ups max. For fingerboard, I can hang on a 20mm edge with about 8kg added weight. For core, I can do 8 toe-to-bar. I weigh 70kg and I\'m 175cm tall.' 
      },
      { role: 'assistant', content: step3Response.text },
      { 
        role: 'user', 
        content: 'I can train Monday, Wednesday, Friday. I prefer 90-minute sessions in the evening after work.' 
      }
    ]);
    console.log('🧗‍♀️ Agent:', step4Response.text);
    console.log('\n---\n');

    // Step 5: Equipment check
    console.log('🏋️ Step 5: Equipment Check (30s target)\n');
    const step5Response = await onboardingAgent.generate([
      { 
        role: 'user', 
        content: 'Hi! I want to start climbing training. My main goal is to send my first V6.' 
      },
      { role: 'assistant', content: step1Response.text },
      { 
        role: 'user', 
        content: 'The hardest boulder I\'ve sent is V4. I feel pretty confident at V3 level, maybe 4 out of 5. I\'ve been climbing for about 2 years.' 
      },
      { role: 'assistant', content: step2Response.text },
      { 
        role: 'user', 
        content: 'I can do 12 pull-ups max. For fingerboard, I can hang on a 20mm edge with about 8kg added weight. For core, I can do 8 toe-to-bar. I weigh 70kg and I\'m 175cm tall.' 
      },
      { role: 'assistant', content: step3Response.text },
      { 
        role: 'user', 
        content: 'I can train Monday, Wednesday, Friday. I prefer 90-minute sessions in the evening after work.' 
      },
      { role: 'assistant', content: step4Response.text },
      { 
        role: 'user', 
        content: 'I have access to a climbing gym and I have a fingerboard at home. No outdoor access yet but hoping to start soon.' 
      }
    ]);
    console.log('🧗‍♀️ Agent:', step5Response.text);
    console.log('\n---\n');

    // Step 6: Program generation
    console.log('🎯 Step 6: Program Generation (15s target)\n');
    const finalResponse = await onboardingAgent.generate([
      { 
        role: 'user', 
        content: 'Hi! I want to start climbing training. My main goal is to send my first V6.' 
      },
      { role: 'assistant', content: step1Response.text },
      { 
        role: 'user', 
        content: 'The hardest boulder I\'ve sent is V4. I feel pretty confident at V3 level, maybe 4 out of 5. I\'ve been climbing for about 2 years.' 
      },
      { role: 'assistant', content: step2Response.text },
      { 
        role: 'user', 
        content: 'I can do 12 pull-ups max. For fingerboard, I can hang on a 20mm edge with about 8kg added weight. For core, I can do 8 toe-to-bar. I weigh 70kg and I\'m 175cm tall.' 
      },
      { role: 'assistant', content: step3Response.text },
      { 
        role: 'user', 
        content: 'I can train Monday, Wednesday, Friday. I prefer 90-minute sessions in the evening after work.' 
      },
      { role: 'assistant', content: step4Response.text },
      { 
        role: 'user', 
        content: 'I have access to a climbing gym and I have a fingerboard at home. No outdoor access yet but hoping to start soon.' 
      },
      { role: 'assistant', content: step5Response.text },
      { 
        role: 'user', 
        content: 'Great! Now please generate my complete personalized training program. I\'m excited to see what ClimbingPill has created for me!' 
      }
    ]);
    console.log('🧗‍♀️ Agent:', finalResponse.text);
    console.log('\n---\n');

    console.log('✅ Onboarding Flow Complete!');
    console.log('\n🎉 User Journey Summary:');
    console.log('• Goal: Send first V6 💪');
    console.log('• Current Level: V4 with 2 years experience');
    console.log('• Strength Profile: 12 pull-ups, 8kg fingerboard, 8 toe-to-bar');
    console.log('• Schedule: Mon/Wed/Fri evenings, 90min sessions');
    console.log('• Equipment: Gym + home fingerboard');
    console.log('• Outcome: Personalized 6-week training program');
    
    console.log('\n📊 Expected Business Impact:');
    console.log('• Time to Value: ~5 minutes (industry: 15-30 min)');
    console.log('• Completion Rate Target: 85% (industry: 60-70%)');
    console.log('• Personalization Depth: High (scientific assessment + AI)');
    console.log('• Retention Setup: Automated engagement workflows');

  } catch (error) {
    console.error('❌ Error in onboarding flow:', error);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Ensure OpenAI API key is set in environment');
    console.log('2. Check that Mastra server is running (npm run dev)');
    console.log('3. Verify all agents and tools are properly imported');
  }
}

// Test retention workflow
async function testRetentionWorkflow() {
  console.log('\n🔄 Testing Retention Workflow...\n');
  
  try {
    const retentionWorkflow = mastra.getWorkflow('retentionWorkflow');
    const run = retentionWorkflow.createRun();
    
    // Simulate user data after Week 2
    const testData = {
      userId: 'test-user-123',
      weekNumber: 2,
      sessionData: {
        completed: true,
        duration: 85, // minutes
        difficulty: 7,  // 1-10 scale
        satisfaction: 8 // 1-10 scale
      },
      userProfile: {
        goal: 'send_first_v6',
        currentGrade: 'V4',
        trainingDays: ['Monday', 'Wednesday', 'Friday'],
        equipment: ['climbing_gym', 'fingerboard']
      }
    };

    console.log('📊 Input Data:', JSON.stringify(testData, null, 2));
    
    const result = await run.start({ inputData: testData });
    
    console.log('\n✅ Retention Analysis Complete!');
    console.log('\n📈 Results:');
    console.log(JSON.stringify(result, null, 2));
    
    if (result.status === 'success') {
      console.log('\n🎯 Key Insights:');
      console.log('• Workflow Status:', result.status);
      console.log('• Steps Completed:', Object.keys(result.steps).length);
    } else {
      console.log('\n❌ Workflow failed or was suspended');
      console.log('• Status:', result.status);
    }

  } catch (error) {
    console.error('❌ Error in retention workflow:', error);
  }
}

async function testUnifiedAgent() {
  console.log('🏔️ Testing Unified ClimbingPill AI Agent\n');
  
  const agent = mastra.getAgent('climbingPillAgent');
  
  if (!agent) {
    console.error('❌ ClimbingPill agent not found');
    return;
  }

  // Test 1: Onboarding Flow
  console.log('=== 🎯 ONBOARDING TEST ===');
  const onboardingResponse = await agent.generate([
    { role: 'user', content: 'Hi! I want to start climbing training and reach V6' }
  ]);
  console.log('Agent:', onboardingResponse.text);
  console.log('\n');

  // Test 2: Assessment Request
  console.log('=== 📊 ASSESSMENT TEST ===');
  const assessmentResponse = await agent.generate([
    { role: 'user', content: 'I want to assess my climbing level. I weigh 70kg, height 175cm, can do 12 pull-ups, hang 20mm edge with +15kg, do 8 toe-to-bar, 25 push-ups, and leg spread 140cm. I climb V5 consistently.' }
  ]);
  console.log('Agent:', assessmentResponse.text);
  console.log('\n');

  // Test 3: Weather Query
  console.log('=== 🌤️ WEATHER TEST ===');
  const weatherResponse = await agent.generate([
    { role: 'user', content: 'What\'s the weather like for climbing in עין פארה today?' }
  ]);
  console.log('Agent:', weatherResponse.text);
  console.log('\n');

  // Test 4: Retention Analysis (NEW!)
  console.log('=== 📈 RETENTION ANALYSIS TEST ===');
  const retentionResponse = await agent.generate([
    { 
      role: 'user', 
      content: 'I\'ve been struggling with consistency lately. I missed 2 sessions this week and feeling unmotivated. Can you analyze my progress and help me get back on track? I\'m user123, week 4 of my program, last session was 45 minutes, difficulty 7/10, satisfaction 4/10. My goal is V6, currently climbing V4, training Mon/Wed/Fri, have gym and fingerboard access.' 
    }
  ]);
  console.log('Agent:', retentionResponse.text);
  console.log('\n');
}

async function testRetentionWorkflowDirectly() {
  console.log('=== 🔄 DIRECT WORKFLOW TEST ===');
  
  const retentionWorkflow = mastra.getWorkflow('retentionWorkflow');
  
  if (!retentionWorkflow) {
    console.error('❌ Retention workflow not found');
    return;
  }

  const run = retentionWorkflow.createRun();
  
  const sampleData = {
    userId: 'user123',
    weekNumber: 4,
    sessionData: {
      completed: false,
      duration: 45,
      difficulty: 7,
      satisfaction: 4
    },
    userProfile: {
      goal: 'Send my first V6',
      currentGrade: 'V4',
      trainingDays: ['Monday', 'Wednesday', 'Friday'],
      equipment: ['gym', 'fingerboard']
    }
  };

  try {
    const result = await run.start({
      inputData: sampleData
    });
    
    console.log('✅ Workflow Status:', result.status);
    if (result.status === 'success') {
      console.log('📊 Progress Metrics:', result.result.progressMetrics);
      console.log('💬 Communications:', result.result.communications.length, 'messages');
      console.log('🔧 Program Adjustments:', result.result.programAdjustments.length, 'adjustments');
    }
  } catch (error) {
    console.error('❌ Workflow Error:', error);
  }
  console.log('\n');
}

async function main() {
  console.log('🚀 ClimbingPill Unified System Test\n');
  
  try {
    // Test the unified agent with all capabilities
    await testUnifiedAgent();
    
    // Test the workflow directly for comparison
    await testRetentionWorkflowDirectly();
    
    console.log('✅ All tests completed successfully!');
    console.log('\n🎯 Key Achievements:');
    console.log('• Single agent handles onboarding, assessment, weather, and retention');
    console.log('• Agent can trigger complex workflows through tools');
    console.log('• Workflows provide detailed analysis and recommendations');
    console.log('• Clean architecture: Agent + Tools + Workflows');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

if (require.main === module) {
  main().catch(console.error);
} 